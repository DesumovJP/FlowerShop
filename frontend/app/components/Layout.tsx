'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import SocialIcons from './SocialIcons';
import { useCartStore } from '../store/cartStore';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getTotalItems } = useCartStore();


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };


  const navigationItems = [
    { label: 'Каталог', href: '/catalog' },
    { label: 'Про нас', href: '/about' },
    { label: 'Контакти', href: '/contact' },
  ];

  const drawer = (
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
                <Typography
                  variant="h6"
                  component={Link}
                  href="/"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontFamily: 'var(--font-playfair)',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  Phoenix
                </Typography>

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
                <Typography
                  variant="h6"
                  component={Link}
                  href="/"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontSize: '1.25rem',
                    fontFamily: 'var(--font-playfair)',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  Phoenix
                </Typography>

                {/* Action Buttons - Right */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    color="inherit" 
                    component={Link}
                    href="/cart"
                    sx={{ padding: 1 }}
                  >
                    <Badge badgeContent={getTotalItems()} color="secondary">
                      <ShoppingCartIcon fontSize="medium" />
                    </Badge>
                  </IconButton>
                </Box>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
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
        {drawer}
      </Drawer>

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
            <Box>
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
                    Категорії
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Про нас
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Каталог
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Контакти
                  </Typography>
                </Box>
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
                    Підтримка
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Доставка та оплата
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Допомога та підтримка
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
              Phoenix * Copyright 2024. Всі права захищені.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
