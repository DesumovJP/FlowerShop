# Налаштування змінних середовища

## Проблема
Адмін-панель показує помилку "Помилка завантаження товарів" тому, що не налаштовані змінні середовища для підключення до Strapi.

## Рішення

### 1. Створіть файл `.env.local` в папці `frontend/`

Створіть файл `frontend/.env.local` з наступним вмістом:

```env
# Strapi Configuration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

**Примітка**: Якщо у вас вже є `NEXT_PUBLIC_API_URL=http://localhost:1337`, просто додайте:
```env
STRAPI_API_TOKEN=your_strapi_api_token_here
```

### 2. Отримайте API Token з Strapi

1. Відкрийте Strapi Admin Panel: `http://localhost:1337/admin`
2. Перейдіть в **Settings** → **API Tokens**
3. Створіть новий токен:
   - **Name**: `Admin Panel Token`
   - **Token type**: `Full access`
   - **Token duration**: `Unlimited`
4. Скопіюйте згенерований токен
5. Замініть `your_strapi_api_token_here` на ваш токен

### 3. Перевірте, що Strapi запущений

Переконайтеся, що Strapi сервер запущений на `http://localhost:1337`

### 4. Перезапустіть Next.js сервер

Після створення `.env.local` файлу перезапустіть Next.js сервер:

```bash
npm run dev
# або
yarn dev
```

### 5. Тестування з'єднання

Відкрийте в браузері: `http://localhost:3000/api/test-strapi`

Це покаже детальну інформацію про з'єднання з Strapi.

## Можливі проблеми

### Strapi не запущений
- Переконайтеся, що Strapi сервер запущений
- Перевірте, що він працює на порту 1337

### Неправильний API Token
- Переконайтеся, що токен має права на `Bouquet1` та `Variety1`
- Перевірте, що токен не закінчився

### Неправильний URL
- Переконайтеся, що `STRAPI_URL` вказує на правильний адрес
- Якщо Strapi працює на іншому порту, змініть URL

## Додаткова інформація

Дивіться також:
- `STRAPI_PERMISSIONS.md` - налаштування дозволів
- `ADMIN_SETUP.md` - загальне налаштування адмін-панелі
