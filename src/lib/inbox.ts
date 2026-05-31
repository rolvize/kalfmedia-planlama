// Inbox utility — hızlı fikir kutusu için localStorage tabanlı CRUD
// Tarayıcı tabında gerçek zamanlı senkronizasyon için custom event kullanır

export interface InboxItem {
  id: string;
  text: string;
  created_at: string;
}

const INBOX_KEY = "kalfmedia_inbox_v1";
const INBOX_EVENT = "kalfmedia-inbox-updated";

export const getInboxItems = (): InboxItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(INBOX_KEY) || "[]");
  } catch {
    return [];
  }
};

export const addInboxItem = (text: string): InboxItem => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Boş not eklenemez");
  
  const items = getInboxItems();
  const newItem: InboxItem = {
    id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: trimmed,
    created_at: new Date().toISOString()
  };
  items.unshift(newItem);
  localStorage.setItem(INBOX_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(INBOX_EVENT));
  return newItem;
};

export const deleteInboxItem = (id: string): void => {
  const items = getInboxItems().filter(i => i.id !== id);
  localStorage.setItem(INBOX_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(INBOX_EVENT));
};

export const clearAllInbox = (): void => {
  localStorage.setItem(INBOX_KEY, "[]");
  window.dispatchEvent(new CustomEvent(INBOX_EVENT));
};

export const subscribeToInbox = (cb: () => void): () => void => {
  window.addEventListener(INBOX_EVENT, cb);
  return () => window.removeEventListener(INBOX_EVENT, cb);
};

export const INBOX_EVENT_NAME = INBOX_EVENT;
