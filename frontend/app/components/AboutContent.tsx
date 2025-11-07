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

// Реальні зображення квітів для moodboard
const moodboardImages = [
  {
    id: 1,
    image: 'http://localhost:1337/uploads/photo_2025_10_30_17_11_20_bfb8d632b3.jpg',
  },
  {
    id: 2,
    image: 'http://localhost:1337/uploads/photo_2025_10_29_02_23_02_6_c831615dbc.jpg',
  },
  {
    id: 3,
    image: 'http://localhost:1337/uploads/photo_2025_10_29_02_15_48_1188f1a6d4.jpg',
  },
  {
    id: 4,
    image: 'http://localhost:1337/uploads/photo_2025_02_06_12_13_47_b1593c3898.jpg',
  },
  {
    id: 5,
    image: 'http://localhost:1337/uploads/photo_2025_06_05_18_07_24_75b6d9ac03.jpg',
  },
  {
    id: 6,
    image: 'http://localhost:1337/uploads/photo_2023_05_19_10_23_10_1_61603e16f8.png',
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
            Про нас
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
                Ласкаво просимо до нашого квіткового магазину, розташованого біля парку на станції метро Дорогожичі! 
                Ми — команда ентузіастів, які обожнюють квіти та створюють неповторні композиції для ваших найважливіших моментів.
              </Typography>

              {/* Team Section */}
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
                  Наш дружній колектив
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  У нас працює дружній та професійний колектив флористів, які мають багаторічний досвід у створенні 
                  вишуканих букетів та композицій. Кожен член нашої команди — це справжній майстер своєї справи, 
                  який з любов'ю та увагою підходить до кожного замовлення. Ми завжди раді допомогти вам вибрати 
                  ідеальний букет для будь-якої нагоди — від романтичного побачення до урочистого свята.
                </Typography>
              </Box>

              {/* Location Section */}
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
                  Наше розташування
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  Наш магазин знаходиться в зручному місці біля парку на станції метро Дорогожичі, що робить нас 
                  легко доступними для мешканців та гостей міста. Ми пропонуємо свіжі квіти найвищої якості, 
                  які ми ретельно відбираємо щодня. Приходьте до нас за красивими букетами, які принесуть радість 
                  вам та вашим близьким!
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
                  component="img"
                  image="http://localhost:1337/uploads/photo_2025_10_30_17_11_20_bfb8d632b3.jpg"
                  alt="Квітковий магазин"
                  sx={{
                    height: { xs: 300, md: 400 },
                    objectFit: 'cover',
                  }}
                />
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 8, borderColor: 'grey.300' }} />

        {/* Gallery Section */}
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
            Наші роботи
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
            Ознайомтеся з нашими найкращими роботами — вишуканими букетами та композиціями, створеними нашими 
            майстрами-флористами. Кожна композиція унікальна та виготовлена з любов'ю та професійністю.
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
                    component="img"
                    image={item.image}
                    alt={`Квіткова композиція ${item.id}`}
                    sx={{
                      height: 150,
                      objectFit: 'cover',
                    }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

      </Container>
    </Box>
  );
}