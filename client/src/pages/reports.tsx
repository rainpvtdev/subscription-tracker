import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { Subscription } from "@shared/schema";

export default function Reports() {
    const { user } = useAuth();
    const { data: subscriptions = [] } = useQuery<Subscription[]>({
        queryKey: ["/api/subscriptions"],
    });

    const { data: stats } = useQuery({
        queryKey: ["/api/stats"],
    });

    // Calculate spending by category
    const spendingByCategory = subscriptions.reduce((acc: Record<string, number>, sub: Subscription) => {
        acc[sub.category] = (acc[sub.category] || 0) + Number(sub.amount);
        return acc;
    }, {});

    const pieData = Object.entries(spendingByCategory).map(([name, value]) => ({
        name,
        value,
    }));

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

    // Format subscription data for the chart
    const chartData = subscriptions.map((sub: Subscription) => ({
        billing_cycle: sub.billing_cycle,
        amount: Number(sub.amount)
    }));

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar user={user} />
            
            {/* Floating Theme Toggle for quick access */}
            <FloatingThemeToggle />
            
            {/* Main content */}
            <div className="md:pl-72">
                <div className="mx-auto flex max-w-7xl flex-col md:px-8">
                    {/* Top bar for mobile */}
                    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-border bg-background md:hidden">
                        <button 
                            type="button" 
                            className="border-r border-border px-4 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-1 items-center">
                                <h1 className="text-xl font-bold text-primary">SubTrack</h1>
                            </div>
                        </div>
                    </div>

                    {/* Reports content */}
                    <main className="flex-1">
                        <div className="py-6">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                                <h1 className="text-2xl font-semibold text-foreground">Subscription Reports</h1>
                            </div>
                            
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="bg-card p-6 rounded-lg shadow">
                                        <h2 className="text-lg font-medium mb-4 text-foreground">Spending by Category</h2>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-card p-6 rounded-lg shadow">
                                        <h2 className="text-lg font-medium mb-4 text-foreground">Monthly Spending Trend</h2>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="billing_cycle" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="amount" fill="#8884d8" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
