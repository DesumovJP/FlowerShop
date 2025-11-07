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
      setError(null);
      const response = await fetch(`/api/shift-reports-graphql?month=${currentMonth + 1}&year=${currentYear}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch shift reports:', response.status, errorData);
        setError(`Помилка при завантаженні звітів: ${errorData.error || response.status}`);
        setReports([]);
        return;
      }
      
      const data = await response.json();
      console.log('Calendar shift reports data:', data);
      
      // GraphQL API повертає { data: [...] }
      const reports = data.data || [];
      
      // Перетворюємо дані для сумісності з інтерфейсом
      const transformedReports = reports.map((report: any) => ({
        id: report.id || report.documentId,
        documentId: report.documentId,
        date: report.date,
        worker: report.worker || { id: 0, name: 'Невідомо', slug: '' },
        itemsSnapshot: report.itemsSnapshot || {},
        shiftComment: report.shiftComment || '',
        cash: report.cash || 0,
        slug: report.slug || '',
        createdAt: report.createdAt || '',
        updatedAt: report.updatedAt || '',
      }));
      
      setReports(transformedReports);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching shift reports:', error);
      setError(`Помилка при завантаженні звітів: ${error?.message || 'Невідома помилка'}`);
      setReports([]);
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
        <Grid key={`empty-${i}`} size={{ xs: 12/7, sm: 12/7, md: 12/7 }}>
          <Box sx={{ height: { xs: 80, sm: 100, md: 120 } }} />
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
        <Grid key={day} size={{ xs: 12/7, sm: 12/7, md: 12/7 }}>
          <Card
            sx={{
              height: { xs: 80, sm: 100, md: 120 },
              minHeight: { xs: 80, sm: 100, md: 120 },
              cursor: 'pointer',
              position: 'relative',
              border: today 
                ? { xs: '1.5px solid #1976d2', sm: '2px solid #1976d2' }
                : hasReport 
                  ? { xs: '1px solid rgba(46,125,50,0.2)', sm: '1px solid rgba(46,125,50,0.2)' }
                  : { xs: '1px solid #e0e0e0', sm: '1px solid #e0e0e0' },
              background: hasReport 
                ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.30) 0%, rgba(76, 175, 80, 0.22) 40%, rgba(129, 199, 132, 0.18) 100%)' 
                : 'rgba(255,255,255,0.9)',
              backdropFilter: hasReport ? 'blur(14px)' : 'none',
              WebkitBackdropFilter: hasReport ? 'blur(14px)' : 'none',
              boxShadow: hasReport 
                ? { xs: '0 2px 8px rgba(46, 125, 50, 0.15), inset 0 1px 0 rgba(255,255,255,0.25)', sm: '0 4px 14px rgba(46, 125, 50, 0.18), inset 0 1px 0 rgba(255,255,255,0.25)' }
                : 'none',
              transition: 'all 0.2s ease',
              overflow: 'hidden',
              '&:hover': {
                transform: { xs: 'translateY(-2px)', sm: 'translateY(-3px)' },
                boxShadow: hasReport 
                  ? { xs: '0 4px 12px rgba(46, 125, 50, 0.25), inset 0 1px 0 rgba(255,255,255,0.3)', sm: '0 6px 18px rgba(46, 125, 50, 0.25), inset 0 1px 0 rgba(255,255,255,0.3)' }
                  : { xs: '0 2px 8px rgba(0,0,0,0.1)', sm: '0 4px 12px rgba(0,0,0,0.12)' },
              },
            }}
            onClick={() => handleDayClick(day)}
          >
            <CardContent sx={{ 
              p: { xs: 0.5, sm: 0.75, md: 1 }, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              '&:last-child': { pb: { xs: 0.5, sm: 0.75, md: 1 } }
            }}>
              <Box sx={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                mb: { xs: 0.4, sm: 0.5, md: 0.75 }, 
                minHeight: { xs: 16, sm: 18, md: 20 } 
              }}>
                {/* Date left */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: today ? 700 : 600,
                    color: today ? 'primary.main' : 'text.primary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                    fontFamily: 'var(--font-inter)',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
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
                      fontWeight: 600,
                      color: 'text.primary',
                      maxWidth: { xs: '75%', sm: '80%', md: '85%' },
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      opacity: 0.9,
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
                  gap: { xs: 0.2, sm: 0.25, md: 0.35 },
                  minHeight: 0,
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 500,
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.01em',
                      lineHeight: { xs: 1.2, sm: 1.3 },
                      opacity: 0.8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Каса:
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: 'success.main', 
                      fontWeight: 700, 
                      lineHeight: 1.1, 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {report.cash}₴
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 500,
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      fontFamily: 'var(--font-inter)',
                      letterSpacing: '0.01em',
                      lineHeight: { xs: 1.2, sm: 1.3 },
                      opacity: 0.8,
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}
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
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 0,
                }}>
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
                      minHeight: { xs: 40, sm: 50, md: 60 },
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      borderRadius: 1,
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'rgba(25,118,210,0.06)',
                        transform: 'scale(1.05)',
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: { xs: 18, sm: 22, md: 28 } }} />
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: { xs: 2, sm: 2.5, md: 3 },
        px: { xs: 0.5, sm: 0 },
      }}>
        <IconButton 
          onClick={handlePreviousMonth}
          sx={{
            padding: { xs: 0.75, sm: 1 },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        
        <Typography 
          variant="h5" 
          sx={{ 
            fontFamily: 'var(--font-playfair)', 
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.5rem', md: '1.75rem' },
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            color: 'text.primary',
            textAlign: 'center',
            flex: 1,
            px: { xs: 1, sm: 0 },
          }}
        >
          {monthNames[currentMonth]} {currentYear}
        </Typography>
        
        <IconButton 
          onClick={handleNextMonth}
          sx={{
            padding: { xs: 0.75, sm: 1 },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Day names */}
      <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: { xs: 0.75, sm: 1 } }}>
        {dayNames.map((dayName) => (
          <Grid key={dayName} size={{ xs: 12/7, sm: 12/7, md: 12/7 }}>
            <Box sx={{ textAlign: 'center', py: { xs: 0.5, sm: 0.75, md: 1 } }}>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  fontFamily: 'var(--font-inter)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                  textTransform: 'uppercase',
                }}
              >
                {dayName}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid container spacing={{ xs: 0.5, sm: 1 }}>
        {renderCalendarDays()}
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: { xs: 2, sm: 3 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: { xs: 14, sm: 16 },
              height: { xs: 14, sm: 16 },
              borderRadius: 1,
              backgroundColor: 'success.main',
            }}
          />
          <Typography 
            variant="caption"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: 'text.secondary',
            }}
          >
            Зміна створена
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: { xs: 14, sm: 16 },
              height: { xs: 14, sm: 16 },
              borderRadius: 1,
              border: '2px solid #1976d2',
            }}
          />
          <Typography 
            variant="caption"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: 'text.secondary',
            }}
          >
            Сьогодні
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }} color="action" />
          <Typography 
            variant="caption"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: 'text.secondary',
            }}
          >
            Створити зміну
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}