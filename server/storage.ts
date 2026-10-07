import { users, subscriptions, User, InsertUser, Subscription, InsertSubscription } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { DatabaseStorage } from "./database-storage";

const MemoryStore = createMemoryStore(session);

export interface SubscriptionStats {
    activeCount: number;
    monthlyCost: number;
    upcomingRenewals: number;
    upcomingCost: number;
}

export interface IStorage {
    // User methods
    getUser(id: number): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    updateUser(id: number, data: Partial<User>): Promise<User>;

    // Subscription methods
    getSubscription(id: number): Promise<Subscription | undefined>;
    getSubscriptionsByuser_id(user_id: number): Promise<Subscription[]>;
    createSubscription(subscription: InsertSubscription): Promise<Subscription>;
    updateSubscription(id: number, data: InsertSubscription): Promise<Subscription>;
    deleteSubscription(id: number): Promise<void>;
    getSubscriptionStats(user_id: number): Promise<SubscriptionStats>;

    // Session store
    sessionStore: session.Store;
}

export class MemStorage implements IStorage {
    private users: Map<number, User>;
    private subscriptions: Map<number, Subscription>;
    public sessionStore: session.Store;
    private user_idCounter: number;
    private subscriptionIdCounter: number;

    constructor() {
        this.users = new Map();
        this.subscriptions = new Map();
        this.user_idCounter = 1;
        this.subscriptionIdCounter = 1;
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000, // Prune expired entries every 24h
        });
    }

    // User methods
    async getUser(id: number): Promise<User | undefined> {
        return this.users.get(id);
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find((user) => user.username.toLowerCase() === username.toLowerCase());
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const id = this.user_idCounter++;
        const created_at = new Date();
        const user: User = {
            ...insertUser,
            id,
            created_at,
            name: insertUser.name || null,
        };
        this.users.set(id, user);
        return user;
    }

    async updateUser(id: number, data: Partial<User>): Promise<User> {
        const user = await this.getUser(id);
        if (!user) {
            throw new Error("User not found");
        }

        const updatedUser = { ...user, ...data };
        this.users.set(id, updatedUser);
        return updatedUser;
    }

    // Subscription methods
    async getSubscription(id: number): Promise<Subscription | undefined> {
        return this.subscriptions.get(id);
    }

    async getSubscriptionsByuser_id(user_id: number): Promise<Subscription[]> {
        return Array.from(this.subscriptions.values()).filter((subscription) => subscription.user_id === user_id);
    }

    async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
        const id = this.subscriptionIdCounter++;
        const created_at = new Date();

        // Convert next payment date string to Date if needed
        let next_payment_date = insertSubscription.next_payment_date;
        if (typeof next_payment_date === "string") {
            next_payment_date = new Date(next_payment_date);
        }

        // Convert amount to string for consistency with DB storage
        const amountStr = String(insertSubscription.amount);

        const subscription: Subscription = {
            ...insertSubscription,
            id,
            created_at,
            next_payment_date,
            status: insertSubscription.status || "active",
            reminder: insertSubscription.reminder || null,
            notes: insertSubscription.notes || null,
            amount: amountStr,
        };

        this.subscriptions.set(id, subscription);
        return subscription;
    }

    async updateSubscription(id: number, data: InsertSubscription): Promise<Subscription> {
        const subscription = await this.getSubscription(id);
        if (!subscription) {
            throw new Error("Subscription not found");
        }

        // Convert next payment date string to Date if needed
        let next_payment_date = data.next_payment_date;
        if (typeof next_payment_date === "string") {
            next_payment_date = new Date(next_payment_date);
        }

        // Convert amount to string for consistency with DB storage
        const amountStr = String(data.amount);

        const updatedSubscription = {
            ...subscription,
            ...data,
            next_payment_date,
            status: data.status || subscription.status || "active",
            reminder: data.reminder || subscription.reminder || null,
            notes: data.notes || subscription.notes || null,
            amount: amountStr,
        };

        this.subscriptions.set(id, updatedSubscription);
        return updatedSubscription;
    }

    async deleteSubscription(id: number): Promise<void> {
        this.subscriptions.delete(id);
    }

    async getSubscriptionStats(user_id: number): Promise<SubscriptionStats> {
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
}

// Uncomment to use in-memory storage for development
// export const storage = new MemStorage();

// Use database storage for production
export const storage = new DatabaseStorage();
