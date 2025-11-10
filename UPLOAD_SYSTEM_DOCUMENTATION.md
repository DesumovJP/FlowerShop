# Система завантаження зображень - Детальна документація

## 🎯 Огляд системи

Система завантаження зображень в квітковому магазині складається з кількох компонентів, які працюють разом для завантаження файлів та їх прив'язки до контенту в Strapi.

## 🏗️ Архітектура

```
Frontend (Next.js) → Next.js API Route → Strapi Backend → File System + Database
```

### Компоненти:
1. **Frontend** - форма завантаження зображень
2. **Next.js API Route** (`/api/upload`) - проксі та логіка прив'язки
3. **Strapi Backend** - обробка файлів та збереження в БД
4. **File System** - збереження фізичних файлів
5. **Database** - збереження метаданих та зв'язків

## 📁 Структура файлів

```
frontend/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts          # Next.js API route для завантаження
│   └── admin/
│       └── products/
│           └── page.tsx          # Frontend форма завантаження
backend/
├── src/
│   └── api/
│       └── bouquet/
│           └── content-types/
│               └── bouquet/
│                   └── schema.json  # Схема Bouquet з UID полем
└── public/
    └── uploads/                 # Фізичні файли
```

## 🔄 Процес завантаження

### 1. Frontend ініціює завантаження

**Файл:** `frontend/app/admin/products/page.tsx`

```typescript
// Створюємо FormData з файлом та метаданими
const uploadFormData = new FormData();
uploadFormData.append('files', imageFile);
uploadFormData.append('ref', 'api::bouquet.bouquet');  // Тип контенту
uploadFormData.append('refId', bouquetId);            // UID букету
uploadFormData.append('field', 'image');               // Поле для прив'язки

// Відправляємо на Next.js API
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: uploadFormData,
});
```

### 2. Next.js API Route обробляє запит

**Файл:** `frontend/app/api/upload/route.ts`

#### Крок 1: Проксування до Strapi
```typescript
// Отримуємо FormData з frontend
const formData = await request.formData();
const ref = formData.get('ref') as string;      // 'api::bouquet.bouquet'
const refId = formData.get('refId') as string;  // UID букету
const field = formData.get('field') as string;  // 'image'

// Проксуємо до Strapi
const response = await fetch(`${STRAPI_URL}/api/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
  body: formData,
});
```

#### Крок 2: Strapi обробляє файл
Strapi автоматично:
- Зберігає файл у файлову систему (`backend/public/uploads/`)
- Створює запис у Media Library
- Повертає метадані файлу з `id` та `documentId`

#### Крок 3: Прив'язка файлу до контенту
```typescript
// Отримуємо поточний стан контенту
const contentUrl = `${STRAPI_URL}/api/bouquets/${refId}?populate=image`;
const contentResponse = await fetch(contentUrl, {
  headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }
});

// Отримуємо існуючі файли
const currentFiles = contentData.data[field] || [];
const currentFileIds = currentFiles.map(f => f.id);

// Додаємо нові файли до існуючих
const newFileIds = result.map(file => file.id);
const updatedFileIds = [...currentFileIds, ...newFileIds];

// Оновлюємо контент
const updateResponse = await fetch(`${STRAPI_URL}/api/bouquets/${refId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: { [field]: updatedFileIds }
  }),
});
```

## 🔑 Ключові особливості

### 1. Використання UID замість числових ID

**Проблема:** Strapi v5 з кастомними UID полями не підтримує стандартні числові ID в REST API.

**Рішення:** Використовуємо `documentId` (UID) напряму для всіх операцій.

```typescript
// ❌ Не працює з UID полями
const response = await fetch(`/api/bouquets/123`);

// ✅ Працює з UID полями  
const response = await fetch(`/api/bouquets/gvtzfmuqnka1w8dw5x13orei`);
```

### 2. Структура відповіді Strapi

```json
{
  "data": {
    "id": 27,                              // Числовий ID (внутрішній)
    "documentId": "gvtzfmuqnka1w8dw5x13orei", // UID (публічний)
    "name": "Літній бриз",
    "image": null                          // Поле зображень
  }
}
```

### 3. Схема Bouquet

**Файл:** `backend/src/api/bouquet/content-types/bouquet/schema.json`

```json
{
  "attributes": {
    "image": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images", "files", "videos", "audios"]
    },
    "slug": {
      "type": "uid",
      "targetField": "name"
    }
  }
}
```

## 🚨 Вирішені проблеми

### Проблема 1: "Content entry not found"
**Причина:** Використання числового ID замість UID
**Рішення:** Використання `documentId` напряму

### Проблема 2: "Cannot read properties of undefined"
**Причина:** Неправильна структура відповіді Strapi
**Рішення:** Використання `contentData.data[field]` замість `contentData.data.attributes[field]`

### Проблема 3: GraphQL помилки
**Причина:** Складна GraphQL схема для простих операцій
**Рішення:** Використання REST API замість GraphQL

## 📊 Логування та дебаг

Система включає детальне логування для відстеження процесу:

```typescript
console.log('🚀 Next.js Upload API called');
console.log('📁 Upload API - Received FormData entries:');
console.log('🔗 Forwarding to Strapi: http://localhost:1337/api/upload');
console.log('📊 Strapi response status: 201');
console.log('✅ Upload successful:', result);
console.log('🔗 Linking files to content:', { ref, refId, field });
console.log('🔍 Fetching content from:', contentUrl);
console.log('📄 Content data:', JSON.stringify(contentData, null, 2));
console.log('✅ Files linked to content:', updateResult);
```

## 🔧 Налаштування

### Environment Variables
```env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token_here
```

### Strapi Configuration
```typescript
// backend/config/plugins.ts
export default () => ({
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        localServer: {
          maxage: 300000,
        },
      },
    },
  },
});
```

## 🎯 Результат

Після успішного завантаження:

1. **Файл зберігається** в `backend/public/uploads/`
2. **Запис створюється** в Strapi Media Library
3. **Файл прив'язується** до букету через поле `image`
4. **Зображення відображається** в адмін панелі Strapi

## 🔄 Майбутні покращення

1. **Валідація файлів** - перевірка типу та розміру
2. **Оптимізація зображень** - автоматичне зменшення розміру
3. **Пакетне завантаження** - завантаження кількох файлів одночасно
4. **Прогрес бар** - відображення прогресу завантаження
5. **Помилки обробки** - детальні повідомлення про помилки

## 📝 Висновок

Система завантаження зображень тепер працює стабільно та ефективно, використовуючи сучасні підходи Strapi v5 з UID полями та REST API для простих операцій.
















