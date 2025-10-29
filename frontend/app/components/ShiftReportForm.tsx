'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
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
  id?: number;
  date: string;
  worker: number;
  itemsSnapshot: Product[];
  shiftComment: string;
  cash: number;
  slug?: string;
}

interface ShiftReportFormProps {
  initialData?: ShiftReport;
  onSave: (data: ShiftReport) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ShiftReportForm({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}: ShiftReportFormProps) {
  const [formData, setFormData] = useState<ShiftReport>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    worker: initialData?.worker || 0,
    itemsSnapshot: initialData?.itemsSnapshot || [],
    shiftComment: (initialData as any)?.shiftComment || '',
    cash: initialData?.cash || 0,
    slug: initialData?.slug || '',
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({ name: '', quantity: 1, price: 0 });

  // Завантаження робітників
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch('/api/workers');
        if (response.ok) {
          const data = await response.json();
          setWorkers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
      }
    };

    fetchWorkers();
  }, []);

  const handleInputChange = (field: keyof ShiftReport, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProduct = () => {
    if (newProduct.name.trim()) {
      setFormData(prev => ({
        ...prev,
        itemsSnapshot: [...prev.itemsSnapshot, { ...newProduct }],
      }));
      setNewProduct({ name: '', quantity: 1, price: 0 });
      setProductDialogOpen(false);
    }
  };

  const handleEditProduct = (index: number) => {
    setEditingProductIndex(index);
    setNewProduct(formData.itemsSnapshot[index]);
    setProductDialogOpen(true);
  };

  const handleUpdateProduct = () => {
    if (editingProductIndex !== null && newProduct.name.trim()) {
      setFormData(prev => ({
        ...prev,
        itemsSnapshot: prev.itemsSnapshot.map((product, index) =>
          index === editingProductIndex ? { ...newProduct } : product
        ),
      }));
      setNewProduct({ name: '', quantity: 1, price: 0 });
      setEditingProductIndex(null);
      setProductDialogOpen(false);
    }
  };

  const handleDeleteProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemsSnapshot: prev.itemsSnapshot.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Генеруємо slug якщо не редагуємо
      if (!isEditing) {
        const selectedWorker = workers.find(w => w.id === formData.worker);
        const dateStr = formData.date.replace(/-/g, '-');
        const workerName = selectedWorker?.name.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        formData.slug = `${dateStr}-${workerName}`;
      }

      console.log('Saving form data:', formData);
      onSave(formData);
    } catch (error) {
      setError('Помилка при збереженні зміни');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = formData.itemsSnapshot.reduce(
    (sum, product) => sum + (product.price || 0) * product.quantity,
    0
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {isEditing ? 'Редагувати зміну' : 'Створити нову зміну'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Дата зміни"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Робітник</InputLabel>
                <Select
                  value={formData.worker}
                  onChange={(e) => handleInputChange('worker', Number(e.target.value))}
                  label="Робітник"
                >
                  {workers.map((worker) => (
                    <MenuItem key={worker.id} value={worker.id}>
                      {worker.name} ({worker.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Товари на зміні</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setProductDialogOpen(true)}
                >
                  Додати товар
                </Button>
              </Box>

              {formData.itemsSnapshot.length > 0 ? (
                <List>
                  {formData.itemsSnapshot.map((product, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={product.name}
                          secondary={`Кількість: ${product.quantity}${product.price ? `, Ціна: ${product.price}₴` : ''}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditProduct(index)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteProduct(index)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < formData.itemsSnapshot.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  Немає товарів
                </Typography>
              )}

              {totalValue > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Загальна вартість товарів: {totalValue}₴
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Коментар до зміни"
                multiline
                rows={3}
                value={formData.shiftComment}
                onChange={(e) => handleInputChange('shiftComment', e.target.value)}
                placeholder="Додайте коментар до зміни (за потреби)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Каса (₴)"
                type="number"
                value={formData.cash}
                onChange={(e) => handleInputChange('cash', Number(e.target.value))}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || !formData.worker || formData.cash < 0}
                >
                  {loading ? 'Збереження...' : isEditing ? 'Оновити' : 'Зберегти'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Діалог для додавання/редагування товару */}
        <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingProductIndex !== null ? 'Редагувати товар' : 'Додати товар'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Назва товару"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Кількість"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ціна (₴)"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProductDialogOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={editingProductIndex !== null ? handleUpdateProduct : handleAddProduct}
              variant="contained"
              disabled={!newProduct.name.trim()}
            >
              {editingProductIndex !== null ? 'Оновити' : 'Додати'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
