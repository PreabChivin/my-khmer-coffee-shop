"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OrderType } from "@/lib/types";

const STORAGE_KEY = "cafe-fulfillment";

interface FulfillmentContextValue {
  orderType: OrderType;
  address: string;
  setOrderType: (type: OrderType) => void;
  setAddress: (address: string) => void;
}

const FulfillmentContext = createContext<FulfillmentContextValue | undefined>(
  undefined
);

export function FulfillmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orderType, setOrderTypeState] = useState<OrderType>("PickUp");
  const [address, setAddressState] = useState("");

  useEffect(() => {
    // Deferred to an effect: localStorage is unavailable during SSR, so
    // reading it in the initializer would cause a hydration mismatch.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FulfillmentContextValue>;
        if (parsed.orderType === "PickUp" || parsed.orderType === "Delivery") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setOrderTypeState(parsed.orderType);
        }
        if (typeof parsed.address === "string") setAddressState(parsed.address);
      }
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  const persist = useCallback((type: OrderType, addr: string) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orderType: type, address: addr })
      );
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, []);

  const setOrderType = useCallback(
    (type: OrderType) => {
      setOrderTypeState(type);
      setAddressState((addr) => {
        persist(type, addr);
        return addr;
      });
    },
    [persist]
  );

  const setAddress = useCallback(
    (addr: string) => {
      setAddressState(addr);
      setOrderTypeState((type) => {
        persist(type, addr);
        return type;
      });
    },
    [persist]
  );

  const value = useMemo(
    () => ({ orderType, address, setOrderType, setAddress }),
    [orderType, address, setOrderType, setAddress]
  );

  return (
    <FulfillmentContext.Provider value={value}>
      {children}
    </FulfillmentContext.Provider>
  );
}

export function useFulfillment(): FulfillmentContextValue {
  const context = useContext(FulfillmentContext);
  if (!context) {
    throw new Error(
      "useFulfillment must be used within a FulfillmentProvider"
    );
  }
  return context;
}
