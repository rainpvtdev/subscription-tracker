import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, subscriptions, resetTokens } from "@shared/schema";
import { type User, type Subscription } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { IStorage, SubscriptionStats } from "./storage";
import crypto from 'crypto';

const PostgresSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
    sessionStore: session.Store;

    constructor() {
        this.sessionStore = new PostgresSessionStore({
            pool,
            tableName: 'session'
        });
    }

    // User methods
    async getUser(id: number): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        try {
            const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
            return user;
        } catch (error) {
            console.error('Error in getUserByUsername:', error);
            throw error;
        }
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        return user;
    }

    async createUser(insertUser: { username: string; password: string; email: string; name: string }): Promise<User> {
        try {
            const [user] = await db
                .insert(users)
                .values({
                    username: insertUser.username.toLowerCase(),
                    password: insertUser.password,
                    email: insertUser.email.toLowerCase(),
                    name: insertUser.name
                })
                .returning();
            return user;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    async updateUser(id: number, data: Partial<User>): Promise<User> {
        const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    // Subscription methods
    async getSubscription(id: number): Promise<Subscription | undefined> {
        const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
        return subscription;
    }

    async getSubscriptionsByuser_id(user_id: number): Promise<Subscription[]> {
        return db.select().from(subscriptions).where(eq(subscriptions.user_id, user_id));
    }

    async createSubscription(insertSubscription: { user_id: number; name: string; category: string; plan: string; amount: number; billing_cycle: string; next_payment_date: Date; status?: string; reminder?: string; notes?: string }): Promise<Subscription> {
        try {
            // Extract only the fields we need, excluding id
            const values = {
                user_id: insertSubscription.user_id,
                name: insertSubscription.name,
                category: insertSubscription.category,
                plan: insertSubscription.plan,
                amount: String(insertSubscription.amount),
                billing_cycle: insertSubscription.billing_cycle,
                next_payment_date: insertSubscription.next_payment_date,
                status: insertSubscription.status || 'active',
                reminder: insertSubscription.reminder || 'none',
                notes: insertSubscription.notes
            };

            const [newSubscription] = await db.insert(subscriptions).values(values).returning();
            return newSubscription;
        } catch (error) {
            console.error('Error in createSubscription:', error);
            throw error;
        }
    }

    async updateSubscription(id: number, data: { user_id: number; name: string; category: string; plan: string; amount: number; billing_cycle: string; next_payment_date: Date; status?: string; reminder?: string; notes?: string }): Promise<Subscription> {
        try {
            // Extract only the fields we need, excluding id
            const values = {
                user_id: data.user_id,
                name: data.name,
                category: data.category,
                plan: data.plan,
                amount: String(data.amount),
                billing_cycle: data.billing_cycle,
                next_payment_date: data.next_payment_date,
                status: data.status || 'active',
                reminder: data.reminder || 'none',
                notes: data.notes
            };

            const [updatedSubscription] = await db.update(subscriptions).set(values).where(eq(subscriptions.id, id)).returning();

            if (!updatedSubscription) {
                throw new Error("Subscription not found");
            }

            return updatedSubscription;
        } catch (error) {
            console.error('Error in updateSubscription:', error);
            throw error;
        }
    }

    async deleteSubscription(id: number): Promise<void> {
        try {
            await db.delete(subscriptions).where(eq(subscriptions.id, id));
        } catch (error) {
            console.error('Error in deleteSubscription:', error);
            throw error;
        }
    }

    async getSubscriptionStats(user_id: number): Promise<SubscriptionStats> {
        // Get all user subscriptions
        const userSubscriptions = await this.getSubscriptionsByuser_id(user_id);

        // Calculate active count
        const activeCount = userSubscriptions.filter((sub) => sub.status === "active").length;

        // Calculate monthly cost (normalize all billing cycles to monthly)
        let monthlyCost = 0;
        userSubscriptions.forEach((sub) => {
            if (sub.status !== "active" && sub.status !== "renewing soon") return;

            const amount = Number(sub.amount);
            if (isNaN(amount)) return;

            switch (sub.billing_cycle) {
                case "Monthly":
                    monthlyCost += amount;
                    break;
                case "Quarterly":
                    monthlyCost += amount / 3;
                    break;
                case "Semi-Annually":
                    monthlyCost += amount / 6;
                    break;
                case "Annually":
                    monthlyCost += amount / 12;
                    break;
            }
        });

        // Calculate upcoming renewals in the next 7 days
        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(now.getDate() + 7);

        const upcomingRenewals = userSubscriptions.filter((sub) => {
            const nextPayment = new Date(sub.next_payment_date);
            return nextPayment >= now && nextPayment <= sevenDaysLater;
        });

        // Calculate cost of upcoming renewals
        const upcomingCost = upcomingRenewals.reduce((total, sub) => {
            const amount = Number(sub.amount);
            return isNaN(amount) ? total : total + amount;
        }, 0);

        return {
            activeCount,
            monthlyCost,
            upcomingRenewals: upcomingRenewals.length,
            upcomingCost,
        };
    }

    async getActiveSubscriptions(): Promise<Subscription[]> {
        const result = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
        return result;
    }

    // Add new methods for password reset
    async setResetToken(userId: number, token: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(resetTokens)
            .values({
                user_id: userId,
                token,
                expires_at: expiresAt,
            });
    }

    async validateResetToken(token: string): Promise<number> {
        const resetToken = await this.getResetToken(token);
        if (!resetToken || !resetToken.user_id || new Date() > resetToken.expires_at) {
            throw new Error("Invalid or expired reset token");
        }
        return resetToken.user_id;
    }

    async getUserByResetToken(token: string): Promise<User | undefined> {
        const result = await db.select()
            .from(users)
            .innerJoin(resetTokens, eq(resetTokens.user_id, users.id))
            .where(eq(resetTokens.token, token))
            .limit(1);

        if (!result[0]) return undefined;
        const user = result[0].users;
        if (!user || !user.id) return undefined;
        return user;
    }

    async getResetToken(token: string): Promise<{ id: number; user_id: number; token: string; expires_at: Date; created_at: Date } | undefined> {
        const result = await db.select()
            .from(resetTokens)
            .where(eq(resetTokens.token, token))
            .limit(1);

        const resetToken = result[0];
        if (!resetToken?.user_id) return undefined;

        // Ensure user_id is not null and return the token with proper types
        return {
            id: resetToken.id,
            user_id: resetToken.user_id,
            token: resetToken.token,
            expires_at: resetToken.expires_at,
            created_at: resetToken.created_at
        };
    }

    async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, userId));
    }

    async clearResetToken(token: string): Promise<void> {
        await db.delete(resetTokens)
            .where(eq(resetTokens.token, token));
    }
}
