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
          items: order.items.map(i => ({ documentId: i.documentId, name: i.name, quantity: i.quantity, price: i.price }))
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
        gap: 1.5,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <Box sx={{
          fontSize: 64,
          animation: 'spin 2.4s linear infinite',
          '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
          }
        }}>
          🌸
        </Box>
        <Typography color="textSecondary" sx={{ fontSize: 18, fontWeight: 500 }}>
          Завантаження...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      background: 'linear-gradient(135deg, rgba(248, 249, 250, 0.98) 0%, rgba(233, 236, 239, 0.95) 100%), linear-gradient(135deg, rgba(46, 125, 50, 0.03) 0%, rgba(46, 125, 50, 0.01) 100%)',
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
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: isMobile ? 'none' : '1px solid rgba(46, 125, 50, 0.1)',
            borderBottom: isMobile ? '1px solid rgba(46, 125, 50, 0.1)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
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
            {cart.length === 0 ? (
              <Box sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1.25,
                color: 'text.secondary'
              }}>
                {/* Minimal cart outline SVG */}
                <Box component="svg" viewBox="0 0 24 24" sx={{ width: 40, height: 40, opacity: 0.6 }}>
                  <path d="M7 4h-2l-1 2m0 0 2.2 8.8c.1.5.6.9 1.1.9h8.8c.5 0 1-.4 1.1-.9L19 8H6.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="19" r="1.2" fill="currentColor"/>
                  <circle cx="16" cy="19" r="1.2" fill="currentColor"/>
                </Box>
                <Typography sx={{ 
                  textAlign: 'center', 
                  fontWeight: 500, 
                  color: 'text.secondary',
                  fontFamily: 'var(--font-inter)',
                  fontSize: { xs: '0.875rem', sm: '0.95rem' },
                  letterSpacing: '0.01em',
                }}>
                  Додайте товари в кошик
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {cart.map((item) => (
                  <Card key={item.product.documentId} sx={{
                    height: { xs: 'auto', sm: 'auto' },
                    minHeight: { xs: '6rem', sm: '10rem' },
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 2,
                    border: '1px solid rgba(46, 125, 50, 0.1)',
                    boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      transform: 'translateY(-2px)',
                      borderColor: 'rgba(46, 125, 50, 0.2)',
                    }
                  }}>
                    <CardContent sx={{ 
                      p: { xs: '0.75rem', sm: '1.5rem' }, 
                      height: '100%',
                      '&:last-child': { pb: { xs: '0.75rem', sm: '1.5rem' } } 
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Top Row: Image and Product Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, gap: { xs: 1.25, sm: 1.5, md: 1.75, lg: 2 } }}>
                          {/* Product Image */}
                          <Avatar
                            sx={{ 
                              width: { xs: '3rem', sm: '3.5rem', md: '4rem', lg: '4.5rem' },
                              height: { xs: '3rem', sm: '3.5rem', md: '4rem', lg: '4.5rem' },
                              backgroundColor: 'rgba(46, 125, 50, 0.1)',
                              border: '1.5px solid rgba(46, 125, 50, 0.2)',
                              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem', lg: '1.5rem' },
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.15)',
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
                                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem', lg: '1.1rem' },
                                mb: 0.75,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-inter)',
                                letterSpacing: '0.01em',
                                lineHeight: 1.3,
                              }}
                            >
                              {item.product.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem', lg: '0.95rem' },
                                  color: 'text.secondary',
                                  fontFamily: 'var(--font-inter)',
                                  letterSpacing: '0.01em',
                                  lineHeight: 1.4,
                                }}
                              >
                                {item.product.price}
                              </Typography>
                              <Typography 
                                component="span"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem', lg: '0.9rem' },
                                  color: 'text.secondary',
                                  fontFamily: 'var(--font-inter)',
                                  letterSpacing: '-0.01em',
                                  lineHeight: 1.4,
                                  opacity: 0.85,
                                }}
                              >
                                ₴
                              </Typography>
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem', lg: '0.85rem' },
                                  color: 'text.secondary',
                                  fontFamily: 'var(--font-inter)',
                                  fontWeight: 400,
                                  letterSpacing: '0.01em',
                                  textTransform: 'lowercase',
                                  opacity: 0.7,
                                  lineHeight: 1.4,
                                }}
                              >
                                {item.product.productType === 'bouquet' ? 'букет' : 'за шт.'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Bottom Row: Quantity Controls, Total Price, Remove Button */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: { xs: 1.5, sm: 1.75, md: 2 } }}>
                          {/* Quantity Controls */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 0.75, sm: 1, md: 1.25, lg: 1.5 },
                            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                            borderRadius: 2,
                            px: { xs: 0.75, sm: 1, md: 1.25 },
                            py: { xs: 0.5, sm: 0.75, md: 1 },
                            border: '1px solid rgba(46, 125, 50, 0.1)',
                          }}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.product.documentId, item.quantity - 1)}
                              sx={{
                                width: { xs: 28, sm: 32, md: 36, lg: 40 },
                                height: { xs: 28, sm: 32, md: 36, lg: 40 },
                                color: '#2E7D32',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                  transform: 'scale(1.05)',
                                }
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }} />
                            </IconButton>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                minWidth: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' }, 
                                textAlign: 'center',
                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.1rem', lg: '1.15rem' },
                                fontWeight: 700,
                                color: '#2E7D32',
                                fontFamily: 'var(--font-inter)',
                                letterSpacing: '0.01em',
                              }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.product.documentId, item.quantity + 1)}
                              sx={{
                                width: { xs: 28, sm: 32, md: 36, lg: 40 },
                                height: { xs: 28, sm: 32, md: 36, lg: 40 },
                                color: '#2E7D32',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.15)',
                                  transform: 'scale(1.05)',
                                }
                              }}
                            >
                              <AddIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }} />
                            </IconButton>
                          </Box>

                          {/* Total Price */}
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700,
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.25rem' },
                                color: '#2E7D32',
                                fontFamily: 'var(--font-inter)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2,
                              }}
                            >
                              {item.total}
                            </Typography>
                            <Typography 
                              component="span"
                              sx={{ 
                                color: '#2E7D32',
                                fontWeight: 500,
                                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem', lg: '1.05rem' },
                                fontFamily: 'var(--font-inter)',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.2,
                                opacity: 0.85,
                              }}
                            >
                              ₴
                            </Typography>
                          </Box>

                          {/* Remove Button */}
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.product.documentId)}
                            sx={{
                              color: 'error.main',
                              width: { xs: 32, sm: 36, md: 40 },
                              height: { xs: 32, sm: 36, md: 40 },
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                transform: 'scale(1.1) rotate(90deg)',
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }} />
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
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(46, 125, 50, 0.08) 100%)',
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
                p: { xs: 1.5, sm: 2, md: 2.5 },
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 2,
                border: '1px solid rgba(46, 125, 50, 0.15)',
                boxShadow: '0 4px 16px rgba(46, 125, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                flex: { xs: 1, sm: 'none' },
                minHeight: { xs: 'auto', sm: 'auto' }
              }}>
                <Typography variant="h6" color="textPrimary" sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                }}>
                  До оплати:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    color: '#2E7D32',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                  }}>
                    {total}
                  </Typography>
                  <Typography 
                    component="span"
                    sx={{ 
                      color: '#2E7D32',
                      fontWeight: 500,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      opacity: 0.85,
                    }}
                  >
                    ₴
                  </Typography>
                </Box>
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
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            border: '1px solid rgba(46, 125, 50, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
          }}>
            {/* Products Header */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.06) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 0,
              alignItems: 'center',
              minHeight: { xs: '4rem', sm: '5.2rem' },
              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.05)',
            }}>
              {/* Category Filter */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(46, 125, 50, 0.15)',
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                      height: { xs: '2.5rem', sm: '2.75rem', md: '3rem' },
                      fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                      width: '100%',
                      fontFamily: 'var(--font-inter)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(46, 125, 50, 0.25)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.12)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        border: '2px solid rgba(46, 125, 50, 0.4)',
                        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.15)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 2,
                          mt: 1,
                          boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                          border: '1px solid rgba(46, 125, 50, 0.1)',
                        },
                      },
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
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(46, 125, 50, 0.15)',
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
                      height: { xs: '2.5rem', sm: '2.75rem', md: '3rem' },
                      fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                      width: '100%',
                      fontFamily: 'var(--font-inter)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(46, 125, 50, 0.25)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.12)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        border: '2px solid rgba(46, 125, 50, 0.4)',
                        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.15)',
                      },
                      '& fieldset': {
                        border: 'none',
                      },
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
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 4px 16px rgba(46, 125, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(46, 125, 50, 0.1)',
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 8px 32px rgba(46, 125, 50, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%)',
                        border: '1px solid rgba(46, 125, 50, 0.2)',
                      },
                      '&:active': {
                        transform: 'translateY(-2px) scale(1.01)',
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
                         mb: 0.75,
                         fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         minHeight: '2.4em',
                         lineHeight: 1.3,
                         textAlign: 'center',
                         fontFamily: 'var(--font-inter)',
                         letterSpacing: '0.01em',
                         color: 'text.primary',
                       }}
                     >
                       {product.name}
                     </Typography>
                     <Typography 
                       variant="caption" 
                       color={product.availableQuantity === 0 ? 'error' : 'textSecondary'}
                       sx={{ 
                         fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                         fontWeight: 500,
                         textAlign: 'center',
                         backgroundColor: product.availableQuantity === 0 
                           ? 'rgba(244, 67, 54, 0.1)' 
                           : 'rgba(46, 125, 50, 0.08)',
                         borderRadius: 1.5,
                         px: 1,
                         py: 0.5,
                         display: 'inline-block',
                         minWidth: 'fit-content',
                         mx: 'auto',
                         mb: 0.75,
                         fontFamily: 'var(--font-inter)',
                         letterSpacing: '0.01em',
                         border: product.availableQuantity === 0 
                           ? '1px solid rgba(244, 67, 54, 0.2)' 
                           : '1px solid rgba(46, 125, 50, 0.15)',
                       }}
                     >
                       Наявність {product.availableQuantity || 0}шт
                     </Typography>
                     <Box sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       gap: 0.75,
                       mt: 0.75,
                       flexWrap: 'wrap',
                     }}>
                       <Typography 
                         variant="h6" 
                         sx={{ 
                           fontWeight: 700,
                           fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                           color: 'primary.main',
                           fontFamily: 'var(--font-inter)',
                           letterSpacing: '-0.02em',
                           lineHeight: 1.2,
                         }}
                       >
                         {product.price}
                       </Typography>
                       <Typography 
                         component="span"
                         sx={{ 
                           color: 'primary.main',
                           fontWeight: 500,
                           fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                           fontFamily: 'var(--font-inter)',
                           letterSpacing: '-0.01em',
                           lineHeight: 1.2,
                           opacity: 0.85,
                         }}
                       >
                         ₴
                       </Typography>
                       <Typography
                         component="span"
                         sx={{
                           color: 'primary.main',
                           fontFamily: 'var(--font-inter)',
                           fontWeight: 500,
                           fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                           letterSpacing: '0.01em',
                           textTransform: 'lowercase',
                           opacity: 0.75,
                           lineHeight: 1,
                         }}
                       >
                         {product.productType === 'bouquet' ? 'букет' : 'за шт.'}
                       </Typography>
                     </Box>
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
            width: isMobile ? '95%' : isTablet ? '70%' : '55%',
            maxWidth: 'none',
            height: isMobile ? '90%' : 'auto',
            maxHeight: isMobile ? '90%' : '90%',
            minHeight: isMobile ? '90%' : 'auto',
          }
        }}
        BackdropProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }
        }}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: 0,
            border: '1px solid rgba(46, 125, 50, 0.15)',
            boxShadow: '0 24px 64px rgba(46, 125, 50, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #2E7D32 0%, #4CAF50 50%, #2E7D32 100%)',
              zIndex: 11,
            },
            '& .MuiDialogContent-root': {
              overflow: 'auto',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(46, 125, 50, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(46, 125, 50, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(46, 125, 50, 0.5)',
                }
              },
            }
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{
          p: { xs: 2.5, sm: 3, md: 3.5 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          color: 'white',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
          flexShrink: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            pointerEvents: 'none',
          }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-playfair)',
              lineHeight: 1.2,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              Оформлення замовлення
            </Typography>
            <IconButton 
              onClick={handlePaymentCancel} 
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'scale(1.1) rotate(90deg)',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ 
          p: { xs: 2.5, sm: 3, md: 3.5 }, 
          pt: { xs: 2.5, sm: 3, md: 3.5 },
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Order Summary */}
          <Box sx={{ 
            mb: { xs: 3, sm: 3.5, md: 4 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.15)',
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)',
              borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: '#2E7D32',
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                mb: 0,
                fontFamily: 'var(--font-inter)',
                letterSpacing: '0.01em',
              }}>
                Замовлення ({cart.length} {cart.length === 1 ? 'товар' : cart.length < 5 ? 'товари' : 'товарів'})
              </Typography>
            </Box>
            
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              {cart.map((item, index) => (
                <Box key={item.product.documentId} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: { xs: 1.5, sm: 1.75, md: 2 },
                  borderBottom: index < cart.length - 1 ? '1px solid rgba(46, 125, 50, 0.1)' : 'none',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.03)',
                  }
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.1rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.01em',
                      lineHeight: 1.4,
                      mb: 0.25,
                    }}>
                      {item.product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 500,
                        color: 'text.secondary',
                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem' },
                        fontFamily: 'var(--font-inter)',
                        letterSpacing: '0.01em',
                      }}>
                        {item.quantity} × {item.product.price}₴
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          fontWeight: 400,
                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                          letterSpacing: '0.01em',
                          textTransform: 'lowercase',
                          opacity: 0.7,
                        }}
                      >
                        {item.product.productType === 'bouquet' ? 'букет' : 'за шт.'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, ml: 2 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: '#2E7D32',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}>
                      {item.total}
                    </Typography>
                    <Typography 
                      component="span"
                      sx={{ 
                        color: '#2E7D32',
                        fontWeight: 500,
                        fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                        fontFamily: 'var(--font-inter)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                        opacity: 0.85,
                      }}
                    >
                      ₴
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              <Box sx={{ 
                mt: { xs: 2, sm: 2.5, md: 3 },
                pt: { xs: 2, sm: 2.5, md: 3 },
                borderTop: '2px solid rgba(46, 125, 50, 0.15)',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                mx: { xs: -2, sm: -2.5, md: -3 },
                px: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: '0 0 8px 8px',
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.01em',
                }}>
                  Сума товарів:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.65rem' },
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}>
                    {subtotal}
                  </Typography>
                  <Typography 
                    component="span"
                    sx={{ 
                      color: '#2E7D32',
                      fontWeight: 500,
                      fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      opacity: 0.85,
                    }}
                  >
                    ₴
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Payment Method */}
          <Box sx={{ 
            mb: { xs: 3, sm: 3.5, md: 4 },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.15)',
            boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
          }}>
            <Typography variant="h6" sx={{ 
              mb: { xs: 2, sm: 2.5, md: 3 }, 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.25rem', md: '1.35rem' },
              fontFamily: 'var(--font-inter)',
              letterSpacing: '0.01em',
            }}>
              Спосіб оплати
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              flexDirection: { xs: 'row', sm: 'row', md: 'row' }
            }}>
              {[
                { 
                  value: 'cash', 
                  label: 'Готівка', 
                  icon: (
                    // Dollar bill SVG
                    <svg width="28" height="28" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="60" height="28" rx="4" fill="#2e7d32" stroke="#1b5e20" strokeWidth="2"/>
                      <rect x="6" y="6" width="52" height="20" rx="3" fill="#43a047"/>
                      <circle cx="20" cy="16" r="4" fill="#1b5e20" opacity="0.25"/>
                      <circle cx="44" cy="16" r="4" fill="#1b5e20" opacity="0.25"/>
                      <text x="30" y="20" fontSize="10" fill="#fff" fontFamily="Arial" fontWeight="700">$</text>
                    </svg>
                  )
                },
                { 
                  value: 'card', 
                  label: 'Картка', 
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="6" width="20" height="12" rx="2" fill="#1976D2" stroke="#1976D2" strokeWidth="1"/>
                      <rect x="2" y="10" width="20" height="2" fill="#fff"/>
                      <circle cx="18" cy="8" r="1.5" fill="#FFD700"/>
                    </svg>
                  )
                }
              ].map((method) => (
                <Box
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  sx={{
                    flex: 1,
                    minHeight: { xs: '5rem', sm: '6rem', md: '7rem' },
                    borderRadius: 2,
                    border: paymentMethod === method.value 
                      ? '2px solid #2E7D32' 
                      : '1px solid rgba(46, 125, 50, 0.2)',
                    background: paymentMethod === method.value 
                      ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(76, 175, 80, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.85) 100%)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 1.25, md: 1.5 },
                    boxShadow: paymentMethod === method.value 
                      ? '0 8px 24px rgba(46, 125, 50, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                      : '0 2px 8px rgba(46, 125, 50, 0.08)',
                    '&:hover': {
                      border: '2px solid rgba(46, 125, 50, 0.4)',
                      background: paymentMethod === method.value 
                        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': {
                      width: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
                      height: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
                      filter: paymentMethod === method.value ? 'drop-shadow(0 2px 4px rgba(46, 125, 50, 0.3))' : 'none',
                      transition: 'all 0.3s ease',
                    }
                  }}>
                    {method.icon}
                  </Box>
                  <Typography sx={{ 
                    fontWeight: paymentMethod === method.value ? 700 : 600,
                    color: paymentMethod === method.value ? '#2E7D32' : 'text.primary',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    textAlign: 'center',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.01em',
                  }}>
                    {method.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Delivery */}
          <Box sx={{ 
            mb: { xs: 3, sm: 3.5, md: 4 },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.15)',
            boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
          }}>
            <Box
              onClick={() => setIncludeDelivery(!includeDelivery)}
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: 2,
                border: includeDelivery 
                  ? '2px solid #2E7D32' 
                  : '1px solid rgba(46, 125, 50, 0.2)',
                background: includeDelivery 
                  ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(76, 175, 80, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.85) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                boxShadow: includeDelivery 
                  ? '0 4px 12px rgba(46, 125, 50, 0.15)'
                  : '0 2px 8px rgba(46, 125, 50, 0.08)',
                '&:hover': {
                  border: '2px solid rgba(46, 125, 50, 0.4)',
                  background: includeDelivery 
                    ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
                <Box sx={{ 
                  width: { xs: 24, sm: 28, md: 32 },
                  height: { xs: 24, sm: 28, md: 32 },
                  borderRadius: 1.5,
                  border: '2px solid',
                  borderColor: includeDelivery ? '#2E7D32' : 'rgba(46, 125, 50, 0.3)',
                  background: includeDelivery 
                    ? 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: includeDelivery ? '0 2px 8px rgba(46, 125, 50, 0.3)' : 'none',
                }}>
                  {includeDelivery && (
                    <Typography sx={{ 
                      color: 'white', 
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, 
                      fontWeight: 700,
                      lineHeight: 1,
                    }}>
                      ✓
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ 
                  fontWeight: includeDelivery ? 700 : 600,
                  color: includeDelivery ? '#2E7D32' : 'text.primary',
                  fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.01em',
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
          <Box sx={{ 
            mb: { xs: 3, sm: 3.5, md: 4 },
            p: { xs: 2.5, sm: 3, md: 3.5 },
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.15)',
            boxShadow: '0 4px 16px rgba(46, 125, 50, 0.08)',
          }}>
            <Typography variant="h6" sx={{ 
              mb: { xs: 2, sm: 2.5, md: 3 }, 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.25rem', md: '1.35rem' },
              fontFamily: 'var(--font-inter)',
              letterSpacing: '0.01em',
            }}>
              Коментар до замовлення
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Додаткові побажання, адреса доставки, тощо..."
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
                  fontFamily: 'var(--font-inter)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    border: '2px solid #2E7D32',
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.1)',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '& .MuiInputBase-input': {
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.6,
                }
              }}
            />
          </Box>

          {/* Total */}
          <Box sx={{ 
            mb: { xs: 2.5, sm: 3, md: 3.5 },
            p: { xs: 3, sm: 3.5, md: 4 },
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            borderRadius: 2,
            border: '1px solid rgba(46, 125, 50, 0.3)',
            boxShadow: '0 8px 32px rgba(46, 125, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              pointerEvents: 'none',
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: { xs: 2, sm: 3, md: 4 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              position: 'relative',
              zIndex: 1,
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: { xs: 1, sm: 1.5, md: 2 },
                flexWrap: 'wrap',
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: 'white',
                  fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.01em',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}>
                  До сплати:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    color: 'white',
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}>
                    {total}
                  </Typography>
                  <Typography 
                    component="span"
                    sx={{ 
                      color: 'white',
                      fontWeight: 500,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      opacity: 0.9,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    ₴
                  </Typography>
                </Box>
              </Box>
              <Button
                onClick={handlePaymentComplete}
                variant="contained"
                sx={{
                  px: { xs: 3, sm: 4, md: 5 },
                  py: { xs: 1.5, sm: 1.75, md: 2 },
                  borderRadius: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#2E7D32',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  textTransform: 'none',
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 1)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Підтвердити оплату
              </Button>
            </Box>
            {includeDelivery && (
              <Typography variant="body2" sx={{ 
                mt: { xs: 1.5, sm: 2, md: 2.5 },
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
                fontFamily: 'var(--font-inter)',
                letterSpacing: '0.01em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}>
                Включає доставку: {deliveryPrice}₴
              </Typography>
            )}
          </Box>
        </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
