export interface FriendProfile {
  id: string;
  name: string;
  interests: string[];
  style?: string;
  budget?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  friendId: string;
  friendName: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlert {
  productId: string;
  targetPrice: number;
  createdAt: string;
}

export interface AssistantState {
  friends: FriendProfile[];
  collections: Collection[];
  wishlist: string[];
  priceAlerts: PriceAlert[];
}

const STORAGE_KEY = "sweetdill:assistant-state";

const emptyState: AssistantState = {
  friends: [],
  collections: [],
  wishlist: [],
  priceAlerts: [],
};

function normalizeName(name: string) {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return normalized.replace(/(^-|-$)/g, "");
}

export function readAssistantState(): AssistantState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as AssistantState;
    const normalizedFriends = (parsed.friends ?? []).map((friend) => ({
      ...friend,
      interests: friend.interests ?? [],
      createdAt: friend.createdAt ?? new Date().toISOString(),
      updatedAt: friend.updatedAt ?? new Date().toISOString(),
    }));
    const normalizedCollections = (parsed.collections ?? []).map((collection) => ({
      ...collection,
      productIds: collection.productIds ?? [],
      createdAt: collection.createdAt ?? new Date().toISOString(),
      updatedAt: collection.updatedAt ?? new Date().toISOString(),
    }));
    return {
      ...emptyState,
      ...parsed,
      friends: normalizedFriends,
      collections: normalizedCollections,
      wishlist: parsed.wishlist ?? [],
      priceAlerts: parsed.priceAlerts ?? [],
    };
  } catch {
    return emptyState;
  }
}

export function writeAssistantState(state: AssistantState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateAssistantState(
  updater: (current: AssistantState) => AssistantState
) {
  const current = readAssistantState();
  const next = updater(current);
  writeAssistantState(next);
  return next;
}

export function upsertFriend(
  state: AssistantState,
  payload: {
    name: string;
    interests?: string[];
    style?: string;
    budget?: string;
  }
) {
  const now = new Date().toISOString();
  const friendName = payload.name.trim();
  const existing = state.friends.find(
    (friend) => friend.name.toLowerCase() === friendName.toLowerCase()
  );

  if (existing) {
    const updated: FriendProfile = {
      ...existing,
      interests: payload.interests?.length ? payload.interests : existing.interests,
      style: payload.style ?? existing.style,
      budget: payload.budget ?? existing.budget,
      updatedAt: now,
    };

    return {
      ...state,
      friends: state.friends.map((friend) =>
        friend.id === existing.id ? updated : friend
      ),
    };
  }

  const idBase = normalizeName(friendName);
  const id = idBase ? `friend-${idBase}` : `friend-${Date.now()}`;
  const friend: FriendProfile = {
    id,
    name: friendName,
    interests: payload.interests ?? [],
    style: payload.style,
    budget: payload.budget,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...state,
    friends: [...state.friends, friend],
  };
}

export function upsertCollectionForFriend(
  state: AssistantState,
  payload: {
    friendName: string;
    productIds: string[];
  }
) {
  const now = new Date().toISOString();
  const friend = state.friends.find(
    (item) => item.name.toLowerCase() === payload.friendName.toLowerCase()
  );
  const friendId =
    friend?.id ?? `friend-${normalizeName(payload.friendName) || Date.now()}`;
  const collectionId = `collection-${friendId}`;
  const existing = state.collections.find(
    (collection) => collection.friendId === friendId
  );
  const mergedProducts = Array.from(
    new Set([...(existing?.productIds ?? []), ...payload.productIds])
  );

  if (existing) {
    const updated: Collection = {
      ...existing,
      productIds: mergedProducts,
      updatedAt: now,
    };
    return {
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === existing.id ? updated : collection
      ),
    };
  }

  const collection: Collection = {
    id: collectionId,
    friendId,
    friendName: payload.friendName.trim(),
    productIds: mergedProducts,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...state,
    collections: [...state.collections, collection],
  };
}

export function toggleWishlistItem(state: AssistantState, productId: string) {
  const hasItem = state.wishlist.includes(productId);
  return {
    ...state,
    wishlist: hasItem
      ? state.wishlist.filter((id) => id !== productId)
      : [...state.wishlist, productId],
  };
}

export function setPriceAlert(
  state: AssistantState,
  payload: { productId: string; targetPrice: number }
) {
  const now = new Date().toISOString();
  const existing = state.priceAlerts.find(
    (alert) => alert.productId === payload.productId
  );
  if (existing) {
    return {
      ...state,
      priceAlerts: state.priceAlerts.map((alert) =>
        alert.productId === payload.productId
          ? { ...alert, targetPrice: payload.targetPrice, createdAt: now }
          : alert
      ),
    };
  }
  return {
    ...state,
    priceAlerts: [
      ...state.priceAlerts,
      { productId: payload.productId, targetPrice: payload.targetPrice, createdAt: now },
    ],
  };
}

export function clearPriceAlert(state: AssistantState, productId: string) {
  return {
    ...state,
    priceAlerts: state.priceAlerts.filter((alert) => alert.productId !== productId),
  };
}
