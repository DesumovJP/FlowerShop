'use client';

import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import NextLink from 'next/link';
import Image from 'next/image';

interface Product {
  id?: string;
  documentId?: string;
  name: string;
  price: number;
  image?: string; // emoji placeholder
  imageBase?: string; // base path without extension under /public
  imageUrl?: string; // absolute URL from Strapi
  images?: Array<{
    documentId: string;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  }>; // multiple images from Strapi
  gradient?: string;
  cardType?: 'standard' | 'large';
  slug: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isLarge = product.cardType === 'large';
  
  // Логування для дебагу
  const productUrl = `/product/${product.slug || product.documentId || product.id}`;
  console.log(`🔗 ProductCard for "${product.name}":`, {
    slug: product.slug,
    documentId: product.documentId,
    id: product.id,
    finalUrl: productUrl
  });
  
  // На мобільному Large картки відображаються як звичайні, але з особливим фоном
  const cardSx = {
    // Large картки займають 2 колонки, medium - 1 колонку
    aspectRatio: '0.75', // All cards 4:3
    width: '100%',
    display: 'grid',
    gridTemplateRows: '1fr auto',
    overflow: 'hidden',
    cursor: 'pointer',
    borderRadius: 0,
    // Minimal shadow for standard cards so large stands out
    ...(isLarge
      ? {}
      : {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          backgroundColor: 'transparent',
        }),
    // Стиль для large: зелений фон + м'який зелений шедоу
    ...(isLarge && {
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #A5D6A7 100%)',
      boxShadow: '0 18px 44px rgba(46,125,50,0.28)',
    }),
  };

  const mediaSx = {
    width: '100%',
    height: '100%',
    // background moved to global class
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isLarge ? '6rem' : '3rem',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isLarge 
        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.8) 0%, rgba(76, 175, 80, 0.8) 50%, rgba(165, 214, 167, 0.8) 100%)'
        : 'transparent',
      zIndex: 1,
    },
    '& > *': {
      position: 'relative',
      zIndex: 2,
    },
  };

  return (
    <Card
      component={NextLink}
      href={productUrl}
      className="product-card-hover"
      sx={cardSx}
    >
      <CardMedia sx={{ ...mediaSx, borderRadius: 0 }} className="glass-media glass-card">
        {product.image?.[0]?.url ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${product.image[0].url}`}
            alt={product.image[0].alternativeText || product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : product.imageBase ? (
          <Image
            src={`${product.imageBase}.png`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        ) : product.image ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isLarge ? '6rem' : '3rem',
            }}
          >
            {product.image}
          </Box>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.grey[500],
            }}
          >
            <Typography variant="h6">Немає фото</Typography>
          </Box>
        )}
        
        {/* Hover Overlay */}
        <Box className="hover-overlay" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <span className={`hover-text ${isLarge ? 'hover-text-large' : ''}`}>
            Дивитися
          </span>
        </Box>
      </CardMedia>
      <CardContent
        sx={{
          p: '5%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          borderRadius: 0,
        }}
        className="glass-card"
      >
        <Typography
          variant={isLarge ? 'h5' : 'subtitle1'}
          component="h3"
          sx={{
            fontWeight: 600,
            mb: 0.25,
            fontFamily: 'var(--font-playfair)',
            color: isLarge ? '#FFFFFF' : 'text.primary',
            textShadow: isLarge ? '0 2px 6px rgba(0,0,0,0.35)' : 'none',
            fontSize: isLarge ? { xs: '1.2rem', sm: '1.4rem' } : { xs: '0.95rem', sm: '1rem' },
          }}
        >
          {product.name}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isLarge ? '#FFFFFF' : 'primary.main',
            textShadow: isLarge ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: isLarge ? { xs: '1.3rem', sm: '1.5rem' } : { xs: '1.1rem', sm: '1.2rem' },
          }}
        >
          {product.price} ₴
        </Typography>
      </CardContent>
    </Card>
  );
}
