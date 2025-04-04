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
    queryKey: ["/api/subscriptions"],
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

          {/* Subscriptions content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
              </div>
              
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Subscriptions section */}
                <div className="mt-8">
                  {/* Header and Add button */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-foreground">Manage Your Subscriptions</h2>
                    <Button
                      onClick={handleAddSubscription}
                      className="inline-flex items-center"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Add Subscription
                    </Button>
                  </div>

                  {/* Filters and search */}
                  <SubscriptionFilter 
                    filterStatus={filterStatus}
                    setFilterStatus={handleFilterStatusChange}
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
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    setCurrentPage={setCurrentPage}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Subscription Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
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
