'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import Link from 'next/link';

const catalogItems = [
  {
    id: 1,
    name: 'Зачаровані пелюстки',
    price: 70,
    image: '🌺',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
  },
  {
    id: 2,
    name: 'Шепіт луків',
    price: 45,
    image: '🌿',
    gradient: 'linear-gradient(135deg, #E8F5E8 0%, #F0F8F0 50%, #F5F5F5 100%)',
  },
  {
    id: 3,
    name: 'Спокійне блаженство',
    price: 60,
    image: '🌹',
    gradient: 'linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 50%, #FFC0CB 100%)',
  },
  {
    id: 4,
    name: 'Квіткова гармонія',
    price: 80,
    image: '🌸',
    gradient: 'linear-gradient(135deg, #FFE4B5 0%, #FFEFD5 50%, #FFF8DC 100%)',
  },
  {
    id: 5,
    name: 'Весняна серенада',
    price: 65,
    image: '🌼',
    gradient: 'linear-gradient(135deg, #F0E68C 0%, #FFFFE0 50%, #FFFACD 100%)',
  },
  {
    id: 6,
    name: 'Цвітуча велич',
    price: 50,
    image: '🌻',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFFF00 50%, #FFF8DC 100%)',
  },
];

export default function CategoriesSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'white' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 3,
              fontFamily: 'var(--font-playfair)',
            }}
          >
            Каталог квіткових насолод для будь-якої нагоди
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {catalogItems.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card
                component={Link}
                href={`/product/${item.id}`}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease-in-out',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 250,
                      background: item.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
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
                    {item.image}
                  </CardMedia>
                  
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          backgroundColor: 'rgba(255,255,255,1)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { 
                          backgroundColor: 'rgba(255,255,255,1)',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ShoppingCartIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <CardContent sx={{ p: 3, textAlign: 'center', flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: 'text.primary',
                      fontFamily: 'var(--font-playfair)',
                    }}
                  >
                    {item.name}
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {item.price} ₴
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/catalog"
            endIcon={<ArrowForwardIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 0,
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'white',
              borderWidth: 2,
              textTransform: 'none',
              fontFamily: 'var(--font-inter)',
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            Відкрити більше
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
