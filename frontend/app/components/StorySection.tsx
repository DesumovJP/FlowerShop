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

export default function StorySection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              className="glass-hover"
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <CardMedia
                component="img"
                image={'http://localhost:1337/uploads/photo_2025_10_30_17_16_55_10_df7ce75f95.jpg'}
                sx={{
                  height: { xs: 300, md: 400 },
                  width: '100%',
                  objectFit: 'cover'
                }}
              />
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ pl: { md: 4 } }}>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: '1.875rem', md: '2.375rem', lg: '2.75rem' },
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: { xs: 2.5, md: 3.5 },
                  fontFamily: 'var(--font-playfair)',
                  lineHeight: { xs: 1.25, md: 1.2 },
                  letterSpacing: { xs: '-0.01em', md: '-0.015em' },
                }}
              >
                Ароматна історія: Плетемо спогади з квітами
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  lineHeight: { xs: 1.7, md: 1.75 },
                  fontSize: { xs: '1rem', md: '1.15rem', lg: '1.2rem' },
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 400,
                  mb: { xs: 4, md: 5 },
                  letterSpacing: '0.01em',
                }}
              >
                Квітковий магазин FlowerShop - це наша пристрасть до природних квітів 
                та ретельна увага наших досвідчених флористів. Ми створюємо унікальні 
                композиції, які розповідають історії та створюють незабутні моменти.
              </Typography>
              
              <Button
                variant="outlined"
                size="large"
                component={Link}
                href="/about"
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
                Читати більше
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
