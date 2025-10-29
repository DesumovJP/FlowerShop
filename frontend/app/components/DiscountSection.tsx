'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function DiscountSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: { xs: 300, md: 400 },
                  background: 'linear-gradient(135deg, #FFE4B5 0%, #FFEFD5 50%, #FFF8DC 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '6rem',
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
                🌻
              </CardMedia>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ pl: { md: 4 } }}>
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
                20% знижки на вашу першу покупку в нашому магазині!
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 400,
                  mb: 4,
                }}
              >
                Спеціальна пропозиція для нових клієнтів! Отримайте 20% знижки 
                на ваше перше замовлення та відкрийте для себе світ красивих квітів 
                за вигідними цінами.
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
                  backgroundColor: 'background.default',
                  borderWidth: 2,
                  textTransform: 'none',
                  fontFamily: 'var(--font-inter)',
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'primary.main',
                    color: 'background.default',
                  },
                }}
              >
                Замовити
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
