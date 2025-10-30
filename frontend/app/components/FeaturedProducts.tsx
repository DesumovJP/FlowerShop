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
  description?: string;
  cardType?: 'standart' | 'large';
  color?: string;
  image: GqlImage[];
};

async function fetchBouquets(): Promise<GqlProduct[]> {
  try {
    const params = new URLSearchParams({ page: '1', pageSize: '3', productType: 'bouquet' });
    const response = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (e) {
    console.error('Failed to fetch bouquets:', e);
    return [];
  }
}

export default function FeaturedProducts() {
  const [bouquets, setBouquets] = useState<GqlProduct[]>([]);

  useEffect(() => {
    fetchBouquets().then(setBouquets).catch(() => setBouquets([]));
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
            Розкриваємо нашу колекцію популярних букетів
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              mb: 4,
            }}
          >
            Відкрийте для себе вражаючу колекцію популярних квітів, 
            які ми ретельно відібрали для вас.
          </Typography>
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
            Переглянути каталог
          </Button>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {bouquets.slice(0, 3).map((p) => (
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
      </Container>
    </Box>
  );
}
