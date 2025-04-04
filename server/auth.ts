import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import * as dotenv from "dotenv";
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import schedule from 'node-schedule';

// Load environment variables
dotenv.config();

declare global {
    namespace Express {
        interface User extends SelectUser {}
    }
}

const scryptAsync = promisify(scrypt);

// Email configuration
const transporter = nodemailer.createTransport({
    host:  process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Only for testing, remove in production
    }
});

// Generate password reset token
async function generateResetToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await storage.setResetToken(userId, token);
    return token;
}

// Send password reset email
async function sendResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password for Subscription Tracker.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                    Reset Password
                </a>
                <p>If you did not request this password reset, please ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Schedule reminder emails
const scheduleReminderEmails = () => {
    // Run every day at 9 AM
    schedule.scheduleJob('0 9 * * *', async () => {
        try {
            // Get all active subscriptions
            const subscriptions = await storage.getActiveSubscriptions();
            
            // Check each subscription for upcoming payment
            for (const sub of subscriptions) {
                const nextPaymentDate = new Date(sub.next_payment_date);
                const reminderDate = new Date(nextPaymentDate);
                reminderDate.setDate(reminderDate.getDate() - 1); // Day before due

                if (isSameDay(reminderDate, new Date())) {
                    // Get user email
                    const user = await storage.getUser(sub.user_id);
                    if (!user) continue;

                    // Send reminder email
                    await sendReminderEmail(user.email, sub);
                }
            }
        } catch (error) {
            console.error('Error sending reminder emails:', error);
        }
    });
};

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Send reminder email
async function sendReminderEmail(email: string, subscription: any): Promise<void> {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Reminder: ${subscription.name} Payment Due Tomorrow`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Subscription Payment Reminder</h2>
                <p>Hi ${subscription.user.name || 'User'},</p>
                <p>This is a friendly reminder that your ${subscription.name} payment is due tomorrow.</p>
                <p>Details:</p>
                <ul>
                    <li>Subscription: ${subscription.name}</li>
                    <li>Amount: ${subscription.amount}</li>
                    <li>Plan: ${subscription.plan}</li>
                    <li>Next Payment Date: ${new Date(subscription.next_payment_date).toLocaleDateString()}</li>
                </ul>
                <p>Please ensure your payment is processed by tomorrow to avoid any service interruptions.</p>
                <p>Thank you!</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Initialize reminder scheduler
scheduleReminderEmails();

export function setupAuth(app: Express) {
    //console.log(" process.env.SESSION_SECRET", process.env.SESSION_SECRET);
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "GavNkZS+t7FdrZLvViAozO+CD1oZeRAZ49TOqaWdQcj86z1NbPhGFGlu2Ej2aCMNpnGQjLq9jcEkxMT6NV+19w==",
        resave: false,
        saveUninitialized: false,
        store: storage.sessionStore,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        },
    };

    app.set("trust proxy", 1);
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user || !(await comparePasswords(password, user.password))) {
                    return done(null, false);
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id: number, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    app.post("/api/register", async (req, res, next) => {
        try {
            // Check if user already exists
            const existingUser = await storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).json({ message: "Username already exists" });
            }

            // Check if email is already in use
            const existingEmail = await storage.getUserByEmail(req.body.email);
            if (existingEmail) {
                return res.status(400).json({ message: "Email already in use" });
            }

            // Create new user with hashed password
            const user = await storage.createUser({
                ...req.body,
                password: await hashPassword(req.body.password),
            });

            // Log the user in
            req.login(user, (err) => {
                if (err) return next(err);
                return res.status(201).json(user);
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/login", (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ message: "Invalid username or password" });

            req.login(user, (err) => {
                if (err) return next(err);
                return res.status(200).json(user);
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
    });

    app.post("/api/forgot-password", async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await storage.getUserByEmail(email);

            if (!user) {
                // Don't reveal that the email doesn't exist for security reasons
                return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
            }

            // Generate reset token
            const resetToken = await generateResetToken(user.id);

            // Send reset email
            await sendResetEmail(email, resetToken);

            return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
        } catch (err) {
            next(err);
        }
    });

    // Reset password endpoint
    app.post("/api/reset-password", async (req, res, next) => {
        try {
            const { token, password } = req.body;
            
            // Validate input
            if (!token || !password) {
                return res.status(400).json({ message: "Token and password are required" });
            }

            // Get user by reset token
            const user = await storage.getUserByResetToken(token);
            if (!user) {
                return res.status(400).json({ message: "Invalid or expired reset token" });
            }

            // Check if token is expired (24 hours)
            const tokenData = await storage.getResetToken(token);
            if (!tokenData || new Date() > tokenData.expires_at) {
                return res.status(400).json({ message: "Reset token has expired" });
            }

            // Hash the new password
            const salt = randomBytes(16).toString("hex");
            const hashedPassword = (await scryptAsync(password, salt, 64)) as Buffer;
            const passwordString = `${salt}:${hashedPassword.toString("hex")}`;

            // Update user's password and clear reset token
            await storage.updateUserPassword(user.id, passwordString);
            await storage.clearResetToken(token);

            res.json({ message: "Password reset successful" });
        } catch (error) {
            next(error);
        }
    });
}
