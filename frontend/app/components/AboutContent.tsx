'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  Divider,
} from '@mui/material';

// Mock data для moodboard зображень
const moodboardImages = [
  {
    id: 1,
    image: '🌸',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
  },
  {
    id: 2,
    image: '🌹',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 25%, #FFB3B3 50%, #FFD1DC 75%, #FFE4E1 100%)',
  },
  {
    id: 3,
    image: '🌺',
    gradient: 'linear-gradient(135deg, #DDA0DD 0%, #EE82EE 50%, #DA70D6 100%)',
  },
  {
    id: 4,
    image: '🌻',
    gradient: 'linear-gradient(135deg, #FFE4B5 0%, #FFEFD5 50%, #FFF8DC 100%)',
  },
  {
    id: 5,
    image: '🌷',
    gradient: 'linear-gradient(135deg, #F0E68C 0%, #FFFFE0 50%, #FFFACD 100%)',
  },
  {
    id: 6,
    image: '🌿',
    gradient: 'linear-gradient(135deg, #98FB98 0%, #90EE90 50%, #8FBC8F 100%)',
  },
];

export default function AboutContent() {
  return (
    <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="xl">
        {/* About Project Section */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 4,
              fontFamily: 'var(--font-playfair)',
            }}
          >
            Про проєкт
          </Typography>

          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.6,
                  mb: 4,
                  fontFamily: 'var(--font-inter)',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                Phoenix — студія квітів, де краса природи перетворюється на витончене флористичне мистецтво, 
                що виражає любов, радість і свято через вишукані композиції.
              </Typography>

              {/* Task Section */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    mb: 2,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Завдання
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Створити зручний і сучасний сайт для квіткової студії з простим доступом до каталогу 
                  букетів і композицій. Спростити оформлення замовлення, додавши безпечні методи оплати 
                  та зручні варіанти доставки — для швидкого й приємного онлайн‑досвіду.
                </Typography>
              </Box>

              {/* Solution Section */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    mb: 2,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Рішення
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Дизайн поєднує пастельні та теплі відтінки, створюючи приємну атмосферу. Контрастні 
                  темні фото додають глибини, а велика вишукана типографіка підвищує читабельність і 
                  надає елегантності. Мінімалістичний стиль підкреслює сучасність і вишуканість.
                </Typography>
              </Box>
            </Grid>

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
                      background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.2\'/%3E%3Ccircle cx=\'80\' cy=\'40\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.3\'/%3E%3Ccircle cx=\'40\' cy=\'80\' r=\'1.5\' fill=\'%23ffffff\' opacity=\'0.1\'/%3E%3C/svg%3E")',
                    }
                  }}
                >
                  🌸
                </CardMedia>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 8, borderColor: 'grey.300' }} />

        {/* Moodboard Section */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 4,
              fontFamily: 'var(--font-playfair)',
            }}
          >
            Мудборд
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              lineHeight: 1.6,
              mb: 6,
              fontFamily: 'var(--font-inter)',
              maxWidth: '800px',
            }}
          >
            Перед стартом дизайну ми підготували мудборд, щоб зафіксувати настрій і напрям. У ньому — 
            натхнення природою, м'які пастельні кольори, виразні контрасти, простота, елегантність і 
            витончені деталі. Цей візуальний орієнтир задає цілісність і стиль усього проєкту.
          </Typography>

          <Grid container spacing={3}>
            {moodboardImages.map((item) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={item.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 150,
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
        </Box>

        <Divider sx={{ my: 8, borderColor: 'grey.300' }} />

        {/* Typography And Colors Section */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 6,
              fontFamily: 'var(--font-playfair)',
            }}
          >
            Типографіка та кольори
          </Typography>

          <Grid container spacing={6}>
            {/* Typography */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Типографіка
              </Typography>

              {/* Serif Font */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    mb: 2,
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.1rem',
                  }}
                >
                  Carme
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'text.primary',
                    fontFamily: 'var(--font-playfair)',
                    letterSpacing: '0.1em',
                  }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </Typography>
              </Box>

              {/* Sans-serif Font */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    mb: 2,
                    fontFamily: 'var(--font-inter)',
                    fontSize: '1.1rem',
                  }}
                >
                  KoPub Batang
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'text.primary',
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.1em',
                  }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </Typography>
              </Box>
            </Grid>

            {/* Colors */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 3,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                Кольори
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Color 1 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#999999',
                      borderRadius: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 500,
                    }}
                  >
                    #999999
                  </Typography>
                </Box>

                {/* Color 2 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#DBCCBA',
                      borderRadius: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 500,
                    }}
                  >
                    #DBCCBA
                  </Typography>
                </Box>

                {/* Color 3 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: '#2C2C2C',
                      borderRadius: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.primary',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 500,
                    }}
                  >
                    #2C2C2C
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}