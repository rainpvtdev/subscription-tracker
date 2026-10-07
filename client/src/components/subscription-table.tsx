import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Edit, Trash2, RefreshCw, Check, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";

interface SubscriptionTableProps {
    subscriptions: Subscription[];
    isLoading: boolean;
    onEdit: (subscription: Subscription) => void;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    setCurrentPage: (page: number) => void;
}

export default function SubscriptionTable({ subscriptions: initialSubscriptions, isLoading, onEdit, currentPage, totalPages, totalItems, itemsPerPage, setCurrentPage }: SubscriptionTableProps) {
    // Calculate pagination range
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const { toast } = useToast();
    const { currency } = useCurrency();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [renewingId, setRenewingId] = useState<number | null>(null);
    const [selectedSort, setSelectedSort] = useState<string>("");
    const [selectedBulkAction, setSelectedBulkAction] = useState<string>("");
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
    const [selectAll, setSelectAll] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkExporting, setIsBulkExporting] = useState(false);

    // Update subscriptions when initialSubscriptions change or sort changes
    useEffect(() => {
        let sortedData = [...initialSubscriptions];
        
        // Apply sorting
        if (selectedSort) {
            sortedData = sortData(sortedData, selectedSort);
        }
        
        setSubscriptions(sortedData);
    }, [initialSubscriptions, selectedSort]);

    // Get subscription being deleted
    const subscriptionToDelete = subscriptions.find((s) => s.id === deletingId);
    // Get subscription being renewed
    const subscriptionToRenew = subscriptions.find((s) => s.id === renewingId);
    
    // Sort subscriptions
    const sortData = (data: Subscription[], sortType: string) => {
        switch (sortType) {
            case "date-asc":
                return [...data].sort((a, b) => 
                    new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
                );
            case "date-desc":
                return [...data].sort((a, b) => 
                    new Date(b.next_payment_date).getTime() - new Date(a.next_payment_date).getTime()
                );
            case "amount-asc":
                return [...data].sort((a, b) => Number(a.amount) - Number(b.amount));
            case "amount-desc":
                return [...data].sort((a, b) => Number(b.amount) - Number(a.amount));
            case "name-asc":
                return [...data].sort((a, b) => a.name.localeCompare(b.name));
            case "name-desc":
                return [...data].sort((a, b) => b.name.localeCompare(a.name));
            default:
                return data;
        }
    };

    // Handle sort change
    const handleSortChange = (sortType: string) => {
        setSelectedSort(sortType);
    };

    // Toggle select all subscriptions
    const toggleSelectAll = () => {
        if (selectAll) {
            // Deselect all
            setSelectedItems([]);
        } else {
            // Select all
            setSelectedItems(subscriptions.map(subscription => subscription.id as number));
        }
        setSelectAll(!selectAll);
    };

    // Toggle select single subscription
    const toggleSelectItem = (id: number) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
            setSelectAll(false);
        } else {
            setSelectedItems([...selectedItems, id]);
            // Check if all items are now selected
            if (selectedItems.length + 1 === subscriptions.length) {
                setSelectAll(true);
            }
        }
    };

    // Handle bulk action
    const handleBulkAction = () => {
        if (selectedItems.length === 0) {
            toast({
                title: "No items selected",
                description: "Please select at least one subscription to perform this action",
            });
            return;
        }

        switch (selectedBulkAction) {
            case "delete":
                // Show bulk delete confirmation
                setIsBulkDeleting(true);
                break;
            case "export":
                // Export selected items
                handleExportSelected();
                break;
            default:
                // No action selected
                toast({
                    title: "No action selected",
                    description: "Please select an action to perform",
                });
        }
    };

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            // Delete multiple subscriptions
            for (const id of ids) {
                await apiRequest("DELETE", `/api/subscriptions/${id}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            toast({
                title: "Success",
                description: `${selectedItems.length} subscription(s) deleted successfully`,
            });
            setIsBulkDeleting(false);
            setSelectedItems([]);
            setSelectAll(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
            setIsBulkDeleting(false);
        },
    });

    // Handle bulk delete confirmation
    const handleBulkDelete = () => {
        if (selectedItems.length > 0) {
            bulkDeleteMutation.mutate(selectedItems);
        }
    };

    // Handle export selected
    const handleExportSelected = () => {
        setIsBulkExporting(true);
        
        try {
            // Get selected subscriptions
            const selectedSubscriptions = subscriptions.filter(sub => selectedItems.includes(sub.id as number));
            
            // Convert to CSV
            const replacer = (key: string, value: any) => value === null ? '' : value;
            const header = Object.keys(selectedSubscriptions[0]);
            const csv = [
                header.join(','), // CSV header
                ...selectedSubscriptions.map(row => header.map(fieldName => 
                    JSON.stringify((row as any)[fieldName], replacer)).join(','))
            ].join('\r\n');
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'subscriptions_export.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setIsBulkExporting(false);
            
            toast({
                title: "Export successful",
                description: `${selectedItems.length} subscription(s) exported successfully`,
            });
            
            // Clear selection after export
            setSelectedItems([]);
            setSelectAll(false);
            setSelectedBulkAction("");
        } catch (error) {
            setIsBulkExporting(false);
            toast({
                title: "Export failed",
                description: "Failed to export subscriptions. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/subscriptions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            toast({
                title: "Success",
                description: "Subscription deleted successfully",
            });
            setDeletingId(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Renew mutation
    const renewMutation = useMutation({
        mutationFn: async (id: number) => {
            // Get the subscription
            const subscription = subscriptions.find(s => s.id === id);
            if (!subscription) return;
            
            // Calculate new payment date based on billing cycle
            const currentDate = new Date(subscription.next_payment_date);
            let newDate = new Date(currentDate);
            
            switch (subscription.billing_cycle.toLowerCase()) {
                case "monthly":
                    newDate.setMonth(newDate.getMonth() + 1);
                    break;
                case "quarterly":
                    newDate.setMonth(newDate.getMonth() + 3);
                    break;
                case "semi-annually":
                    newDate.setMonth(newDate.getMonth() + 6);
                    break;
                case "annually":
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    break;
                default:
                    // Default to monthly if unknown billing cycle
                    newDate.setMonth(newDate.getMonth() + 1);
            }
            
            // Update the subscription with the new date
            const res = await apiRequest("PUT", `/api/subscriptions/${id}`, {
                ...subscription,
                next_payment_date: newDate.toISOString(),
                // Set status to active in case it was expired or renewing soon
                status: "active",
            });
            
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            toast({
                title: "Success",
                description: "Subscription renewed successfully",
            });
            setRenewingId(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Handle delete confirmation
    const handleDelete = () => {
        if (deletingId) {
            deleteMutation.mutate(deletingId);
        }
    };

    // Handle renew confirmation
    const handleRenew = () => {
        if (renewingId) {
            renewMutation.mutate(renewingId);
        }
    };

    // Format date for display
    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Format amount for display
    const formatAmount = (amount: string | number) => {
        return formatCurrency(amount, currency);
    };

    // Generate category icon based on subscription category
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case "entertainment":
                return (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </div>
                );
            case "music":
                return (
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                        </svg>
                    </div>
                );
            case "software":
                return (
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                );
            case "shopping":
                return (
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                );
            case "gaming":
                return (
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                    </div>
                );
        }
    };

    // Get status badge class based on status
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
            case "renewing soon":
                return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
            case "expired":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
            case "canceled":
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="mt-6 flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Empty state
    if (subscriptions.length === 0) {
        return (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new subscription.</p>
            </div>
        );
    }

    // Main table rendering
    return (
        <div className="mt-6 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 md:rounded-lg">
                        <div className="bg-background">
                            <div className="mb-4 flex items-center space-x-4 p-4">
                                <select 
                                    className="rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    value={selectedBulkAction}
                                    onChange={(e) => setSelectedBulkAction(e.target.value)}
                                >
                                    <option value="">Bulk Actions</option>
                                    <option value="delete">Delete Selected</option>
                                    <option value="export">Export Selected</option>
                                </select>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleBulkAction}
                                    disabled={!selectedBulkAction || selectedItems.length === 0}
                                >
                                    Apply
                                </Button>

                                <select 
                                    className="rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                    value={selectedSort}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                >
                                    <option value="">Sort By</option>
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="name-desc">Name (Z-A)</option>
                                </select>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                    Service
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Plan
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Amount
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Billing Cycle
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Next Payment
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    Status
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </div>
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-background">
                                    <tr className="divide-y divide-border">
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                            #
                                        </th>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                                            Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Service
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Plan
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Billing Cycle
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Next Payment
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                            Status
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {subscriptions.map((subscription) => (
                                        <tr key={subscription.id} className={selectedItems.includes(subscription.id as number) ? "bg-muted/50" : ""}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                                                <Checkbox 
                                                    checked={selectedItems.includes(subscription.id as number)} 
                                                    onCheckedChange={() => toggleSelectItem(subscription.id as number)}
                                                    aria-label={`Select ${subscription.name}`}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">{getCategoryIcon(subscription.category)}</div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-foreground">{subscription.name}</div>
                                                        <div className="text-muted-foreground">{subscription.category}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{subscription.plan}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{formatAmount(subscription.amount)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{subscription.billing_cycle}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{formatDate(subscription.next_payment_date)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(subscription.status)}`}>
                                                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-border dark:bg-background dark:hover:bg-muted dark:text-foreground"
                                                        >
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem onClick={() => onEdit(subscription)} className="cursor-pointer">
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => setRenewingId(subscription.id)} 
                                                            className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Renew
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => setDeletingId(subscription.id)} 
                                                            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-border bg-background px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        Next
                    </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <Button variant="outline" size="sm" className="rounded-l-md" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path
                                        fillRule="evenodd"
                                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </Button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <Button
                                    key={i + 1}
                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                    size="sm"
                                    className={`${currentPage === i + 1 ? "bg-purple-600  text-primary-foreground" : ""}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button variant="outline" size="sm" className="rounded-r-md" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path
                                        fillRule="evenodd"
                                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 01.02-1.06.751.751 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </Button>
                        </nav>
                    </div>
                </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingId} onOpenChange={(isOpen) => !isOpen && setDeletingId(null)}>
                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Delete this subscription?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                            This will permanently delete the subscription "{subscriptionToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Renew Confirmation Dialog */}
            <AlertDialog open={!!renewingId} onOpenChange={(isOpen) => !isOpen && setRenewingId(null)}>
                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Renew this subscription?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                            This will extend "{subscriptionToRenew?.name}" subscription for another {subscriptionToRenew?.billing_cycle.toLowerCase()} period. The next payment date will be updated accordingly.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRenew} className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600">
                            {renewMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Renewing...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Renew Subscription
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleting} onOpenChange={(isOpen) => !isOpen && setIsBulkDeleting(false)}>
                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Delete Multiple Subscriptions?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                            This will permanently delete {selectedItems.length} subscription(s). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">
                            {bulkDeleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete All Selected"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </div>
    );
}
