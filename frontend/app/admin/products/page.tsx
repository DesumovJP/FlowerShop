'use client';

import { append } from '../../utils/recentActivities.store';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as CloudUploadIcon,
  TextFields as TextFieldsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useRouter } from 'next/navigation';
import ProductFilters from '../../components/ProductFilters';
import { useProductsStore } from '../../store/productsStore';

// Функція для витягування тексту з Rich Text Editor формату
function extractTextFromRichText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => extractTextFromRichText(item)).join(' ');
  }
  if (richText.children && Array.isArray(richText.children)) {
    return richText.children.map((child: any) => extractTextFromRichText(child)).join(' ');
  }
  if (richText.text) return richText.text;
  return '';
}

// Types (matching Strapi GraphQL response)
interface Product {
  documentId: string;
  name: string;
  slug: string;
  price: number;
  availableQuantity?: number;
  productType: 'bouquet' | 'singleflower' | 'composition' | 'accessory';
  description?: string;
  color?: string;
  cardType: 'standard' | 'large';
  image: Array<{
    documentId: string;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  }>;
  varieties: Array<{
    documentId: string;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  price: number;
  availableQuantity?: number;
  availableQuantityInput?: string;
  description: string;
  color: string;
  cardType: 'standard' | 'large';
  varieties: string[];
  varietiesNames?: Array<{ id: string; name: string }>;
  productType: 'bouquet' | 'singleflower' | 'composition' | 'accessory';
}

// Product Form Dialog Component
function ProductFormDialog({ 
  open, 
  onClose, 
  product, 
  onSave,
  varieties = []
}: {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (data: ProductFormData) => void;
  varieties?: Array<{documentId: string, name: string, slug: string, description?: string}>;
}) {
  const theme = useTheme();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    price: 0,
    availableQuantity: 0,
    availableQuantityInput: '0',
    description: '',
    color: '',
    cardType: 'standard',
    varieties: [],
    varietiesNames: [],
    productType: 'bouquet',
  });

  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  // Function to validate and reset invalid form values
  const resetInvalidValues = (data: ProductFormData): ProductFormData => {
    const validColors = ['Білий', 'Червоний', 'Рожевий', 'Жовтий', 'Фіолетовий', 'Голубий', 'Синій', 'Помаранчевий'];
    
    return {
      ...data,
      color: validColors.includes(data.color) ? data.color : '',
      availableQuantity: typeof data.availableQuantity === 'number' && data.availableQuantity >= 0
        ? Math.floor(data.availableQuantity)
        : 0,
    };
  };

  // Function to transliterate Ukrainian values to Strapi-expected values
  const transliterateForStrapi = (data: ProductFormData): ProductFormData => {
    const colorMapping: Record<string, string> = {
      'Білий': 'bilyj',
      'Червоний': 'chervonij',
      'Рожевий': 'rozhevyj',
      'Жовтий': 'zhyovtyj ',
      'Фіолетовий': 'fioletovij ',
      'Голубий': 'golubyj',
      'Синій': 'synij',
      'Помаранчевий': 'oranzhevyj'
    };

    const cardTypeMapping: Record<string, string> = {
      'standard': 'standard',
      'large': 'large'
    };

    return {
      ...data,
      color: data.color ? colorMapping[data.color] || data.color : '',
      cardType: data.cardType ? (cardTypeMapping[data.cardType] as 'standard' | 'large') || data.cardType : 'standard',
    };
  };

  // Function to convert Strapi values back to Ukrainian for display
  const transliterateFromStrapi = (data: any): any => {
    const colorReverseMapping: Record<string, string> = {
      'bilyj': 'Білий',
      'chervonij': 'Червоний',
      'rozhevyj': 'Рожевий',
      'zhyovtyj ': 'Жовтий',
      'fioletovij ': 'Фіолетовий',
      'golubyj': 'Голубий',
      'synij': 'Синій',
      'oranzhevyj': 'Помаранчевий'
    };

    const cardTypeReverseMapping: Record<string, string> = {
      'standart': 'standard',
      'large': 'large'
    };

    return {
      ...data,
      color: data.color ? colorReverseMapping[data.color] || data.color : '',
      cardType: data.cardType ? cardTypeReverseMapping[data.cardType] || data.cardType : '',
    };
  };

  useEffect(() => {
    if (open) {
      if (product) {
        console.log('Loading product data:', {
          name: product.name,
          color: product.color,
          cardType: product.cardType,
          productType: product.productType
        });
        // Використовуємо productType з API
        const productType = product.productType || 'bouquet';
        
        const initialData = {
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          availableQuantity: product.availableQuantity ?? 0,
          availableQuantityInput: (product.availableQuantity ?? 0).toString(),
          description: extractTextFromRichText(product.description) || '',
          color: product.color || '',
          cardType: product.cardType,
          varieties: product.varieties ? product.varieties.map(v => v.documentId) : [],
          varietiesNames: product.varieties ? product.varieties.map(v => ({ id: v.documentId, name: v.name })) : [],
          productType: productType, // Правильний тип продукту
        };
        
        // Convert Strapi values to Ukrainian for display
        const displayData = transliterateFromStrapi(initialData);
        
        // Reset invalid values
        const cleanedData = resetInvalidValues(displayData);
        setFormData(cleanedData);
        
        // Initialize existing images
        if (product.image && Array.isArray(product.image)) {
          setExistingImages(product.image);
        } else {
          setExistingImages([]);
        }
      } else {
        setFormData({
          name: '',
          slug: '',
          price: 0,
          availableQuantity: 0,
          availableQuantityInput: '0',
          description: '',
          color: '',
          cardType: 'standard',
          varieties: [],
          varietiesNames: [],
          productType: 'bouquet',
        });
        setExistingImages([]);
      }
      setErrors({});
      setSelectedFiles([]);
      setFilePreviews([]);
      setImagesToRemove([]);
    }
  }, [product, open]);

  // Очищуємо varieties при зміні типу продукту на singleflower
  useEffect(() => {
    if (formData.productType === 'singleflower' && formData.varieties.length > 0) {
      setFormData(prev => ({ ...prev, varieties: [], varietiesNames: [] }));
    }
  }, [formData.productType]);

  const handleChange = (field: keyof ProductFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    
    // Спеціальна обробка для ціни - перетворюємо в число
    if (field === 'price') {
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else if (field === 'availableQuantity') {
      const numericValue = value === '' ? 0 : parseInt(value, 10);
      const safeValue = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
      setFormData(prev => ({ ...prev, availableQuantity: safeValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleVarietiesChange = (event: any) => {
    const value = event.target.value;
    const selectedIds = typeof value === 'string' ? value.split(',') : value;
    
    // Отримуємо назви сортів за ID
    const selectedVarietiesNames = selectedIds
      .map((id: string) => {
        const variety = varieties.find(v => v.documentId === id);
        return variety ? { id: variety.documentId, name: variety.name } : null;
      })
      .filter((v: { id: string; name: string } | null): v is { id: string; name: string } => v !== null);
    
    setFormData(prev => ({ 
      ...prev, 
      varieties: selectedIds,
      varietiesNames: selectedVarietiesNames
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Create previews for new files
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (imageId: string) => {
    console.log('Frontend: Removing image with ID:', imageId);
    setImagesToRemove(prev => [...prev, imageId]);
  };

  const undoRemoveImage = (imageId: string) => {
    setImagesToRemove(prev => prev.filter(id => id !== imageId));
  };

  const validateForm = (): boolean => {
    console.log('Validating form with data:', formData);
    const newErrors: Partial<ProductFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Назва товару обов\'язкова';
    }
    
    if (!formData.slug || !formData.slug.trim()) {
      newErrors.slug = 'Slug обов\'язковий';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug може містити тільки маленькі літери, цифри та дефіси';
    }
    
    if (!formData.price || formData.price <= 0 || isNaN(formData.price)) {
      newErrors.price = 'Ціна повинна бути більше 0' as any;
    }
    
    if (formData.availableQuantity == null || formData.availableQuantity < 0 || isNaN(formData.availableQuantity as any)) {
      (newErrors as any).availableQuantity = 'Кількість не може бути відʼємною';
    }
    
    if (!formData.color.trim()) {
      newErrors.color = 'Колір обов\'язковий';
    }
    
    // Validate color is one of the available options
    const validColors = ['Білий', 'Червоний', 'Рожевий', 'Жовтий', 'Фіолетовий', 'Голубий', 'Синій', 'Помаранчевий'];
    if (formData.color && !validColors.includes(formData.color)) {
      newErrors.color = 'Оберіть валідний колір';
    }
    
    // Колекції видалені з нової структури Product
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('Form submission started');
    console.log('Current form data:', formData);
    console.log('Selected files:', selectedFiles.length);
    console.log('Images to remove:', imagesToRemove.length);
    
    if (validateForm()) {
      console.log('Form validation passed, submitting...');
      setIsSubmitting(true);
      try {
        // Transliterate values for Strapi API
        const transliteratedData = transliterateForStrapi(formData);
        console.log('Transliterated data:', transliteratedData);
        console.log('Varieties before sending:', transliteratedData.varieties);
        console.log('CardType before sending:', transliteratedData.cardType);
        
        // Визначаємо тип продукту - використовуємо formData.productType (вже правильно встановлений)
        const productType = formData.productType;
        
        console.log('🔍 Product type detection:', { 
          isEdit: !!product, 
          productType, 
          formDataProductType: formData.productType,
          hasVarieties: (product?.varieties?.length || 0) > 0 
        });
        
        // Створення або оновлення
        const isEdit = !!product?.documentId;
        const apiEndpoint = isEdit ? `/api/products/${product!.documentId}` : '/api/products';
        
        // Підготовка payload для Product колекції (без documentId у тілі)
        const jsonPayload = {
          name: transliteratedData.name,
          slug: transliteratedData.slug,
          price: transliteratedData.price,
          availableQuantity: formData.availableQuantity ?? 0,
          description: transliteratedData.description,
          color: transliteratedData.color,
          cardType: transliteratedData.cardType,
          productType: productType,
          varieties: productType === 'bouquet' ? transliteratedData.varieties : [],
        };
        
        console.log('Frontend: Sending JSON payload to:', apiEndpoint, jsonPayload);
        console.log('Price type and value:', typeof jsonPayload.price, jsonPayload.price);

        const response = await fetch(apiEndpoint, {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonPayload),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to save product';
          try {
            const errorData = await response.json();
            console.error('Error saving product:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
            console.error('Response status:', response.status);
            console.error('Response statusText:', response.statusText);
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('📊 API Response:', result);
        
        // Отримуємо documentId залежно від типу продукту
        const bouquetDocumentId = productType === 'singleflower' 
          ? result.data?.documentId 
          : result.data?.documentId;
        
        console.log('📋 Document ID:', bouquetDocumentId);
        
        if (!bouquetDocumentId) {
          throw new Error('Failed to get document ID from API response');
        }
        
        // Handle image uploads separately if any
        if (selectedFiles.length > 0) {
          console.log('Frontend: Uploading images separately:', selectedFiles.length);
          
          const uploadedFiles = [];
          
          for (const file of selectedFiles) {
            try {
              const uploadFormData = new FormData();
              uploadFormData.append('files', file);
              uploadFormData.append('ref', 'api::product.product');
              uploadFormData.append('refId', bouquetDocumentId);
              uploadFormData.append('field', 'image');
              
              console.log('🔧 Using default Strapi v5 upload for admin panel');
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData,
              });
              
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('Failed to upload image:', file.name, 'Error:', errorText);
              } else {
                const uploadResult = await uploadResponse.json();
                console.log('Successfully uploaded image:', file.name, uploadResult);
                uploadedFiles.push(...uploadResult);
              }
            } catch (uploadError) {
              console.error('Upload error for file:', file.name, uploadError);
            }
          }
          
          // Прив'язуємо завантажені файли до товару
          if (uploadedFiles.length > 0) {
            console.log('🔗 Linking uploaded files to product:', uploadedFiles.length);
            
            try {
              // Отримуємо поточний стан контенту
              const contentResponse = await fetch(`${apiBaseUrl}/api/products/${bouquetDocumentId}?populate=image`);
              const contentData = await contentResponse.json();
              
              // Отримуємо існуючі файли
              const currentFiles = contentData.data.image || [];
              const currentFileIds = currentFiles.map((f: any) => f.id);
              
              // Додаємо нові файли до існуючих
              const newFileIds = uploadedFiles.map(file => file.id);
              const updatedFileIds = [...currentFileIds, ...newFileIds];
              
              console.log('Current files:', currentFileIds);
              console.log('New files:', newFileIds);
              console.log('Updated files:', updatedFileIds);
              
              // Оновлюємо контент з прив'язкою файлів
              const updateResponse = await fetch(`${apiBaseUrl}/api/products/${bouquetDocumentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  data: { image: updatedFileIds }
                })
              });
              
              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error('Failed to link images:', errorData);
              } else {
                console.log('✅ Images successfully linked to product');
              }
            } catch (linkError) {
              console.error('Error linking images:', linkError);
            }
          }
        }
        
        // Handle image removal if any
        if (imagesToRemove.length > 0) {
          console.log('Frontend: Removing images:', imagesToRemove);
          // TODO: Implement image removal logic
        }

        if (response.ok) {
          // Сповістити батьківський компонент про успішне збереження
          try {
            // Отримуємо назви сортів за ID
            const varietiesNames = formData.varieties
              .map(id => {
                const variety = varieties.find(v => v.documentId === id);
                return variety ? { id: variety.documentId, name: variety.name } : null;
              })
              .filter((v): v is { id: string; name: string } => v !== null);

            onSave({
              name: formData.name,
              slug: formData.slug,
              price: formData.price,
              availableQuantity: formData.availableQuantity ?? 0,
              productType: formData.productType,
              color: formData.color,
              varieties: formData.varieties,
              varietiesNames: varietiesNames,
            } as any);
          } catch {}

          // Clean up preview URLs
          filePreviews.forEach(url => URL.revokeObjectURL(url));
          onClose();
        } else {
          let errorMessage = 'Failed to save product';
          try {
            const errorData = await response.json();
            console.error('Error saving product:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError);
            console.error('Response status:', response.status);
            console.error('Response statusText:', response.statusText);
          }
          throw new Error(errorMessage);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const colors = [
    'Білий', 'Червоний', 'Рожевий', 'Жовтий', 'Фіолетовий',
    'Голубий', 'Синій', 'Помаранчевий'
  ];

  // Колекції видалені з нової структури Product

  // Функція для отримання кольору
  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'Білий': '#FFFFFF',
      'Червоний': '#FF0000',
      'Рожевий': '#FF69B4',
      'Жовтий': '#FFFF00',
      'Фіолетовий': '#800080',
      'Голубий': '#87CEEB',
      'Синій': '#0000FF',
      'Помаранчевий': '#FFA500',
    };
    return colorMap[colorName] || '#CCCCCC';
  };

  // Varieties will be loaded from API

  return (
    <Dialog 
      open={open} 
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{
        sx: {
          borderRadius: 0,
          boxShadow: 'none',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          maxHeight: '95vh',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(6px)'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
        borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
        pb: 3,
        px: 4,
        pt: 4,
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          width: '100%'
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: product ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
          }}>
            {product ? <EditIcon /> : <AddIcon />}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#2E7D32',
              fontFamily: 'var(--font-poppins)',
            }}>
              {product ? 'Редагувати товар' : 'Додати новий товар'}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              mt: 0.5,
            }}>
              {product ? 'Оновіть інформацію про товар' : 'Створіть новий товар для каталогу'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ 
          p: 3,
          overflow: 'auto',
          maxHeight: 'calc(95vh - 7.5rem)',
          pb: 12,
        }}>
          <Box sx={{ maxWidth: '50rem', mx: 'auto' }}>
            {/* Основні поля */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Назва товару *"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
                sx={{ 
                  mt: 1,
                  mb: 2,
                  '& .MuiOutlinedInput-root': { borderRadius: 0 },
                }}
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Slug (URL) *"
                  value={formData.slug || ''}
                  onChange={handleChange('slug')}
                  error={!!errors.slug}
                  helperText={errors.slug}
                  required
                  placeholder="vesnyanyj-buket"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                
                <TextField
                  fullWidth
                  label="Ціна (₴) *"
                  type="text"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={handleChange('price')}
                  error={!!errors.price}
                  helperText={errors.price}
                  required
                  placeholder="Введіть ціну"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Кількість на складі"
                  type="text"
                  inputMode="numeric"
                  value={formData.availableQuantityInput ?? '0'}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setFormData(prev => ({ ...prev, availableQuantityInput: val }));
                    if (val === '') {
                      setFormData(prev => ({ ...prev, availableQuantity: 0 }));
                    } else {
                      const num = Number(val);
                      if (!isNaN(num) && num >= 0) {
                        setFormData(prev => ({ ...prev, availableQuantity: num }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
                      setFormData(prev => ({ ...prev, availableQuantity: 0, availableQuantityInput: '0' }));
                    } else {
                      const num = Number(val);
                      setFormData(prev => ({ ...prev, availableQuantity: num, availableQuantityInput: num.toString() }));
                    }
                  }}
                  error={!!(errors as any).availableQuantity}
                  helperText={(errors as any).availableQuantity as any}
                  placeholder="0"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Опис товару"
                multiline
                rows={6}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Опишіть особливості букета, його склад та призначення..."
                helperText={`${formData.description.length}/500 символів`}
                inputProps={{
                  maxLength: 500,
                }}
                sx={{ 
                  mb: 2, 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 0,
                    maxHeight: '12.5rem',
                    overflow: 'auto'
                  }
                }}
              />
            </Box>

            {/* Характеристики в ряд */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 3,
            }}>
              <FormControl fullWidth required error={!!errors.color} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
                <InputLabel>Колір *</InputLabel>
                <Select
                  value={formData.color}
                  label="Колір *"
                  onChange={handleChange('color')}
                >
                  {colors.map((color) => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: getColorValue(color),
                              border: '1px solid',
                              borderColor: theme.palette.grey[300],
                            }}
                          />
                          {color}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          -
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Колекції видалені з нової структури Product */}
              
              {/* Тип продукту не редагується: показуємо readOnly поле */}
              <TextField
                fullWidth
                label="Тип продукту"
                value={formData.productType === 'bouquet' ? 'Букет' : 'Квітка'}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
                <InputLabel>Розмір картки</InputLabel>
                <Select
                  value={formData.cardType}
                  label="Розмір картки"
                  onChange={handleChange('cardType')}
                >
                  <MenuItem value="standard">Стандартна</MenuItem>
                  <MenuItem value="large">Велика</MenuItem>
                </Select>
              </FormControl>

              {formData.productType === 'bouquet' && (
                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
                  <InputLabel>Сорти квітів</InputLabel>
                  <Select
                    multiple
                    value={formData.varieties}
                    label="Сорти квітів"
                    onChange={handleVarietiesChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.length > 0 ? (
                          selected.map((value) => {
                            const variety = varieties.find(v => v.documentId === value);
                            return (
                              <Chip 
                                key={value} 
                                label={variety?.name} 
                                size="small"
                                sx={{ backgroundColor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Оберіть сорти
                          </Typography>
                        )}
                      </Box>
                    )}
                  >
                    {varieties.map((variety) => (
                      <MenuItem key={variety.documentId} value={variety.documentId}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>🌸</Typography>
                          {variety.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Інформаційне повідомлення для одиночних квітів */}
            {/* Інформаційне повідомлення для одиночних квітів видалено за вимогою */}

                    {/* Завантаження зображень */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1.5,
                          fontFamily: 'var(--font-playfair)',
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        Зображення
                      </Typography>

                      <Box
                        component="label"
                        sx={{
                          border: '2px dashed',
                          borderColor: theme.palette.grey[300],
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          backgroundColor: theme.palette.grey[50],
                          display: 'block',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.primary.light + '05',
                          },
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        <CloudUploadIcon
                          sx={{
                            fontSize: 32,
                            color: theme.palette.grey[400],
                            mb: 1,
                          }}
                        />
                        <Typography
                          variant="body2"
                          gutterBottom
                          sx={{
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                          }}
                        >
                          Завантажити зображення
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          JPG, PNG, WebP (макс. 5MB кожне)
                        </Typography>
                      </Box>
                      {/* Превью нових файлів */}
                      {filePreviews.length > 0 && (
                        <Box sx={{ mt: 2, mb: 10 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: theme.palette.primary.main,
                            }}
                          >
                            Нові зображення ({filePreviews.length})
                          </Typography>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(5.5rem, 1fr))',
                              gap: 1,
                            }}
                          >
                            {filePreviews.map((preview, index) => (
                              <Box
                                key={index}
                                sx={{
                                  position: 'relative',
                                  width: '100%',
                                  pt: '100%', // square
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '2px solid',
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: theme.palette.grey[100],
                                }}
                              >
                                <Box
                                  component="img"
                                  alt={`Preview ${index + 1}`}
                                  src={preview}
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => removeSelectedFile(index)}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                    },
                                    width: 20,
                                    height: 20,
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Існуючі зображення */}
                      {product && product.image && product.image.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Завантажені зображення
                          </Typography>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(5.5rem, 1fr))',
                              gap: 1,
                            }}
                          >
                            {product.image
                              .filter(img => !imagesToRemove.includes(img.documentId))
                              .map((img) => (
                              <Box
                                key={img.documentId}
                                sx={{
                                  position: 'relative',
                                  width: '100%',
                                  pt: '100%', // square
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '1px solid',
                                  borderColor: theme.palette.grey[200],
                                  backgroundColor: theme.palette.grey[100],
                                }}
                              >
                                <Box
                                  component="img"
                                  alt={img.alternativeText || product.name}
                                  src={`${apiBaseUrl}${img.url}`}
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => removeExistingImage(img.documentId)}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                    },
                                    width: 20,
                                    height: 20,
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Видалені зображення */}
                      {imagesToRemove.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              color: theme.palette.error.main,
                            }}
                          >
                            Буде видалено ({imagesToRemove.length})
                          </Typography>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(5.5rem, 1fr))',
                              gap: 1,
                            }}
                          >
                            {product?.image
                              .filter(img => imagesToRemove.includes(img.documentId))
                              .map((img) => (
                              <Box
                                key={img.documentId}
                                sx={{
                                  position: 'relative',
                                  width: '100%',
                                  pt: '100%', // square
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '2px solid',
                                  borderColor: theme.palette.error.main,
                                  backgroundColor: theme.palette.grey[100],
                                  opacity: 0.5,
                                }}
                              >
                                <Box
                                  component="img"
                                  alt={img.alternativeText || product.name}
                                  src={`${apiBaseUrl}${img.url}`}
                                  sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: 'grayscale(100%)',
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => undoRemoveImage(img.documentId)}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: theme.palette.error.main,
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: theme.palette.error.dark,
                                    },
                                    width: 20,
                                    height: 20,
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12, transform: 'rotate(45deg)' }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
          </Box>
        </Box>
        {/* Сірий оверлей: В розробці */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'text.secondary' }}>
          В розробці
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 4, 
        pb: 4,
        pt: 2,
        gap: 2,
        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.02) 0%, rgba(76, 175, 80, 0.01) 100%)',
        borderTop: '1px solid rgba(46, 125, 50, 0.1)',
        justifyContent: 'flex-end',
      }}>
        <Button 
          onClick={onClose} 
          disabled
          sx={{
            color: '#666',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 0,
            border: '1px solid rgba(102, 102, 102, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(102, 102, 102, 0.1)',
              borderColor: '#666',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              opacity: 0.5,
              transform: 'none',
            },
            minWidth: 120,
          }}
        >
          Скасувати
        </Button>
        <Button 
          disabled
          sx={{
            background: product 
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
              : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            color: 'white',
            fontWeight: 700,
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: 0,
            boxShadow: product 
              ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
              : '0 4px 12px rgba(46, 125, 50, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: product 
                ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' 
                : 'linear-gradient(135deg, #1b5e20 0%, #2E7D32 100%)',
              boxShadow: product 
                ? '0 6px 16px rgba(25, 118, 210, 0.4)' 
                : '0 6px 16px rgba(46, 125, 50, 0.4)',
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              opacity: 0.6,
              transform: 'none',
            },
            minWidth: 160,
          }}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Збереження...
            </Box>
          ) : (
            product ? 'Оновити товар' : 'Створити товар'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Variety Form Dialog Component
function VarietyFormDialog({ 
  open, 
  onClose, 
  variety, 
  onSave 
}: {
  open: boolean;
  onClose: () => void;
  variety?: any;
  onSave: (data: any) => void;
}) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Заповнюємо форму при редагуванні
  useEffect(() => {
    if (variety) {
      setFormData({
        name: variety.name || '',
        slug: variety.slug || '',
        description: variety.description || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
      });
    }
    setErrors({});
  }, [variety, open]);

  const handleChange = (field: string) => (event: any) => {
    const value = event.target.value;
    
    // Спеціальна обробка для ціни - перетворюємо в число
    if (field === 'price') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Очищаємо помилку для цього поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Назва сорту обов\'язкова';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug обов\'язковий';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = variety 
        ? `/api/admin/varieties?documentId=${variety.documentId}`
        : '/api/admin/varieties';
      
      const method = variety ? 'PUT' : 'POST';
      const body = variety 
        ? { documentId: variety.documentId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save variety');
      }

      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving variety:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          boxShadow: 'none',
          border: '1px solid rgba(46, 125, 50, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(6px)'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
        borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
        pb: 3,
        px: 4,
        pt: 4,
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          width: '100%'
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: variety ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
          }}>
            {variety ? <EditIcon /> : <AddIcon />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#2E7D32',
              fontFamily: 'var(--font-poppins)',
            }}>
              {variety ? 'Редагувати сорт' : 'Додати новий сорт'}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              mt: 0.5,
            }}>
              {variety ? 'Оновіть інформацію про сорт квітів' : 'Створіть новий сорт квітів для каталогу'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4, pt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mt: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Назва сорту *"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2E7D32',
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Slug *"
              value={formData.slug}
              onChange={handleChange('slug')}
              error={!!errors.slug}
              helperText={errors.slug}
              placeholder="troyanda-rozeva"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2E7D32',
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Опис сорту"
              value={formData.description}
              onChange={handleChange('description')}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2E7D32',
                },
              }}
            />
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ 
        px: 4, 
        pb: 4,
        pt: 2,
        gap: 2,
        background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.02) 0%, rgba(76, 175, 80, 0.01) 100%)',
        borderTop: '1px solid rgba(46, 125, 50, 0.1)',
      }}>
        <Button 
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            color: '#666',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 0,
            border: '1px solid rgba(102, 102, 102, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(102, 102, 102, 0.1)',
              borderColor: '#666',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              opacity: 0.5,
              transform: 'none',
            },
          }}
        >
          Скасувати
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            background: variety 
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
              : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            color: 'white',
            fontWeight: 700,
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: 0,
            boxShadow: variety 
              ? '0 4px 12px rgba(25, 118, 210, 0.3)' 
              : '0 4px 12px rgba(46, 125, 50, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: variety 
                ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' 
                : 'linear-gradient(135deg, #1b5e20 0%, #2E7D32 100%)',
              boxShadow: variety 
                ? '0 6px 16px rgba(25, 118, 210, 0.4)' 
                : '0 6px 16px rgba(46, 125, 50, 0.4)',
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              opacity: 0.6,
              transform: 'none',
            },
            minWidth: 160,
          }}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Збереження...
            </Box>
          ) : (
            variety ? 'Оновити сорт' : 'Створити сорт'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Мапінг кольорів з латиниці на українську (як в каталозі)
const colorMapping: Record<string, string> = {
  'Chervonij': 'Червоний',
  'Rozhevij': 'Рожевий', 
  'Zhyovtyj': 'Жовтий',
  'Fioletovij': 'Фіолетовий',
  'Golubyj': 'Голубий',
  'Synij': 'Синій',
  'Pomaranchevyj': 'Помаранчевий',
  'Bilyj': 'Білий'
};

// Колекції видалені з нової структури Product

// Функція для отримання кольору
const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'Білий': '#FFFFFF',
    'Червоний': '#FF0000',
    'Рожевий': '#FF69B4',
    'Жовтий': '#FFFF00',
    'Фіолетовий': '#800080',
    'Голубий': '#87CEEB',
    'Синій': '#0000FF',
    'Помаранчевий': '#FFA500',
  };
  return colorMap[colorName] || '#CCCCCC';
};

// Main Products Management Component
export default function ProductsPage() {
  const theme = useTheme();
  const router = useRouter();
  
  // Адаптивність
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('xs'));
  // Zustand store
  const { 
    products, 
    loading, 
    fetchProducts, 
    refreshProducts,
    invalidateCache,
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProductsStore();
  
  const allProducts = products; // Використовуємо ті ж товари для підрахунку
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('Всі кольори');
  const [filterVariety, setFilterVariety] = useState('Всі сорти');
  const [filterProductType, setFilterProductType] = useState('Всі продукти');
  // Пагінація вимкнена — показуємо повний список
  const [varieties, setVarieties] = useState<Array<{documentId: string, name: string, slug: string, description?: string}>>([]);
  // Модалка списання/видалення товару
  const [writeoffDialogOpen, setWriteoffDialogOpen] = useState(false);
  const [writeoffTarget, setWriteoffTarget] = useState<{ productId: string; productType?: string } | null>(null);
  const [writeoffAmount, setWriteoffAmount] = useState<number>(0);
  const [writeoffAmountInput, setWriteoffAmountInput] = useState<string>('1');
  
  // Отримуємо доступні типи продуктів
  const availableProductTypes = useMemo(() => {
    const types = allProducts.map(product => product.productType);
    const uniqueTypes = Array.from(new Set(types));
    
    const typeLabels = {
      'bouquet': 'Букети',
      'singleflower': 'Квітка',
      'composition': 'Композиції',
      'accessory': 'Аксесуари'
    };
    
    return ['Всі продукти', ...uniqueTypes.map(type => typeLabels[type as keyof typeof typeLabels] || type)];
  }, [allProducts]);
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  
  // Variety dialog states
  const [varietyDialogOpen, setVarietyDialogOpen] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState<any | undefined>();
  const [showVarieties, setShowVarieties] = useState(false);
  
  // Notification states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  // Єдине джерело правди для тривалості, щоб анімація й закриття збігалися
  const SNACKBAR_DURATION_MS = 4000;

  // Fetch varieties
  const fetchVarieties = async () => {
    try {
      const response = await fetch('/api/admin/varieties');
      const data = await response.json();
      
      if (response.ok) {
        setVarieties(data.data || []);
        try { router.refresh(); } catch {}
      }
    } catch (error) {
      console.error('Error fetching varieties:', error);
    }
  };

  // Завантаження товарів при монтуванні компонента
  useEffect(() => {
    fetchProducts(true);
    fetchVarieties();
  }, [fetchProducts]);

  // Застосовуємо фільтри до списку товарів
  const paginatedProducts = useMemo(() => {
    const typeLabels: Record<string, string> = {
      'bouquet': 'Букети',
      'singleflower': 'Квітка',
      'composition': 'Композиції',
      'accessory': 'Аксесуари'
    };

    // Мапінг кольорів (Strapi -> UA відображення)
    const colorMapping: Record<string, string> = {
      'red': 'Червоний',
      'pink': 'Рожевий',
      'white': 'Білий',
      'yellow': 'Жовтий',
      'purple': 'Фіолетовий',
      'blue': 'Синій',
      'green': 'Зелений',
      'orange': 'Оранжевий',
      'cream': 'Кремовий',
      'peach': 'Персиковий',
      // Підтримка латинської транслітерації, що зберігається у Product
      'chervonij': 'Червоний',
      'rozhevyj': 'Рожевий',
      'rozhevij': 'Рожевий',
      'bilyj': 'Білий',
      'zhyovtyj': 'Жовтий',
      'zhovtyj': 'Жовтий',
      'fioletovij': 'Фіолетовий',
      'synij': 'Синій',
      'golubyj': 'Голубий',
      'oranzhevyj': 'Помаранчевий',
      'pomaranchevyj': 'Помаранчевий',
      'zelenyj': 'Зелений'
    };

    const selectedTypeCode = (Object.keys(typeLabels) as Array<keyof typeof typeLabels>).find(
      (code) => typeLabels[code] === filterProductType
    );

    return products.filter((product) => {
      // Пошук
      const matchesSearch = !searchTerm
        || product.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Тип продукту
      const matchesType = filterProductType === 'Всі продукти'
        || product.productType === selectedTypeCode;

      // Колір
      const productColorUA = colorMapping[product.color as keyof typeof colorMapping] || product.color;
      const matchesColor = filterColor === 'Всі кольори'
        || productColorUA === filterColor
        || product.color === filterColor; // на випадок якщо у списку значення латиницею

      // Сорт
      const matchesVariety = filterVariety === 'Всі сорти'
        || (product.varieties || []).some((v) => v.name === filterVariety);

      return matchesSearch && matchesType && matchesColor && matchesVariety;
    });
  }, [products, searchTerm, filterProductType, filterColor, filterVariety]);

  const toUkrainianColor = useCallback((c: string | undefined) => {
    if (!c) return '-';
    const map: Record<string, string> = {
      red: 'Червоний', pink: 'Рожевий', white: 'Білий', yellow: 'Жовтий', purple: 'Фіолетовий', blue: 'Синій', green: 'Зелений', orange: 'Оранжевий', cream: 'Кремовий', peach: 'Персиковий',
      chervonij: 'Червоний', rozhevyj: 'Рожевий', rozhevij: 'Рожевий', bilyj: 'Білий', zhyovtyj: 'Жовтий', zhovtyj: 'Жовтий', fioletovij: 'Фіолетовий', synij: 'Синій', golubyj: 'Голубий', oranzhevyj: 'Помаранчевий', pomaranchevyj: 'Помаранчевий', zelenyj: 'Зелений'
    };
    return map[c] || c;
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setFormDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormDialogOpen(true);
  };

  // Variety handlers
  const handleAddVariety = () => {
    setSelectedVariety(undefined);
    setVarietyDialogOpen(true);
  };

  const handleEditVariety = (variety: any) => {
    setSelectedVariety(variety);
    setVarietyDialogOpen(true);
  };

  const handleDeleteVariety = async (documentId: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей сорт?')) {
      try {
        const response = await fetch(`/api/admin/varieties?documentId=${documentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchVarieties();
          showNotification('Сорт успішно видалено', 'success');
        } else {
          throw new Error('Failed to delete variety');
        }
      } catch (error) {
        console.error('Error deleting variety:', error);
        showNotification('Помилка видалення сорту', 'error');
      }
    }
  };

  const handleViewProduct = (product: Product) => {
    // Визначаємо тип продукту
    const isSingleflower = !product?.varieties || product.varieties.length === 0;
    
    // Перевіряємо, чи є slug
    if (!product.slug) {
      showNotification(`Товар "${product.name}" не має slug. Можливо, потрібно зберегти товар ще раз для генерації slug.`, 'error');
      return;
    }
    
    // Відкриваємо сторінку товару в новій вкладці
    // Використовуємо загальний URL /product/[slug] для обох типів
    const url = `/product/${product.slug}`;
    
    console.log('🔍 Opening product:', {
      productName: product.name,
      slug: product.slug,
      isSingleflower,
      url
    });
    
    window.open(url, '_blank');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterColor('Всі кольори');
    setFilterVariety('Всі сорти');
    setFilterProductType('Всі продукти');
  };


  const startDeleteProduct = (productId: string, productType?: string) => {
    const product = products.find(p => p.documentId === productId);
    const currentQty = product?.availableQuantity ?? 0;
    setWriteoffTarget({ productId, productType });
    setWriteoffAmount(currentQty > 0 ? 1 : 0);
    setWriteoffAmountInput(currentQty > 0 ? '1' : '0');
    setWriteoffDialogOpen(true);
  };

  const handleDeleteProductWithAmount = async (productId: string, amountToWriteoff: number, productType?: string) => {
    const product = products.find(p => p.documentId === productId);
    const currentQty = product?.availableQuantity ?? 0;

    try {
      // If partial write-off requested, do write-off instead of delete
      if (amountToWriteoff < currentQty) {
        const res = await fetch('/api/admin/products-writeoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: productId, amount: amountToWriteoff })
        });
        if (!res.ok) {
          const text = await res.text();
          showNotification(`Помилка списання: ${text}`, 'error');
          return;
        }

        // Log write-off activity
        try {
          const result = await res.json();
          const activity = {
            id: `writeoff_${Date.now()}`,
            type: 'productDeleted',
            createdAt: new Date().toISOString(),
            payload: {
              documentId: productId,
              name: product?.name,
              productType: product?.productType,
              availableQuantity: amountToWriteoff,
          price: product?.price ?? 0,
              remainingAfter: result.after,
            }
          };
          try {
            append({
              id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              ts: Date.now(),
              createdAt: new Date().toISOString(),
              type: 'productDeleted',
              source: 'admin',
              payload: {
                documentId: activity.payload.documentId,
                name: product?.name,
                productType: product?.productType,
                availableQuantity: amountToWriteoff,
                remainingAfter: result.after
              }
            });
          } catch {}
        } catch {}

        await fetchProducts();
        try { router.refresh(); } catch {}
        try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('products:refresh')); } } catch {}
        showNotification('Списання виконано', 'success');
        return;
      }

      // Full delete path
        // Визначаємо тип продукту на основі наявності varieties
        const isSingleflower = !product?.varieties || product.varieties.length === 0;
        
        // Додаткова перевірка: якщо productType передано явно, використовуємо його
        const finalProductType = productType || (isSingleflower ? 'singleflower' : 'bouquet');
        
        // Перевіряємо, чи правильно визначено тип
        console.log('🔍 Product type detection:', {
          productId,
          productName: product?.name,
          hasVarieties: product?.varieties?.length || 0,
          isSingleflower,
          productType,
          finalProductType
        });
        
        // Вибираємо правильний endpoint (legacy GraphQL)
        const endpoint = finalProductType === 'singleflower' 
          ? `/api/admin/singleflowers-graphql?documentId=${productId}`
          : `/api/admin/bouquets-graphql?documentId=${productId}`;
        
        console.log('🗑️ Deleting product:', { 
          productId, 
          isSingleflower, 
          finalProductType,
          endpoint,
          productName: product?.name,
          hasVarieties: product?.varieties?.length || 0,
          productType: productType
        });
        
        // 1) Швидкий шлях: новий уніфікований ендпоїнт Product
        try {
          const fastResponse = await fetch(`/api/admin/products-delete?documentId=${productId}`, { method: 'DELETE' });
          if (fastResponse.ok) {
            console.log('🗑️ Fast delete successful');
            // Log write-off to recent activities
            try {
              const activity = {
                id: `writeoff_${Date.now()}`,
                type: 'productDeleted',
                createdAt: new Date().toISOString(),
                payload: {
                  documentId: productId,
                  name: product?.name,
                  productType: finalProductType,
            availableQuantity: product?.availableQuantity ?? null,
            price: product?.price ?? 0,
                }
              };
              try {
                append({
                  id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  ts: Date.now(),
                  createdAt: new Date().toISOString(),
                  type: 'productDeleted',
                  source: 'admin',
                  payload: {
                    documentId: activity.payload.documentId,
                    name: product?.name,
                    productType: finalProductType,
                    availableQuantity: activity.payload.availableQuantity ?? 0
                  }
                });
              } catch (e) {
                console.error('Failed to log write-off activity:', e);
              }
            } catch (e) {
              console.error('Failed to log write-off activity:', e);
            }
            await fetchProducts();
            try { router.refresh(); } catch {}
            try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('products:refresh')); } } catch {}
            showNotification('Товар успішно видалено', 'success');
            return;
          } else {
            const fastErrorText = await fastResponse.text();
            console.warn('🗑️ Fast delete failed, falling back to legacy GraphQL:', fastErrorText);
          }
        } catch (e) {
          console.warn('🗑️ Fast delete error, falling back to legacy GraphQL:', e);
        }

        // 2) Резерв: старі GraphQL ендпоїнти
        const response = await fetch(endpoint, { method: 'DELETE' });
        console.log('🗑️ Legacy delete response status:', response.status);
        if (response.ok) {
          // Log write-off to recent activities
          try {
            const activity = {
              id: `writeoff_${Date.now()}`,
              type: 'productDeleted',
              createdAt: new Date().toISOString(),
              payload: {
                documentId: productId,
                name: product?.name,
                productType: finalProductType,
            availableQuantity: product?.availableQuantity ?? null,
            price: product?.price ?? 0,
              }
            };
            try {
              append({
                id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                ts: Date.now(),
                createdAt: new Date().toISOString(),
                type: 'productDeleted',
                source: 'admin',
                payload: {
                  documentId: activity.payload.documentId,
                  name: product?.name,
                  productType: finalProductType,
                  availableQuantity: activity.payload.availableQuantity ?? 0
                }
              });
            } catch (e) {
              console.error('Failed to log write-off activity:', e);
            }
          } catch (e) {
            console.error('Failed to log write-off activity:', e);
          }
          await fetchProducts();
          try { router.refresh(); } catch {}
          try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('products:refresh')); } } catch {}
          showNotification('Товар успішно видалено', 'success');
          return;
        }

        const errorText = await response.text();
        console.error('🗑️ GraphQL Delete error:', errorText);
        showNotification(`Помилка видалення товару: ${response.status} - ${errorText}`, 'error');
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification(`Помилка видалення товару: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      invalidateCache();
      await refreshProducts(); // Refresh the list
      try { router.refresh(); } catch {}
      try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('products:refresh')); } } catch {}
      // Log to recent activities
      try {
        append({
          id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ts: Date.now(),
          createdAt: new Date().toISOString(),
          type: selectedProduct ? 'productUpdated' : 'productCreated',
          source: 'admin',
          payload: {
            documentId: selectedProduct?.documentId || `temp_${Date.now()}`,
            name: formData.name,
            price: formData.price,
            availableQuantity: formData.availableQuantity || 0,
            productType: formData.productType,
            color: formData.color,
            delta: selectedProduct ? (formData.availableQuantity || 0) - (selectedProduct.availableQuantity || 0) : (formData.availableQuantity || 0),
            varieties: formData.varietiesNames || []
          }
        } as any);
      } catch (e) {
        console.error('Failed to log product activity:', e);
      }
      // Notify recent-activities listeners
      // Подія оновлення вже диспатчиться всередині append()
      showNotification(
        selectedProduct ? 'Товар успішно оновлено' : 'Товар успішно створено', 
        'success'
      );
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Помилка збереження товару', 'error');
    }
  };

  const handleSaveVariety = async (varietyData: any) => {
    try {
      await fetchVarieties(); // Refresh the list
      invalidateCache();
      await refreshProducts();
      try { router.refresh(); } catch {}
      try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('products:refresh')); } } catch {}
      // Log to recent activities
      try {
        append({
          id: `ra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ts: Date.now(),
          createdAt: new Date().toISOString(),
          type: selectedVariety ? 'varietyUpdated' : 'varietyCreated',
          source: 'admin',
          payload: {
            documentId: selectedVariety?.documentId || `temp_variety_${Date.now()}`,
            name: varietyData.name,
            slug: varietyData.slug,
            description: varietyData.description,
          }
        } as any);
      } catch (e) {
        console.error('Failed to log variety activity:', e);
      }
      // Notify recent-activities listeners
      // Подія оновлення вже диспатчиться всередині append()
      showNotification(
        selectedVariety ? 'Сорт успішно оновлено' : 'Сорт успішно створено', 
        'success'
      );
    } catch (error) {
      console.error('Error saving variety:', error);
      showNotification('Помилка збереження сорту', 'error');
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const colors = [
    'Білий', 'Червоний', 'Рожевий', 'Жовтий', 'Фіолетовий',
    'Голубий', 'Синій', 'Помаранчевий'
  ];

  // Колекції видалені з нової структури Product

  return (
    <Box sx={{ 
      py: { xs: 2, md: 4 }, 
      backgroundColor: 'linear-gradient(135deg, rgba(46, 125, 50, 0.02) 0%, rgba(76, 175, 80, 0.01) 100%)',
      minHeight: '100vh',
      width: '100%',
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0,
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1rem',
          border: '1px solid rgba(46, 125, 50, 0.1)',
          boxShadow: '0 8px 32px rgba(46, 125, 50, 0.1)',
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontFamily: 'var(--font-playfair)', 
              fontWeight: 700,
              textAlign: isMobile ? 'center' : 'left',
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(46, 125, 50, 0.1)',
            }}
          >
            🌸 Управління товарами
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              variant="outlined"
              onClick={() => { invalidateCache(); refreshProducts(); }}
              sx={{
                borderRadius: '0.75rem',
                border: '2px solid rgba(46, 125, 50, 0.3)',
                color: '#2E7D32',
                backgroundColor: 'rgba(46, 125, 50, 0.05)',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '2px solid rgba(46, 125, 50, 0.5)',
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                },
                minWidth: isMobile ? '100%' : 180,
                py: 1,
              }}
            >
              🔄 Примусово оновити товари
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowVarieties(!showVarieties)}
              sx={{
                borderRadius: '0.75rem',
                border: '2px solid rgba(46, 125, 50, 0.3)',
                color: '#2E7D32',
                backgroundColor: 'rgba(46, 125, 50, 0.05)',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '2px solid rgba(46, 125, 50, 0.5)',
                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                },
                minWidth: isMobile ? '100%' : 140,
                py: 1,
              }}
            >
              🌿 {showVarieties ? 'Сховати сорти' : 'Показати сорти'}
            </Button>
            {/* Кнопку "Додати сорт квітів" прибрано — вона дублюється у блоці "Сорти квітів" */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              sx={{
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)',
                },
                minWidth: isMobile ? '100%' : 160,
                py: 1,
              }}
            >
              ✨ {isMobile ? 'Додати товар' : 'Додати товар'}
            </Button>
          </Box>
        </Box>


      {/* Product Management */}
      <>
        {/* Filters */}
        <ProductFilters
          allProducts={allProducts as any}
          searchTerm={searchTerm}
          filterVariety={filterVariety}
          filterColor={filterColor}
          filterProductType={filterProductType}
          onSearchChange={setSearchTerm}
          onVarietyChange={setFilterVariety}
          onColorChange={setFilterColor}
          onProductTypeChange={setFilterProductType}
          onResetFilters={handleResetFilters}
          showProductTypeFilter={true}
          showResetButton={true}
          variant="admin"
        />

      {/* Varieties Section */}
      {showVarieties && (
        <Card sx={{ 
          mb: 3,
          borderRadius: 0,
          background: 'white',
          border: '1px solid rgba(46, 125, 50, 0.1)',
          boxShadow: 'none',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
            borderBottom: '1px solid rgba(46, 125, 50, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: '#2E7D32',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              🌿 Сорти квітів
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddVariety}
              size="small"
              sx={{
                borderRadius: '0.75rem',
                border: '2px solid rgba(76, 175, 80, 0.3)',
                color: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '2px solid rgba(76, 175, 80, 0.5)',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                },
              }}
            >
              Додати сорт квітів
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)',
                }}>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#2E7D32' }}>Назва</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#2E7D32' }}>Кількість товарів</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#2E7D32' }}>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {varieties.map((variety, index) => (
                  <TableRow 
                    key={variety.documentId} 
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': {
                        backgroundColor: 'rgba(46, 125, 50, 0.02)',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.05)',
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>🌸</Typography>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {variety.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                            {variety.description ? extractTextFromRichText(variety.description) : 'Без опису'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                        {products.filter(product => 
                          product.varieties?.some(v => v.documentId === variety.documentId)
                        ).length}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Редагувати">
                          <IconButton
                            size="small"
                            onClick={() => handleEditVariety(variety)}
                            sx={{
                              color: '#2E7D32',
                              backgroundColor: 'rgba(46, 125, 50, 0.1)',
                              borderRadius: 0,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: '#2E7D32',
                                color: 'white',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Видалити">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVariety(variety.documentId)}
                            sx={{
                              color: '#d32f2f',
                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                              borderRadius: 0,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: '#d32f2f',
                                color: 'white',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Products Table */}
      <Card sx={{ 
        boxSizing: 'border-box',
        width: '100%',
        borderRadius: 0,
        background: 'white',
        border: '1px solid rgba(46, 125, 50, 0.1)',
        boxShadow: 'none',
        overflow: 'hidden',
        '& .MuiTableCell-root': {
          padding: { xs: '0.75rem 0.5rem', sm: '0.75rem 0.5rem' },
        },
        '& .MuiTableRow-root': {
          transition: 'all 0.2s ease',
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(46, 125, 50, 0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.05)',
          }
        },
      }}>
        <TableContainer sx={{ 
          overflowX: 'auto',
          maxWidth: '100%',
          borderRadius: 0,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            borderRadius: 0,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(46, 125, 50, 0.3)',
            borderRadius: 0,
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.5)',
            }
          },
        }}>
          <Table sx={{ 
            minWidth: isMobile ? '100%' : isTablet ? '800px' : 'auto',
            tableLayout: isMobile ? 'fixed' : 'auto',
          }}>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.05) 100%)',
              }}>
                <TableCell align="center" sx={{ 
                  width: isMobile ? '20%' : isTablet ? '25%' : '20%',
                  fontWeight: 700,
                  color: '#2E7D32',
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                  py: { xs: 1, sm: 1.5 }
                }}>
                  Товар
                </TableCell>
                {!isMobile && (
                  <TableCell align="center" sx={{ 
                    width: isTablet ? '12%' : '7%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Ціна
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center" sx={{ 
                    width: isTablet ? '12%' : '7%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Кількість
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center" sx={{ 
                    width: isTablet ? '15%' : '8%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Тип
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center" sx={{ 
                    width: isTablet ? '18%' : '10%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Сорт
                  </TableCell>
                )}
                {!isMobile && !isTablet && (
                  <TableCell align="center" sx={{ 
                    width: '8%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Колір
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center" sx={{ 
                    width: isTablet ? '10%' : '6%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Відображення
                  </TableCell>
                )}
                {!isMobile && !isTablet && (
                  <TableCell align="center" sx={{ 
                    width: '6%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Дата
                  </TableCell>
                )}
                {isMobile && (
                  <TableCell align="center" sx={{ 
                    width: '50%',
                    fontWeight: 700,
                    color: '#2E7D32',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    Характеристики
                  </TableCell>
                )}
                <TableCell align="center" sx={{ 
                  width: isMobile ? '30%' : isTablet ? '18%' : '20%',
                  fontWeight: 700,
                  color: '#2E7D32',
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                  py: { xs: 1, sm: 1.5 }
                }}>
                  Дії
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product) => (
                  <TableRow 
                  key={product.documentId} 
                  sx={{ 
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(46, 125, 50, 0.02)',
                    },
                    // hover вимкнено
                  }}
                >
                  <TableCell sx={{ 
                    width: isMobile ? '20%' : isTablet ? '25%' : '20%',
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.5, sm: 0.75 },
                    }}>
                      <Avatar
                        sx={{
                          width: { xs: 30, sm: 35, md: 40 },
                          height: { xs: 30, sm: 35, md: 40 },
                          backgroundColor: 'rgba(46, 125, 50, 0.1)',
                          flexShrink: 0,
                          border: '2px solid rgba(46, 125, 50, 0.2)',
                        }}
                        src={product.image?.[0]?.url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${product.image[0].url}` : undefined}
                      >
                        {!product.image?.[0]?.url && '🌸'}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{
                            fontWeight: 600,
                            color: '#2E7D32',
                            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' },
                            lineHeight: 1.2,
                            display: isMobile ? '-webkit-box' : undefined,
                            WebkitLineClamp: isMobile ? 2 : undefined,
                            WebkitBoxOrient: isMobile ? 'vertical' : undefined,
                            overflow: 'hidden',
                            textOverflow: isMobile ? undefined : 'ellipsis',
                            whiteSpace: isMobile ? 'normal' : 'nowrap',
                            maxWidth: { xs: '6rem', sm: '8rem', md: '10rem' },
                            mb: isMobile ? 0.25 : 0,
                          }}
                        >
                          {product.name}
                        </Typography>
                        {!isMobile && !isTablet && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              display: 'block',
                              mt: 0.25,
                            }}
                          >
                            ID: {product.documentId.slice(-8)}
                          </Typography>
                        )}
                        {isMobile && (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              color="textSecondary"
                              sx={{
                                fontSize: '0.65rem',
                                lineHeight: 1.2,
                                fontWeight: 500,
                              }}
                            >
                              {product.price}₴
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color={product.availableQuantity === 0 ? 'error.main' : 'textSecondary'}
                              sx={{
                                fontSize: '0.65rem',
                                lineHeight: 1.2,
                                fontWeight: 500,
                              }}
                            >
                              {product.availableQuantity || 0} шт
                            </Typography>
                          </Box>
                        )}
                        {!isMobile && product.description && extractTextFromRichText(product.description).length > 30 ? (
                          <Tooltip 
                            title={extractTextFromRichText(product.description)}
                            placement="top"
                            arrow
                            sx={{
                              '& .MuiTooltip-tooltip': {
                                maxWidth: 300,
                                fontSize: '0.75rem',
                                whiteSpace: 'pre-wrap',
                              }
                            }}
                          >
                            <Typography 
                              variant="caption" 
                              color="textSecondary"
                              sx={{
                                cursor: 'help',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                                fontSize: '0.65rem',
                              }}
                            >
                              {extractTextFromRichText(product.description).substring(0, 30)}...
                              <TextFieldsIcon 
                                sx={{ 
                                  fontSize: 10, 
                                  color: theme.palette.primary.main,
                                }} 
                              />
                            </Typography>
                          </Tooltip>
                        ) : !isMobile && (
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                            {extractTextFromRichText(product.description) || 'Без опису'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <TableCell align="center" sx={{ 
                      width: isTablet ? '12%' : '7%',
                      py: { xs: 1, sm: 1.5 }
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#2E7D32',
                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                          borderRadius: 0,
                          px: 1,
                          py: 0.5,
                          display: 'inline-block',
                        }}
                      >
                        {product.price}₴
                      </Typography>
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell align="center" sx={{ 
                      width: isTablet ? '12%' : '7%',
                      py: { xs: 1, sm: 1.5 }
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: product.availableQuantity === 0 ? '#d32f2f' : '#2E7D32',
                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                          borderRadius: 0,
                          px: 1,
                          py: 0.5,
                          display: 'inline-block',
                        }}
                      >
                        {product.availableQuantity || 0}
                      </Typography>
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell align="center" sx={{ 
                      width: isTablet ? '15%' : '8%',
                      py: { xs: 1, sm: 1.5 }
                    }}>
                      <Chip
                        label={product.productType === 'bouquet' ? 'Букет' : 
                               product.productType === 'singleflower' ? 'Квітка' : 
                               product.productType === 'composition' ? 'Композиція' : 
                               product.productType === 'accessory' ? 'Аксесуар' : 'Невідомо'}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                          height: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          background: 'none',
                          boxShadow: 'none',
                          borderRadius: 0,
                          color: product.productType === 'bouquet' ? '#2E7D32' : 
                                 product.productType === 'singleflower' ? '#4CAF50' : 
                                 '#666',
                          border: 'none',
                          width: '100%',
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                          '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' }
                        }}
                      />
                    </TableCell>
                  )}
                  {isMobile && (
                    <TableCell sx={{ width: '50%' }}>
                      <Grid container spacing={0.5}>
                        <Grid size={{ xs: 12 }}>
                          <Chip
                            label={product.productType === 'bouquet' ? 'Букет' : 
                                   product.productType === 'singleflower' ? 'Квітка' : 
                                   product.productType === 'composition' ? 'Композиція' : 
                                   product.productType === 'accessory' ? 'Аксесуар' : 'Невідомо'}
                            size="small"
                            color={product.productType === 'bouquet' ? 'primary' : 
                                   product.productType === 'singleflower' ? 'secondary' : 'default'}
                            sx={{
                              fontSize: '0.5rem',
                              height: '1rem',
                              width: '100%',
                              '& .MuiChip-label': {
                                px: 0.25,
                                fontSize: '0.5rem',
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Chip
                            label={toUkrainianColor(product.color) || 'Не вказано'}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.secondary.light,
                              color: theme.palette.secondary.contrastText,
                              fontSize: '0.5rem',
                              height: '1rem',
                              width: '100%',
                              '& .MuiChip-label': {
                                px: 0.25,
                                fontSize: '0.5rem',
                              }
                            }}
                          />
                        </Grid>
                        {product.varieties && product.varieties.length > 0 ? (
                          product.varieties.map((variety, index) => (
                            <Grid size={{ xs: 12 }} key={variety.documentId}>
                              <Chip
                                label={variety.name}
                                size="small"
                                sx={{
                                  backgroundColor: theme.palette.primary.light,
                                  color: theme.palette.primary.contrastText,
                                  fontSize: '0.5rem',
                                  height: '1rem',
                                  width: '100%',
                                  '& .MuiChip-label': {
                                    px: 0.25,
                                    fontSize: '0.5rem',
                                  }
                                }}
                              />
                            </Grid>
                          ))
                        ) : (
                          <Grid size={{ xs: 12 }}>
                            <Chip
                              label="Не вказано"
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.grey[300],
                                color: theme.palette.grey[600],
                                fontSize: '0.5rem',
                                height: '1rem',
                                width: '100%',
                                '& .MuiChip-label': {
                                  px: 0.25,
                                  fontSize: '0.5rem',
                                }
                              }}
                            />
                          </Grid>
                        )}
                        <Grid size={{ xs: 12 }}>
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{
                              fontSize: '0.5rem',
                              lineHeight: 1.2,
                              display: 'block',
                              textAlign: 'center',
                            }}
                          >
                            {new Date(product.createdAt).toLocaleDateString('uk-UA', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell align="center" sx={{ 
                      width: isTablet ? '18%' : '10%',
                      py: { xs: 1, sm: 1.5 }
                    }}>
                      {product.varieties && product.varieties.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {product.varieties.slice(0, isTablet ? 2 : 1).map((variety, index) => (
                            <Chip
                              key={variety.documentId}
                              label={variety.name}
                              size="small"
                              sx={{
                                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                                height: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                background: 'none',
                                boxShadow: 'none',
                                borderRadius: 0,
                                color: '#4CAF50',
                                border: 'none',
                                '& .MuiChip-label': {
                                  px: 0.5,
                                },
                                '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' }
                              }}
                            />
                          ))}
                          {product.varieties.length > (isTablet ? 2 : 1) && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.6rem',
                                color: 'text.secondary',
                                fontStyle: 'italic'
                              }}
                            >
                              +{product.varieties.length - (isTablet ? 2 : 1)} більше
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }}
                        >
                          Квітка
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  {!isMobile && !isTablet && (
                    <TableCell align="center">
                      <Grid container spacing={0.5} justifyContent="center">
                        <Grid size={{ xs: 12 }}>
                          <Chip
                            label={toUkrainianColor(product.color) || '-'}
                            size="small"
                            sx={{
                              backgroundColor: 'transparent',
                              background: 'none',
                              boxShadow: 'none',
                              borderRadius: 0,
                              color: theme.palette.text.primary,
                              fontSize: '0.5rem',
                              height: '1rem',
                              width: '100%',
                              '& .MuiChip-label': {
                                px: 0.25,
                                fontSize: '0.5rem',
                              },
                              '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </TableCell>
                  )}
                  {/* Колекції видалені з нової структури Product */}
                  {!isMobile && (
                    <TableCell align="center" sx={{ 
                      width: isTablet ? '10%' : '6%',
                      py: { xs: 1, sm: 1.5 }
                    }}>
                      <Chip
                        label={product.cardType === 'large' ? 'Велика' : 'Стандартна'}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                          height: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          background: 'none',
                          boxShadow: 'none',
                          borderRadius: 0,
                          color: product.cardType === 'large' ? '#FF9800' : '#666',
                          border: 'none',
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                          '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' }
                        }}
                      />
                    </TableCell>
                  )}
                  {!isMobile && !isTablet && (
                    <TableCell align="center">
                      <Grid container spacing={0.5} justifyContent="center">
                        <Grid size={{ xs: 12 }}>
                          <Typography 
                            variant="caption" 
                            color="textSecondary" 
                            sx={{ 
                              fontSize: '0.65rem',
                              lineHeight: 1.2,
                              display: 'block',
                              textAlign: 'center',
                            }}
                          >
                            {new Date(product.createdAt).toLocaleDateString('uk-UA', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ 
                    width: isMobile ? '30%' : isTablet ? '18%' : '20%',
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 0.75 }, 
                      justifyContent: 'center',
                      flexWrap: 'nowrap',
                      alignItems: 'center',
                    }}>
                      <Tooltip title="Переглянути товар">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewProduct(product)}
                          sx={{
                            color: '#2E7D32',
                            backgroundColor: 'rgba(46, 125, 50, 0.1)',
                            borderRadius: 0,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#2E7D32',
                              color: 'white',
                            },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Редагувати товар">
                        <IconButton 
                          size="small"
                          onClick={() => handleEditProduct(product)}
                          sx={{
                            color: '#1976d2',
                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                            borderRadius: 0,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#1976d2',
                              color: 'white',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Видалити товар">
                        <IconButton 
                          size="small"
                          onClick={() => startDeleteProduct(product.documentId, product.varieties?.length > 0 ? 'bouquet' : 'singleflower')}
                          sx={{
                            color: '#d32f2f',
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            borderRadius: 0,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#d32f2f',
                              color: 'white',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Пагінація видалена: повний список донизу */}
      </Card>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
        varieties={varieties}
      />

      {/* Variety Form Dialog */}
      <VarietyFormDialog
        open={varietyDialogOpen}
        onClose={() => setVarietyDialogOpen(false)}
        variety={selectedVariety}
        onSave={handleSaveVariety}
      />

      {/* Write-off/Delete Dialog */}
      <Dialog open={writeoffDialogOpen} onClose={() => setWriteoffDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Списання товару</DialogTitle>
        <DialogContent>
          {writeoffTarget && (() => {
            const p = products.find(pp => pp.documentId === writeoffTarget.productId);
            const current = p?.availableQuantity ?? 0;
            return (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Доступно: {current} шт
                </Typography>
                <TextField
                  fullWidth
                  type="text"
                  inputMode="numeric"
                  label="Кількість для списання"
                  value={writeoffAmountInput}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setWriteoffAmountInput(val);
                    if (val === '') {
                      setWriteoffAmount(0);
                    } else {
                      const num = Number(val);
                      if (!isNaN(num) && num >= 0 && num <= current) {
                        setWriteoffAmount(num);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
                      setWriteoffAmount(0);
                      setWriteoffAmountInput('0');
                    } else {
                      const num = Math.max(0, Math.min(Number(val), current));
                      setWriteoffAmount(num);
                      setWriteoffAmountInput(num.toString());
                    }
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': { borderRadius: 0 },
                    '& .MuiOutlinedInput-notchedOutline': { borderRadius: 0 }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Якщо вказати повну кількість — товар буде повністю видалено
                </Typography>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWriteoffDialogOpen(false)} sx={{ borderRadius: 0 }}>Скасувати</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!writeoffTarget) return;
              const { productId, productType } = writeoffTarget;
              setWriteoffDialogOpen(false);
              await handleDeleteProductWithAmount(productId, writeoffAmount, productType);
              setWriteoffTarget(null);
            }}
            sx={{ borderRadius: 0 }}
          >
            Підтвердити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={SNACKBAR_DURATION_MS}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            '& .MuiPaper-root': {
              maxWidth: 1000,
              width: 'calc(100% - 32px)'
            },
            // expose duration to children via css var
            '--fs-duration': `${SNACKBAR_DURATION_MS}ms`,
          }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              fontSize: '1rem',
              px: 2,
              py: 1,
              minHeight: 56,
              borderRadius: 1.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              position: 'relative',
              overflow: 'hidden',
              '& .MuiAlert-icon': { fontSize: '1.25rem', mr: 1 },
              '& .MuiAlert-message': {
                flex: 1,
                textAlign: 'center',
                fontWeight: 600,
                lineHeight: 1.2,
              },
            }}
          >
            {snackbarMessage}
            {/* Bottom progress bar timer (10s) */}
            <Box
              sx={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 8,
                height: 3,
                borderRadius: 999,
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.35)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  bgcolor: 'currentColor',
                  opacity: 0.7,
                  animationName: snackbarOpen ? 'fsTimer' : 'none',
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationDuration: 'var(--fs-duration)'
                },
                '@keyframes fsTimer': {
                  from: { width: 0 },
                  to: { width: '100%' },
                },
              }}
            />
          </Alert>
        </Snackbar>
        </>

      </Container>
    </Box>
  );
}
