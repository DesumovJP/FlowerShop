'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Container,
  useMediaQuery,
  useTheme,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Fab,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import SocialIcons from './SocialIcons';
import { useCartStore } from '../store/cartStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  


  const handleDrawerToggle = () => {
    if (isAdminRoute) {
      setMobileOpen(!mobileOpen);
    } else {
      setNavOpen(true);
    }
  };


  const navigationItems = [
    { label: 'Каталог', href: '/catalog' },
    { label: 'Про нас', href: '/about' },
    { label: 'Контакти', href: '/contact' },
  ];

  const drawerList = (
    <Box sx={{ width: 250 }}>
      <List>
        <ListItem component={Link} href="/">
          <ListItemText primary="Головна" />
        </ListItem>
        {navigationItems.map((item) => (
          <ListItem key={item.label} component={Link} href={item.href}>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Client mobile navigation as grid (About, Catalog, Contact)
  const drawerGrid = (
    <Box sx={{ padding: '1%', height: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          height: '100%',
          alignItems: 'center',
        }}
      >
        {/* Left column: About (top 50%), Contacts (bottom 50%) */}
        <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
          <Box
            component={Link}
            href="/about"
            onClick={() => setNavOpen(false)}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.35)',
              backgroundImage: 'url(\'http://localhost:1337/uploads/photo_2025_10_30_17_11_20_caff2b2a50.jpg\')',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              color: 'common.white',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.35)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 2 }}>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>Про нас</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                Історія, цінності та натхнення нашої команди
              </Typography>
            </Box>
          </Box>
          <Box
            component={Link}
            href="/contact"
            onClick={() => setNavOpen(false)}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.35)',
              backgroundImage: 'url(\'http://localhost:1337/uploads/photo_2025_10_30_17_16_55_4_f1fa8e5027.jpg\')',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              color: 'common.white',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.35)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 2 }}>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>Контакти</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                Як нас знайти та зв’язатися швидко
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right column: Catalog 100% height */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Box
            component={Link}
            href="/catalog"
            onClick={() => setNavOpen(false)}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.35)',
              backgroundImage: 'url(\'http://localhost:1337/uploads/image_1_6c46a9bbca.png\')',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              color: 'common.white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 28px rgba(46,125,50,0.22)',
              transform: 'translateZ(0)',
              transition: 'transform 220ms ease, box-shadow 220ms ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.45)'
              },
              '&:hover': {
                boxShadow: '0 18px 44px rgba(46,125,50,0.28)',
                transform: 'scale(1.01)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 2 }}>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, letterSpacing: 0.5, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>Каталог</Typography>
              <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                Перегляньте новинки та бестселери
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ 
            justifyContent: isMobile ? 'space-between' : 'space-between', 
            py: 1,
            position: 'relative',
          }}>
            {/* Mobile Layout */}
            {isMobile ? (
              <>
                {/* Hamburger Menu - Left */}
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ padding: 0.5 }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>

                {/* Logo - Center */}
                <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                      mb: '-0.2rem',
                    }}
                  >
                    квіти
                  </Typography>
                  <Typography
                    variant="h6"
                    component={Link}
                    href="/"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-playfair)'
                    }}
                  >
                    Phoenix
                  </Typography>
                </Box>

                {/* Shopping Cart - Right */}
                <IconButton
                  color="inherit" 
                  component={Link}
                  href="/cart"
                  sx={{ padding: 0.5 }}
                >
                  <Badge badgeContent={getTotalItems()} color="secondary">
                    <ShoppingCartIcon fontSize="medium" />
                  </Badge>
                </IconButton>
              </>
            ) : (
              <>
                {/* Desktop Navigation - Left */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {navigationItems.map((item) => (
                    <Button
                      key={item.label}
                      component={Link}
                      href={item.href}
                      sx={{ 
                        color: 'text.primary', 
                        fontWeight: 500,
                        fontSize: '1rem',
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>

                {/* Logo - Center */}
                <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                      mb: '-0.25rem',
                    }}
                  >
                    квіти
                  </Typography>
                  <Typography
                    variant="h6"
                    component={Link}
                    href="/"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontSize: '1.25rem',
                      fontFamily: 'var(--font-playfair)'
                    }}
                  >
                    Phoenix
                  </Typography>
                </Box>

                {/* Action Buttons - Right */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    color="inherit" 
                    component={Link}
                    href="/cart"
                    sx={{ padding: 1 }}
                  >
                    <Badge badgeContent={mounted ? getTotalItems() : 0} color="secondary">
                      <ShoppingCartIcon fontSize="medium" />
                    </Badge>
                  </IconButton>
                </Box>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation - Drawer for admin, Modal for client */}
      {isAdminRoute ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawerList}
        </Drawer>
      ) : (
        <Dialog
          open={isMobile && navOpen}
          onClose={() => setNavOpen(false)}
          TransitionComponent={Fade as any}
          PaperProps={{
            sx: {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '95vw',
              height: '60vh',
              m: 0,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.78)',
              border: '1px solid rgba(255,255,255,0.45)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }
          }}
          slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)' } } }}
          fullWidth
        >
          <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }} className="drop-appear">
            {drawerGrid}
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <Box 
        component="main" 
        suppressHydrationWarning
        sx={{ 
          flexGrow: 1,
          width: '100%'
        }}
      >
        {children}
      </Box>

      {/* Floating action button: Наберіть мене */}
      <Fab
        onClick={() => setCallOpen(true)}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          width: 64,
          height: 64,
          minHeight: 64,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 12px 28px rgba(46,125,50,0.28)',
          color: 'primary.main',
          '&:hover': {
            background: 'rgba(255,255,255,0.75)'
          }
        }}
        aria-label="Наберіть мене"
      >
        {/* SVG трубка телефону */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1C10.85 22 2 13.15 2 2a1 1 0 0 1 1-1h3.49a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Fab>

      {/* Contact modal */}
      <Dialog open={callOpen} onClose={() => setCallOpen(false)}
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)' } } }}
        PaperProps={{ sx: { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 2, boxShadow: '0 16px 48px rgba(46,125,50,0.18)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'var(--font-playfair)' }}>Залиште контакти — передзвонимо за 10–15 хвилин</DialogTitle>
        <DialogContent sx={{ pt: 1, minWidth: { xs: 300, sm: 460 } }}>
          <TextField
            fullWidth
            label="Ваше ім'я"
            variant="outlined"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
          <TextField
            fullWidth
            label="Номер телефону"
            placeholder="+380..."
            variant="outlined"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setCallOpen(false)} sx={{ borderRadius: 0 }}>Скасувати</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              // Here you can POST to your backend
              try { console.log('Contact request:', { contactName, contactPhone }); } catch {}
              setCallOpen(false);
              setSnackOpen(true);
              setContactName('');
              setContactPhone('');
            }}
            sx={{ borderRadius: 0 }}
          >
            Відправити
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ width: '100%' }}>
          Дякуємо! Ми зателефонуємо найближчим часом.
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: 'background.default',
          py: 6,
          mt: 'auto',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 6,
              mb: 4,
            }}
          >
            {/* Logo та соціальні мережі */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontFamily: 'var(--font-playfair)',
                  mb: 2,
                }}
              >
                Phoenix
              </Typography>
              <SocialIcons size={20} color="currentColor" />
            </Box>

            {/* Категорії та підтримка */}
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'var(--font-playfair)' }}>
                    Категорії
                  </Typography>
                  <Typography component={Link} href="/about" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Про нас
                  </Typography>
                  <Typography component={Link} href="/catalog" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Каталог
                  </Typography>
                  <Typography component={Link} href="/contact" variant="body2" color="text.secondary" sx={{ display: 'block', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Контакти
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'var(--font-playfair)' }}>
                    Підтримка
                  </Typography>
                  <Typography component={Link} href="/contact" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Доставка та оплата
                  </Typography>
                  <Typography component={Link} href="/contact" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Допомога та підтримка
                  </Typography>
                  <Typography component={Link} href="/contact" variant="body2" color="text.secondary" sx={{ display: 'block', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    Сервіс 24/7
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Контактна інформація */}
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontFamily: 'var(--font-playfair)',
                }}
              >
                Контакти
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                +380501627774 (Ростислав)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                phoenixUA@gmail.com
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                м. Київ, вул. Ризька, 1
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Графік: 08:00 – 20:00
              </Typography>
            </Box>
          </Box>
          
          <Box
            sx={{
              borderTop: 1,
              borderColor: 'grey.300',
              pt: 3,
              textAlign: 'center',
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontFamily: 'var(--font-inter)' }}
            >
              Phoenix * Copyright 2025. Всі права захищені.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
