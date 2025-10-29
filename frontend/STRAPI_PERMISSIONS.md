# Налаштування дозволів в Strapi для адмін-панелі

## Огляд

Для роботи адмін-панелі з вашим Strapi бекендом потрібно налаштувати дозволи для API токенів. Це дозволить адмін-панелі виконувати CRUD операції з товарами.

## Крок 1: Створення API токена

1. **Увійдіть в адмін-панель Strapi**
   - Відкрийте `http://localhost:1337/admin`
   - Увійдіть з вашими обліковими даними

2. **Перейдіть в Settings → API Tokens**
   - В лівому меню натисніть "Settings"
   - Виберіть "API Tokens"

3. **Створіть новий токен**
   - Натисніть "Create new API Token"
   - Заповніть поля:
     - **Name**: `Admin Panel Token`
     - **Description**: `Token for admin panel CRUD operations`
     - **Token duration**: `Unlimited` (або встановіть потрібний термін)

## Крок 2: Налаштування дозволів

### Для Content Type "Bouquet1" (Товари)

1. **В розділі "Token permissions" знайдіть "Bouquet1"**

2. **Встановіть наступні дозволи:**
   - ✅ **find** (GET) - для отримання списку товарів
   - ✅ **findOne** (GET) - для отримання одного товару
   - ✅ **create** (POST) - для створення нових товарів
   - ✅ **update** (PUT) - для редагування товарів
   - ✅ **delete** (DELETE) - для видалення товарів

### Для Content Type "Variety1" (Сорти квітів)

1. **Знайдіть "Variety1" в списку**

2. **Встановіть дозволи:**
   - ✅ **find** (GET) - для отримання списку сортів
   - ✅ **findOne** (GET) - для отримання одного сорту

### Для Media (Зображення)

1. **Знайдіть "Media" в списку**

2. **Встановіть дозволи:**
   - ✅ **find** (GET) - для отримання зображень
   - ✅ **findOne** (GET) - для отримання одного зображення
   - ✅ **create** (POST) - для завантаження зображень
   - ✅ **update** (PUT) - для редагування зображень
   - ✅ **delete** (DELETE) - для видалення зображень

## Крок 3: Збереження токена

1. **Натисніть "Save"**
2. **Скопіюйте згенерований токен** (він виглядає приблизно так: `abc123def456...`)
3. **Додайте токен в `.env.local` файл:**

```env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=ваш_токен_тут
NEXT_PUBLIC_API_URL=http://localhost:1337
```

## Крок 4: Перевірка налаштувань

### Тестування через API

Можете протестувати токен через curl або Postman:

```bash
# Тест отримання товарів
curl -H "Authorization: Bearer ваш_токен" \
     http://localhost:1337/api/bouquet1s

# Тест створення товару
curl -X POST \
     -H "Authorization: Bearer ваш_токен" \
     -H "Content-Type: application/json" \
     -d '{"data":{"name":"Тестовий букет","price":1000}}' \
     http://localhost:1337/api/bouquet1s
```

### Тестування через адмін-панель

1. Запустіть frontend: `yarn dev`
2. Відкрийте `http://localhost:3000/admin`
3. Перейдіть в розділ "Товари"
4. Спробуйте додати новий товар

## Можливі проблеми та рішення

### Помилка 403 Forbidden
- **Причина**: Неправильні дозволи або недійсний токен
- **Рішення**: Перевірте дозволи в Strapi та правильність токена

### Помилка 401 Unauthorized
- **Причина**: Токен не передається або недійсний
- **Рішення**: Перевірте змінні середовища та формат токена

### Помилка 404 Not Found
- **Причина**: Неправильний URL або endpoint
- **Рішення**: Перевірте, що Strapi запущений на правильному порту

### Помилка CORS
- **Причина**: Проблеми з CORS налаштуваннями
- **Рішення**: Додайте `http://localhost:3000` в CORS налаштування Strapi

## Додаткові налаштування

### CORS налаштування в Strapi

Якщо виникають проблеми з CORS, додайте в `backend/config/middlewares.ts`:

```typescript
export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'res.cloudinary.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:3000', 'http://localhost:1337']
    }
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

## Безпека

⚠️ **Важливо**: 
- Ніколи не додавайте API токени в Git
- Використовуйте різні токени для різних середовищ (dev, staging, production)
- Регулярно оновлюйте токени
- Обмежуйте дозволи тільки тими, що необхідні для роботи

## Підтримка

Якщо виникають проблеми:
1. Перевірте логи Strapi в консолі
2. Перевірте логи Next.js в консолі
3. Перевірте Network tab в DevTools браузера
4. Переконайтеся, що всі сервіси запущені на правильних портах

