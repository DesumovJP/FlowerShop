'use client';

import React from 'react';
import { IconButton, Box } from '@mui/material';

// Instagram SVG Icon
const InstagramIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={color} strokeWidth="2" fill="none"/>
    <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke={color} strokeWidth="2" fill="none"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Facebook SVG Icon
const FacebookIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

// Telegram SVG Icon
const TelegramIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.198 3.148L2.802 10.2c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.843.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

// TikTok SVG Icon
const TikTokIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

interface SocialIconsProps {
  size?: number;
  color?: string;
}

export default function SocialIcons({ size = 24, color = 'currentColor' }: SocialIconsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton
        size="small"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'text.primary',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'text.primary',
            color: 'background.default',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <InstagramIcon size={size} color={color} />
      </IconButton>
      
      <IconButton
        size="small"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'text.primary',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'text.primary',
            color: 'background.default',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <FacebookIcon size={size} color={color} />
      </IconButton>
      
      <IconButton
        size="small"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'text.primary',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'text.primary',
            color: 'background.default',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <TelegramIcon size={size} color={color} />
      </IconButton>
      
      <IconButton
        size="small"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'text.primary',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'text.primary',
            color: 'background.default',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <TikTokIcon size={size} color={color} />
      </IconButton>
    </Box>
  );
}
