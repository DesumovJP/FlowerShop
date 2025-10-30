'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
} from '@mui/material';

export default function SocialSection() {
  const socialImages = [
    'http://localhost:1337/uploads/photo_2025_10_30_17_16_55_11_ed91f3a05b.jpg',
    'http://localhost:1337/uploads/photo_2025_10_29_02_27_29_9e7341e7b9.jpg',
    'http://localhost:1337/uploads/photo_2025_10_30_17_16_55_7_279aab85ae.jpg',
  ];

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
            Залишайтесь на зв'язку: Слідкуйте за нашою квітковою подорожжю
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              mb: 2,
            }}
          >
            @flowershop_ua
          </Typography>
        </Box>

        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                fontFamily: 'var(--font-inter)',
                fontWeight: 400,
              }}
            >
              Приєднуйтесь до нашої квіткової спільноти та залишайтесь в курсі 
              останніх новин, красивих композицій та особливих пропозицій. 
              Слідкуйте за нами в соціальних мережах та діліться своїми 
              улюбленими моментами з квітами.
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2}>
              {socialImages.map((src, idx) => (
                <Grid size={{ xs: 4 }} key={idx}>
                  <Card
                    className="glass-hover"
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={src}
                      sx={{
                        height: 200,
                        width: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
