import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon, ArrowDownIcon, Clock10Icon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  trend?: {
    type: "positive" | "negative" | "warning";
    text: string;
  };
  isCurrency?: boolean;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  trend,
  isCurrency = false,
  isLoading = false,
}: StatsCardProps) {
  // Format the value
  const formattedValue = isCurrency 
    ? `$${value.toFixed(2)}` 
    : value.toString();

  // Determine trend icon and color
  const getTrendUI = () => {
    if (!trend) return null;

    switch (trend.type) {
      case "positive":
        return (
          <div className="mt-2 flex items-center text-sm text-green-600">
            <ArrowUpIcon className="h-5 w-5 flex-shrink-0 self-center text-green-500" />
            <span className="ml-2">{trend.text}</span>
          </div>
        );
      case "negative":
        return (
          <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
              <ArrowDownIcon className="h-5 w-5 flex-shrink-0 self-center text-red-500" />
            </div>
            <span className="ml-2">{trend.text}</span>
          </div>
        );
      case "warning":
        return (
          <div className="mt-2 flex items-center text-sm text-amber-600">
            <Clock10Icon className="h-5 w-5 flex-shrink-0 self-center text-amber-500" />
            <span className="ml-2">{trend.text}</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
      <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900">{formattedValue}</dd>
      {getTrendUI()}
    </div>
  );
}
