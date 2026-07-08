"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DrinkCustomization, GroupCartStateDTO, ProductDTO } from "@/lib/types";

const GROUP_ID_KEY = "cafe-group-id";
const NAME_KEY_PREFIX = "cafe-group-name-";
const POLL_INTERVAL_MS = 4000;

interface GroupCartContextValue {
  isGroupMode: boolean;
  groupId: string | null;
  state: GroupCartStateDTO | null;
  isLoading: boolean;
  /** This device's remembered contributor name for the active group. */
  contributorName: string;
  setContributorName: (name: string) => void;
  startGroupSession: () => Promise<string | null>;
  leaveGroupSession: () => void;
  addGroupItem: (
    product: ProductDTO,
    quantity: number,
    customization: DrinkCustomization | null
  ) => Promise<boolean>;
  removeGroupItem: (itemId: string) => Promise<void>;
  updateGroupItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const GroupCartContext = createContext<GroupCartContextValue | undefined>(
  undefined
);

export function GroupCartProvider({ children }: { children: React.ReactNode }) {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [state, setState] = useState<GroupCartStateDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contributorName, setContributorNameState] = useState("");
  const hasHydrated = useRef(false);

  // Hydrate group id from the URL (?group=ID) or localStorage — deferred to an
  // effect since neither is available during SSR.
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("group");
      const fromStorage = window.localStorage.getItem(GROUP_ID_KEY);
      const id = fromUrl || fromStorage;
      if (id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGroupId(id);
        window.localStorage.setItem(GROUP_ID_KEY, id);
        const name = window.localStorage.getItem(NAME_KEY_PREFIX + id) ?? "";
        setContributorNameState(name);
      }
    } catch {
      // ignore
    }
    hasHydrated.current = true;
  }, []);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/group/${groupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setGroupId(null);
          window.localStorage.removeItem(GROUP_ID_KEY);
        }
        return;
      }
      const data: GroupCartStateDTO = await res.json();
      setState(data);
      if (data.status === "CHECKED_OUT") {
        // The organizer already paid — everyone else's session exits group mode.
        window.localStorage.removeItem(GROUP_ID_KEY);
      }
    } catch {
      // transient network hiccup — the next poll tick retries
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(null);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [groupId, refresh]);

  const setContributorName = useCallback(
    (name: string) => {
      setContributorNameState(name);
      if (groupId) {
        try {
          window.localStorage.setItem(NAME_KEY_PREFIX + groupId, name);
        } catch {
          // ignore
        }
      }
    },
    [groupId]
  );

  const startGroupSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/group", { method: "POST" });
      if (!res.ok) return null;
      const data: { id: string } = await res.json();
      setGroupId(data.id);
      window.localStorage.setItem(GROUP_ID_KEY, data.id);
      return data.id;
    } catch {
      return null;
    }
  }, []);

  const leaveGroupSession = useCallback(() => {
    setGroupId(null);
    setState(null);
    try {
      window.localStorage.removeItem(GROUP_ID_KEY);
    } catch {
      // ignore
    }
  }, []);

  const addGroupItem = useCallback(
    async (
      product: ProductDTO,
      quantity: number,
      customization: DrinkCustomization | null
    ): Promise<boolean> => {
      if (!groupId || !contributorName.trim()) return false;
      try {
        const res = await fetch(`/api/group/${groupId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributorName: contributorName.trim(),
            productId: product.id,
            quantity,
            customization,
          }),
        });
        if (res.ok) await refresh();
        return res.ok;
      } catch {
        return false;
      }
    },
    [groupId, contributorName, refresh]
  );

  const removeGroupItem = useCallback(
    async (itemId: string) => {
      if (!groupId) return;
      await fetch(`/api/group/${groupId}/items/${itemId}`, { method: "DELETE" });
      await refresh();
    },
    [groupId, refresh]
  );

  const updateGroupItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!groupId) return;
      if (quantity <= 0) return removeGroupItem(itemId);
      await fetch(`/api/group/${groupId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      await refresh();
    },
    [groupId, refresh, removeGroupItem]
  );

  const value: GroupCartContextValue = {
    isGroupMode: groupId !== null && state?.status !== "CHECKED_OUT",
    groupId,
    state,
    isLoading,
    contributorName,
    setContributorName,
    startGroupSession,
    leaveGroupSession,
    addGroupItem,
    removeGroupItem,
    updateGroupItemQuantity,
    refresh,
  };

  return (
    <GroupCartContext.Provider value={value}>
      {children}
    </GroupCartContext.Provider>
  );
}

export function useGroupCart(): GroupCartContextValue {
  const context = useContext(GroupCartContext);
  if (!context)
    throw new Error("useGroupCart must be used within a GroupCartProvider");
  return context;
}
