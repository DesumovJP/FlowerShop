# Специфікація "Останні дії" (Recent Activities)

## Мета
- Надійно зберігати продажі, списання, поставки в "Останні дії" до закриття зміни
- При закритті зміни: злити знімок з агрегованими діями; очистити сховище дій
- Уникнути дублювання, гонки потоків та розбіжностей схеми

## Модель даних (localStorage ключ: recentActivities)
- Тип: масив записів дій; обмежений (наприклад, 500)
- Загальні поля:
  - id: string (uuid)
  - ts: number (Date.now)
  - type: "order" | "productDeleted" | "productCreated" | "productUpdated"
  - source: "pos" | "admin" | "api"
  - workerSlug?: string
- Payload за типом:
  - order: { items: Array<{ documentId: string; quantity: number; price?: number }> }
  - productDeleted: { documentId: string; availableQuantity: number }
  - productCreated|productUpdated: { documentId: string; availableQuantity: number, delta?: number }
- Інваріанти:
  - documentId обов'язковий для подій на рівні продукту
  - кількості невід'ємні; delta опціональний, але бажаний для поставок

## Життєвий цикл сховища
- Додавати при кожній події (продаж POS, списання адміном, створення/оновлення адміном)
- Емітувати window event 'recentActivities:update' після запису
- UI споживач тільки для читання (список "Останні дії" в адмінці)
- При успішному закритті зміни:
  - Агрегувати по продукту: { sold, writtenOff, delivered }
  - Зберегти в Strapi shift JSON itemsSnapshot з кількостями та полями дій
  - Видалити localStorage recentActivities, емітувати update event
- При помилці закриття зміни: не очищати; показати toast помилки

## API утилітарного модуля (recentActivities.store.ts)
- append(activity: Activity): void
  - Читає існуючі, додає activity на початок, обмежує довжину, записує, диспатчить event
- read(): Activity[]
- clear(): void
  - removeItem та диспатчить event
- aggregate(): Record<string, { sold: number; writtenOff: number; delivered: number }>
  - Продажі: сума order.items.quantity по documentId
  - Списання: сума productDeleted.availableQuantity
  - Поставки: віддати перевагу payload.delta якщо є; інакше позитивний availableQuantity як fallback
- calculateTotalSales(products, agg): number
  - Сума price*agg[docId].sold з fallback ціни продукту 0

## Точки інтеграції
- POSSystem.tsx
  - При успішному підтвердженні замовлення: append({ type: "order", items, source: "pos", ts, id })
- admin/products/page.tsx
  - При видаленні продукту: append({ type: "productDeleted", payload, source: "admin" })
  - При створенні/оновленні продукту: append({ type: "productCreated"|"productUpdated", payload з delta якщо відомо })
- ShiftReportModal.tsx
  - Для попереднього перегляду в режимі створення: activity = aggregate()
  - При finalizeShift: itemsSnapshot включає sold, delivered, writtenOff
  - Після успішного finalize: clear()

## Надійність та UX
- Обмежити записи щоб уникнути переповнення сховища (наприклад, 500)
- Валідувати форми перед append; захищатися від помилок JSON parse
- Показувати бейдж в адмін "Останні дії" тільки на основі довжини масиву (не потрібно в заголовку модалки)
- Опціонально дублювати в sessionStorage як останній резерв (майбутнє)

## Крайові випадки
- Перезавантаження додатку/браузера: дані зберігаються
- Кілька вкладок: dispatch event підтримує списки узгодженими
- Часткові замовлення або скасовані операції: додавати тільки на шляхах успіху
- Відсутній documentId: пропустити з console.warn
- Зміни цін: totalSales використовує поточну ціну продукту на момент закриття; прийнятне наближення

## Чек-лист тестування (ручний)
- Продаж POS додає order в recentActivities і адмін "Останні дії" оновлюється в реальному часі
- Видалення продукту додає productDeleted
- Створення/оновлення зі збільшенням кількості додає поставку
- Закриття зміни зберігає itemsSnapshot з агрегованими полями і очищає recentActivities
- Повторне відкриття модалки після закриття показує порожні "Останні дії"
- Помилка при закритті зберігає recentActivities недоторканими

