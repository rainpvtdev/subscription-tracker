import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon } from "lucide-react";

interface SubscriptionFilterProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SubscriptionFilter({
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
}: SubscriptionFilterProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-xl border border-gray-200 dark:border-zinc-800 p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Filter by status */}
      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-sm font-medium text-foreground">
          Status:
        </label>
        <Select
          value={filterStatus}
          onValueChange={setFilterStatus}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mt-2 sm:mt-0">
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search subscriptions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}
