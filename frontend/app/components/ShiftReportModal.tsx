'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import FlowerSpinner from './FlowerSpinner';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import ShiftReportForm from './ShiftReportForm';
import RecentActivitiesTable from './RecentActivitiesTable';
import { aggregate, calculateTotalSales, clear as clearRecentActivities, read as readRecentActivities } from '../utils/recentActivities.store';

interface Worker {
  id: number;
  name: string;
  role: string;
  phone?: string;
  slug: string;
}

interface Product {
  name: string;
  quantity: number;
  price?: number;
}

interface AllProduct {
  id: number; // ID з таблиці Product
  documentId: string;
  name: string;
  slug: string;
  price: number;
  availableQuantity?: number; // Поточна кількість на складі
  productType?: string; // Тип товару (bouquet, singleflower)
  description?: string;
  cardType?: string;
  color?: string;
  image?: any[];
  varieties?: any[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ShiftReport {
  id: number;
  documentId: string;
  date: string;
  worker: Worker;
  itemsSnapshot: any; // JSON поле з масивом товарів
  shiftComment: string;
  cash: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftReportModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  report?: ShiftReport;
  onSave: (data: any, itemsSnapshot?: any[]) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function ShiftReportModal({
  open,
  onClose,
  date,
  report,
  onSave,
  onDelete,
  onRefresh,
}: ShiftReportModalProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'create' | 'close'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<AllProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [workers, setWorkers] = useState<any[]>([]);
  const [isFromPreviousShift, setIsFromPreviousShift] = useState(false);
  // Ререндер при оновленні "Останні дії"
  const [recentActivitiesVersion, setRecentActivitiesVersion] = useState(0);
  const [createFormData, setCreateFormData] = useState({
    worker: 0,
    cash: 0,
    shiftComment: '',
  });

  // Хелпер для витягування масиву items з itemsSnapshot (підтримує обидва формати)
  const getItemsFromSnapshot = (snapshot: any): any[] => {
    if (!snapshot) return [];
    // Якщо це об'єкт з полем items (новий формат)
    if (typeof snapshot === 'object' && !Array.isArray(snapshot) && snapshot.items && Array.isArray(snapshot.items)) {
      return snapshot.items;
    }
    // Якщо це масив (старий формат)
    if (Array.isArray(snapshot)) {
      return snapshot;
    }
    return [];
  };

  useEffect(() => {
    if (open) {
      if (report) {
        setMode('view');
        
        // Для режиму view завантажуємо повну інформацію про товари
        const items = getItemsFromSnapshot(report.itemsSnapshot);
        if (items && items.length > 0) {
          fetchProductsForViewMode(items);
        } else {
          setAllProducts([]);
          setSelectedProducts({});
        }
      } else {
        setMode('create');
        // Ініціалізуємо selectedProducts для режиму створення
        setSelectedProducts({});
        // Автоматично завантажуємо товари при відкритті create-модалки
        handleLoadCurrentProducts();
      }
      setError(null);
      setLoading(false); // Скидаємо loading при відкритті
      // Завантажуємо робітників одразу при відкритті модалки
      fetchWorkers();
      // Слухаємо оновлення "Останні дії" і оновлюємо представлення в create-mode
      if (typeof window !== 'undefined') {
        const handler = () => setRecentActivitiesVersion(v => v + 1);
        window.addEventListener('recentActivities:update', handler);
        return () => {
          window.removeEventListener('recentActivities:update', handler);
        };
      }
    } else {
      // При закритті модалки скидаємо стан
      setAllProducts([]);
      setSelectedProducts({});
      setWorkers([]);
      setIsFromPreviousShift(false);
      setLoading(false);
    }
  }, [open, report]);

  // Окремий useEffect для завантаження товарів після встановлення режиму
  useEffect(() => {
    if (open && (mode === 'create' || mode === 'close')) {
      // Не завантажуємо товари автоматично, тільки коли користувач натисне кнопку "Завантажити товари станом на зараз"
    }
  }, [open, mode]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);

      // Завантажуємо всі товари з поточною кількістю
        const response = await fetch('/api/products?pageSize=1000');
        const data = await response.json();

        const products = (data.data || []).map((product: AllProduct) => ({
          ...product,
          id: product.documentId
        }));

        setAllProducts(products);
        
      // Ініціалізуємо selectedProducts для всіх товарів з нульовою кількістю
        const initialSelectedProducts: {[key: string]: number} = {};
        products.forEach((product: AllProduct) => {
          initialSelectedProducts[product.documentId] = 0;
        });
        setSelectedProducts(initialSelectedProducts);
        setIsFromPreviousShift(false);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Помилка при завантаженні товарів');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousShiftProducts = async () => {
    try {
      // Обчислюємо дату вчора
      const today = new Date(date);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = normalizeDate(yesterday); // ✅ Нормалізуємо дату
      
      // Використовуємо GraphQL API для пошуку попередньої зміни
      const query = `
        query {
          shiftReports(filters: { slug: { eq: "${yesterdayStr}" } }) {
            id
            slug
            itemsSnapshot
          }
        }
      `;
      
      const response = await fetch('/api/shift-reports-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          workerSlug: '', // ✅ Додаємо workerSlug (порожній для пошуку)
          date: yesterdayStr // ✅ Додаємо date
        }),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.data && data.data.shiftReports && data.data.shiftReports.length > 0) {
        const previousShift = data.data.shiftReports[0];
        
        if (previousShift.itemsSnapshot) {
          const items = getItemsFromSnapshot(previousShift.itemsSnapshot);
          // Перетворюємо itemsSnapshot (JSON) в формат AllProduct
          const products = items.map((item: any) => {
            if (!item.product) {
              console.warn('⚠️ Skipping product without valid product ID:', item);
              return null;
            }
            
            return {
              id: item.product, // Використовуємо product як id
              documentId: item.product,
              name: item.name || 'Без назви',
              price: item.price || 0,
              slug: item.slug || '',
              description: item.description || '',
              cardType: item.cardType || 'BOUQUET',
              color: item.color || 'RED',
              image: item.image || [],
              varieties: item.varieties || [],
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              publishedAt: item.publishedAt || new Date().toISOString(),
              quantity: item.quantity,
            };
          }).filter((product: any) => product !== null);
          
          return products;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching previous shift products:', error);
      return null;
    }
  };

  const fetchProductsForViewMode = async (itemsSnapshot: any) => {
    try {
      setLoading(true);
      
      // itemsSnapshot тепер JSON поле з масивом товарів
      const items = getItemsFromSnapshot(itemsSnapshot);
      if (!items || items.length === 0) {
        console.warn('⚠️ itemsSnapshot is empty:', itemsSnapshot);
        setAllProducts([]);
        setSelectedProducts({});
        return;
      }
      
      const viewProducts: AllProduct[] = [];
      const selectedProductsMap: {[key: string]: number} = {};
      
      items.forEach((item: any) => {
        if (item && item.product && item.quantity !== undefined) {
          // Додаємо продукт до списку
          viewProducts.push({
            id: item.product,
            documentId: item.product,
            name: item.name || 'Без назви',
            slug: item.slug || '',
            price: item.price || 0,
            description: item.description || '',
            cardType: item.cardType || 'BOUQUET',
            color: item.color || 'RED',
            image: item.image || [],
            varieties: item.varieties || [],
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            publishedAt: item.publishedAt || new Date().toISOString(),
          });
          
          // Використовуємо documentId як ключ для selectedProductsMap
          selectedProductsMap[item.product] = item.quantity || 0;
        }
      });
      
      setAllProducts(viewProducts);
      setSelectedProducts(selectedProductsMap);
      
    } catch (error) {
      console.error('Error processing products for view mode:', error);
      setError('Помилка при обробці товарів');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      console.log('Fetching workers...');
      const response = await fetch('/api/workers');
      if (response.ok) {
        const data = await response.json();
        console.log('Workers data:', data);
        setWorkers(data.data || []);
      } else {
        console.error('Failed to fetch workers:', response.status);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleLoadCurrentProducts = async () => {
    try {
      setLoading(true);
      
      // Завантажуємо всі товари з поточною кількістю
      const response = await fetch('/api/products?pageSize=1000');
      const data = await response.json();

      console.log('📦 Products API response:', data);

      const products = (data.data || []).map((product: AllProduct) => ({
        ...product,
        id: product.documentId
      }));

      console.log('📦 Mapped products:', products);
      console.log('📦 First product availableQuantity:', products[0]?.availableQuantity);

      setAllProducts(products);
      
      // Ініціалізуємо selectedProducts з поточною кількістю товарів
      const initialSelectedProducts: {[key: string]: number} = {};
      products.forEach((product: AllProduct) => {
        console.log(`📦 Product ${product.name}: availableQuantity = ${product.availableQuantity}`);
        // Використовуємо той самий ключ, що і в UI: product.slug || product.documentId
        const key = product.slug || product.documentId;
        initialSelectedProducts[key] = product.availableQuantity || 0;
      });
      
      console.log('📦 Initial selected products:', initialSelectedProducts);
      setSelectedProducts(initialSelectedProducts);
      setIsFromPreviousShift(false);
      
    } catch (error) {
      console.error('Error loading current products:', error);
      setError('Помилка при завантаженні товарів');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setMode('edit');
  };

  const handleCloseShift = () => {
    setMode('close');
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    console.log(`🔄 handleProductQuantityChange: ${productId} -> ${quantity}`);
    setSelectedProducts(prev => {
      const newState = {
      ...prev,
      [productId]: quantity
      };
      console.log('🔄 New selectedProducts state:', newState);
      return newState;
    });
  };

  // Функція для нормалізації дати до формату YYYY-MM-DD
  const normalizeDate = (dateInput: string | Date): string => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date input:', dateInput);
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error normalizing date:', dateInput, error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Функція для перевірки існуючої зміни за slug
  const checkExistingShift = async (slug: string, workerSlug?: string, date?: string) => {
    try {
      const query = `
        query {
          shiftReports {
            documentId
            slug
          }
        }
      `;
      
      console.log('🔍 checkExistingShift params:', { slug, workerSlug, date });
      
      const response = await fetch('/api/shift-reports-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          slug: slug || '', // ✅ Додаємо slug
          date: date || '', // ✅ Додаємо date
          workerSlug: workerSlug || '' // ✅ Додаємо workerSlug
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.shiftReports) {
        const existingShift = data.data.shiftReports.find((shift: any) => shift.slug === slug);
        return existingShift ? existingShift.documentId : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing shift:', error);
      return null;
    }
  };

  // Функція для створення нової зміни (без itemsSnapshot)
  const createShiftReport = async (payload: any) => {
    try {
      const mutation = `
        mutation CreateShiftReport($date: Date!, $slug: String!, $cash: Float!, $shiftComment: String!, $worker: ID!) {
          createShiftReport(data: {
            date: $date,
            slug: $slug,
            cash: $cash,
            shiftComment: $shiftComment,
            worker: $worker
          }) {
            documentId
            date
            slug
            cash
            shiftComment
            worker {
              name
            }
          }
        }
      `;
      
      console.log('📦 Payload:', payload);
      console.log('🔍 GraphQL mutation:', mutation);
      
      const response = await fetch('/api/shift-reports-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: mutation,
          workerSlug: payload.workerSlug || '', // ✅ Додаємо workerSlug для пошуку workerId
          date: payload.date || '', // ✅ Додаємо date
          slug: payload.slug || '', // ✅ Додаємо slug
          cash: payload.cash || 0, // ✅ Додаємо cash
          shiftComment: payload.shiftComment || '', // ✅ Додаємо shiftComment
          worker: payload.worker || 0 // ✅ Додаємо worker (для валідації)
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 createShiftReport response:', data);
      
      // Support both shapes:
      // 1) API route returns the created object directly
      // 2) Raw GraphQL passthrough returns { data: { createShiftReport: {...} } }
      const created = (data && data.documentId) ? data : (data?.data?.createShiftReport ?? null);
      if (created && created.documentId) {
        console.log('✅ Successfully created shift report with documentId:', created.documentId);
        return created.documentId;
      }
      
      console.error('❌ No createShiftReport data in response:', data);
      throw new Error('Failed to create shift report - no data returned');
    } catch (error) {
      console.error('Error creating shift report:', error);
      throw error;
    }
  };

  // Використовуємо утиліту для агрегації даних з recentActivities
  const aggregateRecentActivities = aggregate;

  // Використовуємо утиліту для розрахунку суми продажів
  const calculateTotalSalesFromActivities = (products: AllProduct[], activityData: Record<string, { sold: number; writtenOff: number; delivered: number }>) => {
    return calculateTotalSales(products, activityData);
  };

  // Функція для завершення зміни з збереженням зліпка товарів
  const finalizeShift = async (documentId: string) => {
    try {
      console.log('🟡 Finalizing shift:', documentId);

      // 1. Отримати всі продукти
      const productsResponse = await fetch('/api/products?pageSize=1000');
      const { data: products } = await productsResponse.json();

      if (!products || products.length === 0) {
        console.warn('⚠️ No products found');
        return;
      }

      // 2. Агрегувати дані з recentActivities
      const activityData = aggregateRecentActivities();
      console.log('📊 Aggregated activity data:', activityData);

      // Підраховуємо кількість замовлень та суми готівки/картки
      const recentActivities = readRecentActivities();
      const ordersCount = recentActivities.filter((a: any) => 
        a.type === 'order' || !!a.items || (a.payload?.items && Array.isArray(a.payload.items))
      ).length;

      // Розраховуємо реальні суми готівки/картки з замовлень
      let totalCashSales = 0;
      let totalCardSales = 0;
      
      recentActivities.forEach((activity: any) => {
        if (activity.type === 'order' || (activity.payload?.items && Array.isArray(activity.payload.items))) {
          const items = activity.items || activity.payload?.items || [];
          const orderTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
          
          // Перевіряємо, чи є інформація про спосіб оплати
          if (activity.paymentMethod === 'cash') {
            totalCashSales += orderTotal;
          } else if (activity.paymentMethod === 'card') {
            totalCardSales += orderTotal;
          } else {
            // Якщо немає інформації про спосіб оплати, розподіляємо 50/50
            totalCashSales += orderTotal * 0.5;
            totalCardSales += orderTotal * 0.5;
          }
        }
      });

      // 3. Побудувати itemsSnapshot з даними про продажі/списання/поставки
      const itemsSnapshotArray = products.map((p: any) => {
        const activity = activityData[p.documentId] || { sold: 0, writtenOff: 0, delivered: 0 };
        return {
        product: p.documentId,
        name: p.name,
        slug: p.slug,
        quantity: p.availableQuantity || 0,
        price: p.price || 0,
          type: p.productType || 'BOUQUET',
          sold: activity.sold,
          writtenOff: activity.writtenOff,
          delivered: activity.delivered
        };
      });

      // Додаємо метадані про кількість замовлень та суми
      const itemsSnapshot = {
        items: itemsSnapshotArray,
        ordersCount,
        cashSales: totalCashSales,
        cardSales: totalCardSales,
        recentActivities
      };

      console.log('📦 itemsSnapshot to save:', itemsSnapshot);

      // 3. Відправити оновлення як JSON через API-роут
      const response = await fetch('/api/shift-reports-graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId,
          itemsSnapshot,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response for finalizeShift:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Shift finalized:', result);

      if (result && result.documentId) {
        console.log('✅ Successfully finalized shift with documentId:', result.documentId);
        
        // Очищаємо recentActivities після успішного збереження
        try {
          clearRecentActivities();
        } catch (error) {
          console.error('Error clearing recentActivities:', error);
        }
        
        return result;
      }

      throw new Error('Failed to finalize shift - no data returned');
    } catch (error) {
      console.error('Error finalizing shift:', error);
      throw error;
    }
  };

  // Функція для оновлення itemsSnapshot окремо
  const updateItemsSnapshot = async (documentId: string, itemsSnapshot: any[], workerSlug?: string, date?: string) => {
    console.log('🎯 updateItemsSnapshot FUNCTION CALLED!');
    console.log('🎯 Parameters:', { documentId, itemsSnapshot, workerSlug, date });
    
    try {
      console.log('📦 Updating itemsSnapshot for documentId:', documentId);
      console.log('📦 itemsSnapshot:', itemsSnapshot);
      console.log('📦 itemsSnapshot JSON:', JSON.stringify(itemsSnapshot, null, 2));
      
      const response = await fetch('/api/shift-reports-graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentId,
          itemsSnapshot,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response for updateItemsSnapshot:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 updateItemsSnapshot response:', data);
      
      if (data && data.documentId) {
        console.log('✅ Successfully updated itemsSnapshot for documentId:', data.documentId);
        return data.documentId;
      }
      
      console.error('❌ No updateShiftReport data in response:', data);
      throw new Error('Failed to update items snapshot - no data returned');
    } catch (error) {
      console.error('Error updating items snapshot:', error);
      throw error;
    }
  };

  const handleConfirmCloseShift = async () => {
    try {
      setLoading(true);
      
      // Перевіряємо, чи всі продукти мають documentId
      const productsWithoutDocumentId = allProducts.filter(p => !p.documentId);
      if (productsWithoutDocumentId.length > 0) {
        console.error('❌ Products without documentId:', productsWithoutDocumentId.map(p => ({ 
          name: p.name, 
          documentId: p.documentId,
          slug: p.slug
        })));
      }
      
      // Створюємо мапу для пошуку documentId
      console.log('📦 allProducts before mapping:', allProducts);
      
      const productKeyToDocumentIdMap: Record<string, string> = {};
      allProducts.forEach(product => {
          if (product.documentId) {
            productKeyToDocumentIdMap[product.documentId] = product.documentId;
          if (product.slug) {
            productKeyToDocumentIdMap[product.slug] = product.documentId;
          }
        } else {
          console.warn('⚠️ Product missing documentId:', { 
            documentId: product.documentId, 
            slug: product.slug,
            productName: product.name 
          });
        }
      });
      
      console.log('📦 productKeyToDocumentIdMap after building:', productKeyToDocumentIdMap);
      
      // Перевіряємо, чи мапа не порожня
      if (Object.keys(productKeyToDocumentIdMap).length === 0) {
        console.error('❌ Product key to DocumentId map is empty!');
        setError('Помилка: жоден продукт не має валідного documentId');
        return;
      }
      
      // Будуємо itemsSnapshot правильно (product як UUID-рядок)
      console.log('📦 selectedProducts before filtering:', selectedProducts);
      console.log('📦 productKeyToDocumentIdMap:', productKeyToDocumentIdMap);
      
      // Підраховуємо кількість замовлень та суми готівки/картки
      const recentActivities = readRecentActivities();
      const ordersCount = recentActivities.filter((a: any) => 
        a.type === 'order' || !!a.items || (a.payload?.items && Array.isArray(a.payload.items))
      ).length;

      // Розраховуємо реальні суми готівки/картки з замовлень
      let totalCashSales = 0;
      let totalCardSales = 0;
      
      recentActivities.forEach((activity: any) => {
        if (activity.type === 'order' || (activity.payload?.items && Array.isArray(activity.payload.items))) {
          const items = activity.items || activity.payload?.items || [];
          const orderTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
          
          // Перевіряємо, чи є інформація про спосіб оплати
          if (activity.paymentMethod === 'cash') {
            totalCashSales += orderTotal;
          } else if (activity.paymentMethod === 'card') {
            totalCardSales += orderTotal;
          } else {
            // Якщо немає інформації про спосіб оплати, розподіляємо 50/50
            totalCashSales += orderTotal * 0.5;
            totalCardSales += orderTotal * 0.5;
          }
        }
      });

      const itemsSnapshotArray = Object.entries(selectedProducts)
        .filter(([key, quantity]) => quantity > 0)
        .map(([key, quantity]) => {
          const productDocumentId = productKeyToDocumentIdMap[key];
          
          if (!productDocumentId) {
            console.warn("❌ Product documentId not found for key:", key);
            return null;
          }
          
          return {
            product: productDocumentId, // Передаємо як UUID-рядок
            quantity: quantity
          };
        })
        .filter(item => item !== null);

      // Додаємо метадані про кількість замовлень та суми
      const itemsSnapshot = {
        items: itemsSnapshotArray,
        ordersCount,
        cashSales: totalCashSales,
        cardSales: totalCardSales,
        recentActivities
      };

      console.log('📦 itemsSnapshot after building:', itemsSnapshot);

      // Перевіряємо, чи є вибрані товари
      if (itemsSnapshotArray.length === 0) {
        setError('Будь ласка, виберіть хоча б один товар для зміни');
        return;
      }

      console.log('📦 itemsSnapshot:', itemsSnapshot);

      // Знаходимо workerSlug
      const selectedWorker = workers.find(w => w.id === (report?.worker.id || createFormData.worker));
      const workerSlug = report?.worker.slug || selectedWorker?.slug || '';
      
      // Агрегуємо дані з recentActivities для каси
      const activityData = aggregateRecentActivities();
      const totalSales = calculateTotalSalesFromActivities(allProducts, activityData);
      
      // Будуємо payload для створення зміни (без itemsSnapshot)
      const payload = {
        date: normalizeDate(report?.date || date), // ✅ Нормалізуємо дату
        slug: report?.slug || normalizeDate(date), // ✅ Нормалізуємо slug теж
        cash: totalSales, // ✅ Використовуємо суму продажів як касу
        worker: Number(report?.worker.id || createFormData.worker) || 0,
        shiftComment: (report as any)?.shiftComment || createFormData.shiftComment || '',
        workerSlug: workerSlug, // ✅ Додаємо workerSlug
      };
      
      console.log('📦 handleConfirmCloseShift payload:', payload);
      
      // Перевіряємо, чи зміна вже існує
      const existingDocumentId = await checkExistingShift(payload.slug, workerSlug, payload.date);
      
      let documentId: string;
      
      if (existingDocumentId) {
        // Оновлюємо існуючу зміну
        console.log('Updating existing shift with documentId:', existingDocumentId);
        documentId = existingDocumentId;
      } else {
        // Створюємо нову зміну
        console.log('Creating new shift');
        const createResponse = await createShiftReport(payload);
        documentId = createResponse;
      }
      
      // Оновлюємо itemsSnapshot окремо
      console.log('📦 documentId:', documentId);
      
      if (!documentId) {
        console.error('❌ No documentId returned — skipping itemsSnapshot update');
        setError('Помилка: не вдалося створити зміну');
        return;
      }
      
      console.log('📦 About to call updateItemsSnapshot with:', { documentId, itemsSnapshot, workerSlug, date: payload.date });
      
      // Перевіряємо, чи itemsSnapshot не порожній
      if (!itemsSnapshotArray || itemsSnapshotArray.length === 0) {
        console.warn('⚠️ itemsSnapshot is empty, skipping update');
        return;
      }
      
      console.log('📦 itemsSnapshot details:', itemsSnapshotArray.map((item: any) => ({
        product: item.product,
        quantity: item.quantity,
        productType: typeof item.product
      })));
      
      console.log('🚀 CALLING finalizeShift NOW...');
      await finalizeShift(documentId);
      console.log('✅ finalizeShift completed successfully');
      
      // Очищаємо recentActivities після успішного збереження (якщо ще не очищено в finalizeShift)
      try {
        clearRecentActivities();
      } catch (error) {
        console.error('Error clearing recentActivities:', error);
      }

      onClose();
      onRefresh();
    } catch (error) {
      console.error('Error saving shift:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setError(`Помилка при збереженні зміни: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async () => {
    try {
      setLoading(true);
      
      // Перевіряємо, чи всі продукти мають documentId
      const productsWithoutDocumentId = allProducts.filter(p => !p.documentId);
      if (productsWithoutDocumentId.length > 0) {
        console.error('❌ Products without documentId:', productsWithoutDocumentId.map(p => ({ 
          name: p.name, 
          documentId: p.documentId,
          slug: p.slug
        })));
      }
      
      // Створюємо мапу для пошуку documentId
      console.log('📦 allProducts before mapping:', allProducts);
      
      const productKeyToDocumentIdMap: Record<string, string> = {};
      allProducts.forEach(product => {
        if (product.documentId) {
          productKeyToDocumentIdMap[product.documentId] = product.documentId;
          if (product.slug) {
            productKeyToDocumentIdMap[product.slug] = product.documentId;
          }
        } else {
          console.warn('⚠️ Product missing documentId:', { 
            documentId: product.documentId, 
            slug: product.slug,
            productName: product.name 
          });
        }
      });
      
      console.log('📦 productKeyToDocumentIdMap after building:', productKeyToDocumentIdMap);
      
      // Перевіряємо, чи мапа не порожня
      if (Object.keys(productKeyToDocumentIdMap).length === 0) {
        console.error('❌ Product key to DocumentId map is empty!');
        setError('Помилка: жоден продукт не має валідного documentId');
        return;
      }
      
      // Будуємо itemsSnapshot правильно (product як UUID-рядок)
      console.log('📦 selectedProducts before filtering:', selectedProducts);
      console.log('📦 productKeyToDocumentIdMap:', productKeyToDocumentIdMap);
      
      // Агрегуємо дані з recentActivities
      const activityData = aggregateRecentActivities();
      console.log('📊 Aggregated activity data:', activityData);

      // Підраховуємо кількість замовлень та суми готівки/картки
      const recentActivities = readRecentActivities();
      const ordersCount = recentActivities.filter((a: any) => 
        a.type === 'order' || !!a.items || (a.payload?.items && Array.isArray(a.payload.items))
      ).length;

      // Розраховуємо реальні суми готівки/картки з замовлень
      let totalCashSales = 0;
      let totalCardSales = 0;
      
      recentActivities.forEach((activity: any) => {
        if (activity.type === 'order' || (activity.payload?.items && Array.isArray(activity.payload.items))) {
          const items = activity.items || activity.payload?.items || [];
          const orderTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
          
          // Перевіряємо, чи є інформація про спосіб оплати
          if (activity.paymentMethod === 'cash') {
            totalCashSales += orderTotal;
          } else if (activity.paymentMethod === 'card') {
            totalCardSales += orderTotal;
          } else {
            // Якщо немає інформації про спосіб оплати, розподіляємо 50/50
            totalCashSales += orderTotal * 0.5;
            totalCardSales += orderTotal * 0.5;
          }
        }
      });

      const itemsSnapshotArray = Object.entries(selectedProducts)
        .filter(([key, quantity]) => quantity > 0)
        .map(([key, quantity]) => {
          const productDocumentId = productKeyToDocumentIdMap[key];
          
          if (!productDocumentId) {
            console.warn("❌ Product documentId not found for key:", key);
            return null;
          }
          
          const product = allProducts.find(p => p.documentId === productDocumentId);
          const activity = activityData[productDocumentId] || { sold: 0, writtenOff: 0, delivered: 0 };
          
          return {
            product: productDocumentId, // Передаємо як UUID-рядок
            quantity: quantity,
            name: product?.name,
            slug: product?.slug,
            price: product?.price || 0,
            type: product?.productType || 'BOUQUET',
            sold: activity.sold,
            writtenOff: activity.writtenOff,
            delivered: activity.delivered
          };
        })
        .filter(item => item !== null);

      // Додаємо метадані про кількість замовлень та суми
      const itemsSnapshot = {
        items: itemsSnapshotArray,
        ordersCount,
        cashSales: totalCashSales,
        cardSales: totalCardSales
      };

      console.log('📦 itemsSnapshot after building:', itemsSnapshot);

      // Перевіряємо, чи є вибрані товари
      if (itemsSnapshotArray.length === 0) {
        setError('Будь ласка, виберіть хоча б один товар для зміни');
        return;
      }

      console.log('📦 itemsSnapshot:', itemsSnapshot);

      // Знаходимо workerSlug
      const selectedWorker = workers.find(w => w.id === createFormData.worker);
      const workerSlug = selectedWorker?.slug || '';
      
      // Використовуємо вже існуючий activityData зверху функції
      const totalSales = calculateTotalSalesFromActivities(allProducts, activityData);
      
      // Будуємо payload для створення зміни (без itemsSnapshot)
      const payload = {
        date: normalizeDate(date), // ✅ Нормалізуємо дату
        slug: normalizeDate(date), // ✅ Нормалізуємо slug теж
        cash: totalSales, // ✅ Використовуємо суму продажів як касу
        worker: Number(createFormData.worker) || 0,
        shiftComment: createFormData.shiftComment || '',
        workerSlug: workerSlug, // ✅ Додаємо workerSlug
      };
      
      console.log('📦 handleCreateShift payload:', payload);
      
      // Перевіряємо, чи зміна вже існує
      const existingDocumentId = await checkExistingShift(payload.slug, workerSlug, payload.date);
      
      let documentId: string;
      
      if (existingDocumentId) {
        // Оновлюємо існуючу зміну
        console.log('Updating existing shift with documentId:', existingDocumentId);
        documentId = existingDocumentId;
      } else {
        // Створюємо нову зміну
        console.log('Creating new shift');
        const createResponse = await createShiftReport(payload);
        documentId = createResponse;
      }
      
      // Оновлюємо itemsSnapshot окремо
      console.log('📦 documentId:', documentId);
      
      if (!documentId) {
        console.error('❌ No documentId returned — skipping itemsSnapshot update');
        setError('Помилка: не вдалося створити зміну');
        return;
      }
      
      console.log('📦 About to call updateItemsSnapshot with:', { documentId, itemsSnapshot, workerSlug, date: payload.date });
      
      // Перевіряємо, чи itemsSnapshot не порожній
      if (!itemsSnapshotArray || itemsSnapshotArray.length === 0) {
        console.warn('⚠️ itemsSnapshot is empty, skipping update');
        return;
      }
      
      console.log('📦 itemsSnapshot details:', itemsSnapshotArray.map((item: any) => ({
        product: item.product,
        quantity: item.quantity,
        productType: typeof item.product
      })));
      
      console.log('🚀 CALLING finalizeShift NOW...');
      await finalizeShift(documentId);
      console.log('✅ finalizeShift completed successfully');
      
      // Очищаємо recentActivities після успішного збереження (якщо ще не очищено в finalizeShift)
      try {
        clearRecentActivities();
      } catch (error) {
        console.error('Error clearing recentActivities:', error);
      }

      onClose();
      onRefresh();
    } catch (error) {
      console.error('Error creating shift:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setError(`Помилка при створенні зміни: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    
    if (window.confirm('Ви впевнені, що хочете видалити цю зміну?')) {
      try {
        setLoading(true);
        await onDelete(report.id);
        onClose();
        onRefresh();
      } catch (error) {
        setError('Помилка при видаленні зміни');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      await onSave(data);
      setMode('view');
      onRefresh();
    } catch (error) {
      setError('Помилка при збереженні зміни');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (report) {
      setMode('view');
    } else {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('uk-UA', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalProductsValue = (products: Product[] | undefined) => {
    if (!products || !Array.isArray(products)) {
      return 0;
    }
    return products.reduce((sum, product) => sum + (product.price || 0) * product.quantity, 0);
  };

  const renderViewMode = () => {
    if (!report) return null;

    return (
      <Box sx={{ height: '100%' }}>
        <Grid container spacing={4} sx={{ height: '100%' }}>
          {/* Інформація про зміну - зверху */}
          <Grid size={{ xs: 12, md: 12 }} sx={{ order: 1 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              height: 'fit-content',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Інформація про зміну
              </Typography>
              
              <Grid container spacing={3}>
                {/* Ліва колонка 35%: Дата + Робітник + Каса */}
                <Grid size={{ xs: 12, md: 4 }}>
                  {/* Дата зміни */}
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Дата зміни
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {formatDate(report.date)}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Робітник
                  </Typography>
                  {(() => {
                    const workerName = report.worker?.name || 'Без робітника';
                    const r: any = report || {};
                    const workerId = r?.worker?.id;
                    const workerSlug = r?.worker?.slug || r?.workerSlug;
                    const fromReport = r?.worker?.role || r?.worker?.roleName || r?.worker?.role?.name;
                    const byId = workerId ? workers.find(w => w.id === workerId)?.role : undefined;
                    const bySlug = workerSlug ? workers.find(w => w.slug === workerSlug)?.role : undefined;
                    const byName = r?.worker?.name ? workers.find(w => w.name === r.worker.name)?.role : undefined;
                    const role = fromReport || byId || bySlug || byName || 'Невідома роль';
                    return (
                      <Typography variant="h6" gutterBottom>
                        {workerName} ({role})
                      </Typography>
                    );
                  })()}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                      Каса
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      p: 2, 
                      bgcolor: 'success.light', 
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'success.main',
                      color: '#000',
                      fontWeight: 'bold'
                    }}>
                      {report.cash}₴
                    </Typography>
                    {(() => {
                      const snapshot: any = report.itemsSnapshot || {};
                      const cashSales = typeof snapshot?.cashSales === 'number' ? snapshot.cashSales : undefined;
                      const cardSales = typeof snapshot?.cardSales === 'number' ? snapshot.cardSales : undefined;
                      const cashVal = typeof (report as any).cashCash === 'number' ? (report as any).cashCash : cashSales;
                      const cardVal = typeof (report as any).cashCard === 'number' ? (report as any).cashCard : cardSales;
                      return (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          (
                          Готівка: {typeof cashVal === 'number' ? `${cashVal}₴` : '—'}, Картка: {typeof cardVal === 'number' ? `${cardVal}₴` : '—'}
                          )
                        </Typography>
                      );
                    })()}
                    <Typography variant="caption" color="textSecondary">
                      (автоматично з продажів)
                    </Typography>
                  
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Списано:
                      </Typography>
                      {(() => {
                        const items = Array.isArray((report as any)?.itemsSnapshot?.items)
                          ? (report as any).itemsSnapshot.items : getItemsFromSnapshot(report.itemsSnapshot);
                        const writeOffCalculated = Array.isArray(items)
                          ? items.reduce((sum: number, it: any) => sum + ((it.writtenOff || 0) * (it.price || 0)), 0)
                          : 0;
                        const writeOffVal =
                          typeof (report as any).writeOffAmount === 'number' ? (report as any).writeOffAmount :
                          typeof (report as any).writeOffSum === 'number' ? (report as any).writeOffSum :
                          typeof (report as any).writeOffTotal === 'number' ? (report as any).writeOffTotal :
                          (writeOffCalculated || undefined);
                        return (
                          <Typography variant="subtitle2">
                            {typeof writeOffVal === 'number' ? `${writeOffVal}₴` : '—'}
                          </Typography>
                        );
                      })()}
                    </Box>
                  </Box>

                  {/* Коментар до зміни — відображення під касою у режимі перегляду */}
                  {typeof (report as any)?.shiftComment === 'string' && (report as any).shiftComment.trim().length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Коментар до зміни
                      </Typography>
                      <Typography variant="body2" sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1, bgcolor: 'grey.50' }}>
                        {(report as any).shiftComment}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                {/* Права колонка 65%: Детальна таблиця останніх дій */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Останні дії (детально)
                      </Typography>
                      {(() => {
                        const recent = (report.itemsSnapshot as any)?.recentActivities;
                        if (Array.isArray(recent) && recent.length > 0) {
                          return (
                            <Box>
                              <RecentActivitiesTable data={recent} />
                            </Box>
                          );
                        }
                        
                        // Витягуємо дані з itemsSnapshot
                        const items = getItemsFromSnapshot(report.itemsSnapshot);
                        const ordersCount = (report.itemsSnapshot as any)?.ordersCount || 0;
                        const cashSales = (report.itemsSnapshot as any)?.cashSales || 0;
                        const cardSales = (report.itemsSnapshot as any)?.cardSales || 0;
                        
                        // Розраховуємо суми списаних товарів
                        let totalWriteOffSum = 0;
                        items.forEach((item: any) => {
                          if (item.writtenOff && item.price) {
                            totalWriteOffSum += item.writtenOff * item.price;
                          }
                        });

                        return (
                          <Box sx={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto', 
                            overflowX: 'auto',
                            border: 1,
                            borderColor: 'grey.300',
                            borderRadius: 1
                          }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '25%' }}>Тип</th>
                                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '35%' }}>Деталі</th>
                                  <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '20%' }}>К-сть</th>
                                  <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '20%' }}>Сума</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Замовлення */}
                                {ordersCount > 0 && (
                                  <tr style={{
                                    background: 'linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(165,214,167,0.12) 100%)',
                                    border: '1px solid rgba(46, 125, 50, 0.16)'
                                  }}>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        Замовлення
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {ordersCount} замовлень
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        —
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {report.cash}₴
                                      </Typography>
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Розбивка готівка/картка */}
                                {(cashSales > 0 || cardSales > 0) && (
                                  <>
                                    <tr style={{ backgroundColor: 'rgba(46,125,50,0.05)' }}>
                                      <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                          Готівка
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2">
                                          Частина продажів
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2">
                                          —
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                          {cashSales.toFixed(2)}₴
                                        </Typography>
                                      </td>
                                    </tr>
                                    <tr style={{ backgroundColor: 'rgba(46,125,50,0.05)' }}>
                                      <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                          Картка
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2">
                                          Частина продажів
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2">
                                          —
                                        </Typography>
                                      </td>
                                      <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                          {cardSales.toFixed(2)}₴
                                        </Typography>
                                      </td>
                                    </tr>
                                  </>
                                )}

                                {/* Списання товарів */}
                                {items.filter((item: any) => item.writtenOff > 0).map((item: any, idx: number) => (
                                  <tr key={`writeoff_${idx}`} style={{
                                    background: 'linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(255,205,210,0.12) 100%)',
                                    border: '1px solid rgba(211, 47, 47, 0.16)'
                                  }}>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                        Списання
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {item.name || '—'}
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {item.writtenOff}
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                        -{(item.writtenOff * item.price).toFixed(2)}₴
                                      </Typography>
                                    </td>
                                  </tr>
                                ))}

                                {/* Поставки */}
                                {items.filter((item: any) => item.delivered > 0).map((item: any, idx: number) => (
                                  <tr key={`delivery_${idx}`} style={{
                                    background: 'linear-gradient(135deg, rgba(33,150,243,0.08) 0%, rgba(187,222,251,0.12) 100%)',
                                    border: '1px solid rgba(33, 150, 243, 0.16)'
                                  }}>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        Поставка
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {item.name || '—'}
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {item.delivered}
                                      </Typography>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        +{(item.delivered * item.price).toFixed(2)}₴
                                      </Typography>
                                    </td>
                                  </tr>
                                ))}

                                {/* Коментар до зміни */}
                                {(report as any).shiftComment && (
                                  <tr style={{ backgroundColor: 'rgba(158,158,158,0.05)' }}>
                                    <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Коментар
                                      </Typography>
                                    </td>
                                    <td colSpan={3} style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                                      <Typography variant="body2">
                                        {(report as any).shiftComment}
                                      </Typography>
                                    </td>
                                  </tr>
                                )}

                                {/* Якщо немає даних */}
                                {ordersCount === 0 && items.filter((item: any) => item.writtenOff > 0 || item.delivered > 0).length === 0 && (
                                  <tr>
                                    <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                                      <Typography variant="body2">
                                        Немає активностей за цю зміну
                                      </Typography>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Товари в наявності - внизу */}
          <Grid size={{ xs: 12, md: 12 }} sx={{ order: 2 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              height: '100%',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 4,
                  height: 32,
                  bgcolor: 'primary.main',
                  borderRadius: 2
                }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Товари в наявності
                </Typography>
                {(() => {
                  const items = getItemsFromSnapshot(report.itemsSnapshot);
                  return items && items.length > 0;
                })() && (
                  <Typography variant="body2" color="textSecondary">
                    станом на {formatTime(report.updatedAt !== report.createdAt ? report.updatedAt : report.createdAt)} · {new Date(report.date).toLocaleDateString('uk-UA')}
                  </Typography>
                )}
                {/* Кількість товарів приховано за запитом */}
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <FlowerSpinner size={60} />
                  <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                    Завантаження товарів...
                  </Typography>
                </Box>
              ) : (() => {
                const items = getItemsFromSnapshot(report.itemsSnapshot);
                return items && items.length > 0;
              })() ? (
                <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e0e0e0' }}>Назва</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0' }}>К-сть</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0' }}>Ціна</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'rgba(46,125,50,0.1)' }}>Продаж</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'rgba(33,150,243,0.1)' }}>Поставка</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'rgba(211,47,47,0.1)' }}>Списання</th>
                        <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e0e0e0' }}>Баланс</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getItemsFromSnapshot(report.itemsSnapshot).map((item: any, idx: number) => (
                        <tr key={item.slug || item.product || idx}>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>{item.name || '—'}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{item.quantity ?? 0}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{item.price ?? 0}₴</td>
                          <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (item.sold ?? 0) > 0 ? 'rgba(46,125,50,0.18)' : 'rgba(46,125,50,0.05)', fontWeight: 700, color: (item.sold ?? 0) > 0 ? '#1B5E20' : '#2E7D32' }}>
                            {item.sold ?? 0}
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (item.delivered ?? 0) > 0 ? 'rgba(33,150,243,0.20)' : 'rgba(33,150,243,0.06)', fontWeight: 700, color: (item.delivered ?? 0) > 0 ? '#0D47A1' : '#1565C0' }}>
                            {item.delivered ?? 0}
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (item.writtenOff ?? 0) > 0 ? 'rgba(211,47,47,0.20)' : 'rgba(211,47,47,0.06)', fontWeight: 700, color: (item.writtenOff ?? 0) > 0 ? '#B71C1C' : '#C62828' }}>
                            {item.writtenOff ?? 0}
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{((item.price ?? 0) * (item.quantity ?? 0))}₴</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>Сума товарів на балансі</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>
                          {getItemsFromSnapshot(report.itemsSnapshot).reduce((sum: number, it: any) => sum + ((it.price ?? 0) * (it.quantity ?? 0)), 0)}₴
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </Box>
              ) : allProducts.length > 0 ? (
                <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {allProducts.map((product: AllProduct, index: number) => (
                      <Box
                        key={product.slug || product.documentId || index}
                        sx={{ 
                          border: 1,
                          borderColor: 'grey.300', 
                          borderRadius: 2,
                          p: 3,
                          bgcolor: 'grey.100',
                          '&:hover': {
                            bgcolor: 'grey.200',
                            borderColor: 'primary.main'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Інформація про продукт (зліва) */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              mb: 1,
                              color: 'text.primary'
                            }}>
                              {product.name || 'Без назви'}
                            </Typography>
                            
                            {/* Додаткова інформація про товар */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                Тип: {product.productType === 'bouquet' ? 'Букет' : product.productType === 'singleflower' ? 'Квітка' : product.productType || 'Невідомо'}
                              </Typography>
                              {product.varieties && product.varieties.length > 0 && (
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                  Сорт: {product.varieties.map((v: any) => v.name).join(', ')}
                                </Typography>
                              )}
                              {product.color && (
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                  Колір: {product.color}
                                </Typography>
                              )}
                            </Box>
                            
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.95rem' }}>
                              Ціна за одиницю: {product.price || 0}₴
                            </Typography>
                          </Box>
                          
                          {/* Кількість та сума (справа) */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2
                          }}>
                            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
                              {(() => {
                                const key = product.slug || product.documentId;
                                const quantity = selectedProducts[key] || 0;
                                console.log(`🎨 UI: Product ${product.name}, key: ${key}, quantity: ${quantity}`);
                                return `${quantity} шт`;
                              })()}
                            </Typography>
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1.2rem' }}>
                              =
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              color: 'primary.main',
                              fontSize: '1.1rem'
                            }}>
                              {(product.price || 0) * (selectedProducts[product.slug || product.documentId] || 0)}₴
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    Товари не знайдені
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          

        </Grid>
      </Box>
    );
  };

  const renderFormMode = () => {
    return (
      <ShiftReportForm
        initialData={report ? {
          id: report.id,
          date: report.date,
          worker: report.worker.id,
          itemsSnapshot: report.itemsSnapshot,
          shiftComment: (report as any).shiftComment,
          cash: report.cash,
          slug: report.slug,
        } : {
          date: date,
          worker: 0,
          itemsSnapshot: [],
          shiftComment: '',
          cash: 0,
          slug: '',
        }}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={!!report}
      />
    );
  };

  const renderCloseMode = () => {

    return (
      <Box sx={{ height: '100%' }}>
        <Grid container spacing={4} sx={{ height: '100%' }}>
          {/* Інформація про зміну */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              height: 'fit-content',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                {mode === 'create' ? 'Створення зміни' : 'Закриття зміни'}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Дата зміни
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {formatDate(report?.date || date)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Робітник
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {report?.worker.name} ({report?.worker.role})
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Каса
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {report?.cash || 0}₴
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Вибір товарів */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              height: '100%',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Товари в наявності:
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setAllProducts([]);
                    fetchAllProducts();
                  }}
                  disabled={loading}
                >
                  Оновити
                </Button>
              </Box>
              
              {loading ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '40vh',
                  gap: 2
                }}>
                  <FlowerSpinner size={60} />
                  <Typography variant="body2">
                    Завантаження товарів...
                  </Typography>
                </Box>
              ) : allProducts.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: 'text.secondary',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" gutterBottom>
                    Товари не знайдені
                  </Typography>
                  <Typography variant="body2">
                    Спробуйте оновити сторінку або перевірте підключення
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Знайдено товарів: {allProducts.length}
                  </Typography>

                  {allProducts.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {allProducts.map((product, index) => (
                        <Box
                          key={product.slug || product.documentId || index}
                          sx={{ 
                            border: 1,
                            borderColor: 'grey.300', 
                            borderRadius: 2,
                            p: 3,
                            bgcolor: 'grey.100',
                            '&:hover': {
                              bgcolor: 'grey.200',
                              borderColor: 'primary.main'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* Інформація про продукт (зліва) */}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                mb: 1,
                                color: 'text.primary'
                              }}>
                                {product.name || 'Без назви'}
                              </Typography>
                              <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.95rem' }}>
                                Ціна за одиницю: {product.price || 0}₴
                              </Typography>
                            </Box>
                            
                            {/* Кількість та сума (справа) */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {selectedProducts[product.slug || product.documentId] || 0} шт
                                </Typography>
                              <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1.2rem' }}>
                                =
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '1.1rem'
                              }}>
                                {(product.price || 0) * (selectedProducts[product.slug || product.documentId] || 0)}₴
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="error">
                      Масив товарів порожній, але loading=false
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderCreateMode = () => {
    // Агрегуємо дані з recentActivities для показу
    const activityData = aggregateRecentActivities();
    const totalSales = calculateTotalSalesFromActivities(allProducts, activityData);
    const recentActivities = readRecentActivities();
    // Розбивка каси за методами оплати
    const paymentBreakdown = recentActivities.reduce((acc: { cash: number; card: number }, entry: any) => {
      const isOrder = entry.type === 'order' || !!entry.items;
      if (!isOrder) return acc;
      const items = entry.payload?.items || entry.items || [];
      const orderTotal = typeof entry.total === 'number'
        ? entry.total
        : items.reduce((s: number, it: any) => s + (it.total ?? ((it.price || 0) * (it.quantity || 0))), 0);
      const pm = entry.paymentMethod || entry.payload?.paymentMethod;
      if (pm === 'cash') acc.cash += orderTotal;
      else if (pm === 'card') acc.card += orderTotal;
      return acc;
    }, { cash: 0, card: 0 });
    
    // Розраховуємо суму поставок та списаних товарів
    const totalDelivered = allProducts.reduce((sum, product) => {
      const productAct = activityData[product.documentId];
      if (productAct && productAct.delivered) {
        return sum + (product.price || 0) * productAct.delivered;
      }
      return sum;
    }, 0);
    
    const totalWrittenOff = allProducts.reduce((sum, product) => {
      const productAct = activityData[product.documentId];
      if (productAct && productAct.writtenOff) {
        return sum + (product.price || 0) * productAct.writtenOff;
      }
      return sum;
    }, 0);

    return (
      <Box sx={{ height: '100%' }}>
        <Grid container spacing={4} sx={{ height: '100%' }}>
          {/* Інформація про зміну - зверху */}
          <Grid size={{ xs: 12, md: 12 }} sx={{ order: 1 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              height: 'fit-content',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Інформація про зміну
              </Typography>
              
              <Grid container spacing={3}>
                {/* Ліва колонка 35%: Дата + Робітник + Каса */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Дата зміни
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {formatDate(date)}
                  </Typography>
                
                  <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Робітник
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={createFormData.worker}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, worker: Number(e.target.value) }))}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 0 },
                      '& .MuiOutlinedInput-notchedOutline': { borderRadius: 0 }
                    }}
                  >
                    <MenuItem value={0}>Оберіть робітника</MenuItem>
                    {workers.map((worker) => (
                      <MenuItem key={worker.id} value={worker.id}>
                        {worker.name} ({worker.role})
                      </MenuItem>
                    ))}
                  </TextField>
                  </Box>
                
                  <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                      Каса
                  </Typography>
                    <Typography variant="h6" sx={{ 
                      p: 2, 
                      bgcolor: 'success.light', 
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'success.main',
                      color: '#000',
                      fontWeight: 'bold'
                    }}>
                      {totalSales}₴
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      (
                      Готівка: {paymentBreakdown.cash}₴, Картка: {paymentBreakdown.card}₴
                      )
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      (автоматично з продажів)
                    </Typography>
                    {/* Коментар до зміни — перенесено під Касу */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        Коментар до зміни
                      </Typography>
                      <TextField
                        fullWidth
                        value={createFormData.shiftComment}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, shiftComment: e.target.value }))}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 0 },
                          '& .MuiOutlinedInput-notchedOutline': { borderRadius: 0 }
                        }}
                        placeholder="Додайте коментар до зміни (за потреби)"
                        multiline
                        rows={2}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                {/* Права колонка 65%: Детальна таблиця останніх дій */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom sx={{ mb: 1 }}>
                      Останні дії (детально)
                    </Typography>
                    <Box sx={{
                      border: 1,
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      overflowY: 'auto',
                      overflowX: 'auto',
                      maxHeight: { xs: '45vh', md: '40vh' },
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      lineHeight: 1.25,
                      '& table': { width: '100%', tableLayout: 'fixed' },
                      '& th, & td': {
                        padding: { xs: '6px 8px', md: '8px 10px' },
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal'
                      },
                      '& .col-sum': {
                        display: { xs: 'none', md: 'table-cell' }
                      }
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Подія</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Дата/час</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Деталі</th>
                            <th className="col-sum" style={{ textAlign: 'right', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Сума</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentActivities.map((entry: any, idx: number) => {
                            const ts = entry.createdAt || entry.ts || Date.now();
                            const dateStr = new Date(ts).toLocaleString('uk-UA', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            });
                            // Визначаємо формат (старий/новий) для order
                            const isOrder = entry.type === 'order' || !!entry.items;
                            const items = entry.payload?.items || entry.items || [];
                            const isWriteoff = entry.type === 'productDeleted';
                            const isDelivery = entry.type === 'productCreated' || entry.type === 'productUpdated';

                            if (isOrder) {
                              const total = entry.total ?? (items.reduce((s: number, it: any) => s + (it.total ?? (it.price || 0) * (it.quantity || 0)), 0));
                              const payment = entry.paymentMethod === 'card' ? 'Картка' : entry.paymentMethod === 'cash' ? 'Готівка' : (entry.payload?.paymentMethod === 'card' ? 'Картка' : entry.payload?.paymentMethod === 'cash' ? 'Готівка' : '—');
                              const includeDelivery = entry.includeDelivery ?? entry.payload?.includeDelivery;
                              const deliveryPrice = entry.deliveryPrice ?? entry.payload?.deliveryPrice;
                              const comment = entry.comment ?? entry.payload?.comment;
                              return (
                                <React.Fragment key={`order_${idx}`}>
                                  <tr style={{ 
                                    background: 'linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(165,214,167,0.12) 100%)',
                                    border: '1px solid rgba(46, 125, 50, 0.16)'
                                  }}>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Замовлення {entry.id}</td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                                      Сума: <b>{total}₴</b> • Оплата: {payment}
                                      {includeDelivery ? <> • Доставка: так{typeof deliveryPrice === 'number' ? `, ${deliveryPrice}₴` : ''}</> : ' • Доставка: ні'}
                                      {comment ? <> • Коментар: {comment}</> : null}
                                    </td>
                                    <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{total}₴</td>
                                  </tr>
                                  {items.map((it: any, iIdx: number) => (
                                    <tr key={`oi_${idx}_${iIdx}`} style={{ 
                                      background: 'linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(165,214,167,0.12) 100%)',
                                      border: '1px solid rgba(46, 125, 50, 0.16)'
                                    }}>
                                      <td style={{ padding: '6px 10px 6px 24px', color: '#666' }} colSpan={2}>{it.name || it.documentId}</td>
                                      <td style={{ padding: '6px 10px', color: '#666' }}>{(it.quantity || 0)} × {(it.price || 0)}₴ = {(it.total ?? ((it.price || 0) * (it.quantity || 0)))}₴</td>
                                      <td className="col-sum" style={{ padding: '6px 10px', textAlign: 'right', color: '#666' }}>{it.total ?? ((it.price || 0) * (it.quantity || 0))}₴</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            }

                            if (isWriteoff) {
                              const name = entry.payload?.name;
                              const type = entry.payload?.productType;
                              const qty = entry.payload?.availableQuantity ?? 0;
                              const remaining = entry.payload?.remainingAfter;
                              return (
                                <tr key={`w_${idx}`} style={{ 
                                  background: 'linear-gradient(135deg, rgba(211,47,47,0.12) 0%, rgba(244,67,54,0.16) 100%)',
                                  border: '1px solid rgba(211, 47, 47, 0.25)'
                                }}>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Списання товару</td>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                                    Назва: <b>{name || '—'}</b>{type ? ` • Тип: ${type}` : ''}<br/>
                                    Списано: {qty} шт{(typeof remaining === 'number' && remaining >= 0) ? ` • Залишок: ${remaining} шт` : ''}
                                  </td>
                                  <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>—</td>
                                </tr>
                              );
                            }

                            if (isDelivery) {
                              const name = entry.payload?.name;
                              const type = entry.payload?.productType;
                              const qty = entry.payload?.availableQuantity ?? 0;
                              const price = entry.payload?.price ?? 0;
                              return (
                                <tr key={`d_${idx}`} style={{ 
                                  background: 'linear-gradient(135deg, rgba(33,150,243,0.10) 0%, rgba(144,202,249,0.16) 100%)',
                                  border: '1px solid rgba(33, 150, 243, 0.25)'
                                }}>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Поставка</td>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                                    Назва: <b>{name || '—'}</b>{type ? ` • Тип: ${type}` : ''}<br/>
                                    Кількість: {qty}{price ? ` • Ціна: ${price}₴` : ''}
                                  </td>
                                  <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{price ? `${price}₴` : '—'}</td>
                                </tr>
                              );
                            }

                            // Fallback для інших подій
                            return (
                              <tr key={`x_${idx}`} style={{ 
                                background: 'linear-gradient(135deg, rgba(233,30,99,0.08) 0%, rgba(244,143,177,0.12) 100%)',
                                border: '1px solid rgba(233, 30, 99, 0.16)'
                              }}>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{entry.type}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>—</td>
                                <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>—</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Box>
                    {/* Коментар перенесено в ліву колонку під "Каса" */}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Товари в наявності - внизу */}
          <Grid size={{ xs: 12, md: 12 }} sx={{ order: 2 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              height: '100%',
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 4,
                  height: 32,
                  bgcolor: 'primary.main',
                  borderRadius: 2
                }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Товари в наявності
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  станом на {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} · {new Date(date).toLocaleDateString('uk-UA')}
                </Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <FlowerSpinner size={60} />
                  <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                    Завантаження товарів...
                  </Typography>
                </Box>
              ) : allProducts.length > 0 ? (
                <Box sx={{ 
                  maxHeight: '60vh', 
                  overflow: 'auto',
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.8rem' },
                  '& table': { 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed'
                  },
                  '& th, & td': {
                    padding: { xs: '4px 3px', sm: '6px 4px', md: '6px 6px' },
                    verticalAlign: 'top',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                  },
                  '& .col-mobile-hide': {
                    display: { xs: 'none', sm: 'table-cell' }
                  }
                }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '30%' }}>Назва</th>
                        <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '12%' }}>К-сть</th>
                        <th className="col-mobile-hide" style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '12%' }}>Ціна</th>
                        <th className="col-mobile-hide" style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '10%', backgroundColor: 'rgba(46,125,50,0.1)' }}>Продаж</th>
                        <th className="col-mobile-hide" style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '10%', backgroundColor: 'rgba(33,150,243,0.1)' }}>Поставка</th>
                        <th className="col-mobile-hide" style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '10%', backgroundColor: 'rgba(211,47,47,0.1)' }}>Списання</th>
                        <th style={{ textAlign: 'right', padding: '8px 6px', borderBottom: '1px solid #e0e0e0', width: '16%' }}>Баланс</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProducts.map((product: AllProduct, idx: number) => {
                        const activity = activityData[product.documentId] || { sold: 0, writtenOff: 0, delivered: 0 };
                        const quantity = selectedProducts[product.slug || product.documentId] || product.availableQuantity || 0;
                        return (
                          <tr key={product.slug || product.documentId || idx}>
                            <td style={{ padding: '6px 6px', borderBottom: '1px solid #f0f0f0' }}>
                              {product.name || '—'}
                              <Box sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
                                {product.price ?? 0}₴ • Продаж: {activity.sold ?? 0} • Поставка: {activity.delivered ?? 0} • Списання: {activity.writtenOff ?? 0}
                            </Box>
                            </td>
                            <td style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{quantity}</td>
                            <td className="col-mobile-hide" style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>{product.price ?? 0}₴</td>
                            <td className="col-mobile-hide" style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (activity.sold ?? 0) > 0 ? 'rgba(46,125,50,0.18)' : 'rgba(46,125,50,0.05)', fontWeight: 700, color: (activity.sold ?? 0) > 0 ? '#1B5E20' : '#2E7D32' }}>
                              {activity.sold ?? 0}
                            </td>
                            <td className="col-mobile-hide" style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (activity.delivered ?? 0) > 0 ? 'rgba(33,150,243,0.20)' : 'rgba(33,150,243,0.05)', fontWeight: 700, color: (activity.delivered ?? 0) > 0 ? '#0D47A1' : '#1565C0' }}>
                              {activity.delivered ?? 0}
                            </td>
                            <td className="col-mobile-hide" style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: (activity.writtenOff ?? 0) > 0 ? 'rgba(211,47,47,0.20)' : 'rgba(211,47,47,0.05)', fontWeight: 700, color: (activity.writtenOff ?? 0) > 0 ? '#B71C1C' : '#C62828' }}>
                              {activity.writtenOff ?? 0}
                            </td>
                            <td style={{ padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{((product.price ?? 0) * quantity)}₴</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>Сума товарів на балансі</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>
                          {allProducts.reduce((sum, product) => {
                            const quantity = selectedProducts[product.slug || product.documentId] || product.availableQuantity || 0;
                            return sum + ((product.price ?? 0) * quantity);
                          }, 0)}₴
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '200px',
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2" color="textSecondary">
                    Товари завантажуються...
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return `Звіт за ${formatDate(date)}`;
      case 'edit':
        return `Редагувати зміну на ${formatDate(date)}`;
      case 'close':
        return `Звіт за ${formatDate(date)}`;
      default:
        return `Зміна на ${formatDate(date)}`;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullWidth
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          margin: 0,
          maxHeight: '100vh',
          height: '100vh',
        }
      }}
    >
      <DialogTitle sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <Typography variant="h4" component="h1" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(() => {
              if (mode === 'view') {
                return <Box component="span" sx={{ color: 'success.main', fontWeight: 700, mr: 1 }}>(Завершена ✅)</Box>;
              }
              if (mode === 'create') {
                return <Box component="span" sx={{ color: 'info.main', fontWeight: 700, mr: 1 }}>(Створити)</Box>;
              }
              return null;
            })()}
            {getTitle()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, position: 'absolute', right: 0 }}>
            {/* У режимі перегляду закритої зміни прибираємо кнопки редагування та видалення */}
            <IconButton onClick={onClose} size="large" title="Закрити">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 3, mb: 0 }}>
            {error}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <FlowerSpinner size={60} />
          </Box>
        )}
        
        <Box sx={{ p: 3 }}>
          {(() => {
            if (mode === 'view') {
              return renderViewMode();
            } else if (mode === 'close') {
              return renderCloseMode();
            } else if (mode === 'create') {
              return renderCreateMode();
            } else {
              return renderFormMode();
            }
          })()}
        </Box>
      </DialogContent>
      
      {mode === 'view' && (
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" size="large">
            Закрити
          </Button>
        </DialogActions>
      )}
      
      {mode === 'close' && (
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCancel} variant="outlined" size="large">
            Скасувати
          </Button>
          <Button 
            onClick={handleConfirmCloseShift} 
            variant="contained" 
            color="success" 
            size="large"
            disabled={loading}
          >
            {loading ? <FlowerSpinner size={24} /> : 'Підтвердити закриття'}
          </Button>
        </DialogActions>
      )}
      
      {mode === 'create' && (
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCancel} variant="outlined" size="large">
            Скасувати
          </Button>
          <Button 
            onClick={handleCreateShift} 
            variant="contained" 
            color="success" 
            size="large"
            disabled={loading || createFormData.worker === 0}
          >
            {loading ? <FlowerSpinner size={24} /> : 'Закрити зміну'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
