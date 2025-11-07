'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  CalendarMonth as CalendarMonthIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
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
  date: string;
  worker: Worker;
  productsSnapshot: Product[];
  shiftComment: string;
  cash: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftReportListProps {
  onEdit: (report: ShiftReport) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

export default function ShiftReportList({ onEdit, onAdd, refreshTrigger }: ShiftReportListProps) {
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ShiftReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuReport, setMenuReport] = useState<ShiftReport | null>(null);

  // Завантаження звітів про зміни
  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching shift reports...');
      const response = await fetch('/api/shift-reports-graphql', {
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
      console.log('Shift reports data:', data);
      
      // GraphQL API повертає { data: [...] }
      const reports = data.data || [];
      
      // Перетворюємо дані для сумісності з інтерфейсом
      const transformedReports = reports.map((report: any) => ({
        id: report.id || report.documentId,
        documentId: report.documentId,
        date: report.date,
        worker: report.worker || { id: 0, name: 'Невідомо', slug: '' },
        productsSnapshot: Array.isArray(report.itemsSnapshot) 
          ? report.itemsSnapshot 
          : (report.itemsSnapshot?.items || []),
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

  const handleView = (report: ShiftReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleEdit = (report: ShiftReport) => {
    onEdit(report);
    setMenuAnchor(null);
  };

  const handleDelete = (report: ShiftReport) => {
    setSelectedReport(report);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const confirmDelete = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(`/api/shift-reports/${selectedReport.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== selectedReport.id));
        setDeleteDialogOpen(false);
        setSelectedReport(null);
      } else {
        setError('Помилка при видаленні звіту');
      }
    } catch (error) {
      console.error('Error deleting shift report:', error);
      setError('Помилка при видаленні звіту');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, report: ShiftReport) => {
    setMenuAnchor(event.currentTarget);
    setMenuReport(report);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuReport(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Невідомо';
    try {
      return new Date(dateString).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Невідомо';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Невідомо';
    try {
      return new Date(dateString).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Невідомо';
    }
  };

  const getTotalProductsValue = (products: Product[]) => {
    return products.reduce((sum, product) => sum + (product.price || 0) * product.quantity, 0);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          Звіти про зміни
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Створити зміну
        </Button>
      </Box>

      {reports.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Немає звітів про зміни
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Створіть перший звіт про зміну, щоб почати відстежувати роботу
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
              Створити зміну
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Робітник</TableCell>
                <TableCell>Товари</TableCell>
                <TableCell>Каса</TableCell>
                <TableCell>Списано</TableCell>
                <TableCell>Створено</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => {
                const totalValue = getTotalProductsValue(report.productsSnapshot || []);
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDate(report.date || '')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {report.date || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.worker?.name || 'Невідомо'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {report.worker?.role || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {report.productsSnapshot?.length || 0} товарів
                        </Typography>
                        {totalValue > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Вартість: {totalValue}₴
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${report.cash || 0}₴`}
                        color="success"
                        size="small"
                        icon={<AttachMoneyIcon />}
                      />
                    </TableCell>
                    <TableCell>
                    {report.shiftComment ? (
                      <Tooltip title={report.shiftComment}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {report.shiftComment}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Немає
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(report.createdAt || '')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, report)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Меню дій */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuReport && handleView(menuReport)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Переглянути</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuReport && handleEdit(menuReport)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редагувати</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuReport && handleDelete(menuReport)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Видалити</ListItemText>
        </MenuItem>
      </Menu>

      {/* Діалог перегляду */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon />
            Деталі зміни
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Дата зміни
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedReport.date || '')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Робітник
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedReport.worker?.name || 'Невідомо'} ({selectedReport.worker?.role || ''})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Каса
                </Typography>
                <Chip
                  label={`${selectedReport.cash || 0}₴`}
                  color="success"
                  icon={<AttachMoneyIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Загальна вартість товарів
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {getTotalProductsValue(selectedReport.productsSnapshot || [])}₴
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Товари на зміні
                </Typography>
                {selectedReport.productsSnapshot?.length > 0 ? (
                  <List dense>
                    {selectedReport.productsSnapshot.map((product, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={product.name}
                          secondary={`Кількість: ${product.quantity}${product.price ? `, Ціна: ${product.price}₴` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">Немає товарів</Typography>
                )}
              </Grid>
              {(selectedReport as any).shiftComment && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Списано
                  </Typography>
                  <Typography variant="body1">
                    {(selectedReport as any).shiftComment}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цей звіт про зміну? Цю дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
