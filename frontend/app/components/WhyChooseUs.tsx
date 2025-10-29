'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';

const features = [
  {
    icon: '🚚',
    title: 'Швидка доставка',
    description: 'Доставляємо квіти по всьому місту протягом 2 годин',
  },
  {
    icon: '🌸',
    title: 'Свіжі квіти',
    description: 'Щодня отримуємо свіжі квіти з найкращих плантацій',
  },
  {
    icon: '💝',
    title: 'Індивідуальний підхід',
    description: 'Створюємо унікальні букети згідно з вашими побажаннями',
  },
  {
    icon: '🏆',
    title: 'Досвід роботи',
    description: 'Більше 10 років створюємо красиві композиції',
  },
  {
    icon: '💰',
    title: 'Доступні ціни',
    description: 'Пропонуємо якісні квіти за розумними цінами',
  },
  {
    icon: '⭐',
    title: 'Високий рейтинг',
    description: 'Наші клієнти залишають тільки позитивні відгуки',
  },
];

export default function WhyChooseUs() {
  return (
    <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: 'grey.50' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
            }}
          >
            Чому обирають нас
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Ми прагнемо надати найкращий сервіс та якість для наших клієнтів
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  backgroundColor: 'white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      backgroundColor: 'primary.light',
                      fontSize: '2rem',
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Statistics Section */}
        <Box
          sx={{
            mt: 8,
            p: 4,
            backgroundColor: 'primary.main',
            borderRadius: 3,
            color: 'white',
          }}
        >
          <Grid container spacing={4} sx={{ textAlign: 'center' }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: 'white',
                }}
              >
                1000+
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Задоволених клієнтів
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: 'white',
                }}
              >
                5000+
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Доставлених букетів
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: 'white',
                }}
              >
                10+
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Років досвіду
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: 'white',
                }}
              >
                4.9
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Середній рейтинг
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
