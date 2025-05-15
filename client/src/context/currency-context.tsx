import { Currency } from "@shared/schema";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useMutation } from "@tanstack/react-query";
import { updateUserSettings } from "@/api";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, refetch: refetchUser } = useUser();
  const [currency, setCurrencyState] = useState<Currency>(user?.currency || "USD");
  
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
  
  const setCurrency = async (newCurrency: Currency) => {
    // Set locally immediately for responsive UI
    setCurrencyState(newCurrency);
    
    // Update in backend
    if (user?.id) {
      await updateUser({ currency: newCurrency });
    }
  };
  
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
