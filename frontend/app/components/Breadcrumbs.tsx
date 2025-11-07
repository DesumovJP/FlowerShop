'use client';

import React from 'react';
import { Box, Typography, Breadcrumbs as MuiBreadcrumbs } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'default' | 'minimal';
}

export default function Breadcrumbs({ items, variant = 'default' }: BreadcrumbsProps) {
  return (
    <Box
      sx={{
        mb: { xs: 3, md: 4 },
        ...(variant === 'default' ? {
          py: 1.5,
          px: 2,
        } : {
          py: 0,
          px: 0,
        }),
      }}
    >
      <MuiBreadcrumbs
        separator={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
              opacity: 0.6,
              mx: 0.5,
            }}
          >
            <NavigateNextIcon fontSize="small" sx={{ fontSize: '1rem' }} />
          </Box>
        }
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
            alignItems: 'center',
          },
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHome = item.label === 'Головна' || item.href === '/';

          if (isLast || item.isActive) {
            // Останній елемент або активний - з бейджем
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  sx={{
                    color: 'primary.main',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: 600,
                    maxWidth: { xs: '150px', sm: '300px', md: 'none' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          // Звичайний посилання
          return (
            <Link
              key={index}
              href={item.href || '#'}
              style={{
                textDecoration: 'none',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {isHome && <HomeIcon sx={{ fontSize: '1rem' }} />}
                <span>{item.label}</span>
              </Box>
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}

