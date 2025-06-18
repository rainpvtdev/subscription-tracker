import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { Subscription } from "@shared/schema";
import { TrendingUp, DollarSign, PieChart as PieIcon, Users } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";

export default function Reports() {
    const { user } = useAuth();
    const { currency } = useCurrency();
    const { data: subscriptions = [], isLoading, error } = useQuery<Subscription[]>({
        queryKey: ["subscriptions"],
        queryFn: async (): Promise<Subscription[]> => {
            try {
                const response = await fetch('/api/subscriptions', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch subscriptions');
                }
                
                return await response.json();
            } catch (error) {
                console.error('Error fetching subscriptions:', error);
                throw error;
            }
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
                <Sidebar user={user} />
                <div className="md:pl-72 p-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                </div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
                <Sidebar user={user} />
                <div className="md:pl-72 p-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">Failed to load report data. Please try again later.</span>
                    </div>
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
            <Sidebar user={user} />
            <FloatingThemeToggle />

            <div className="md:pl-72">
                <div className="mx-auto max-w-7xl py-10 px-4">
                    <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-8 flex items-center gap-2">
                        <PieIcon className="w-8 h-8" /> Reports Dashboard
                    </h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Spend</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpend, currency)}</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Active Subs</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeSubs}</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Most Expensive</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(mostExpensive, currency)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 transition-colors">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <PieIcon className="w-5 h-5" /> Spending by Category
                            </h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={pieData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={100} 
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Bar Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 transition-colors">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <TrendingUp className="w-5 h-5" /> Monthly Spending Trend
                            </h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                        <XAxis dataKey="billing_cycle" stroke="#888" />
                                        <YAxis stroke="#888" tickFormatter={(value) => `${getCurrencySymbol(currency)}${value}`} />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none' }} />
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