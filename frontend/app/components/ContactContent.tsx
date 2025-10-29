'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
} from '@mui/icons-material';

export default function ContactContent() {
  return (
    <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default', minHeight: '80vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 3,
              fontFamily: 'var(--font-playfair)',
            }}
          >
            Контакти
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Зв'яжіться з нами щодо питань про квіти, доставку чи індивідуальні замовлення
          </Typography>
        </Box>

        <Grid container spacing={1} alignItems="stretch">
          {/* Contact Information - Left (40%) */}
          <Grid size={{ xs: 12, md: 4.8 }}>
            <Card
              sx={{
                p: 4,
                borderRadius: { xs: 3, md: '12px 0 0 12px' },
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backgroundColor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 4,
                    fontFamily: 'var(--font-playfair)',
                    textAlign: 'center',
                  }}
                >
                  Зв'яжіться з нами
                </Typography>

                {/* Contact Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Зв'яжіться з нами */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <PhoneIcon />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          mb: 0.5,
                        }}
                      >
                        Зв'яжіться з нами
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 600,
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        +380501627774 (Ростислав)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Електронна пошта */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <EmailIcon />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          mb: 0.5,
                        }}
                      >
                        Email
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 600,
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        phoenixUA@gmail.com
                      </Typography>
                    </Box>
                  </Box>

                  {/* Address */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <LocationOnIcon />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          mb: 0.5,
                        }}
                      >
                        Адреса
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 600,
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        м. Київ, вул. Ризька, 1
                      </Typography>
                    </Box>
                  </Box>

                  {/* Графік роботи */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <AccessTimeIcon />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'var(--font-inter)',
                          mb: 0.5,
                        }}
                      >
                        Графік роботи
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.primary',
                          fontWeight: 600,
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        08:00 – 20:00
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Contact Form */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 3,
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    Напишіть нам повідомлення
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Ваше ім'я"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Ваш email"
                      variant="outlined"
                      type="email"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Повідомлення"
                      variant="outlined"
                      multiline
                      rows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
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
                      Надіслати
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Google Maps - Right (60%) */}
          <Grid size={{ xs: 12, md: 7.2 }}>
            <Box
              sx={{
                borderRadius: { xs: 3, md: '0 12px 12px 0' },
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                height: { xs: 400, md: '100%' },
                backgroundColor: 'background.paper',
                position: 'relative',
                '& iframe': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100% !important',
                  height: '100% !important',
                  border: 'none',
                  display: 'block',
                }
              }}
            >
              <iframe
                title="Ми на карті"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2539.45293241841!2d30.441426727281776!3d50.46991117334766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4cd007e936c3f%3A0xd2be827915aecc2a!2z0JrQstGW0YLQuCBQSE9FTklYINCk0LXQvdGW0LrRgS7RjtCw!5e0!3m2!1suk!2sua!4v1760015272611!5m2!1suk!2sua"
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
