import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import SubscriptionTable from "@/components/subscription-table";
import SubscriptionForm from "@/components/subscription-form";
import SubscriptionFilter from "@/components/subscription-filter";
import { Button } from "@/components/ui/button";
import { PlusIcon, DollarSign, TrendingUp, Users, PieChart as PieIcon, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useCurrency } from "@/context/currency-context";
import { formatCurrency } from "@/lib/utils";

// Types
type FilterStatus = "All" | "Active" | "Expired" | "Upcoming";

function Dashboard() {
  // State for subscription form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Authentication
  const { user } = useAuth();
  // Currency context for formatting
  const { currency } = useCurrency();

  // Fetch subscriptions data
  const { 
    data: subscriptions = [], 
    isLoading: isLoadingSubscriptions, 
    error: subscriptionError 
  } = useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: async (): Promise<Subscription[]> => {
      console.log('Fetching subscriptions...');
      try {
        const response = await fetch('/api/subscriptions', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('Subscription response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Subscription fetch error:', errorText);
          throw new Error(`Failed to fetch subscriptions: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as Subscription[];
        console.log('Fetched subscriptions:', data);
        return data;
      } catch (err) {
        console.error('Error in subscription query:', err);
        throw err;
      }
    },
    enabled: !!user, // Only fetch if user is authenticated
    retry: false
  });
  
  useEffect(() => {
    if (subscriptionError) {
      console.error('Subscription fetch failed:', subscriptionError);
    }
  }, [subscriptionError]);
  
  console.log('Dashboard render - subscriptions:', subscriptions, 'loading:', isLoadingSubscriptions, 'error:', subscriptionError);

  // Fetch stats data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Format currency using the user's preferred currency
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  // Filter and search subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    // Filter by status
    if (filterStatus !== "All") {
      if (filterStatus === "Active" && sub.status !== "active") return false;
      if (filterStatus === "Expired" && sub.status !== "expired") return false;
      if (filterStatus === "Upcoming" && sub.status !== "renewing soon") return false;
    }
    // Search by name, category, or plan
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sub.name.toLowerCase().includes(query) ||
        sub.category.toLowerCase().includes(query) ||
        sub.plan.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  console.log("subscriptions",subscriptions);

  // Pie chart: spending by category
  const spendingByCategory = subscriptions.reduce((acc, sub) => {
    acc[sub.category] = (acc[sub.category] || 0) + Number(sub.amount);
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#6366F1", "#06b6d4", "#f59e42", "#f43f5e", "#a3e635"];

  // Bar chart: monthly trend
  const chartData = subscriptions.map(sub => ({
    billing_cycle: sub.billing_cycle,
    amount: Number(sub.amount)
  }));

  // Handle adding a new subscription
  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setIsFormOpen(true);
  };

  // Handle editing a subscription
  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsFormOpen(true);
  };

  // Modal close handler
  const handleModalClose = () => {
    setIsFormOpen(false);
    setEditingSubscription(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
      <Sidebar user={user} />
      <FloatingThemeToggle />
      <div className="md:pl-72">
        <div className="mx-auto max-w-7xl py-10 px-4">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-8 flex items-center gap-2">
            <PieIcon className="w-8 h-8" /> Dashboard
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Monthly Cost</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{isLoadingSubscriptions ? "Loading..." : formatAmount(subscriptions.reduce((sum, s) => sum + Number(s.amount), 0))}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Active Subs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{isLoadingSubscriptions ? "Loading..." : subscriptions.length}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 flex items-center gap-4 transition-colors">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Most Expensive</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{isLoadingSubscriptions ? "Loading..." : formatAmount(subscriptions.reduce((max, s) => Number(s.amount) > max ? Number(s.amount) : max, 0))}</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 transition-colors">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <PieIcon className="w-5 h-5" /> Spending by Category
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="amount" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Subscriptions section */}
          <div className="mt-8">
            {/* Header and Add button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">Your Subscriptions</h2>
              <Button
                onClick={handleAddSubscription}
                className="inline-flex items-center rounded-md bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 px-2 py-4 text-sm font-medium text-white shadow-sm transition-colors"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Subscription
              </Button>
            </div>

            {/* Filters and search */}
            <SubscriptionFilter
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Subscriptions table */}
            <SubscriptionTable
              subscriptions={paginatedSubscriptions}
              isLoading={isLoadingSubscriptions}
              onEdit={handleEditSubscription}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSubscriptions.length}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Subscription form modal */}
      <Dialog open={isFormOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingSubscription ? "Edit Subscription" : "Add New Subscription"}
            </DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            subscription={editingSubscription}
            onClose={handleModalClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;