import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import SubscriptionTable from "@/components/subscription-table";
import SubscriptionForm from "@/components/subscription-form";
import SubscriptionFilter from "@/components/subscription-filter";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";


// Types
type FilterStatus = "All" | "Active" | "Expired" | "Upcoming";

function SubscriptionsPage() {
  // State for subscription form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show more items per page on dedicated subscriptions page

  // Authentication
  const { user } = useAuth();

  // Fetch subscriptions data
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/subscriptions", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      return response.json();
    },
    enabled: !!user, // Only fetch if user is authenticated
    retry: false
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
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  console.log("paginatedSubscriptions",paginatedSubscriptions);
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

  // Handler for filter status change to fix type issue
  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status as FilterStatus);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar user={user} />
      <FloatingThemeToggle />
      <div className="md:pl-72">
        <div className="mx-auto flex max-w-7xl flex-col md:px-8">
          {/* Top bar for mobile */}
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm md:hidden">
            <button 
              type="button" 
              className="border-r border-gray-200 dark:border-gray-700 px-4 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex flex-1 items-center">
                <h1 className="text-xl font-bold text-purple-700 dark:text-purple-400">SubTrack</h1>
              </div>
            </div>
          </div>


          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="mt-8">
                  <div className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 transition-all">
                    {/* Header and Add button */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center">
                          <span className="inline-block w-2 h-8 rounded bg-purple-600 dark:bg-purple-500 mr-3"></span>
                          Manage Your Subscriptions
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Easily add, edit, filter, and track all your recurring services in one place.</p>
                      </div>
                      <Button
                        onClick={handleAddSubscription}
                        className="inline-flex items-center bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white shadow-lg px-6 py-2 rounded-lg text-base font-semibold transition-colors"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Add Subscription
                      </Button>
                    </div>

                    {/* Filters and search */}
                    <div className="mb-4">
                      <SubscriptionFilter 
                        filterStatus={filterStatus}
                        setFilterStatus={handleFilterStatusChange}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                      />
                    </div>

                    {/* Subscriptions table */}
                    <div className="overflow-x-auto">
                      <SubscriptionTable 
                        subscriptions={paginatedSubscriptions}
                        isLoading={isLoadingSubscriptions}
                        onEdit={handleEditSubscription}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        setCurrentPage={setCurrentPage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Subscription Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
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

export default SubscriptionsPage;
