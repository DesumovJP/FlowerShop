# 🖼️ Повне налаштування завантаження зображень з прив'язкою

## 🎯 Проблема

В Strapi v5 API `/upload` **НЕ прив'язує файли автоматично** до контенту, навіть якщо передавати `ref`, `refId` та `field`. Файли завантажуються в Media Library, але не прив'язуються до товарів.

## 🔧 Рішення

Потрібно робити **два кроки**:
1. **Завантажити файли** через `/api/upload`
2. **Прив'язати файли** через PUT запит до контенту

## 📋 Покрокова інструкція

### Крок 1: Налаштування Docker

#### 1.1 Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Встановлюємо системні залежності для Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

# Встановлюємо Yarn
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

# Копіюємо package.json файли
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Встановлюємо залежності
RUN yarn install

# Копіюємо весь проект
COPY . .

# Встановлюємо права доступу
RUN mkdir -p /app/backend/public/uploads && \
    chown -R node:node /app/backend/public/uploads && \
    chmod -R 755 /app/backend/public/uploads

# Створюємо cache директорію для corepack
RUN mkdir -p /.cache/node/corepack/v1 && \
    chown -R node:nodejs /.cache && \
    chmod -R 755 /.cache

# Збираємо Strapi
WORKDIR /app/backend
RUN yarn build

# Створюємо користувача
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

# Встановлюємо права доступу
RUN chown -R strapi:nodejs /app && \
    chmod -R 755 /app

USER strapi

CMD ["yarn", "strapi", "develop"]
```

#### 1.2 docker-compose.yml
```yaml
services:
  strapi:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "1337:1337"
    volumes:
      - ./backend:/app/backend
      - ./uploads:/app/backend/public/uploads  # ВАЖЛИВО: Volume для зображень
    environment:
      DATABASE_CLIENT: sqlite
      NODE_ENV: development
      HOST: 0.0.0.0
      PORT: 1337
      COREPACK_HOME: /app/.cache/corepack
    restart: unless-stopped
```

### Крок 2: Налаштування Strapi

#### 2.1 backend/package.json
```json
{
  "dependencies": {
    "sharp": "^0.33.0"
  }
}
```

#### 2.2 backend/config/plugins.ts
```typescript
export default () => ({
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 10000000, // 10MB
        localServer: {
          maxage: 300000,
        },
      },
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
      responsiveDimensions: true,
      optimize: true,
    },
  },
});
```

#### 2.3 backend/config/middlewares.ts
```typescript
export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:3000', 'http://localhost:1337', 'http://localhost:8080']
    }
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: "256mb",
      jsonLimit: "256mb",
      textLimit: "256mb",
      formidable: {
        maxFileSize: 200 * 1024 * 1024, // 200MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### Крок 3: Схеми контенту

#### 3.1 Bouquet schema (backend/src/api/bouquet/content-types/bouquet/schema.json)
```json
{
  "attributes": {
    "image": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images", "files", "videos", "audios"]
    }
  }
}
```

#### 3.2 Singleflower schema (backend/src/api/singleflower/content-types/singleflower/schema.ts)
```typescript
export default {
  attributes: {
    image: {
      type: 'media',
      multiple: true,
      allowedTypes: ['images'],
    },
  },
};
```

### Крок 4: Frontend логіка (Next.js)

#### 4.1 Створення товару з зображеннями
```typescript
// 1. Створюємо товар
const productData = {
  data: {
    name: "Назва товару",
    price: 1000,
    description: "Опис"
  }
};

const productResponse = await fetch(`${API_BASE}/bouquets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productData)
});

const product = await productResponse.json();
const productId = product.data.documentId;

// 2. Завантажуємо зображення
const uploadedFiles = [];

for (const file of selectedFiles) {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::bouquet.bouquet');
  formData.append('refId', productId);
  formData.append('field', 'image');
  
  const uploadResponse = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (uploadResponse.ok) {
    const uploadResult = await uploadResponse.json();
    uploadedFiles.push(...uploadResult);
  }
}

// 3. Прив'язуємо файли до товару
if (uploadedFiles.length > 0) {
  // Отримуємо поточні файли
  const contentResponse = await fetch(`${API_BASE}/bouquets/${productId}?populate=image`);
  const contentData = await contentResponse.json();
  
  const currentFiles = contentData.data.image || [];
  const currentFileIds = currentFiles.map(f => f.id);
  
  // Додаємо нові файли
  const newFileIds = uploadedFiles.map(file => file.id);
  const updatedFileIds = [...currentFileIds, ...newFileIds];
  
  // Оновлюємо товар
  await fetch(`${API_BASE}/bouquets/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: { image: updatedFileIds }
    })
  });
}
```

### Крок 5: Тестування

#### 5.1 Створення тестового HTML файлу
```html
<!DOCTYPE html>
<html>
<head>
    <title>Тест завантаження</title>
</head>
<body>
    <form id="uploadForm">
        <input type="text" id="name" placeholder="Назва" required>
        <input type="number" id="price" placeholder="Ціна" required>
        <input type="file" id="image" accept="image/*" multiple>
        <button type="submit">Створити</button>
    </form>
    
    <script>
        const API_BASE = 'http://localhost:1337/api';
        
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const price = parseFloat(document.getElementById('price').value);
            const images = document.getElementById('image').files;
            
            // 1. Створюємо товар
            const productResponse = await fetch(`${API_BASE}/bouquets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: { name, price }
                })
            });
            
            const product = await productResponse.json();
            const productId = product.data.documentId;
            
            // 2. Завантажуємо зображення
            const uploadedFiles = [];
            for (const file of images) {
                const formData = new FormData();
                formData.append('files', file);
                formData.append('ref', 'api::bouquet.bouquet');
                formData.append('refId', productId);
                formData.append('field', 'image');
                
                const uploadResponse = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const result = await uploadResponse.json();
                    uploadedFiles.push(...result);
                }
            }
            
            // 3. Прив'язуємо файли
            if (uploadedFiles.length > 0) {
                const contentResponse = await fetch(`${API_BASE}/bouquets/${productId}?populate=image`);
                const contentData = await contentResponse.json();
                
                const currentFiles = contentData.data.image || [];
                const currentFileIds = currentFiles.map(f => f.id);
                const newFileIds = uploadedFiles.map(file => file.id);
                const updatedFileIds = [...currentFileIds, ...newFileIds];
                
                await fetch(`${API_BASE}/bouquets/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: { image: updatedFileIds }
                    })
                });
            }
            
            alert('Товар створено з зображеннями!');
        });
    </script>
</body>
</html>
```

## 🚨 Типові проблеми та рішення

### Проблема 1: "EPERM: operation not permitted"
**Рішення:**
```bash
docker-compose down
docker-compose up -d
```

### Проблема 2: "Sharp module not found"
**Рішення:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Проблема 3: "Cannot read properties of null (reading 'useContext')"
**Рішення:** Використовувати альтернативний інтерфейс замість адмінки Strapi

### Проблема 4: Файли завантажуються, але не прив'язуються
**Рішення:** Додати крок 3 (прив'язка файлів) до логіки

### Проблема 5: "CORS error"
**Рішення:** Оновити `backend/config/middlewares.ts` з правильними origin

## 🔧 Команди для швидкого налаштування

```bash
# 1. Зупинити контейнер
docker-compose down

# 2. Видалити старий образ
docker rmi flowershop3-strapi

# 3. Очистити кеш
docker system prune -f

# 4. Перебудувати
docker-compose build --no-cache

# 5. Запустити
docker-compose up -d

# 6. Перевірити логи
docker-compose logs -f strapi
```

## 📊 Перевірка роботи

### 1. API працює
```bash
curl http://localhost:1337/api/bouquets
```

### 2. Завантаження працює
```bash
curl -X POST http://localhost:1337/api/upload \
  -F "files=@test-image.jpg" \
  -F "ref=api::bouquet.bouquet" \
  -F "refId=YOUR_PRODUCT_ID" \
  -F "field=image"
```

### 3. Volume працює
```bash
ls -la uploads/
```

## 🎯 Результат

Після налаштування:
- ✅ Файли завантажуються в Media Library
- ✅ Файли прив'язуються до товарів
- ✅ Зображення відображаються в адмінці
- ✅ Volume працює - файли зберігаються локально
- ✅ Немає помилок EPERM або Sharp

## 📝 Ключові моменти

1. **Завжди робити два кроки:** завантаження + прив'язка
2. **Використовувати volume** для збереження файлів
3. **Додавати Sharp** до залежностей
4. **Налаштовувати CORS** правильно
5. **Тестувати через HTML** якщо адмінка не працює

---
**Готово!** Тепер ви знаєте, як налаштувати систему завантаження зображень з прив'язкою в Strapi v5! 🚀









