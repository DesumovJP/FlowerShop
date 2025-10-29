'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Типи для продуктів
interface Product {
  documentId: string;
  name: string;
  slug: string;
  price: number;
  productType: string;
  color: string;
  description?: string;
  cardType?: string;
  image?: {
    documentId: string;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  varieties?: Array<{
    documentId: string;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ProductFiltersProps {
  // Дані
  allProducts: Product[];
  
  // Стани фільтрів
  searchTerm: string;
  filterVariety: string;
  filterColor: string;
  filterProductType: string;
  
  // Обробники змін
  onSearchChange: (value: string) => void;
  onVarietyChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onProductTypeChange: (value: string) => void;
  onResetFilters: () => void;
  
  // Опції
  showProductTypeFilter?: boolean;
  showResetButton?: boolean;
  variant?: 'admin' | 'catalog';
}

// Мапінг кольорів
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

// Функція для отримання кольору
const getColorValue = (color: string) => {
  const colorMap: Record<string, string> = {
    'Червоний': '#e53e3e',
    'Рожевий': '#ed64a6',
    'Білий': '#f7fafc',
    'Жовтий': '#f6e05e',
    'Фіолетовий': '#9f7aea',
    'Синій': '#4299e1',
    'Зелений': '#68d391',
    'Оранжевий': '#ed8936',
    'Кремовий': '#fef5e7',
    'Персиковий': '#fed7d7'
  };
  return colorMap[color] || '#e2e8f0';
};

export default function ProductFilters({
  allProducts,
  searchTerm,
  filterVariety,
  filterColor,
  filterProductType,
  onSearchChange,
  onVarietyChange,
  onColorChange,
  onProductTypeChange,
  onResetFilters,
  showProductTypeFilter = true,
  showResetButton = true,
  variant = 'admin'
}: ProductFiltersProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Отримуємо доступні кольори з поточних продуктів
  const availableColors = useMemo(() => {
    const colors = allProducts
      .map(product => product.color)
      .filter(Boolean)
      .map(color => colorMapping[color] || color);
    
    const uniqueColors = Array.from(new Set(colors));
    return ['Всі кольори', ...uniqueColors];
  }, [allProducts]);

  // Отримуємо доступні сорти з поточних продуктів
  const availableVarieties = useMemo(() => {
    const varietiesFromProducts = allProducts
      .flatMap(product => product.varieties || [])
      .map(variety => variety.name);
    
    const uniqueVarieties = Array.from(new Set(varietiesFromProducts));
    
    // Створюємо об'єкти сортів з реальними даними з продуктів
    return uniqueVarieties.map(varietyName => {
      // Знаходимо перший продукт з цим сортом для отримання повної інформації
      const productWithVariety = allProducts.find(product => 
        product.varieties?.some(v => v.name === varietyName)
      );
      
      const varietyFromProduct = productWithVariety?.varieties?.find(v => v.name === varietyName);
      
      return {
        documentId: varietyFromProduct?.documentId || varietyName,
        name: varietyName,
        slug: varietyFromProduct?.slug || varietyName.toLowerCase().replace(/\s+/g, '-')
      };
    });
  }, [allProducts]);

  // Отримуємо доступні типи продуктів
  const availableProductTypes = useMemo(() => {
    const types = allProducts.map(product => product.productType);
    const uniqueTypes = Array.from(new Set(types));
    
    const typeLabels = {
      'bouquet': 'Букети',
      'singleflower': 'Квітка',
      'composition': 'Композиції',
      'accessory': 'Аксесуари'
    };
    
    return ['Всі продукти', ...uniqueTypes.map(type => typeLabels[type] || type)];
  }, [allProducts]);

  // Перевіряємо, чи є активні фільтри
  const hasActiveFilters = searchTerm || 
    filterColor !== 'Всі кольори' || 
    filterVariety !== 'Всі сорти' || 
    (showProductTypeFilter && filterProductType !== 'Всі продукти');

  return (
    <Card sx={{ 
      mb: { xs: 2, md: 3 },
      boxShadow: 'none',
      border: `1px solid ${theme.palette.grey[200]}`,
      boxSizing: 'border-box',
      width: '100%',
      borderRadius: 0,
    }}>
      <CardContent sx={{ p: { xs: 2, md: 3 }, '& *:hover': { boxShadow: 'none' } }}>
        <Grid container spacing={2} alignItems="center">
          {/* Пошук */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Пошук товарів..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.grey[50],
                }
              }}
            />
          </Grid>

          {/* Сорт квітів */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Сорт квітів</InputLabel>
              <Select
                value={filterVariety}
                label="Сорт квітів"
                onChange={(e) => onVarietyChange(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '300px',
                    },
                  },
                }}
              >
                <MenuItem value="Всі сорти">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>Всі сорти</span>
                    <Typography variant="caption" color="textSecondary">
                      {allProducts.length}
                    </Typography>
                  </Box>
                </MenuItem>
                {availableVarieties.map((variety) => (
                  <MenuItem key={variety.documentId} value={variety.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>🌸</Typography>
                        {variety.name}
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {allProducts.filter(p => 
                          p.varieties?.some(v => v.name === variety.name)
                        ).length}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Колір */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Колір</InputLabel>
              <Select
                value={filterColor}
                label="Колір"
                onChange={(e) => onColorChange(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: '300px',
                    },
                  },
                }}
              >
                  <MenuItem value="Всі кольори">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
                            border: '1px solid',
                            borderColor: theme.palette.grey[300],
                          }}
                        />
                        <span>Всі кольори</span>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {allProducts.length}
                      </Typography>
                    </Box>
                  </MenuItem>
                  {availableColors.filter(color => color !== 'Всі кольори').map((color) => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: getColorValue(color),
                              border: '1px solid',
                              borderColor: theme.palette.grey[300],
                            }}
                          />
                          {color}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {allProducts.filter(p => {
                            const ukrainianColor = colorMapping[p.color] || p.color;
                            return ukrainianColor === color;
                          }).length}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Тип продукту (тільки для адмінки) */}
          {showProductTypeFilter && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Тип продукту</InputLabel>
                <Select
                  value={filterProductType}
                  label="Тип продукту"
                  onChange={(e) => onProductTypeChange(e.target.value)}
                >
                  <MenuItem value="Всі продукти">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>🛍️</Typography>
                        <span>Всі продукти</span>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {allProducts.length}
                      </Typography>
                    </Box>
                  </MenuItem>
                  {availableProductTypes.filter(type => type !== 'Всі продукти').map((type) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>
                            {type === 'Букети' ? '💐' : 
                             type === 'Квітка' ? '🌸' : 
                             type === 'Композиції' ? '🌺' : 
                             type === 'Аксесуари' ? '🛒' : '🛍️'}
                          </Typography>
                          <span>{type}</span>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {allProducts.filter(p => {
                            const typeLabels = {
                              'bouquet': 'Букети',
                              'singleflower': 'Квітка',
                              'composition': 'Композиції',
                              'accessory': 'Аксесуари'
                            };
                            return typeLabels[p.productType] === type;
                          }).length}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        
        {/* Кнопка скидання фільтрів */}
        {showResetButton && hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onResetFilters}
              sx={{
                borderColor: theme.palette.grey[300],
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.grey[400],
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              Скинути фільтри
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
