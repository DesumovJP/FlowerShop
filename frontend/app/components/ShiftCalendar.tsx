'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface Worker {
  id: number;
  name: string;
  role: string;
  phone?: string;
  slug: string;
}

interface Product {
  name: string;
  quantity: number;
  price?: number;
}

interface ShiftReport {
  id: number;
  documentId: string;
  date: string;
  worker: Worker;
  itemsSnapshot: any; // JSON поле з масивом товарів
  shiftComment: string;
  cash: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftCalendarProps {
  onDayClick: (date: string, report?: ShiftReport) => void;
  onAddShift: (date: string) => void;
  refreshTrigger: number;
}

export default function ShiftCalendar({ onDayClick, onAddShift, refreshTrigger }: ShiftCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Завантаження звітів про зміни
  useEffect(() => {
    fetchReports();
  }, [refreshTrigger, currentMonth, currentYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shift-reports-graphql?month=${currentMonth + 1}&year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Calendar shift reports data:', data);
        // GraphQL API повертає { data: [...] }
        setReports(data.data || []);
        setError(null);
      } else {
        setError('Помилка при завантаженні звітів');
      }
    } catch (error) {
      console.error('Error fetching shift reports:', error);
      setError('Помилка при завантаженні звітів');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7, then adjust for Monday start
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getReportForDate = (date: string) => {
    return reports.find(report => report.date === date);
  };

  const formatDate = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const date = formatDate(day);
    const report = getReportForDate(date);
    // Відкриваємо модалку: якщо є звіт — передаємо його, якщо ні — створення
    onDayClick(date, report);
  };

  const handleAddShift = (day: number) => {
    const date = formatDate(day);
    onAddShift(date);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <Grid key={`empty-${i}`} size={{ xs: 12/7 }}>
          <Box sx={{ height: 120 }} />
        </Grid>
      );
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(day);
      const report = getReportForDate(date);
      const today = isToday(day);
      const hasReport = !!report;

      days.push(
        <Grid key={day} size={{ xs: 12/7 }}>
          <Card
            sx={{
              height: 100, // compact fixed card height
              cursor: 'pointer',
              position: 'relative',
              border: today 
                ? '2px solid #1976d2' 
                : hasReport 
                  ? '1px solid rgba(46,125,50,0.2)' 
                  : '1px solid #e0e0e0',
              background: hasReport 
                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.30) 0%, rgba(76, 175, 80, 0.22) 40%, rgba(129, 199, 132, 0.18) 100%)' 
                : 'rgba(255,255,255,0.9)',
              backdropFilter: hasReport ? 'blur(14px)' : 'none',
              WebkitBackdropFilter: hasReport ? 'blur(14px)' : 'none',
              boxShadow: hasReport 
                ? '0 4px 14px rgba(46, 125, 50, 0.18), inset 0 1px 0 rgba(255,255,255,0.25)'
                : 'none',
              transition: 'all 0.2s ease',
              overflow: 'hidden',
            }}
            onClick={() => handleDayClick(day)}
          >
            <CardContent sx={{ p: 0.75, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mb: 0.5, minHeight: 18 }}>
                {/* Date left */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: today ? 700 : 600,
                    color: today ? 'primary.main' : 'text.primary',
                  }}
                >
                  {day}
                </Typography>
                {/* Worker name centered when report exists */}
                {report && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 700,
                      color: 'text.primary',
                      maxWidth: '80%',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {report.worker?.name || 'Без робітника'}
                  </Typography>
                )}
              </Box>

              {report ? (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 0.25 
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
                    Каса:
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: 'success.main', fontWeight: 800, lineHeight: 1.1, fontSize: '0.95rem' }}
                  >
                    {report.cash}₴
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
                    Продажів: {(() => {
                      if (!report.itemsSnapshot) return 0;
                      // Якщо itemsSnapshot - це об'єкт з ordersCount
                      if (typeof report.itemsSnapshot === 'object' && !Array.isArray(report.itemsSnapshot) && (report.itemsSnapshot as any).ordersCount !== undefined) {
                        return (report.itemsSnapshot as any).ordersCount;
                      }
                      // Якщо itemsSnapshot - це масив (старий формат)
                      return Array.isArray(report.itemsSnapshot) ? report.itemsSnapshot.length : 0;
                    })()}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddShift(day);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: 'text.secondary',
                      transition: 'color 0.2s ease, background-color 0.2s ease',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'rgba(25,118,210,0.04)'
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with month navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handlePreviousMonth}>
          <ChevronLeftIcon />
        </IconButton>
        
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          {monthNames[currentMonth]} {currentYear}
        </Typography>
        
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Day names */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {dayNames.map((dayName) => (
          <Grid key={dayName} size={{ xs: 12/7 }}>
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                {dayName}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid container spacing={1}>
        {renderCalendarDays()}
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              backgroundColor: 'success.main',
            }}
          />
          <Typography variant="caption">Зміна створена</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 1,
              border: '2px solid #1976d2',
            }}
          />
          <Typography variant="caption">Сьогодні</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon fontSize="small" color="action" />
          <Typography variant="caption">Створити зміну</Typography>
        </Box>
      </Box>
    </Box>
  );
}