'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { read as readRecentActivities } from '../utils/recentActivities.store';

type RecentActivitiesTableProps = {
  data?: any[];
};

export default function RecentActivitiesTable({ data }: RecentActivitiesTableProps) {
  const [activities, setActivities] = React.useState<any[]>(data || []);

  React.useEffect(() => {
    if (data) {
      // If data is provided via props (e.g., from a saved shift), use it as-is
      setActivities(Array.isArray(data) ? data : []);
      return;
    }
    const load = () => {
      try {
        setActivities(readRecentActivities());
      } catch {
        setActivities([]);
      }
    };
    load();
    const handler = () => load();
    if (typeof window !== 'undefined') {
      window.addEventListener('recentActivities:update', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('recentActivities:update', handler);
      }
    };
  }, [data]);

  return (
    <Box sx={{
      border: 1,
      borderColor: 'grey.300',
      borderRadius: 1,
      overflowY: 'auto',
      overflowX: 'auto',
      maxHeight: { xs: '45vh', md: '40vh' },
      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
      lineHeight: 1.25,
      '& table': { width: '100%', tableLayout: 'fixed' },
      '& th, & td': {
        padding: { xs: '6px 8px', md: '8px 10px' },
        verticalAlign: 'top',
        wordBreak: 'break-word',
        whiteSpace: 'normal'
      },
      '& .col-sum': {
        display: { xs: 'none', md: 'table-cell' }
      }
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Подія</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Дата/час</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Деталі</th>
            <th className="col-sum" style={{ textAlign: 'right', padding: '8px 10px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>Сума</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((entry: any, idx: number) => {
            const ts = entry.createdAt || entry.ts || Date.now();
            const dateStr = new Date(ts).toLocaleString('uk-UA', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            });
            // Визначаємо формат (старий/новий) для order
            const isOrder = entry.type === 'order' || !!entry.items;
            const items = entry.payload?.items || entry.items || [];
            const isWriteoff = entry.type === 'productDeleted';
            const isDelivery = entry.type === 'productCreated' || entry.type === 'productUpdated';

            if (isOrder) {
              const total = entry.total ?? (items.reduce((s: number, it: any) => s + (it.total ?? (it.price || 0) * (it.quantity || 0)), 0));
              const payment = entry.paymentMethod === 'card' ? 'Картка' : entry.paymentMethod === 'cash' ? 'Готівка' : (entry.payload?.paymentMethod === 'card' ? 'Картка' : entry.payload?.paymentMethod === 'cash' ? 'Готівка' : '—');
              const includeDelivery = entry.includeDelivery ?? entry.payload?.includeDelivery;
              const deliveryPrice = entry.deliveryPrice ?? entry.payload?.deliveryPrice;
              const comment = entry.comment ?? entry.payload?.comment;
              return (
                <React.Fragment key={`order_${idx}`}>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(165,214,167,0.12) 100%)',
                    border: '1px solid rgba(46, 125, 50, 0.16)'
                  }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Замовлення {entry.id}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                      Сума: <b>{total}₴</b> • Оплата: {payment}
                      {includeDelivery ? <> • Доставка: так{typeof deliveryPrice === 'number' ? `, ${deliveryPrice}₴` : ''}</> : ' • Доставка: ні'}
                      {comment ? <> • Коментар: {comment}</> : null}
                    </td>
                    <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{total}₴</td>
                  </tr>
                  {items.map((it: any, iIdx: number) => (
                    <tr key={`oi_${idx}_${iIdx}`} style={{ 
                      background: 'linear-gradient(135deg, rgba(46,125,50,0.08) 0%, rgba(165,214,167,0.12) 100%)',
                      border: '1px solid rgba(46, 125, 50, 0.16)'
                    }}>
                      <td style={{ padding: '6px 10px 6px 24px', color: '#666' }} colSpan={2}>{it.name || it.documentId}</td>
                      <td style={{ padding: '6px 10px', color: '#666' }}>{(it.quantity || 0)} × {(it.price || 0)}₴ = {(it.total ?? ((it.price || 0) * (it.quantity || 0)))}₴</td>
                      <td className="col-sum" style={{ padding: '6px 10px', textAlign: 'right', color: '#666' }}>{it.total ?? ((it.price || 0) * (it.quantity || 0))}₴</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            }

            if (isWriteoff) {
              const name = entry.payload?.name;
              const type = entry.payload?.productType;
              const qty = entry.payload?.availableQuantity ?? 0;
              const remaining = entry.payload?.remainingAfter;
              return (
                <tr key={`w_${idx}`} style={{ 
                  background: 'linear-gradient(135deg, rgba(211,47,47,0.12) 0%, rgba(244,67,54,0.16) 100%)',
                  border: '1px solid rgba(211, 47, 47, 0.25)'
                }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Списання товару</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    Назва: <b>{name || '—'}</b>{type ? ` • Тип: ${type}` : ''}<br/>
                    Списано: {qty} шт{(typeof remaining === 'number' && remaining >= 0) ? ` • Залишок: ${remaining} шт` : ''}
                  </td>
                  <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>—</td>
                </tr>
              );
            }

            if (isDelivery) {
              const name = entry.payload?.name;
              const type = entry.payload?.productType;
              const qty = entry.payload?.availableQuantity ?? 0;
              const price = entry.payload?.price ?? 0;
              return (
                <tr key={`d_${idx}`} style={{ 
                  background: 'linear-gradient(135deg, rgba(33,150,243,0.10) 0%, rgba(144,202,249,0.16) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.25)'
                }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>Поставка</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    Назва: <b>{name || '—'}</b>{type ? ` • Тип: ${type}` : ''}<br/>
                    Кількість: {qty}{price ? ` • Ціна: ${price}₴` : ''}
                  </td>
                  <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{price ? `${price}₴` : '—'}</td>
                </tr>
              );
            }

            // Fallback для інших подій
            return (
              <tr key={`x_${idx}`} style={{ 
                background: 'linear-gradient(135deg, rgba(233,30,99,0.08) 0%, rgba(244,143,177,0.12) 100%)',
                border: '1px solid rgba(233, 30, 99, 0.16)'
              }}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{entry.type}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>{dateStr}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>—</td>
                <td className="col-sum" style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>—</td>
              </tr>
            );
          })}

          {activities.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'center', color: '#757575' }}>Немає активностей</td>
            </tr>
          )}
        </tbody>
      </table>
    </Box>
  );
}