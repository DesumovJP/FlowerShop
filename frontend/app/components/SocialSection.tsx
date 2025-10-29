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
    {
      id: 1,
      image: '🌸',
      gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
    },
    {
      id: 2,
      image: '🌺',
      gradient: 'linear-gradient(135deg, #DDA0DD 0%, #EE82EE 50%, #DA70D6 100%)',
    },
    {
      id: 3,
      image: '🌻',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFFF00 50%, #FFF8DC 100%)',
    },
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
              {socialImages.map((item) => (
                <Grid size={{ xs: 4 }} key={item.id}>
                  <Card
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
                      component="div"
                      sx={{
                        height: 200,
                        background: item.gradient,
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
                      {item.image}
                    </CardMedia>
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
