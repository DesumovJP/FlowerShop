'use client';

import React, { useEffect, useState } from 'react';
import FlowerSpinner from './FlowerSpinner';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import NextLink from 'next/link';
import { useCartStore } from '../store/cartStore';
import Breadcrumbs from './Breadcrumbs';

// Функція для витягування тексту з Rich Text Editor формату
function extractTextFromRichText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => extractTextFromRichText(item)).join(' ');
  }
  if (richText.children && Array.isArray(richText.children)) {
    return richText.children.map((child: any) => extractTextFromRichText(child)).join(' ');
  }
  if (richText.text) return richText.text;
  return '';
}

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
  cardType: 'standard' | 'large';
  color?: string;
  image: GqlImage[];
  varieties: GqlVariety[];
  availableQuantity?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

// Мапінг кольорів з латиниці на українську
const colorMapping: Record<string, string> = {
  'chervonij': 'Червоний',
  'rozhevyj': 'Рожевий',
  'bilyj': 'Білий',
  'zhyovtyj': 'Жовтий',
  'fioletovij': 'Фіолетовий',
  'oranzhevyj': 'Оранжевий',
  'synij': 'Синій',
  'zelenyj': 'Зелений',
  'kremovyj': 'Кремовий',
  'bordovyj': 'Бордовий',
  'miks': 'Мікс'
};

// Функція для перекладу кольору
const translateColor = (color: string): string => {
  return colorMapping[color.toLowerCase()] || color;
};

// Мапінг кольору до HEX фону для бейджа
const colorBg: Record<string, string> = {
  'червоний': '#ffebee',
  'рожевий': '#fce4ec',
  'білий': '#fafafa',
  'жовтий': '#fff8e1',
  'фіолетовий': '#f3e5f5',
  'оранжевий': '#fff3e0',
  'синій': '#e3f2fd',
  'зелений': '#e8f5e9',
  'кремовий': '#fffde7',
  'бордовий': '#fbe9e7',
  'мікс': '#ede7f6',
};
const getColorBg = (c?: string) => (c ? colorBg[(translateColor(c) || '').toLowerCase()] || '#e8f5e9' : '#e8f5e9');

// Мапінг колекцій з латиниці на українську
const collectionMapping: Record<string, string> = {
  'vesna': 'Весна',
  'leto': 'Літо',
  'osen': 'Осінь',
  'zima': 'Зима',
  'весна': 'Весна',
  'літо': 'Літо',
  'осінь': 'Осінь',
  'зима': 'Зима'
};

// Функція для перекладу колекції
const translateCollection = (collection: string): string => {
  return collectionMapping[collection.toLowerCase()] || collection;
};

async function fetchProduct(idOrSlug: string): Promise<GqlProduct | null> {
  try {
    console.log('🔍 Fetching product with ID/slug:', idOrSlug);
    
    // Використовуємо новий єдиний API для Product колекції
    const response = await fetch(`/api/products/${idOrSlug}`, { cache: 'no-store' });
    console.log('Product API response status:', response.status);
    
    if (response.ok) {
      const productJson = await response.json();
      console.log('Product API response:', productJson);
      if (productJson.product) {
        console.log('Product found:', productJson.product);
        return productJson.product;
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Product API error:', errorText);
      console.error('❌ Product API status:', response.status);
      console.error('❌ Product API URL:', `/api/products/${idOrSlug}`);
    }
    
    console.error('Product not found');
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Функція для отримання пов'язаних товарів
async function fetchRelatedBouquets(
  currentSlug: string, 
  currentVarieties: GqlVariety[], 
  currentColor?: string
): Promise<GqlProduct[]> {
  try {
    console.log('Fetching related products for:', currentSlug, 'with varieties:', currentVarieties, 'color:', currentColor);
    const res = await fetch('/api/products', { cache: 'no-store' });
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error fetching related products:', json);
      return [];
    }
    
    const allProducts = json.data || [];
    console.log('All products from API:', allProducts.length);
    
    // Фільтруємо поточний товар
    const otherProducts = allProducts.filter((p: GqlProduct) => p.slug !== currentSlug);
    console.log('Other products (excluding current):', otherProducts.length);
    
    const result: GqlProduct[] = [];
    const usedIds = new Set<string>();
    
    // 1. Спочатку шукаємо за сортами квітів
    if (currentVarieties.length > 0) {
      const relatedByVariety = otherProducts.filter((product: GqlProduct) => 
        product.varieties.some(variety => 
          currentVarieties.some(currentVariety => currentVariety.name === variety.name)
        ) && !usedIds.has(product.documentId)
      );
      
      // Додаємо до результату (максимум 3)
      for (const product of relatedByVariety.slice(0, 3)) {
        if (result.length < 3) {
          result.push(product);
          usedIds.add(product.documentId);
        }
      }
      console.log('Related by variety:', result.length);
    }
    
    // 2. Якщо не вистачає (менше 3), додаємо за кольором
    if (result.length < 3 && currentColor) {
      const relatedByColor = otherProducts.filter((product: GqlProduct) => 
        product.color === currentColor && !usedIds.has(product.documentId)
      );
      
      // Додаємо до результату, поки не буде 3
      for (const product of relatedByColor) {
        if (result.length < 3) {
          result.push(product);
          usedIds.add(product.documentId);
        }
      }
      console.log('Related by color (total now):', result.length);
    }
    
    // 3. Якщо все ще менше 3, додаємо випадкові
    if (result.length < 3) {
      const remaining = otherProducts.filter((p: GqlProduct) => !usedIds.has(p.documentId));
      const shuffled = remaining.sort(() => 0.5 - Math.random());
      
      for (const product of shuffled) {
        if (result.length < 3) {
          result.push(product);
          usedIds.add(product.documentId);
        }
      }
      console.log('Added random products (final total):', result.length);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching related bouquets:', error);
    return [];
  }
}

export default function ProductDetail({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [data, setData] = useState<GqlProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<GqlProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    setLoading(true);
    fetchProduct(productId)
      .then((bouquet) => {
        console.log('Main product loaded:', bouquet);
        setData(bouquet);
        if (bouquet) {
          console.log('Product varieties:', bouquet.varieties);
          console.log('Product color:', bouquet.color);
          // Завантажуємо пов'язані товари
          fetchRelatedBouquets(bouquet.slug, bouquet.varieties || [], bouquet.color)
            .then((related) => {
              console.log('Related products loaded:', related);
              setRelatedProducts(related);
            })
            .catch((error) => {
              console.error('Error loading related products:', error);
              setRelatedProducts([]);
            });
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
            <FlowerSpinner size={64} />
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-inter)', color: 'text.secondary' }}>
              Завантаження...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-inter)' }}>
              Товар не знайдено
            </Typography>
            <Button href="/catalog" variant="outlined">
              Повернутися до каталогу
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 5, md: 8 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          variant="minimal"
          items={[
            { label: 'Головна', href: '/' },
            { label: 'Каталог', href: '/catalog' },
            { label: data.name, isActive: true },
          ]}
        />

        {/* Main Product Section */}
        <Grid container spacing={{ xs: 4, md: 8 }} sx={{ mb: { xs: 6, md: 10 } }}>
          {/* Product Images */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3 } }}>
              {/* Main Image */}
              <Card
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(46, 125, 50, 0.12)',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(46, 125, 50, 0.1)',
                }}
              >
                <CardMedia component="div" sx={{ height: { xs: 400, md: 500 }, position: 'relative', backgroundColor: 'grey.100' }}>
                  {data.image?.[selectedImageIndex]?.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        alt={data.image[selectedImageIndex].alternativeText || data.name} 
                        src={`${API_URL}${data.image[selectedImageIndex].url}`} 
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
                      />
                      {data.image.length > 1 && (
                        <>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.9) 0%, rgba(76, 175, 80, 0.85) 100%)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: 'white',
                              px: 2,
                              py: 0.75,
                              borderRadius: 2,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-inter)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {selectedImageIndex + 1} з {data.image.length}
                          </Box>
                          
                          {/* Navigation Arrows */}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(
                                selectedImageIndex === 0 ? data.image.length - 1 : selectedImageIndex - 1
                              );
                            }}
                            sx={{
                              position: 'absolute',
                              left: 16,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.85) 0%, rgba(76, 175, 80, 0.8) 100%)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: 'white',
                              width: 44,
                              height: 44,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(76, 175, 80, 0.9) 100%)',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                              }
                            }}
                          >
                            <NavigateNextIcon sx={{ transform: 'rotate(180deg)', fontSize: '1.5rem' }} />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageIndex(
                                selectedImageIndex === data.image.length - 1 ? 0 : selectedImageIndex + 1
                              );
                            }}
                            sx={{
                              position: 'absolute',
                              right: 16,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.85) 0%, rgba(76, 175, 80, 0.8) 100%)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: 'white',
                              width: 44,
                              height: 44,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(76, 175, 80, 0.9) 100%)',
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                              }
                            }}
                          >
                            <NavigateNextIcon sx={{ fontSize: '1.5rem' }} />
                          </IconButton>
                        </>
                      )}
                    </>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      fontSize: '3rem'
                    }}>
                      🌸
                    </Box>
                  )}
                </CardMedia>
              </Card>

              {/* Thumbnail Images */}
              {data.image && data.image.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, pt: 1 }}>
                  {data.image.slice(0, 4).map((img, index) => (
                    <Card
                      key={img.documentId}
                      sx={{
                        minWidth: 90,
                        height: 90,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImageIndex === index ? '2.5px solid' : '1.5px solid',
                        borderColor: selectedImageIndex === index ? 'primary.main' : 'rgba(46, 125, 50, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedImageIndex === index
                          ? '0 4px 12px rgba(46, 125, 50, 0.25)'
                          : '0 2px 6px rgba(0, 0, 0, 0.08)',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
                        }
                      }}
                      onClick={() => {
                        setSelectedImageIndex(index);
                      }}
                    >
                      <CardMedia
                        component="div"
                        sx={{ height: '100%', position: 'relative' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          alt={img.alternativeText || data.name} 
                          src={`${API_URL}${img.url}`} 
                          style={{ 
                            objectFit: 'contain', 
                            objectPosition: 'center',
                            width: '100%', 
                            height: '100%',
                            borderRadius: '8px',
                          }} 
                        />
                      </CardMedia>
                    </Card>
                  ))}
                  {data.image.length > 4 && (
                    <Card
                      sx={{
                        minWidth: 90,
                        height: 90,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.08) 100%)',
                        border: '1.5px solid',
                        borderColor: 'rgba(46, 125, 50, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.15)',
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                        }
                      }}
                      onClick={() => {
                        setSelectedImageIndex(4);
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          fontFamily: 'var(--font-inter)',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        +{data.image.length - 4}
                      </Typography>
                    </Card>
                  )}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Product Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ pl: { md: 6 } }}>
              {/* Product Name */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.25rem', lg: '2.75rem' },
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: { xs: 2, md: 3 },
                  fontFamily: 'var(--font-playfair)',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                }}
              >
                {data.name}
              </Typography>

              {/* Price */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 3, md: 4 }, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Typography
                    variant="h4"
                    component="span"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '1.75rem', md: '2rem', lg: '2.25rem' },
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {data.price}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 500,
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' },
                      opacity: 0.85,
                      lineHeight: 1.2,
                    }}
                  >
                    ₴
                  </Typography>
                </Box>
                <Typography
                  component="span"
                  sx={{
                    color: 'primary.main',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    letterSpacing: '0.01em',
                    textTransform: 'lowercase',
                    opacity: 0.8,
                    lineHeight: 1,
                  }}
                >
                  {data.productType === 'bouquet' ? 'за букет' : 'за шт.'}
                </Typography>
              </Box>

              {/* Short description under title/price */}
              {data.description && (
                <Box
                  sx={{
                    mb: { xs: 4, md: 5 },
                    p: { xs: 2.5, md: 3 },
                    background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(46, 125, 50, 0.1)',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      whiteSpace: 'pre-line',
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                      lineHeight: 1.7,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {extractTextFromRichText(data.description)}
                  </Typography>
                </Box>
              )}

              {/* Info grid: Колір (ліворуч), Сорти (праворуч) */}
              <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: { xs: 4, md: 5 } }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {data.color && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: { xs: 1.5, md: 2 },
                          color: 'text.primary',
                          fontFamily: 'var(--font-inter)',
                          fontSize: { xs: '0.95rem', md: '1rem' },
                          letterSpacing: '0.01em',
                        }}
                      >
                        Колір
                      </Typography>
                      <Link href={`/catalog?color=${encodeURIComponent(translateColor(data.color))}`} style={{ textDecoration: 'none' }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2.5,
                            py: 1.25,
                            backgroundColor: getColorBg(data.color),
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-inter)',
                            border: '1px solid',
                            borderColor: 'rgba(46, 125, 50, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
                              borderColor: 'rgba(46, 125, 50, 0.3)',
                            },
                          }}
                        >
                          {translateColor(data.color)}
                        </Box>
                      </Link>
                    </Box>
                  )}
                </Grid>
                {/* Показуємо "Сорт" тільки для товарів, які не є категорією "інші" */}
                {data.productType !== 'else' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: { xs: 1.5, md: 2 },
                        color: 'text.primary',
                        fontFamily: 'var(--font-inter)',
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        letterSpacing: '0.01em',
                      }}
                    >
                      Сорт
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                      {data.varieties?.map((variety) => (
                        <Link key={variety.documentId} href={`/catalog?variety=${encodeURIComponent(variety.name)}`} style={{ textDecoration: 'none' }}>
                          <Box
                            sx={{
                              px: 2.5,
                              py: 1.25,
                              borderRadius: 0,
                              border: '2px solid',
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              backgroundColor: 'background.default',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-inter)',
                              textTransform: 'none',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderWidth: 2,
                                backgroundColor: 'primary.main',
                                color: 'background.default',
                              },
                            }}
                          >
                            {variety.name}
                          </Box>
                        </Link>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Delivery and Availability */}
              <Box
                sx={{
                  mb: { xs: 4, md: 5 },
                  p: { xs: 2.5, md: 3 },
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(46, 125, 50, 0.1)',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: 'text.primary',
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '0.95rem', md: '1rem' },
                      letterSpacing: '0.01em',
                    }}
                  >
                    Доставка
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '0.9rem', md: '0.95rem' },
                    }}
                  >
                    Доставка та умови узгоджуються під час оформлення замовлення.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    pt: 2,
                    borderTop: '1px solid rgba(46, 125, 50, 0.1)',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontFamily: 'var(--font-inter)',
                      fontSize: { xs: '0.9rem', md: '0.95rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: typeof data.availableQuantity === 'number' && data.availableQuantity > 0
                          ? 'success.main'
                          : 'grey.400',
                        display: 'inline-block',
                      }}
                    />
                    В наявності: {typeof data.availableQuantity === 'number' ? data.availableQuantity : '—'}
                  </Typography>
                </Box>
              </Box>

              {/* Bottom row: Quantity left, Add to cart right */}
              <Box
                sx={{
                  mt: { xs: 4, md: 5 },
                  p: { xs: 3, md: 3.5 },
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(46, 125, 50, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 125, 50, 0.1)',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {data.productType === 'singleflower' && (
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                        }}
                      >
                        Кількість
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          sx={{
                            border: '1px solid',
                            borderColor: 'rgba(46, 125, 50, 0.2)',
                            borderRadius: 1.5,
                            width: 44,
                            height: 44,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.1)',
                            borderColor: 'primary.main',
                          },
                            '&:disabled': {
                              opacity: 0.4,
                            },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: '1.2rem' }} />
                        </IconButton>
                        <TextField
                          value={quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            handleQuantityChange(value);
                          }}
                          inputProps={{
                            style: { textAlign: 'center', width: '60px', fontSize: '1rem', fontWeight: 600 },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              width: 90,
                              height: 44,
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: 1.5,
                              border: '1px solid rgba(46, 125, 50, 0.2)',
                              '&:hover': {
                                borderColor: 'primary.main',
                              },
                              '&.Mui-focused': {
                                borderColor: 'primary.main',
                                boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.1)',
                              },
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => handleQuantityChange(quantity + 1)}
                          sx={{
                            border: '1px solid',
                            borderColor: 'rgba(46, 125, 50, 0.2)',
                            borderRadius: 1.5,
                            width: 44,
                            height: 44,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.1)',
                            borderColor: 'primary.main',
                          },
                          }}
                        >
                          <AddIcon sx={{ fontSize: '1.2rem' }} />
                        </IconButton>
                      </Box>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: data.productType === 'singleflower' ? 7 : 12 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => {
                        if (data) {
                          const imageUrl = data.image?.[0]?.url ? `${API_URL}${data.image[0].url}` : undefined;
                          addItem({
                            id: data.documentId,
                            name: data.name,
                            price: data.price,
                            imageUrl: imageUrl,
                            slug: data.slug,
                          });
                          openCart();
                        }
                      }}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        borderRadius: 0,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        backgroundColor: 'background.default',
                        borderWidth: 2,
                        textTransform: 'none',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'primary.main',
                          color: 'background.default',
                        },
                      }}
                    >
                      Додати до кошика
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Дивіться також Section */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 700,
                color: 'text.primary',
                mb: 4,
                fontFamily: 'var(--font-playfair)',
              }}
            >
              Дивіться також
            </Typography>

            <Grid container spacing={3}>
              {relatedProducts.map((relatedProduct) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={relatedProduct.documentId}>
                  <Link href={`/product/${relatedProduct.slug}`} style={{ textDecoration: 'none' }}>
                    <Card
                      className="product-card-hover glass-card"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 250,
                          position: 'relative',
                          backgroundColor: 'grey.100',
                        }}
                      >
                        {relatedProduct.image?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            alt={relatedProduct.image[0].alternativeText || relatedProduct.name} 
                            src={`${API_URL}${relatedProduct.image[0].url}`} 
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
                          />
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            fontSize: '4rem'
                          }}>
                            🌸
                          </Box>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="hover-overlay">
                          <span className="hover-text">
                            Дивитися
                          </span>
                        </div>
                      </CardMedia>
                      
                    </Box>

                    <CardContent sx={{ p: 2, textAlign: 'center', flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                          fontFamily: 'var(--font-playfair)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {relatedProduct.name}
                      </Typography>
                      
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 700,
                          fontFamily: 'var(--font-inter)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {relatedProduct.price} ₴
                      </Typography>
                    </CardContent>
                    </Card>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      </Container>
    </Box>
  );
}
