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
                sx={{
                  gridRow: { sm: 'span 2' },
                  height: { xs: '300px', sm: '100%' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
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
                      background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3Ccircle cx=\'80\' cy=\'40\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.2\'/%3E%3Ccircle cx=\'40\' cy=\'80\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.4\'/%3E%3C/svg%3E")',
                    }
                  }}
                >
                  🌸
                </CardMedia>
              </Card>
              
              {/* Менший букет справа зверху */}
              <Card
                sx={{
                  height: { xs: '200px', sm: '240px' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #DDA0DD 0%, #EE82EE 50%, #DA70D6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.2\'/%3E%3Ccircle cx=\'70\' cy=\'20\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3C/svg%3E")',
                    }
                  }}
                >
                  🌺
                </CardMedia>
              </Card>
              
              {/* Менший букет справа знизу */}
              <Card
                sx={{
                  height: { xs: '200px', sm: '240px' },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #98FB98 0%, #90EE90 50%, #8FBC8F 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'25\' cy=\'25\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3Ccircle cx=\'75\' cy=\'75\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.2\'/%3E%3C/svg%3E")',
                    }
                  }}
                >
                  🌿
                </CardMedia>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
