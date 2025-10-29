'use client';

import React, { useEffect, useState } from 'react';
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
  Breadcrumbs,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import NextLink from 'next/link';
import { useCartStore } from '../store/cartStore';

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
  productType: 'bouquet' | 'singleflower';
  description?: string;
  cardType: 'standard' | 'large';
  color?: string;
  image: GqlImage[];
  varieties: GqlVariety[];
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
async function fetchRelatedBouquets(currentSlug: string, currentVarieties: GqlVariety[]): Promise<GqlProduct[]> {
  try {
    console.log('Fetching related products for:', currentSlug, 'with varieties:', currentVarieties);
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
    
    // Знаходимо товари з такими ж сортами квітів
    const relatedByVariety = otherProducts.filter((product: GqlProduct) => 
      product.varieties.some(variety => 
        currentVarieties.some(currentVariety => currentVariety.name === variety.name)
      )
    );
    console.log('Related by variety:', relatedByVariety.length);
    
    // Якщо знайшли товари з такими ж сортами, повертаємо їх (максимум 3)
    if (relatedByVariety.length > 0) {
      const result = relatedByVariety.slice(0, 3);
      console.log('Returning related by variety:', result);
      return result;
    }
    
    // Якщо немає товарів з такими ж сортами, повертаємо випадкові (максимум 3)
    const shuffled = otherProducts.sort(() => 0.5 - Math.random());
    const result = shuffled.slice(0, 3);
    console.log('Returning random products:', result);
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
          // Завантажуємо пов'язані товари
          fetchRelatedBouquets(bouquet.slug, bouquet.varieties || [])
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
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-inter)' }}>
              Завантаження...
            </Typography>
            <Box sx={{ fontSize: '3rem' }}>🌸</Box>
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
    <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          <Link href="/" color="inherit">
            Головна
          </Link>
          <Link href="/catalog" color="inherit">
            Каталог
          </Link>
          <Typography color="text.primary">{data.name}</Typography>
        </Breadcrumbs>

        {/* Main Product Section */}
        <Grid container spacing={6} sx={{ mb: 8 }}>
          {/* Product Images */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Main Image */}
              <Card
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  position: 'relative',
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
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              fontWeight: 500,
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
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)',
                              }
                            }}
                          >
                            <NavigateNextIcon sx={{ transform: 'rotate(180deg)' }} />
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
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)',
                              }
                            }}
                          >
                            <NavigateNextIcon />
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
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                  {data.image.slice(0, 4).map((img, index) => (
                    <Card
                      key={img.documentId}
                      sx={{
                        minWidth: 80,
                        height: 80,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImageIndex === index ? '2px solid' : '1px solid',
                        borderColor: selectedImageIndex === index ? 'primary.main' : 'grey.300',
                        '&:hover': {
                          borderColor: 'primary.main',
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
                            height: '100%' 
                          }} 
                        />
                      </CardMedia>
                    </Card>
                  ))}
                  {data.image.length > 4 && (
                    <Card
                      sx={{
                        minWidth: 80,
                        height: 80,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'grey.200',
                        }
                      }}
                      onClick={() => {
                        setSelectedImageIndex(4);
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
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
            <Box sx={{ pl: { md: 4 } }}>
              {/* Product Name */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2,
                  fontFamily: 'var(--font-playfair)',
                }}
              >
                {data.name}
              </Typography>

              {/* Price */}
              <Typography
                variant="h4"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  mb: 2,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {data.price} ₴
              </Typography>

              {/* Product Info */}
              <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {data.color && (
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: 'text.primary',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      Колір
                    </Typography>
                    <Link
                      href={`/catalog?color=${encodeURIComponent(translateColor(data.color))}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box 
                        sx={{ 
                          display: 'inline-block',
                          px: 2, 
                          py: 1, 
                          backgroundColor: 'grey.100',
                          borderRadius: 2, 
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          fontFamily: 'var(--font-inter)',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        {translateColor(data.color)}
                      </Box>
                    </Link>
                  </Box>
                )}

                {/* Колекції видалені з нової структури Product */}
              </Box>

              {/* Composition */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Сорти квітів у букеті
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                  {data.varieties?.map((variety) => (
                    <Link
                      key={variety.documentId}
                      href={`/catalog?variety=${encodeURIComponent(variety.name)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box 
                        sx={{ 
                          px: 2, 
                          py: 1, 
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderRadius: 3, 
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          fontFamily: 'var(--font-inter)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: 'primary.dark',
                          }
                        }}
                      >
                        {variety.name}
                      </Box>
                    </Link>
                  ))}
                </Box>
                {data.description && (
                  <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary', 
                        lineHeight: 1.7, 
                        fontFamily: 'var(--font-inter)',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {extractTextFromRichText(data.description)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Delivery */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Доставка
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Доставка та умови узгоджуються під час оформлення замовлення.
                </Typography>
              </Box>

              {/* Quantity Selector */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Обрати кількість
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={() => handleQuantityChange(quantity - 1)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleQuantityChange(value);
                    }}
                    inputProps={{
                      style: { textAlign: 'center', width: '60px' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        width: 80,
                        height: 40,
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleQuantityChange(quantity + 1)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Add to Bag Button */}
              <Button
                variant="outlined"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={() => {
                  if (data) {
                    const imageUrl = data.image?.[0]?.url ? `${API_URL}${data.image[0].url}` : undefined;
                    console.log('API_URL:', API_URL);
                    console.log('Image URL from data:', data.image?.[0]?.url);
                    console.log('Final image URL:', imageUrl);
                    
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
                  fontSize: '1.1rem',
                  borderRadius: 0,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  backgroundColor: 'background.default',
                  borderWidth: 2,
                  textTransform: 'none',
                  fontFamily: 'var(--font-inter)',
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'primary.main',
                    color: 'background.default',
                  },
                }}
              >
                У кошик
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Дивіться також Section */}
        {relatedProducts.length > 0 ? (
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
                      className="product-card-hover"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
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
        ) : (
          <Box sx={{ mb: 6, textAlign: 'center', py: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Немає пов'язаних товарів
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontFamily: 'var(--font-inter)',
                mt: 1,
              }}
            >
              Debug: relatedProducts.length = {relatedProducts.length}
            </Typography>
          </Box>
        )}

      </Container>
    </Box>
  );
}
