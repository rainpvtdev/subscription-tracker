import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import StatsCard from "@/components/stats-card";
import SubscriptionTable from "@/components/subscription-table";
import SubscriptionForm from "@/components/subscription-form";
import SubscriptionFilter from "@/components/subscription-filter";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Floating Theme Toggle for quick access */}
      {/* <FloatingThemeToggle />
       */}
      {/* Main content */}
      <div className="md:pl-64">
        <div className="mx-auto flex max-w-7xl flex-col md:px-8">
          {/* Top bar for mobile */}
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white md:hidden">
            <button 
              type="button" 
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
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
              <div className="flex items-center">
                <div className="relative ml-3">
                  <div>
                    <button 
                      type="button" 
                      className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <span className="sr-only">Open user menu</span>
                      <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        {user?.name?.[0] || user?.username?.[0] || "U"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              
              {/* Stats cards */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="mt-6">
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatsCard 
                      title="Active Subscriptions"
                      value={stats?.activeCount || 0}
                      trend={{ 
                        type: "positive", 
                        text: stats?.activeCount > 0 ? `${stats?.activeCount} active subscriptions` : "No active subscriptions" 
                      }}
                      isLoading={isLoadingStats}
                    />
                    <StatsCard 
                      title="Monthly Cost"
                      value={stats?.monthlyCost || 0}
                      trend={{ 
                        type: "negative", 
                        text: stats?.monthlyCost > 0 ? `$${stats?.monthlyCost.toFixed(2)} per month` : "No monthly costs" 
                      }}
                      isCurrency
                      isLoading={isLoadingStats}
                    />
                    <StatsCard 
                      title="Upcoming Renewals (7 days)"
                      value={stats?.upcomingRenewals || 0}
                      trend={{ 
                        type: "warning", 
                        text: stats?.upcomingCost > 0 ? `Total: $${stats?.upcomingCost.toFixed(2)}` : "No upcoming renewals" 
                      }}
                      isLoading={isLoadingStats}
                    />
                  </dl>
                </div>

                {/* Subscriptions section */}
                <div className="mt-8">
                  {/* Header and Add button */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Your Subscriptions</h2>
                    <Button
                      onClick={handleAddSubscription}
                      className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
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
          </main>
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
