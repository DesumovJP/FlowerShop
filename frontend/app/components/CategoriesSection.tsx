'use client';

import React, { useEffect, useState } from 'react';
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
import ProductCard from './ProductCard';

type GqlImage = { 
  documentId: string;
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
};
type GqlProduct = {
  documentId: string;
  name: string;
  slug: string;
  price: number;
  productType: 'bouquet' | 'singleflower';
  image: GqlImage[];
};

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

async function fetchSingleFlowers(): Promise<GqlProduct[]> {
  try {
    const params = new URLSearchParams({ page: '1', pageSize: '6', productType: 'singleflower' });
    const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (e) {
    console.error('Failed to fetch singleflowers:', e);
    return [];
  }
}

export default function CategoriesSection() {
  const [singleFlowers, setSingleFlowers] = useState<GqlProduct[]>([]);

  useEffect(() => {
    fetchSingleFlowers().then(setSingleFlowers).catch(() => setSingleFlowers([]));
  }, []);

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

        {/* Прибрано картки-заглушки */}

        {/* 6 карток singleflower з каталогу */}
        <Box sx={{ mt: 6 }}>
          <Grid container spacing={3}>
            {singleFlowers.slice(0, 6).map((p) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.documentId || p.slug}>
                <ProductCard product={{
                  name: p.name,
                  price: p.price,
                  imageUrl: p.image?.[0]?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${p.image[0].url}` : undefined,
                  slug: p.slug,
                  cardType: 'standart'
                }} />
              </Grid>
            ))}
          </Grid>
        </Box>

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
