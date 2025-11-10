'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

export default function FlowerSpinner({ size = 48 }: { size?: number }) {
  const fontSize = Math.max(14, Math.floor(size * 0.6));
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fs-rotate 1.2s linear infinite',
        '@keyframes fs-rotate': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
      aria-label="loading"
    >
      <Typography component="span" sx={{ fontSize }}>{'🌸'}</Typography>
    </Box>
  );
}



