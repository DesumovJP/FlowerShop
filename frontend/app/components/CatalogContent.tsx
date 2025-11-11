'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import FlowerSpinner from './FlowerSpinner';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  useMediaQuery,
  CircularProgress,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import NextLink from 'next/link';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Breadcrumbs from './Breadcrumbs';

type GqlImage = { 
  documentId: string;
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
};
type GqlVariety = { 
  documentId: string;
  name: string;
  slug: string;
};
type GqlProduct = {
  documentId: string;
  name: string;
  slug: string;
  price: number;
  productType: 'bouquet' | 'singleflower' | 'composition' | 'else';
  description?: string;
  cardType: 'standart' | 'large';
  color?: string;
  image: GqlImage[];
  varieties: GqlVariety[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

async function fetchProducts(
  page = 1, 
  productType?: string,
  variety?: string,
  color?: string,
  search?: string
): Promise<{ data: GqlProduct[], pagination: any }> {
  try {
    console.log('Fetching products with params:', { page, productType, variety, color, search });
    
    // Використовуємо новий єдиний API для Product колекції
    // Завантажуємо всі товари для фільтрації (великий pageSize)
    const params = new URLSearchParams({
      page: '1',
      pageSize: '1000' // Завантажуємо всі товари для фільтрації
    });
    
    if (productType && productType !== 'Всі продукти') {
      if (productType === 'Букети') {
        params.append('productType', 'bouquet');
      } else if (productType === 'Квітка') {
        params.append('productType', 'singleflower');
      } else if (productType === 'Композиції') {
        params.append('productType', 'composition');
      } else if (productType === 'Аксесуари') {
        // Аксесуари мають тип "else" в Strapi
        params.append('productType', 'else');
      }
    }
    
    // Додаємо фільтри для API
    if (variety && variety !== 'Всі сорти') {
      params.append('variety', variety);
    }
    
    if (color && color !== 'Всі кольори') {
      params.append('color', color);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Products from new API:', result);
    
    return { data: result.data || [], pagination: result.pagination };
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: [], pagination: null };
  }
}

async function fetchVarieties(): Promise<GqlVariety[]> {
  try {
    const response = await fetch('/api/catalog-varieties', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    // catalog-varieties повертає { data: [...] }
    return result.data || [];
  } catch (error) {
    console.error('Error fetching varieties:', error);
    return [];
  }
}

export default function CatalogContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<GqlProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState('Всі продукти');
  const [selectedVariety, setSelectedVariety] = useState('Всі сорти');
  const [selectedColor, setSelectedColor] = useState('Всі кольори');
  const [searchTerm, setSearchTerm] = useState('');
  const [varieties, setVarieties] = useState<GqlVariety[]>([]);

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Завжди завантажуємо з першої сторінки, але з усіма фільтрами
      // Фільтрація відбувається на сервері через API
      const result = await fetchProducts(
        1, 
        selectedType,
        selectedVariety,
        selectedColor,
        searchTerm
      );
      console.log('📦 Loaded products:', result.data);
      console.log('📦 Products count:', result.data.length);
      result.data.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - slug: ${product.slug}, documentId: ${product.documentId}`);
      });
      setProducts(result.data);
      setTotalPages(result.pagination?.pageCount || 1);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedVariety, selectedColor, searchTerm]);

  // Fetch varieties
  const loadVarieties = useCallback(async () => {
    try {
      const result = await fetchVarieties();
      setVarieties(result);
    } catch (error) {
      console.error('Error loading varieties:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadProducts();
    loadVarieties();
  }, [loadProducts, loadVarieties]);

  // Фільтрація тепер відбувається на сервері через API
  // Тому просто використовуємо products як є
  // Групуємо товари за типами, якщо показуються всі товари
  const groupedProducts = useMemo(() => {
    if (selectedType !== 'Всі продукти') {
      // Якщо вибрано конкретний тип, просто повертаємо товари без групування
      return null;
    }

    // Групуємо товари за типами
    const groups: Record<string, GqlProduct[]> = {
      bouquet: [],
      singleflower: [],
      composition: [],
      else: []
    };

    products.forEach(product => {
      if (product.productType && groups[product.productType]) {
        groups[product.productType].push(product);
      }
    });

    // Повертаємо масив груп з назвами в правильному порядку (пріоритет зверху вниз)
    return [
      { type: 'bouquet', name: 'Букети', products: groups.bouquet },
      { type: 'singleflower', name: 'Одиночні квіти', products: groups.singleflower },
      { type: 'composition', name: 'Композиції', products: groups.composition },
      { type: 'else', name: 'Інші', products: groups.else }
    ].filter(group => group.products.length > 0); // Показуємо тільки групи з товарами
  }, [products, selectedType]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Головна', href: '/' },
            { label: 'Каталог', isActive: true },
          ]}
        />

        {/* Filters */}
        <ProductFilters
          allProducts={products as any}
          searchTerm={searchTerm}
          filterVariety={selectedVariety}
          filterColor={selectedColor}
          filterProductType={selectedType}
          onSearchChange={setSearchTerm}
          onVarietyChange={setSelectedVariety}
          onColorChange={setSelectedColor}
          onProductTypeChange={setSelectedType}
          onResetFilters={() => {
            setSearchTerm('');
            setSelectedVariety('Всі сорти');
            setSelectedColor('Всі кольори');
            setSelectedType('Всі продукти');
          }}
          showProductTypeFilter={true}
          showResetButton={true}
          variant="catalog"
        />

        {/* Products Grid with Masonry Layout */}
        {groupedProducts ? (
          // Показуємо товари згруповані по типах з заголовками
          <Box sx={{ mb: 4 }}>
            {groupedProducts.map((group, groupIndex) => (
              <Box key={group.type} sx={{ mb: 6 }}>
                {/* Заголовок групи */}
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 4,
                    mt: groupIndex > 0 ? 6 : 0,
                    fontFamily: 'var(--font-playfair)',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 2
                  }}
                >
                  {group.name}
                </Typography>
                
                {/* Товари групи */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)',
                    },
                    gridAutoFlow: 'row dense',
                    gap: { xs: 2, sm: 3 },
                    width: '100%'
                  }}
                >
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.documentId}
                      product={product as any}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          // Показуємо товари без групування (коли вибрано конкретний тип)
          <Box
            key={`products-grid-${selectedType}`}
            suppressHydrationWarning
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gridAutoFlow: 'row dense',
              gap: { xs: 2, sm: 3 },
              mb: 4,
              width: '100%'
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.documentId}
                product={product as any}
              />
            ))}
          </Box>
        )}

        {/* Індикатор завантаження */}
        {loading && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            mt: 4,
            mb: 4
          }}>
            <FlowerSpinner size={56} />
          </Box>
        )}

      </Container>
    </Box>
  );
}
