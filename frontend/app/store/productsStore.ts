import { create } from 'zustand';

export interface Product {
  documentId: string;
  name: string;
  slug: string;
  price: number;
  availableQuantity?: number;
  productType: 'bouquet' | 'singleflower' | 'composition' | 'accessory';
  description?: string;
  color?: string;
  cardType: 'standard' | 'large';
  image: Array<{
    documentId: string;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  }>;
  varieties: Array<{
    documentId: string;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ProductsStore {
  products: Product[];
  loading: boolean;
  lastFetch: number | null;
  error: string | null;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProducts: (force?: boolean) => Promise<void>;
  refreshProducts: () => Promise<void>;
  invalidateCache: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  clearProducts: () => void;
  
  // Getters
  getProductById: (id: string) => Product | undefined;
  getProductsByType: (type: string) => Product[];
  getProductsByVariety: (variety: string) => Product[];
  getProductsByColor: (color: string) => Product[];
}

// Для адмінки не використовуємо кешування - завжди актуальні дані
const CACHE_DURATION = 0; // Немає кешування для адмінки

export const useProductsStore = create<ProductsStore>()(
  // Прибрано persist middleware - дані не зберігаються в localStorage
  (set, get) => ({
    products: [],
    loading: false,
    lastFetch: null,
    error: null,

    setProducts: (products) => set({ products, lastFetch: Date.now() }),
    
    setLoading: (loading) => set({ loading }),
    
    setError: (error) => set({ error }),
    
    fetchProducts: async (force = false) => {
      const { loading } = get();
      
      // Для адмінки завжди завантажуємо дані (немає кешування)
      if (loading) {
        return;
      }
      
      set({ loading: true, error: null });
      
      try {
        console.log('🛒 Store: Fetching products from API (no cache)...');
        // Використовуємо адмін endpoint, який не фільтрує по publishedAt
        const response = await fetch('/api/admin/products?page=1&pageSize=1000', { 
          cache: 'no-store',
          next: { revalidate: 0 } // Завжди оновлюємо дані
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const products = data.data || [];
        
        console.log('🛒 Store: API response:', {
          status: response.status,
          dataLength: products.length,
          firstProduct: products[0] ? {
            name: products[0].name,
            documentId: products[0].documentId,
            slug: products[0].slug,
            productType: products[0].productType
          } : null
        });
        
        set({ 
          products, 
          loading: false, 
          lastFetch: Date.now(),
          error: null 
        });
        
        console.log('📦 Products loaded (no cache):', products.length);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        set({ 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    },

    // Force refresh convenience
    refreshProducts: async () => {
      await get().fetchProducts(true);
    },

    // Invalidate cache timestamp without dropping products
    invalidateCache: () => set({ lastFetch: null }),
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),
      
      updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map(product =>
          product.documentId === productId 
            ? { ...product, ...updates }
            : product
        )
      })),
      
      deleteProduct: (productId) => set((state) => ({
        products: state.products.filter(product => product.documentId !== productId)
      })),
      
      clearProducts: () => set({ 
        products: [], 
        lastFetch: null, 
        error: null 
      }),
      
      // Getters
      getProductById: (id) => {
        return get().products.find(product => product.documentId === id);
      },
      
      getProductsByType: (type) => {
        return get().products.filter(product => product.productType === type);
      },
      
      getProductsByVariety: (variety) => {
        return get().products.filter(product => 
          product.varieties.some(v => v.slug === variety)
        );
      },
      
      getProductsByColor: (color) => {
        return get().products.filter(product => product.color === color);
      },
    })
);
