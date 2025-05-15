import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Currency } from "@shared/schema";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency based on the provided currency code
 * @param amount The amount to format
 * @param currency The currency code (USD, EUR, etc.)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  currency: Currency = "USD",
  options: Intl.NumberFormatOptions = {}
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    ...options
  }).format(numAmount);
}

/**
 * Gets the currency symbol for the provided currency code
 * @param currency The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    INR: '₹',
    CNY: '¥'
  };
  
  return symbols[currency] || currency;
}
