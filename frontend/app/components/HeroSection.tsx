'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardMedia,
  Grid,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 700,
                color: 'text.primary',
                mb: 3,
                lineHeight: 1.1,
                fontFamily: 'var(--font-playfair)',
              }}
            >
              Відкрийте чарівну колекцію нашого квіткового магазину
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 4,
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                fontFamily: 'var(--font-inter)',
                fontWeight: 400,
              }}
            >
              Заглибтесь у світ красивих квітів та відкрийте для себе 
              унікальну колекцію букетів, створених з любов'ю та майстерністю.
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
              Наш каталог
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3,
                height: { xs: 'auto', md: '500px' },
              }}
            >
              {/* Великий букет зліва */}
              <Card
                className="glass-hover"
                sx={{
                  gridRow: { sm: 'span 2' },
                  height: { xs: '300px', sm: '100%' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="img"
                  image={'http://localhost:1337/uploads/photo_2025_10_29_02_27_29_9e7341e7b9.jpg'}
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Card>
              
              {/* Менший букет справа зверху */}
              <Card
                className="glass-hover"
                sx={{
                  height: { xs: '200px', sm: '240px' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="img"
                  image={'http://localhost:1337/uploads/photo_2025_10_28_21_55_50_b7c287e8ee.jpg'}
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Card>
              
              {/* Менший букет справа знизу */}
              <Card
                className="glass-hover"
                sx={{
                  height: { xs: '200px', sm: '240px' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="img"
                  image={'http://localhost:1337/uploads/photo_2025_10_30_17_16_55_3629a1f0f2.jpg'}
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
