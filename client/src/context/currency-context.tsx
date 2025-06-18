import { Currency } from "@shared/schema";
import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { useMutation } from "@tanstack/react-query";
import { updateUserSettings } from "@/api";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Only fetch user data when needed
  const { user, refetch: refetchUser } = useUser(false);
  const [currency, setCurrencyState] = useState<Currency>("USD");
  
  // Update currency when user data changes
  useEffect(() => {
    if (user?.currency) {
      setCurrencyState(user.currency);
    }
  }, [user?.currency]);
  
  const { mutateAsync: updateUser } = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      refetchUser();
    }
  });
  
  const setCurrency = useCallback(async (newCurrency: Currency) => {
    // Set locally immediately for responsive UI
    setCurrencyState(newCurrency);
    
    // Update in backend if we have a user
    if (user?.id) {
      try {
        await updateUser({ currency: newCurrency });
      } catch (error) {
        console.error('Failed to update currency:', error);
        // Revert on error
        if (user?.currency) {
          setCurrencyState(user.currency);
        }
      }
    }
  }, [updateUser, user?.id, user?.currency]);
  
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
