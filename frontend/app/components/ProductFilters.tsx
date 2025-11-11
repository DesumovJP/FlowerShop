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
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

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
  // EN canonical
  'red': 'Червоний',
  'pink': 'Рожевий',
  'white': 'Білий',
  'yellow': 'Жовтий',
  'purple': 'Фіолетовий',
  'blue': 'Синій',
  'green': 'Зелений',
  'orange': 'Оранжевий',
  'cream': 'Кремовий',
  'peach': 'Персиковий',
  // translit variants
  'chervonij': 'Червоний',
  'rozhevij': 'Рожевий',
  'rozhevyj': 'Рожевий',
  'bilyj': 'Білий',
  'zhovtyj': 'Жовтий',
  'zhyovtyj': 'Жовтий',
  'fioletovyj': 'Фіолетовий',
  'fioletovij': 'Фіолетовий',
  'synij': 'Синій',
  'golubyj': 'Голубий',
  'oranzhevyj': 'Помаранчевий',
  'pomaranchevyj': 'Помаранчевий',
  'zelenyj': 'Зелений',
  // missing translits
  'bordovyj': 'Бордовий',
  'kremovyj': 'Кремовий',
  'miks': 'Мікс'
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
    'Бордовий': '#7b1e3a',
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
      'else': 'Аксесуари' // Аксесуари мають тип "else" в Strapi
    };
    
    return ['Всі продукти', ...uniqueTypes.map(type => typeLabels[type] || type)];
  }, [allProducts]);

  // Перевіряємо, чи є активні фільтри
  const hasActiveFilters = searchTerm || 
    filterColor !== 'Всі кольори' || 
    filterVariety !== 'Всі сорти' || 
    (showProductTypeFilter && filterProductType !== 'Всі продукти');

  // Функція для отримання активних фільтрів як чипсів
  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; onRemove: () => void }> = [];
    
    if (searchTerm) {
      filters.push({
        label: `Пошук: "${searchTerm}"`,
        onRemove: () => onSearchChange(''),
      });
    }
    if (filterVariety !== 'Всі сорти') {
      filters.push({
        label: `Сорт: ${filterVariety}`,
        onRemove: () => onVarietyChange('Всі сорти'),
      });
    }
    if (filterColor !== 'Всі кольори') {
      filters.push({
        label: `Колір: ${filterColor}`,
        onRemove: () => onColorChange('Всі кольори'),
      });
    }
    if (showProductTypeFilter && filterProductType !== 'Всі продукти') {
      filters.push({
        label: `Тип: ${filterProductType}`,
        onRemove: () => onProductTypeChange('Всі продукти'),
      });
    }
    
    return filters;
  }, [searchTerm, filterVariety, filterColor, filterProductType, showProductTypeFilter, onSearchChange, onVarietyChange, onColorChange, onProductTypeChange]);

  return (
    <Card sx={{ 
      mb: { xs: 2, md: 3 },
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(46, 125, 50, 0.1)',
      boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center">
          {/* Сорт квітів */}
          <Grid size={{ xs: 12, sm: 6, md: variant === 'catalog' ? (showProductTypeFilter ? 3 : 4) : 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: 'text.secondary',
                '&.Mui-focused': { color: 'primary.main' }
              }}>
                Сорт квітів
              </InputLabel>
              <Select
                value={filterVariety}
                label="Сорт квітів"
                onChange={(e) => onVarietyChange(e.target.value)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(46, 125, 50, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(46, 125, 50, 0.3)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: '400px',
                      borderRadius: 2,
                      mt: 1,
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                      border: '1px solid rgba(46, 125, 50, 0.1)',
                    },
                  },
                }}
              >
                <MenuItem value="Всі сорти">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.1) 100%)',
                          border: '1px solid rgba(46, 125, 50, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        🌸
                      </Box>
                      <span>Всі сорти</span>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {allProducts.length}
                    </Typography>
                  </Box>
                </MenuItem>
                {availableVarieties.map((variety, index) => {
                  const count = allProducts.filter(p => 
                    p.varieties?.some(v => v.name === variety.name)
                  ).length;
                  
                  // Різні емодзі для різноманітності
                  const flowerIcons = ['🌹', '🌺', '🌻', '🌷', '🌼', '🌿', '🌸', '💐'];
                  const icon = flowerIcons[index % flowerIcons.length];
                  
                  return (
                    <MenuItem key={variety.documentId} value={variety.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.2) 0%, rgba(255, 192, 203, 0.15) 100%)',
                              border: '1px solid rgba(46, 125, 50, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              flexShrink: 0,
                            }}
                          >
                            {icon}
                          </Box>
                          {variety.name}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {count}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Колір */}
          <Grid size={{ xs: 12, sm: 6, md: variant === 'catalog' ? (showProductTypeFilter ? 3 : 4) : 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: 'text.secondary',
                '&.Mui-focused': { color: 'primary.main' }
              }}>
                Колір
              </InputLabel>
              <Select
                value={filterColor}
                label="Колір"
                onChange={(e) => onColorChange(e.target.value)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(46, 125, 50, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(46, 125, 50, 0.3)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: '400px',
                      borderRadius: 2,
                      mt: 1,
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                      border: '1px solid rgba(46, 125, 50, 0.1)',
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
                              ...(color === 'Мікс'
                                ? {
                                    background:
                                      'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)'
                                  }
                                : { backgroundColor: getColorValue(color) }),
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
            <Grid size={{ xs: 12, sm: 6, md: variant === 'catalog' ? 3 : 3 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: 'text.secondary',
                  '&.Mui-focused': { color: 'primary.main' }
                }}>
                  Тип продукту
                </InputLabel>
                <Select
                  value={filterProductType}
                  label="Тип продукту"
                  onChange={(e) => onProductTypeChange(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(46, 125, 50, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(46, 125, 50, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: '400px',
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                        border: '1px solid rgba(46, 125, 50, 0.1)',
                      },
                    },
                  }}
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
                              'else': 'Аксесуари' // Аксесуари мають тип "else" в Strapi
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

          {/* Пошук */}
          <Grid size={{ xs: 12, sm: 6, md: variant === 'catalog' ? (showProductTypeFilter ? 3 : 4) : 3 }}>
            <TextField
              fullWidth
              placeholder="Пошук товарів..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main', opacity: 0.7 }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onSearchChange('')}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                  },
                  '& fieldset': {
                    borderColor: 'rgba(46, 125, 50, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(46, 125, 50, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
        
        {/* Активні фільтри як чипси */}
        {activeFilters.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
                mr: 0.5,
              }}
            >
              Активні фільтри:
            </Typography>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter.label}
                onDelete={filter.onRemove}
                deleteIcon={<CloseIcon sx={{ fontSize: '1rem' }} />}
                sx={{
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                  color: 'primary.main',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': {
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.15)',
                  },
                }}
              />
            ))}
            {showResetButton && (
              <Button
                variant="text"
                size="small"
                onClick={onResetFilters}
                startIcon={<ClearIcon />}
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  ml: 'auto',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(46, 125, 50, 0.05)',
                  },
                }}
              >
                Скинути всі
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
