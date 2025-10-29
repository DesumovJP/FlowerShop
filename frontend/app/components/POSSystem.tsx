'use client';

import React, { useState, useEffect } from 'react';
import { useProductsStore, Product } from '../store/productsStore';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  QrCodeScanner as QrCodeIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as CashIcon,
  PhoneAndroid as MobileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { append } from '../utils/recentActivities.store';

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function POSSystem() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Zustand store
  const { products, loading, fetchProducts, refreshProducts, invalidateCache } = useProductsStore();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState(50);
  const [deliveryPriceInput, setDeliveryPriceInput] = useState('50');
  const [orderComment, setOrderComment] = useState('');

  // Завантаження товарів при монтуванні компонента
  useEffect(() => {
    console.log('🛒 POSSystem: Fetching products (force refresh)...');
    fetchProducts(true); // bypass local cache to reflect recent Strapi changes
    const handler = () => {
      console.log('🔄 POSSystem: products:refresh received');
      invalidateCache();
      refreshProducts();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('products:refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('products:refresh', handler);
      }
    };
  }, [fetchProducts, invalidateCache, refreshProducts]);

  // Синхронізація deliveryPriceInput з deliveryPrice при зміні includeDelivery
  useEffect(() => {
    if (includeDelivery) {
      setDeliveryPriceInput(deliveryPrice === 0 ? '' : deliveryPrice.toString());
    } else {
      setDeliveryPriceInput('50');
      setDeliveryPrice(50);
    }
  }, [includeDelivery]);

  // Логування стану
  useEffect(() => {
    console.log('🛒 POSSystem state:', {
      productsCount: products.length,
      loading,
      searchTerm,
      selectedCategory,
      filteredProductsCount: products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.productType === selectedCategory;
        return matchesSearch && matchesCategory;
      }).length,
      firstProduct: products[0] ? {
        name: products[0].name,
        documentId: products[0].documentId,
        productType: products[0].productType
      } : null
    });
  }, [products, loading, searchTerm, selectedCategory]);

  // Фільтрація товарів
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.productType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Додавання товару в кошик
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.documentId === product.documentId);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.documentId === product.documentId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * product.price }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  // Зміна кількості товару
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.product.documentId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
        : item
    ));
  };

  // Видалення товару з кошика
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.documentId !== productId));
  };

  // Відкриття модалки оплати
  const handlePayment = () => {
    setPaymentModalOpen(true);
  };

  // Закриття модалки та очищення кошика
  const handlePaymentComplete = () => {
    // Формуємо замовлення
    const order = {
      id: `order_${Date.now()}`,
      createdAt: new Date().toISOString(),
      paymentMethod,
      includeDelivery,
      deliveryPrice: includeDelivery ? deliveryPrice : 0,
      comment: orderComment,
      subtotal,
      total,
      items: cart.map(ci => ({
        documentId: ci.product.documentId,
        name: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
        total: ci.total,
        image: ci.product.image?.[0]?.url || null,
      }))
    };

    // 1) Логуємо в "Останні дії" через уніфікований стор
    try {
      append({
        id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ts: Date.now(),
        createdAt: order.createdAt,
        type: 'order',
        source: 'pos',
        paymentMethod, // 'cash' | 'card'
        includeDelivery,
        deliveryPrice: includeDelivery ? deliveryPrice : 0,
        total,
        comment: orderComment,
        payload: {
          items: order.items.map(i => ({ documentId: i.documentId, quantity: i.quantity, price: i.price }))
        }
      } as any);
    } catch (e) {
      console.error('Failed to append recent activity:', e);
    }

    // 2) Віднімаємо кількість зі Страпі через API
    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          id: order.id,
          total: order.total,
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod,
        },
        items: order.items.map(i => ({ documentId: i.documentId, quantity: i.quantity }))
      })
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        console.error('Sale API failed:', text);
      }
      // Оновлюємо кеш товарів після продажу
      invalidateCache();
      refreshProducts();
    }).catch(err => {
      console.error('Sale API error:', err);
    });

    // 3) Закриваємо модалку і чистимо кошик
    setPaymentModalOpen(false);
    setCart([]);
    setOrderComment('');
    setIncludeDelivery(false);
  };

  // Закриття модалки без оплати
  const handlePaymentCancel = () => {
    setPaymentModalOpen(false);
  };

  // Підрахунок загальної суми
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const deliveryTotal = includeDelivery ? deliveryPrice : 0;
  const total = subtotal + deliveryTotal;

  // Категорії товарів
  const categories = [
    { id: 'all', name: 'Всі товари', icon: '🛍️' },
    { id: 'bouquet', name: 'Букети', icon: '🌸' },
    { id: 'singleflower', name: 'Квітка', icon: '🌹' },
    { id: 'composition', name: 'Композиції', icon: '🌺' },
    { id: 'accessory', name: 'Аксесуари', icon: '🎀' },
  ];

  // Показуємо індикатор завантаження якщо товари ще завантажуються
  if (loading && products.length === 0) {
    return (
      <Box sx={{ 
        height: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <Typography variant="h6" color="textSecondary" sx={{ 
          textAlign: 'center',
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          Завантаження товарів для POS-системи...
        </Typography>
        <Box sx={{ fontSize: '2rem' }}>🌸</Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Grid container sx={{ height: '100%', m: 0, gap: { xs: 0, sm: 0, md: 0 } }}>
        {/* Left Panel - Cart */}
        <Grid size={{ xs: 12, sm: 4.2, md: 4.2, lg: 3 }} sx={{ 
          order: { xs: 2, sm: 1 },
          height: { xs: '35%', sm: '100%' },
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            flex: 1,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0
          }}>
          {/* Cart Items */}
          <Box sx={{ 
            flex: 1,
            maxHeight: { xs: 'calc(35vh - 12rem)', sm: 'calc(100vh - 20rem)', md: 'calc(100vh - 18rem)', lg: 'calc(100vh - 16rem)' },
            minHeight: 0,
            px: 2, 
            py: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(46, 125, 50, 0.3)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(46, 125, 50, 0.5)',
              }
            }
          }}>
            {cart.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {cart.map((item) => (
                  <Card key={item.product.documentId} sx={{
                    height: { xs: 'auto', sm: 'auto' },
                    minHeight: { xs: '6rem', sm: '10rem' },
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(0.625rem)',
                    borderRadius: '0.1875rem',
                    border: '0.0625rem solid rgba(46, 125, 50, 0.1)',
                    boxShadow: '0 0.125rem 0.75rem rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 0.25rem 1rem rgba(46, 125, 50, 0.12)',
                      transform: 'translateY(-0.0625rem)',
                    }
                  }}>
                    <CardContent sx={{ 
                      p: { xs: '0.75rem', sm: '1.5rem' }, 
                      height: '100%',
                      '&:last-child': { pb: { xs: '0.75rem', sm: '1.5rem' } } 
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Top Row: Image and Product Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                          {/* Product Image */}
                          <Avatar
                            sx={{ 
                              width: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                              height: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                              backgroundColor: 'rgba(46, 125, 50, 0.1)',
                              border: '0.0625rem solid rgba(46, 125, 50, 0.2)',
                              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1.25rem' }
                            }}
                            src={item.product.image?.[0]?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${item.product.image[0].url}` : undefined}
                          >
                            🌸
                          </Avatar>

                          {/* Product Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600,
                                color: '#2E7D32',
                                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' },
                                mb: 0.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                transition: 'font-size 0.2s ease',
                                '@media (max-width: 1200px)': {
                                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }
                                },
                                '@media (max-width: 900px)': {
                                  fontSize: { xs: '0.6rem', sm: '0.7rem' }
                                },
                                '@media (max-width: 600px)': {
                                  fontSize: '0.5rem'
                                }
                              }}
                            >
                              {item.product.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem', lg: '0.85rem' },
                                color: 'rgba(0, 0, 0, 0.6)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.product.price}₴ за одиницю
                            </Typography>
                          </Box>
                        </Box>

                        {/* Bottom Row: Quantity Controls, Total Price, Remove Button */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          {/* Quantity Controls */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 0.5, sm: 0.75, md: 1, lg: 1 }
                          }}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.product.documentId, item.quantity - 1)}
                              sx={{
                                width: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                                height: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                                color: '#2E7D32',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                }
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem', lg: '1rem' } }} />
                            </IconButton>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                minWidth: { xs: '0.8rem', sm: '1rem', md: '1.25rem', lg: '1.5rem' }, 
                                textAlign: 'center',
                                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem', lg: '1rem' },
                                fontWeight: 600,
                                color: '#2E7D32'
                              }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.product.documentId, item.quantity + 1)}
                              sx={{
                                width: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                                height: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                                color: '#2E7D32',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                }
                              }}
                            >
                              <AddIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem', lg: '1rem' } }} />
                            </IconButton>
                          </Box>

                          {/* Total Price */}
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700,
                              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem', lg: '1rem' },
                              color: '#2E7D32',
                              textAlign: 'center'
                            }}
                          >
                            {item.total}₴
                          </Typography>

                          {/* Remove Button */}
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.product.documentId)}
                            sx={{
                              color: 'error.main',
                              width: { xs: '1rem', sm: '1.2rem', md: '1.3rem', lg: '1.5rem' },
                              height: { xs: '1rem', sm: '1.2rem', md: '1.3rem', lg: '1.5rem' },
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem', lg: '0.9rem' } }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Cart Footer */}
          <Box sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(46, 125, 50, 0.1)',
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: 0
          }}>
            {/* Total and Payment Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'column' },
              gap: { xs: 1, sm: 3 },
              mb: 3
            }}>
              {/* Total Section */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: { xs: 0.5, sm: 1 },
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(46, 125, 50, 0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                flex: { xs: 1, sm: 'none' },
                minHeight: { xs: '1.5rem', sm: 'auto' }
              }}>
                <Typography variant="h6" color="textPrimary" sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.6rem', sm: '1rem' }
                }}>
                  До оплати:
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  color: '#2E7D32',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: { xs: '0.7rem', sm: '1.5rem' }
                }}>
                  {total}₴
                </Typography>
              </Box>
              
              {/* Payment Button */}
              <Button
                variant="contained"
                sx={{ 
                  flex: { xs: 1, sm: 'none' },
                  py: { xs: 1, sm: 2 },
                  px: { xs: 1.5, sm: 3 },
                  background: cart.length === 0 
                    ? 'rgba(0,0,0,0.12)' 
                    : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                  boxShadow: cart.length === 0 
                    ? 'none' 
                    : '0 6px 20px rgba(46, 125, 50, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '1.1rem' },
                  textTransform: 'none',
                  minHeight: { xs: '2.5rem', sm: 'auto' },
                  border: cart.length === 0 
                    ? 'none' 
                    : '1px solid rgba(46, 125, 50, 0.3)',
                  '&:hover': {
                    background: cart.length === 0 
                      ? 'rgba(0,0,0,0.12)' 
                      : 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                    boxShadow: cart.length === 0 
                      ? 'none' 
                      : '0 8px 25px rgba(46, 125, 50, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    transform: cart.length === 0 ? 'none' : 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: cart.length === 0 ? 'none' : 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)',
                    cursor: 'not-allowed'
                  }
                }}
                startIcon={<PaymentIcon />}
                onClick={handlePayment}
                disabled={cart.length === 0}
              >
                {cart.length === 0 ? 'Кошик порожній' : 'Сплатити замовлення'}
              </Button>
            </Box>
          </Box>
        </Box>
        </Grid>

        {/* Right Panel - Products */}
        <Grid size={{ xs: 12, sm: 7.8, md: 7.8, lg: 9 }} sx={{ 
          order: { xs: 1, sm: 2 },
          height: { xs: '65%', sm: '100%' },
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            flex: 1,
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.15) 50%, rgba(165, 214, 167, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            border: '1px solid rgba(46, 125, 50, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Products Header */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ 
              p: { xs: 1, sm: 2.6 }, 
              borderBottom: '1px solid rgba(46, 125, 50, 0.2)',
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: 0,
              alignItems: 'center',
              minHeight: { xs: '4rem', sm: '5.2rem' }
            }}>
              {/* Category Filter */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                      height: { xs: '1.8rem', sm: '2rem', md: '2.2rem', lg: '2.4rem' },
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' },
                      width: '100%',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid rgba(46, 125, 50, 0.4)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        border: '2px solid rgba(46, 125, 50, 0.6)',
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.25)',
                      }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem 
                        key={category.id} 
                        value={category.id}
                        disabled={category.id === 'composition' || category.id === 'accessory'}
                        sx={{
                          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem', lg: '1.1rem' },
                          opacity: category.id === 'composition' || category.id === 'accessory' ? 0.5 : 1,
                        }}
                      >
                        {category.icon} {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Search Field */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <TextField
                  size="small"
                  placeholder="Пошук за назвою..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: isMobile ? 1 : 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                      height: isMobile ? '1.8rem' : '2.6rem',
                      fontSize: isMobile ? '0.8rem' : '1rem',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid rgba(46, 125, 50, 0.4)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        border: '2px solid rgba(46, 125, 50, 0.6)',
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.25)',
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Products Grid */}
            <Grid
              container
              spacing={2}
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '1rem',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(46, 125, 50, 0.3)',
                  borderRadius: '3px',
                },
              }}
            >
              {/* Індикатор завантаження */}
              {loading && (
                <Grid size={12}>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 1,
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ 
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        Завантаження товарів...
                      </Typography>
                      <Box sx={{ fontSize: '2rem' }}>🌸</Box>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Повідомлення про відсутність товарів */}
              {!loading && filteredProducts.length === 0 && (
                <Grid size={12}>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 1,
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ 
                        mb: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        Товари не знайдені
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}>
                        {searchTerm ? `За пошуком "${searchTerm}"` : 'Спробуйте змінити фільтри'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Відображення товарів */}
              {!loading && filteredProducts.slice(0, 12).map((product) => (
                <Grid key={product.documentId} size={{ xs: 6, sm: 4, md: 4, lg: 3 }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                        background: 'rgba(255, 255, 255, 1)',
                        border: '1px solid rgba(46, 125, 50, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(-1px)',
                      }
                    }}
                    onClick={() => addToCart(product)}
                  >
                  <CardContent sx={{ 
                    p: isMobile ? 1 : isTablet ? 1 : 1.5, 
                    textAlign: 'center', 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Avatar
                      sx={{ 
                        width: isMobile ? '3rem' : isTablet ? '2.5rem' : '4.5rem', 
                        height: isMobile ? '3rem' : isTablet ? '2.5rem' : '4.5rem', 
                        mx: 'auto', 
                        mb: isMobile ? 1 : isTablet ? 0.5 : 1,
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        fontSize: isMobile ? '1rem' : isTablet ? '0.9rem' : '1.4rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '2px solid rgba(255, 255, 255, 0.8)'
                      }}
                      src={product.image?.[0]?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${product.image[0].url}` : undefined}
                    >
                      🌸
                    </Avatar>
                     <Typography 
                       variant="body2" 
                       sx={{ 
                         fontWeight: 600,
                         mb: 0.5,
                         fontSize: isMobile ? '0.8rem' : isTablet ? '0.9rem' : '1rem',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         minHeight: '2.2em',
                         lineHeight: 1.1,
                         textAlign: 'center'
                       }}
                     >
                       {product.name}
                     </Typography>
                     <Typography 
                       variant="caption" 
                       color={product.availableQuantity === 0 ? 'error' : 'textSecondary'}
                       sx={{ 
                         fontSize: isMobile ? '0.5rem' : isTablet ? '0.55rem' : '0.6rem',
                         fontWeight: 500,
                         textAlign: 'center',
                         backgroundColor: 'rgba(0, 0, 0, 0.05)',
                         borderRadius: 0.3,
                         px: 0.5,
                         py: 0.15,
                         display: 'inline-block',
                         minWidth: 'fit-content',
                         mx: 'auto',
                         mb: 0.5
                       }}
                     >
                       Наявність {product.availableQuantity || 0}шт
                     </Typography>
                     <Typography 
                       variant="h6" 
                       sx={{ 
                         fontWeight: 700,
                         fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
                         color: 'primary.main',
                         textAlign: 'center',
                         mt: 0.5
                       }}
                     >
                       {product.price}₴
                     </Typography>
                  </CardContent>
                </Card>
                </Grid>
              ))}
              
              {/* Показуємо індикатор якщо товарів більше 12 */}
              {filteredProducts.length > 12 && (
                <Grid size={12}>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    border: '0.1% dashed #ccc'
                  }}>
                    <Typography variant="body2" color="textSecondary">
                      Показано 12 з {filteredProducts.length} товарів
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog
        open={paymentModalOpen}
        onClose={handlePaymentCancel}
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: isMobile ? '95%' : isTablet ? '70%' : '50%',
            maxWidth: 'none',
            height: isMobile ? '90%' : 'auto',
            maxHeight: isMobile ? '90%' : '85%',
            minHeight: isMobile ? '90%' : 'auto',
          }
        }}
        BackdropProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }
        }}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(40px)',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            overflow: 'auto',
            position: 'relative',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(46, 125, 50, 0.3)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(46, 125, 50, 0.5)',
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.2), transparent)',
            }
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          p: { xs: '0.5rem', sm: '0.75rem', md: '1rem' },
          pb: { xs: '0.375rem', sm: '0.5rem', md: '0.75rem' },
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.03) 0%, rgba(76, 175, 80, 0.02) 100%)',
          borderBottom: '1px solid rgba(46, 125, 50, 0.08)',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#1A1A1A',
              fontSize: { xs: '0.6rem', sm: '0.7rem', md: '1rem' },
              letterSpacing: '-0.02em'
            }}>
              Оформлення замовлення
            </Typography>
            <IconButton 
              onClick={handlePaymentCancel} 
              sx={{
                width: { xs: '1.5rem', sm: '2rem' },
                height: { xs: '1.5rem', sm: '2rem' },
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, color: '#666' }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.25rem' }, pt: 0 }}>
          {/* Order Summary */}
          <Box sx={{ 
            mb: { xs: '0.75rem', sm: '1rem', md: '1.25rem', lg: '1rem' },
            background: 'rgba(46, 125, 50, 0.02)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(46, 125, 50, 0.08)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{
              p: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' },
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
              borderBottom: '1px solid rgba(46, 125, 50, 0.08)'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: '#2E7D32',
                fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' },
                mb: 0
              }}>
                Замовлення ({cart.length} товарів)
              </Typography>
            </Box>
            
            <Box sx={{ p: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' } }}>
              {cart.map((item, index) => (
                <Box key={item.product.documentId} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: { xs: '0.25rem', sm: '0.375rem', md: '0.5rem' },
                  borderBottom: index < cart.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'
                }}>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    color: '#1A1A1A',
                    fontSize: { xs: '0.45rem', sm: '0.55rem', md: '0.7rem' }
                  }}>
                    {item.product.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 600,
                    color: '#2E7D32',
                    fontSize: { xs: '0.45rem', sm: '0.55rem', md: '0.7rem' }
                  }}>
                    {item.total}₴
                  </Typography>
                </Box>
              ))}
              
              <Box sx={{ 
                mt: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' },
                pt: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' },
                borderTop: '2px solid rgba(46, 125, 50, 0.1)',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#1A1A1A',
                  fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' }
                }}>
                  Сума товарів:
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#2E7D32',
                  fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' }
                }}>
                  {subtotal}₴
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Payment Method */}
          <Box sx={{ mb: { xs: '0.75rem', sm: '1rem', md: '1.25rem' } }}>
            <Typography variant="h6" sx={{ 
              mb: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' }, 
              fontWeight: 600,
              color: '#1A1A1A',
              fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' }
            }}>
              Спосіб оплати
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: '0.75rem',
              flexDirection: { xs: 'row', sm: 'row', md: 'row' }
            }}>
              {[
                { 
                  value: 'cash', 
                  label: 'Готівка', 
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 17H22V19H2V17ZM2 10H22V12H2V10ZM2 3H22V5H2V3ZM4 6H20V8H4V6ZM4 13H20V15H4V13Z" fill="currentColor"/>
                      <circle cx="6" cy="7" r="1" fill="#2E7D32"/>
                      <circle cx="6" cy="14" r="1" fill="#2E7D32"/>
                    </svg>
                  )
                },
                { 
                  value: 'card', 
                  label: 'Картка', 
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="6" width="20" height="12" rx="2" fill="#1976D2" stroke="#1976D2" strokeWidth="1"/>
                      <rect x="2" y="10" width="20" height="2" fill="#fff"/>
                      <circle cx="18" cy="8" r="1.5" fill="#FFD700"/>
                      <text x="4" y="16" fontSize="8" fill="#fff" fontFamily="Arial">**** **** **** 1234</text>
                    </svg>
                  )
                }
              ].map((method) => (
                <Box
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  sx={{
                    flex: 1,
                    height: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    borderRadius: '0.5rem',
                    border: paymentMethod === method.value 
                      ? '2px solid rgba(46, 125, 50, 0.3)' 
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    background: paymentMethod === method.value 
                      ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)'
                      : 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    '&:hover': {
                      border: '2px solid rgba(46, 125, 50, 0.2)',
                      background: 'rgba(46, 125, 50, 0.05)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': {
                      width: '1.5rem',
                      height: '1.5rem'
                    }
                  }}>
                    {method.icon}
                  </Box>
                  <Typography sx={{ 
                    fontWeight: paymentMethod === method.value ? 600 : 500,
                    color: paymentMethod === method.value ? '#2E7D32' : '#1A1A1A',
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                    textAlign: 'center'
                  }}>
                    {method.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Delivery */}
          <Box sx={{ mb: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem', lg: '1rem' } }}>
            <Box
              onClick={() => setIncludeDelivery(!includeDelivery)}
              sx={{
                p: '0.75rem',
                borderRadius: '0.5rem',
                border: includeDelivery 
                  ? '2px solid rgba(46, 125, 50, 0.3)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                background: includeDelivery 
                  ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                '&:hover': {
                  border: '2px solid rgba(46, 125, 50, 0.2)',
                  background: 'rgba(46, 125, 50, 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Box sx={{ 
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '0.25rem',
                  border: '2px solid',
                  borderColor: includeDelivery ? '#2E7D32' : '#ccc',
                  background: includeDelivery ? '#2E7D32' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  {includeDelivery && (
                    <Typography sx={{ color: 'white', fontSize: '0.6rem', fontWeight: 600 }}>
                      ✓
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ 
                  fontWeight: includeDelivery ? 600 : 500,
                  color: includeDelivery ? '#2E7D32' : '#1A1A1A',
                  fontSize: '0.9rem'
                }}>
                  Доставка
                </Typography>
              </Box>
              
              {includeDelivery && (
                <TextField
                  size="small"
                  label="Ціна доставки"
                  type="text"
                  inputMode="numeric"
                  value={deliveryPriceInput}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    // Дозволяємо порожній рядок під час введення
                    setDeliveryPriceInput(val);
                    if (val === '') {
                      setDeliveryPrice(0);
                    } else {
                      const num = Number(val);
                      // Дозволяємо тільки числа >= 0
                      if (!isNaN(num) && num >= 0) {
                        setDeliveryPrice(num);
                      }
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    // При втраті фокусу, якщо поле порожнє - встановлюємо 0
                    const val = e.target.value.trim();
                    if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
                      setDeliveryPrice(0);
                      setDeliveryPriceInput('');
                    } else {
                      const num = Number(val);
                      setDeliveryPrice(num);
                      setDeliveryPriceInput(num.toString());
                    }
                  }}
                  sx={{ 
                    width: '10rem',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                      backdropFilter: 'blur(15px)',
                      border: '2px solid rgba(46, 125, 50, 0.2)',
                      fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                      fontWeight: 600,
                      color: '#2E7D32',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: '2px solid rgba(46, 125, 50, 0.4)',
                        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)'
                      },
                      '&.Mui-focused': {
                        border: '2px solid #2E7D32',
                        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.07) 100%)',
                        boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.1), 0 6px 20px rgba(46, 125, 50, 0.2)',
                        transform: 'translateY(-2px)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                      fontWeight: 600,
                      color: '#2E7D32',
                      '&.Mui-focused': {
                        color: '#2E7D32'
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#2E7D32', 
                          fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                          fontWeight: 600,
                          mr: 0.5
                        }}
                      >
                        💰
                      </Typography>
                    ),
                    endAdornment: (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#2E7D32', 
                          fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.9rem' },
                          fontWeight: 700,
                          ml: 0.5
                        }}
                      >
                        ₴
                      </Typography>
                    )
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Order Comment */}
          <Box sx={{ mb: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem', lg: '1rem' } }}>
            <Typography variant="h6" sx={{ 
              mb: { xs: '0.5rem', sm: '0.625rem', md: '0.75rem' }, 
              fontWeight: 600,
              color: '#1A1A1A',
              fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' }
            }}>
              Коментар до замовлення
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={1}
              placeholder="Додаткові побажання, адреса доставки, тощо..."
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.8rem' },
                  '&:hover': {
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                  },
                  '&.Mui-focused': {
                    border: '2px solid #2E7D32',
                  }
                }
              }}
            />
          </Box>

          {/* Total */}
          <Box sx={{ 
            mb: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem', lg: '1rem' },
            p: '1rem',
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(46, 125, 50, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#1A1A1A',
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }
                }}>
                  До сплати:
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800, 
                  color: '#2E7D32',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {total}₴
                </Typography>
              </Box>
              <Button
                onClick={handlePaymentComplete}
                variant="contained"
                sx={{
                  px: { xs: '1rem', sm: '1.5rem' },
                  py: { xs: '0.4rem', sm: '0.5rem' },
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  textTransform: 'none',
                  boxShadow: '0 4px 16px rgba(46, 125, 50, 0.3)',
                  border: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)'
                  }
                }}
              >
                Підтвердити оплату
              </Button>
            </Box>
            {includeDelivery && (
              <Typography variant="body2" sx={{ 
                mt: '0.5rem',
                color: '#666',
                fontSize: { xs: '0.7rem', sm: '0.8rem' }
              }}>
                Включає доставку: {deliveryPrice}₴
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
