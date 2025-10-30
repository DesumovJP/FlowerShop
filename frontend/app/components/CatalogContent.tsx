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
  Breadcrumbs,
  Link,
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
  NavigateNext as NavigateNextIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import NextLink from 'next/link';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';

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
  productType: 'bouquet' | 'singleflower';
  description?: string;
  cardType: 'standart' | 'large';
  color?: string;
  image: GqlImage[];
  varieties: GqlVariety[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

async function fetchProducts(page = 1, productType?: string): Promise<{ data: GqlProduct[], pagination: any }> {
  try {
    console.log('Fetching products with params:', { page, productType });
    
    // Використовуємо новий єдиний API для Product колекції
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '12'
    });
    
    if (productType && productType !== 'Всі продукти') {
      if (productType === 'Букети') {
        params.append('productType', 'bouquet');
      } else if (productType === 'Квітка') {
        params.append('productType', 'singleflower');
      }
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
    const response = await fetch('/api/admin/varieties', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
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
      const result = await fetchProducts(page, selectedType);
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
  }, [page, selectedType]);

  // Fetch varieties
  const loadVarieties = useCallback(async () => {
    try {
      const result = await fetchVarieties();
      setVarieties(result);
    } catch (error) {
      console.error('Error loading varieties:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadVarieties();
  }, [loadProducts, loadVarieties]);

  // Filter products based on search and filters
  const displayProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Variety filter
    if (selectedVariety !== 'Всі сорти') {
      filtered = filtered.filter(product =>
        product.varieties?.some(variety => variety.name === selectedVariety)
      );
    }

    // Color filter
    if (selectedColor !== 'Всі кольори') {
      const colorMapping: Record<string, string> = {
        'red': 'Червоний',
        'pink': 'Рожевий',
        'white': 'Білий',
        'yellow': 'Жовтий',
        'purple': 'Фіолетовий',
        'blue': 'Синій',
        'green': 'Зелений',
        'orange': 'Оранжевий',
        'cream': 'Кремовий',
        'peach': 'Персиковий'
      };
      
      filtered = filtered.filter(product => {
        const ukrainianColor = colorMapping[product.color || ''] || product.color;
        return ukrainianColor === selectedColor;
      });
    }

    return filtered;
  }, [products, searchTerm, selectedVariety, selectedColor]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link component={NextLink} href="/" color="inherit">
              Головна
            </Link>
            <Typography color="text.primary">Каталог</Typography>
          </Breadcrumbs>
          {/* Прибрали дублюючий заголовок під хлібними крихтами */}
        </Box>

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
            // Let content define height and use page scroll
            width: '100%'
          }}
        >
          {displayProducts.map((product) => {
            return (
              <ProductCard
                key={product.documentId}
                product={product as any}
              />
            );
          })}
        </Box>

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
