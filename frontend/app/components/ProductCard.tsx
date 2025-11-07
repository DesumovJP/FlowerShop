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
    borderRadius: 2,
    position: 'relative',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    // Glassmorphism для стандартних карток
    ...(isLarge
        ? {
            // Large картки також мають закруглені кути
            borderRadius: 2,
          }
        : {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 8px 32px rgba(46, 125, 50, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(255, 255, 255, 0.2)
            `,
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: `
                0 16px 48px rgba(46, 125, 50, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.8),
                inset 0 -1px 0 rgba(255, 255, 255, 0.3)
              `,
            },
          }),
    // Стиль для large: зелений фон + м'який зелений шедоу з гласморфізмом
    ...(isLarge && {
      background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(76, 175, 80, 0.9) 50%, rgba(165, 214, 167, 0.85) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: `
        0 20px 60px rgba(46, 125, 50, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
      `,
      '&:hover': {
        transform: 'translateY(-12px) scale(1.03)',
        boxShadow: `
          0 28px 80px rgba(46, 125, 50, 0.45),
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          inset 0 -1px 0 rgba(0, 0, 0, 0.15)
        `,
      },
    }),
  };

  const mediaSx = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isLarge ? '6rem' : '3rem',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px 16px 0 0',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isLarge 
        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.6) 0%, rgba(76, 175, 80, 0.5) 50%, rgba(165, 214, 167, 0.4) 100%)'
        : 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.05) 100%)',
      zIndex: 1,
      transition: 'opacity 0.4s ease',
      borderRadius: '16px 16px 0 0',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
      zIndex: 2,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.4s ease',
      borderRadius: '16px 16px 0 0',
    },
    '&:hover::after': {
      opacity: 1,
    },
    '& > *': {
      position: 'relative',
      zIndex: 3,
    },
    '& img': {
      transition: 'transform 0.5s ease-out',
      borderRadius: '16px 16px 0 0',
    },
  };

  return (
    <Card
      component={NextLink}
      href={productUrl}
      className="product-card-hover"
      sx={cardSx}
    >
      <CardMedia sx={mediaSx}>
        {product.image?.[0]?.url ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${product.image[0].url}`}
            alt={product.image[0].alternativeText || product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
          />
        ) : product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
          />
        ) : product.imageBase ? (
          <Image
            src={`${product.imageBase}.png`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
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
              borderRadius: '16px 16px 0 0',
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
              borderRadius: '16px 16px 0 0',
            }}
          >
            <Typography variant="h6">Немає фото</Typography>
          </Box>
        )}
        
        {/* Hover Overlay */}
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'grid', 
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            opacity: 0,
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 4,
            borderRadius: '16px 16px 0 0',
          }}
          className="hover-overlay"
        >
          <Box
            sx={{
              color: 'white',
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: isLarge ? { xs: '1.1rem', sm: '1.3rem' } : { xs: '0.9rem', sm: '1rem' },
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(10px)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '.product-card-hover:hover &': {
                transform: 'translateY(0)',
              },
            }}
          >
            Дивитися
          </Box>
        </Box>
      </CardMedia>
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: { xs: '95px', sm: '105px' },
          borderRadius: '0 0 16px 16px',
          background: isLarge
            ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.95) 0%, rgba(76, 175, 80, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: isLarge
              ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(46, 125, 50, 0.15), transparent)',
            borderRadius: '0 0 16px 16px',
          },
        }}
      >
        <Typography
          variant={isLarge ? 'h5' : 'subtitle1'}
          component="h3"
          sx={{
            fontWeight: isLarge ? 700 : 600,
            mb: { xs: 0.75, sm: 1 },
            fontFamily: 'var(--font-playfair)',
            color: isLarge ? '#FFFFFF' : 'text.primary',
            textShadow: isLarge 
              ? '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.08)',
            fontSize: isLarge 
              ? { xs: '1.15rem', sm: '1.3rem', md: '1.4rem' } 
              : { xs: '1.05rem', sm: '1.15rem', md: '1.2rem' },
            lineHeight: 1.3,
            letterSpacing: isLarge ? '0.008em' : '0.005em',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: isLarge ? '2.3em' : '2.2em',
            '.product-card-hover:hover &': {
              color: isLarge ? '#FFFFFF' : 'primary.main',
              textShadow: isLarge 
                ? '0 2px 14px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)' 
                : '0 2px 6px rgba(46, 125, 50, 0.15)',
            },
          }}
        >
          {product.name}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
            mt: 'auto',
          }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 700,
              color: isLarge ? '#FFFFFF' : 'primary.main',
              textShadow: isLarge 
                ? '0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)' 
                : 'none',
              fontFamily: 'var(--font-inter)',
              fontSize: isLarge 
                ? { xs: '1.3rem', sm: '1.45rem', md: '1.6rem' } 
                : { xs: '1.2rem', sm: '1.35rem', md: '1.4rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '.product-card-hover:hover &': {
                textShadow: isLarge 
                  ? '0 2px 14px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)' 
                  : '0 2px 8px rgba(46, 125, 50, 0.2)',
              },
            }}
          >
            {product.price}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: 500,
              color: isLarge ? 'rgba(255, 255, 255, 0.9)' : 'primary.main',
              opacity: 0.8,
              fontFamily: 'var(--font-inter)',
              fontSize: isLarge 
                ? { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' } 
                : { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
              lineHeight: 1.2,
              letterSpacing: '0.02em',
              textShadow: isLarge ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            ₴
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
