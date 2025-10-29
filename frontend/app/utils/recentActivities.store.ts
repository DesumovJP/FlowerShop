// Recent Activities Store: reliable localStorage-based log for POS/admin actions

export type ActivityType = 'order' | 'productDeleted' | 'productCreated' | 'productUpdated' | 'varietyCreated' | 'varietyUpdated';

export interface OrderItemActivity {
  documentId: string;
  quantity: number;
  price?: number;
}

export interface ActivityBase {
  id: string; // uuid
  ts: number; // Date.now()
  type: ActivityType;
  source: 'pos' | 'admin' | 'api';
  workerSlug?: string;
  createdAt?: string; // ISO string for UI convenience
}

export interface OrderActivity extends ActivityBase {
  type: 'order';
  payload: {
    items: OrderItemActivity[];
  };
}

export interface ProductDeletedActivity extends ActivityBase {
  type: 'productDeleted';
  payload: {
    documentId: string;
    availableQuantity: number;
    name?: string;
    productType?: string;
    remainingAfter?: number;
    price?: number;
  };
}

export interface ProductCreatedUpdatedActivity extends ActivityBase {
  type: 'productCreated' | 'productUpdated';
  payload: {
    documentId: string;
    availableQuantity: number;
    delta?: number; // preferred for deliveries
    name?: string;
    productType?: string;
    price?: number;
    color?: string;
    varieties?: Array<{ id: string; name: string }>; // IDs and names of varieties
  };
}

export interface VarietyCreatedUpdatedActivity extends ActivityBase {
  type: 'varietyCreated' | 'varietyUpdated';
  payload: {
    documentId: string;
    name: string;
    slug: string;
    description?: string;
  };
}

export type Activity =
  | OrderActivity
  | ProductDeletedActivity
  | ProductCreatedUpdatedActivity
  | VarietyCreatedUpdatedActivity;

export type AggregatedByProduct = Record<
  string,
  { sold: number; writtenOff: number; delivered: number }
>;

const STORAGE_KEY = 'recentActivities';
const UPDATE_EVENT = 'recentActivities:update';
const MAX_ENTRIES = 500;

function safeDispatchUpdate(): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
    }
  } catch {}
}

export function read(): Activity[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as Activity[]) : [];
  } catch (e) {
    console.error('recentActivities.read failed:', e);
    return [];
  }
}

export function write(list: Activity[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
    safeDispatchUpdate();
  } catch (e) {
    console.error('recentActivities.write failed:', e);
  }
}

export function append(activity: Activity): void {
  try {
    // Basic validation
    if (!activity || typeof activity !== 'object' || !activity.type || !activity.id) return;
    if (activity.type === 'order') {
      const orderActivity = activity as OrderActivity;
      if (!orderActivity.payload?.items || !Array.isArray(orderActivity.payload.items)) return;
    } else {
      const payload = (activity as ProductDeletedActivity | ProductCreatedUpdatedActivity).payload;
      if (!payload || !payload.documentId) return;
    }

    const existing = read();
    const updated = [activity, ...existing].slice(0, MAX_ENTRIES);
    write(updated);
  } catch (e) {
    console.error('recentActivities.append failed:', e);
  }
}

export function clear(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    safeDispatchUpdate();
  } catch (e) {
    console.error('recentActivities.clear failed:', e);
  }
}

export function aggregate(): AggregatedByProduct {
  try {
    const activities = read();
    const aggregated: AggregatedByProduct = {};

    const ensure = (productId: string) => {
      if (!aggregated[productId]) aggregated[productId] = { sold: 0, writtenOff: 0, delivered: 0 };
      return aggregated[productId];
    };

    for (const activity of activities) {
      // Обробка замовлень (orders)
      if (activity.type === 'order' || activity.items) {
        // Новий формат: activity.payload.items
        if (activity.payload?.items) {
          for (const item of activity.payload.items) {
            if (!item?.documentId) continue;
            ensure(item.documentId).sold += item.quantity || 0;
          }
        }
        // Старий формат: activity.items
        else if (activity.items) {
          for (const item of activity.items) {
            if (!item?.documentId) continue;
            ensure(item.documentId).sold += item.quantity || 0;
          }
        }
        continue;
      }
      
      // Обробка списання товарів
      if (activity.type === 'productDeleted') {
        const payload = activity.payload || activity;
        const documentId = payload.documentId;
        const availableQuantity = payload.availableQuantity || payload.remainingAfter || 0;
        
        if (!documentId) continue;
        ensure(documentId).writtenOff += availableQuantity;
        continue;
      }
      
      // Обробка поставок (створення/оновлення товарів)
      if (activity.type === 'productCreated' || activity.type === 'productUpdated') {
        const payload = activity.payload || activity;
        const documentId = payload.documentId;
        const availableQuantity = payload.availableQuantity || 0;
        const delta = payload.delta;
        
        if (!documentId) continue;
        const inc = typeof delta === 'number' ? delta : Math.max(availableQuantity, 0);
        if (inc > 0) {
          ensure(documentId).delivered += inc;
        }
        continue;
      }
    }

    return aggregated;
  } catch (e) {
    console.error('recentActivities.aggregate failed:', e);
    return {};
  }
}

export function calculateTotalSales(
  products: Array<{ documentId: string; price?: number }>,
  agg: AggregatedByProduct,
): number {
  return (products || []).reduce((sum, p) => {
    const a = p?.documentId ? agg[p.documentId] : undefined;
    return sum + ((p.price || 0) * (a?.sold || 0));
  }, 0);
}


