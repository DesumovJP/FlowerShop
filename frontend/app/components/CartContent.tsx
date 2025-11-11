'use client';

import React, { useState } from 'react';
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
  Divider,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useCartStore } from '../store/cartStore';
import Image from 'next/image';

export default function CartContent() {
  const {
    items,
    customerInfo,
    updateQuantity,
    removeItem,
    clearCart,
    updateCustomerInfo,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  // Логування для діагностики
  console.log('CartContent items:', items);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Функція для очищення localStorage (для тестування)
  const clearLocalStorage = () => {
    localStorage.removeItem('cart-storage');
    window.location.reload();
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    
    // Валідація
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.email || !customerInfo.deliveryAddress) {
      setSubmitError('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Тут буде логіка відправки замовлення
      console.log('Замовлення:', {
        items,
        customerInfo,
        total: getTotalPrice(),
      });

      // Симуляція відправки
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Очищуємо корзину після успішного замовлення
      clearCart();
      
      alert('Замовлення успішно відправлено! Ми зв\'яжемося з вами найближчим часом.');
    } catch (error) {
      setSubmitError('Помилка при відправці замовлення. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = getTotalPrice();
  const deliveryThreshold = 2000; // Безкоштовна доставка від 2000₴
  const deliveryCost = subtotal >= deliveryThreshold ? 0 : 150; // 150₴ за доставку
  const total = subtotal + deliveryCost;

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6}>
          {/* Left Section - Кошик */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ mb: 4 }}>
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
                Кошик
              </Typography>
              <Divider sx={{ borderColor: 'grey.300' }} />
            </Box>

            {/* Cart Items */}
            <Card className="glass-card" sx={{ p: 2, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Ваш кошик порожній
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Додайте товари з каталогу
                  </Typography>
                </Box>
              ) : (
                <>
                  {items.map((item, index) => (
                  <Box key={item.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {/* Product Image */}
                      <Card className="glass-card" sx={{ width: 120, height: 120, borderRadius: 0, overflow: 'hidden', flexShrink: 0 }}>
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={120}
                            height={120}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            onError={(e) => {
                              console.error('Image failed to load:', item.imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', item.imageUrl);
                            }}
                          />
                        ) : (
                          <CardMedia
                            component="div"
                            sx={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '3rem',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.2\'/%3E%3Ccircle cx=\'80\' cy=\'40\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3Ccircle cx=\'40\' cy=\'80\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.1\'/%3E%3C/svg%3E")',
                              }
                            }}
                          >
                            🌸
                          </CardMedia>
                        )}
                      </Card>

                    {/* Product Details */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                          fontFamily: 'var(--font-playfair)',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.4,
                          fontFamily: 'var(--font-inter)',
                          mb: 2,
                        }}
                      >
                        Красивий букет квітів
                      </Typography>

                      {/* Quantity and Price Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {/* Quantity Selector */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'grey.300',
                              borderRadius: 1,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleQuantityChange(item.id, value);
                            }}
                            inputProps={{
                              style: { textAlign: 'center', width: '40px' },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                width: 60,
                                height: 32,
                              },
                            }}
                          />
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'grey.300',
                              borderRadius: 1,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Price */}
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            fontFamily: 'var(--font-inter)',
                            minWidth: '80px',
                          }}
                        >
                          {item.price * item.quantity}₴
                        </Typography>

                        {/* Remove Button */}
                        <IconButton
                          onClick={() => handleRemoveItem(item.id)}
                          sx={{
                            color: 'text.secondary',
                            padding: 0.5,
                            '&:hover': {
                              color: 'error.main',
                              backgroundColor: 'transparent',
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  
                </Box>
                  ))}
                </>
              )}
              </Box>
            </Card>
          </Grid>

          {/* Right Section - Total */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Box sx={{ mb: 4 }}>
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
                  Оформлення замовлення
                </Typography>
                <Divider sx={{ borderColor: 'grey.300' }} />
              </Box>
              {/* Customer Info Form (вище) */}
              {items.length > 0 && (
                <Card className="glass-card" sx={{ p: 3, borderRadius: 0, mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Дані для доставки
                  </Typography>

                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {submitError}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="ПІБ *"
                      value={customerInfo.fullName}
                      onChange={(e) => updateCustomerInfo({ fullName: e.target.value })}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />

                    <TextField
                      fullWidth
                      label="Номер телефону *"
                      value={customerInfo.phone}
                      onChange={(e) => updateCustomerInfo({ phone: e.target.value })}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />

                    <TextField
                      fullWidth
                      label="Email *"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => updateCustomerInfo({ email: e.target.value })}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />

                    <TextField
                      fullWidth
                      label="Адреса доставки кур'єром *"
                      multiline
                      rows={2}
                      value={customerInfo.deliveryAddress}
                      onChange={(e) => updateCustomerInfo({ deliveryAddress: e.target.value })}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />

                    <FormControl component="fieldset">
                      <FormLabel component="legend">Спосіб оплати</FormLabel>
                      <RadioGroup
                        value={customerInfo.paymentMethod}
                        onChange={(e) => updateCustomerInfo({ paymentMethod: e.target.value as 'card' | 'cash' })}
                      >
                        <FormControlLabel value="card" control={<Radio />} label="Оплата карткою" />
                        <FormControlLabel value="cash" control={<Radio />} label="Готівкою при отриманні" />
                      </RadioGroup>
                    </FormControl>

                    {customerInfo.paymentMethod === 'card' && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField 
                          fullWidth 
                          label="Номер картки" 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value)} 
                          placeholder="1234 5678 9012 3456"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                          slotProps={{ inputLabel: { shrink: true } } as any}
                          // Span full width across both columns on sm+
                          style={{ gridColumn: '1 / -1' }}
                        />
                        <TextField 
                          fullWidth 
                          label="Термін дії (MM/YY)" 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)} 
                          placeholder="MM/YY"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                          slotProps={{ inputLabel: { shrink: true } } as any}
                        />
                        <TextField 
                          fullWidth 
                          label="CVV" 
                          value={cardCvv} 
                          onChange={(e) => setCardCvv(e.target.value)} 
                          placeholder="***"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                          slotProps={{ inputLabel: { shrink: true } } as any}
                        />
                      </Box>
                    )}
                  </Box>
                </Card>
              )}

              {/* Order Summary (ниже) */}
              <Card className="glass-card" sx={{ p: 3, borderRadius: 0 }}>
                {/* Items */}
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                  >
                    <Typography variant="body1" sx={{ color: 'text.primary', fontFamily: 'var(--font-inter)' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                      {item.price * item.quantity}₴
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2, borderColor: 'grey.300' }} />

                {/* Delivery */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontFamily: 'var(--font-inter)' }}>
                    Доставка:
                  </Typography>
                  <Typography variant="body1" sx={{ color: deliveryCost === 0 ? 'success.main' : 'text.primary', fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                    {deliveryCost === 0 ? 'Безкоштовно' : `${deliveryCost}₴`}
                  </Typography>
                </Box>

                {/* Delivery threshold info */}
                {subtotal < deliveryThreshold && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1.5, backgroundColor: '#81C784', borderRadius: 1, border: '1px solid', borderColor: '#66BB6A' }}>
                    <Typography variant="body2" sx={{ color: 'white', fontFamily: 'var(--font-inter)', fontSize: '0.875rem' }}>
                      До безкоштовної доставки залишилось:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontFamily: 'var(--font-inter)', fontSize: '0.875rem' }}>
                      {deliveryThreshold - subtotal}₴
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2, borderColor: 'grey.300' }} />

                {/* Total */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, fontFamily: 'var(--font-inter)' }}>
                    Всього:
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, fontFamily: 'var(--font-inter)' }}>
                    {total}₴
                  </Typography>
                </Box>

                {/* Pay Button */}
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0}
                  sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 2, borderColor: 'primary.main', color: 'primary.main', backgroundColor: 'background.default', borderWidth: 2, textTransform: 'none', fontFamily: 'var(--font-inter)', '&:hover': { borderWidth: 2, backgroundColor: 'primary.main', color: 'background.default' } }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Відправляємо...
                    </>
                  ) : (
                    `Оформити замовлення${getTotalItems() > 1 ? ` (${getTotalItems()})` : ''}`
                  )}
                </Button>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}