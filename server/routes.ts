import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { hashPassword, comparePasswords } from "./auth";
const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
    // Setup authentication routes
    setupAuth(app);

    // Middleware to check if user is authenticated
    const isAuthenticated = (req: Request, res: Response, next: Function) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: "Unauthorized" });
    };

    // Get all subscriptions for a user
    app.get("/api/subscriptions", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const subscriptions = await storage.getSubscriptionsByuser_id(user_id);
            res.json(subscriptions);
        } catch (err) {
            next(err);
        }
    });

    // Get a single subscription
    app.get("/api/subscriptions/:id", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const subscriptionId = parseInt(req.params.id);

            if (isNaN(subscriptionId)) {
                return res.status(400).json({ message: "Invalid subscription ID" });
            }

            const subscription = await storage.getSubscription(subscriptionId);

            if (!subscription) {
                return res.status(404).json({ message: "Subscription not found" });
            }

            if (subscription.user_id !== user_id) {
                return res.status(403).json({ message: "Forbidden" });
            }

            res.json(subscription);
        } catch (err) {
            next(err);
        }
    });

    // Create a new subscription
    app.post("/api/subscriptions", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
           // console.log("Creating subscription for user:", user_id);
            // console.log("Request body:", req.body);

            // Ensure next_payment_date is properly formatted
            let formData = { ...req.body, user_id };

            // If next_payment_date is a string in ISO format, parse it to a Date
            if (typeof formData.next_payment_date === "string") {
                try {
                    const date = new Date(formData.next_payment_date);
                    if (!isNaN(date.getTime())) {
                        formData.next_payment_date = date;
                    }
                } catch (error) {
                    console.error("Error parsing date:", error);
                }
            }

           // console.log("Processed form data:", formData);

            try {
                // Validate request body
                const validatedData = insertSubscriptionSchema.parse(formData);
                //console.log("Validated data:", validatedData);

                const subscription = await storage.createSubscription(validatedData);
                //console.log("Created subscription:", subscription);

                res.status(201).json(subscription);
            } catch (validationError) {
                console.error("Validation error:", validationError);
                if (validationError instanceof z.ZodError) {
                    const error = fromZodError(validationError);
                    return res.status(400).json({ message: error.message });
                }
                throw validationError;
            }
        } catch (err) {
            console.error("Error creating subscription:", err);
            next(err);
        }
    });

    // Update a subscription
    app.put("/api/subscriptions/:id", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const subscriptionId = parseInt(req.params.id);

            if (isNaN(subscriptionId)) {
                return res.status(400).json({ message: "Invalid subscription ID" });
            }

            // Check if subscription exists and belongs to the user
            const existingSubscription = await storage.getSubscription(subscriptionId);

            if (!existingSubscription) {
                return res.status(404).json({ message: "Subscription not found" });
            }

            if (existingSubscription.user_id !== user_id) {
                return res.status(403).json({ message: "Forbidden" });
            }

            // Validate request body
            const validatedData = insertSubscriptionSchema.omit({ user_id: true }).parse(req.body);

            const updatedSubscription = await storage.updateSubscription(subscriptionId, { ...validatedData, user_id });

            res.json(updatedSubscription);
        } catch (err) {
            if (err instanceof z.ZodError) {
                const validationError = fromZodError(err);
                return res.status(400).json({ message: validationError.message });
            }
            next(err);
        }
    });

    // Delete a subscription
    app.delete("/api/subscriptions/:id", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const subscriptionId = parseInt(req.params.id);

            if (isNaN(subscriptionId)) {
                return res.status(400).json({ message: "Invalid subscription ID" });
            }

            // Check if subscription exists and belongs to the user
            const existingSubscription = await storage.getSubscription(subscriptionId);

            if (!existingSubscription) {
                return res.status(404).json({ message: "Subscription not found" });
            }

            if (existingSubscription.user_id !== user_id) {
                return res.status(403).json({ message: "Forbidden" });
            }

            await storage.deleteSubscription(subscriptionId);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    });

    // Get subscription stats
    app.get("/api/stats", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const stats = await storage.getSubscriptionStats(user_id);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    });

    // Update user profile
    app.put("/api/user/profile", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const { name, email } = req.body;

            // Validate data
            if (!name && !email) {
                return res.status(400).json({ message: "No update data provided" });
            }

            // Check if email is already in use
            if (email) {
                const existingUser = await storage.getUserByEmail(email);
                if (existingUser && existingUser.id !== user_id) {
                    return res.status(400).json({ message: "Email already in use" });
                }
            }

            const updatedUser = await storage.updateUser(user_id, { name, email });
            res.json(updatedUser);
        } catch (err) {
            next(err);
        }
    });

    // Update user settings (including currency)
    app.put("/api/user/settings", isAuthenticated, async (req, res, next) => {
        try {
            // Extract user settings from request
            const { currency, ...otherSettings } = req.body;
            const user_id = req.user!.id;
            
            // Validate currency if provided
            if (currency) {
                // You could add more validation here if needed
            }
            
            // Update user in database with new settings
            const updatedUser = await storage.updateUser(user_id, { 
              currency, 
              ...otherSettings 
            });
            
            res.json(updatedUser);
        } catch (err) {
            if (err instanceof z.ZodError) {
                const validationError = fromZodError(err);
                return res.status(400).json({ message: validationError.message });
            }
            next(err);
        }
    });

    app.post("/api/user/change-password", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current and new password are required" });
            }

            const user = await storage.getUser(user_id);
            if (!user || !user.password) {
                return res.status(400).json({ message: "User not found" });
            }
           
            const isMatch = await comparePasswords(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            
            // Use hashPassword for new password
            const newPasswordHash = await hashPassword(newPassword);
            await storage.updateUser(user_id, { password: newPasswordHash });
            
            res.json({ message: "Password changed successfully" });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/user/deactivate", isAuthenticated, async (req, res, next) => {
        try {
            const user_id = req.user!.id;
            await storage.updateUser(user_id, { deactivated: true });
            req.logout(() => {
                res.json({ message: "Account deactivated" });
            });
        } catch (err) {
            next(err);
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
