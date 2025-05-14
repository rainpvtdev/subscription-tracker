import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { Subscription } from "@shared/schema";
import { TrendingUp, DollarSign, PieChart as PieIcon, Users } from "lucide-react";

export default function Reports() {
    const { user } = useAuth();
    const { data: subscriptions = [] } = useQuery<Subscription[]>({
        queryKey: ["/api/subscriptions"],
    });

    // Example stats
    const totalSpend = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
    const activeSubs = subscriptions.length;
    const mostExpensive = subscriptions.reduce((max, s) => Number(s.amount) > max ? Number(s.amount) : max, 0);

    // Spending by category for pie chart
    const spendingByCategory = subscriptions.reduce((acc: Record<string, number>, sub: Subscription) => {
        acc[sub.category] = (acc[sub.category] || 0) + Number(sub.amount);
        return acc;
    }, {});
    const pieData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));
    const COLORS = ["#6366F1", "#06b6d4", "#f59e42", "#f43f5e", "#a3e635"];

    // Chart data for monthly trend
    const chartData = subscriptions.map((sub: Subscription) => ({
        billing_cycle: sub.billing_cycle,
        amount: Number(sub.amount)
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 transition-colors duration-300">
            <Sidebar user={user} />
            <FloatingThemeToggle />

            <div className="md:pl-72">
                <div className="mx-auto max-w-7xl py-10 px-4">
                    <h1 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
                        <PieIcon className="w-8 h-8" /> Reports Dashboard
                    </h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                            <DollarSign className="w-8 h-8 text-green-500" />
                            <div>
                                <div className="text-lg font-semibold text-gray-700">Total Spend</div>
                                <div className="text-2xl font-bold text-gray-900">${totalSpend.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                            <Users className="w-8 h-8 text-blue-500" />
                            <div>
                                <div className="text-lg font-semibold text-gray-700">Active Subs</div>
                                <div className="text-2xl font-bold text-gray-900">{activeSubs}</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                            <div>
                                <div className="text-lg font-semibold text-gray-700">Most Expensive</div>
                                <div className="text-2xl font-bold text-gray-900">${mostExpensive.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                                <PieIcon className="w-5 h-5" /> Spending by Category
                            </h2>
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
                        {/* Bar Chart */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                                <TrendingUp className="w-5 h-5" /> Monthly Spending Trend
                            </h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="billing_cycle" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="amount" fill="#6366F1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}