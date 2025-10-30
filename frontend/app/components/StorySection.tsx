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
                  fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 3,
                  fontFamily: 'var(--font-playfair)',
                }}
              >
                Ароматна історія: Плетемо спогади з квітами
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
