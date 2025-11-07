'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EditOutlined as EditOutlinedIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import ProductsPage from './products/page';
import ShiftReportList from '../components/ShiftReportList';
import ShiftReportForm from '../components/ShiftReportForm';
import ShiftCalendar from '../components/ShiftCalendar';
import ShiftReportModal from '../components/ShiftReportModal';
import RecentActivitiesTable from '../components/RecentActivitiesTable';
import POSSystem from '../components/POSSystem';

const drawerWidth = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

function AdminLayout({ children, selectedTab, onTabChange }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: 'POS Термінал', icon: <InventoryIcon /> },
    { id: 'products', label: 'Товари', icon: <InventoryIcon /> },
    { id: 'shifts', label: 'Моя зміна', icon: <ScheduleIcon /> },
    { id: 'recent', label: 'Останні дії', icon: <HistoryIcon /> },
  ];

  const drawer = (
    <Box>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'inherit'
          }
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'var(--font-playfair)',
            fontWeight: 700,
            mb: 1,
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          🌸 Phoenix Admin
        </Typography>
      </Box>


      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedTab === item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                borderRadius: 3,
                mb: 1,
                mx: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)',
                  color: '#2E7D32',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(76, 175, 80, 0.15) 100%)',
                    transform: 'translateY(-1px)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#2E7D32',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: selectedTab === item.id 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: selectedTab === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: mobileOpen ? 'blur(8px)' : 'blur(20px)',
          color: '#1A1A1A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          transition: 'backdrop-filter 0.3s ease-in-out',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          </Typography>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)'
            }}>
              <PersonIcon />
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(2px)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          mt: 8, // AppBar height
          overflow: 'hidden', // Prevent horizontal scroll
          filter: mobileOpen ? 'blur(4px)' : 'none',
          transition: 'filter 0.3s ease-in-out',
          pointerEvents: mobileOpen ? 'none' : 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// My Shift Content Component
function MyShiftContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [monthStats, setMonthStats] = useState<{ cashTotal: number; writeoffTotal: number; ordersCount: number }>({ cashTotal: 0, writeoffTotal: 0, ordersCount: 0 });

  const handleDayClick = (date: string, report?: any) => {
    setSelectedDate(date);
    setSelectedReport(report);
    setModalOpen(true);
  };

  const handleAddShift = (date: string) => {
    setSelectedDate(date);
    setSelectedReport(null);
    setModalOpen(true);
  };

  const handleSave = async (data: any, itemsSnapshot?: any[]) => {
    try {
      console.log('handleSave called with data:', data);
      console.log('handleSave called with itemsSnapshot:', itemsSnapshot);
      
      // Використовуємо GraphQL API для створення звітів
      const url = '/api/shift-reports-graphql';
      const method = 'POST';
      
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          itemsSnapshot: itemsSnapshot || []
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        setModalOpen(false);
        setSelectedReport(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Помилка при збереженні');
      }
    } catch (error) {
      console.error('Error saving shift report:', error);
      alert('Помилка при збереженні зміни: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/shift-reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error('Помилка при видаленні зміни');
      }
    } catch (error) {
      console.error('Error deleting shift report:', error);
      throw error;
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Helpers to get month boundaries from ISO date string
  const getMonthBounds = (isoDate?: string) => {
    const base = isoDate ? new Date(isoDate) : new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(end) };
  };

  // Fetch monthly stats via REST proxy (reliable in Strapi v5)
  const fetchMonthlyStats = async () => {
    try {
      const base = selectedDate ? new Date(selectedDate) : new Date();
      const month = String(base.getMonth() + 1).padStart(2, '0');
      const year = String(base.getFullYear());
      const res = await fetch(`/api/shift-reports?month=${month}&year=${year}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch monthly stats:', res.status, errorData);
        setMonthStats({ cashTotal: 0, writeoffTotal: 0, ordersCount: 0 });
        return;
      }
      
      const json = await res.json();
      // Strapi v5 може повертати дані в різних форматах
      const list = json?.data || [];
      let cashTotal = 0;
      let writeoffTotal = 0;
      let ordersCount = 0;
      
      for (const item of list) {
        // Обробляємо обидва формати: з attributes (v4) та без (v5)
        const attr = item.attributes || item;
        cashTotal += Number(attr.cash || 0);
        
        const snap = attr.itemsSnapshot || {};
        ordersCount += Number(snap?.ordersCount || 0);
        
        const items = Array.isArray(snap?.items) ? snap.items : [];
        for (const it of items) {
          const w = Number(it?.writtenOff || 0);
          const price = Number(it?.price || 0);
          writeoffTotal += w * price;
        }
      }
      
      setMonthStats({ cashTotal, writeoffTotal, ordersCount });
    } catch (e) {
      console.error('Failed to fetch monthly stats:', e);
      setMonthStats({ cashTotal: 0, writeoffTotal: 0, ordersCount: 0 });
    }
  };

  useEffect(() => { fetchMonthlyStats(); }, [selectedDate, refreshTrigger]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Sticky header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        mb: 3,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(250,252,255,0.7) 100%)',
        border: '1px solid rgba(46,125,50,0.08)',
        boxShadow: '0 6px 24px rgba(46,125,50,0.08)',
        borderRadius: 0,
        px: { xs: 2, sm: 3 },
        py: { xs: 1.25, sm: 1.5 },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: 'var(--font-playfair)', 
              fontWeight: 700,
              color: '#2E7D32'
            }}
          >
            Моя зміна
          </Typography>
        {/* Кнопки "Оновити" та "Додати зміну" приховано за вимогою */}
        </Box>
      </Box>

      {/* Calendar card - glassmorphism */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)',
        border: '1px solid rgba(46,125,50,0.08)',
        boxShadow: '0 12px 32px rgba(46,125,50,0.08)',
        borderRadius: 0,
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(16px)'
      }}>
        <ShiftCalendar
          onDayClick={handleDayClick}
          onAddShift={handleAddShift}
          refreshTrigger={refreshTrigger}
        />
      </Box>

      {/* Monthly stats under the calendar */}
      <Box sx={{
        mt: 2,
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)',
        border: '1px solid rgba(46,125,50,0.08)',
        boxShadow: '0 12px 32px rgba(46,125,50,0.08)',
        borderRadius: 0,
        p: { xs: 2, sm: 3 },
        overflow: 'hidden'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Статистика за місяць</Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', color: 'text.secondary' }}>
          <Typography>Каса за місяць: <b>{monthStats.cashTotal}₴</b></Typography>
          <Typography>Списання за місяць: <b>{monthStats.writeoffTotal}₴</b></Typography>
          <Typography>Здійснено продажів: <b>{monthStats.ordersCount}</b></Typography>
        </Box>
        {/* В розробці overlay */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'text.secondary', fontWeight: 700,
          fontSize: { xs: '0.95rem', sm: '1.1rem' }
        }}>
          В розробці
        </Box>
      </Box>

      <ShiftReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate}
        report={selectedReport}
        onSave={handleSave}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
      />
    </Container>
  );
}

// Recent Activity Content Component
function RecentActivityContent() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)',
        border: '1px solid rgba(46,125,50,0.08)',
        boxShadow: '0 12px 32px rgba(46,125,50,0.08)',
        borderRadius: 0,
        p: { xs: 2, sm: 3 },
        backdropFilter: 'blur(16px)'
      }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#2E7D32', mb: 2 }}>
          Останні дії
        </Typography>

        <RecentActivitiesTable />
      </Box>
    </Container>
  );
}

// POS Terminal Content Component
function DashboardContent() {
  const theme = useTheme();
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all products for POS system
  React.useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch('/api/products?page=1&pageSize=1000');
        if (response.ok) {
          const data = await response.json();
          setRecentProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching products for POS:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  const handleViewProduct = (product: any) => {
    window.open(`/product/${product.slug}`, '_blank');
  };

  const handleEditProduct = (product: any) => {
    // Navigate to products page with edit mode
    window.location.href = '/admin?tab=products';
  };

  return (
    <>
      {loading ? (
        <Box sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1.5,
          backgroundColor: '#f5f5f5'
        }}>
          <Box sx={{
            fontSize: 64,
            animation: 'spin 2.4s linear infinite',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' }
            }
          }}>
            🌸
          </Box>
          <Box sx={{
            color: 'text.secondary',
            fontSize: 18,
            fontWeight: 500
          }}>
            Завантаження...
          </Box>
        </Box>
      ) : (
        <POSSystem />
      )}
    </>
  );
}

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const renderContent = () => {
    switch (selectedTab) {
      case 'products':
        return <ProductsPage />;
      case 'shifts':
        return <MyShiftContent />;
      case 'recent':
        return <RecentActivityContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <AdminLayout selectedTab={selectedTab} onTabChange={setSelectedTab}>
      {renderContent()}
    </AdminLayout>
  );
}
