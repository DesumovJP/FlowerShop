'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { uk } from 'date-fns/locale';

interface InventoryRecord {
  id: number;
  date: string;
  bouquetsCount: number;
  singleFlowersCount: number;
  varietiesCount: number;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

interface InventoryHistoryProps {
  onClose?: () => void;
}

export default function InventoryHistory({ onClose }: InventoryHistoryProps) {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [filterType, setFilterType] = useState<'month' | 'range'>('month');

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/inventory-records?';
      const params = new URLSearchParams();
      
      if (filterType === 'month') {
        params.append('month', month.toString());
        params.append('year', year.toString());
      } else if (filterType === 'range' && dateFrom && dateTo) {
        params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
        params.append('dateTo', dateTo.toISOString().split('T')[0]);
      }
      
      url += params.toString();
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setRecords(data.data || []);
      } else {
        setError(data.error || 'Помилка завантаження записів');
      }
    } catch (err) {
      setError('Помилка завантаження записів');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [month, year, dateFrom, dateTo, filterType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={uk}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Історія залишків на складі
          </Typography>
          {onClose && (
            <Button onClick={onClose} variant="outlined">
              Закрити
            </Button>
          )}
        </Box>

        {/* Фільтри */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Фільтри
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Тип фільтру</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'month' | 'range')}
                  >
                    <MenuItem value="month">За місяцем</MenuItem>
                    <MenuItem value="range">За діапазоном дат</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {filterType === 'month' ? (
                <>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Місяць</InputLabel>
                      <Select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                      >
                        {monthNames.map((name, index) => (
                          <MenuItem key={index} value={index + 1}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Рік"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="Дата від"
                      value={dateFrom}
                      onChange={(newValue) => setDateFrom(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="Дата до"
                      value={dateTo}
                      onChange={(newValue) => setDateTo(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Результати */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && records.length === 0 && (
          <Alert severity="info">
            Записи залишків не знайдено для обраного періоду
          </Alert>
        )}

        {!loading && !error && records.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Працівник</TableCell>
                  <TableCell>Тип зміни</TableCell>
                  <TableCell align="right">Букети</TableCell>
                  <TableCell align="right">Квітка</TableCell>
                  <TableCell align="right">Сорти квітів</TableCell>
                  <TableCell>Примітки</TableCell>
                  <TableCell>Записано</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatDate(record.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.recordedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      -
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {record.bouquetsCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {record.singleFlowersCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {record.varietiesCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {record.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(record.recordedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Підсумки */}
        {!loading && !error && records.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Підсумки за період
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {records.reduce((sum, record) => sum + record.bouquetsCount, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Загальна кількість букетів
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {records.reduce((sum, record) => sum + record.singleFlowersCount, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Загальна кількість одиночних квітів
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {records.reduce((sum, record) => sum + record.varietiesCount, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Загальна кількість сортів
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
}
