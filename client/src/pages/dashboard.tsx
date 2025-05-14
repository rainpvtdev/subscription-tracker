import { useState } from "react";
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

  // Fetch subscriptions data
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  // Fetch stats data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
  });

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 transition-colors duration-300">
      <Sidebar user={user} />
      <FloatingThemeToggle />

      <div className="md:pl-72">
        <div className="mx-auto max-w-7xl py-10 px-4">
          <h1 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
            <PieIcon className="w-8 h-8" /> Dashboard
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-lg font-semibold text-gray-700">Active Subs</div>
                <div className="text-2xl font-bold text-gray-900">{stats?.activeCount || 0}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-lg font-semibold text-gray-700">Monthly Cost</div>
                <div className="text-2xl font-bold text-gray-900">${stats?.monthlyCost?.toFixed(2) || "0.00"}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <Calendar className="w-8 h-8 text-pink-500" />
              <div>
                <div className="text-lg font-semibold text-gray-700">Upcoming Renewals</div>
                <div className="text-2xl font-bold text-gray-900">{stats?.upcomingRenewals || 0}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-lg font-semibold text-gray-700">Most Expensive</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${subscriptions.reduce((max, s) => Number(s.amount) > max ? Number(s.amount) : max, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
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
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          {/* Subscriptions section */}
          <div className="mt-8">
            {/* Header and Add button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">Your Subscriptions</h2>
              <Button
                onClick={handleAddSubscription}
                className="inline-flex items-center rounded-md bg-purple-600 px-2 py-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
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