# 🌸 FlowerShop - Інструкція з налаштування проекту

## 📋 Зміст
1. [Клонування проекту](#клонування-проекту)
2. [Налаштування Backend](#налаштування-backend)
3. [Налаштування Frontend](#налаштування-frontend)
4. [Запуск проекту](#запуск-проекту)
5. [Важлива інформація](#важлива-інформація)

---

## 🔽 Клонування проекту

```bash
git clone https://github.com/DesumovJP/FlowerShop.git
cd FlowerShop
```

---

## ⚙️ Налаштування Backend

### 1. Перейти в директорію backend
```bash
cd backend
```

### 2. Встановити залежності
```bash
yarn install
```

### 3. Створити .env файл
Створіть файл `.env` на основі `.env.example`:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

**Важливо:** Для продакшну використовуйте безпечні ключі. Для розробки можна використати тестові значення.

### 4. Перевірка бази даних
База даних `backend/data/data.db` тепер включена в репозиторій і містить всі продукти! ✅

### 5. Запустити backend
```bash
yarn develop
```

Backend запуститься на `http://localhost:1337`

---

## 🎨 Налаштування Frontend

### 1. Перейти в директорію frontend
```bash
cd ../frontend
```

### 2. Встановити залежності
```bash
yarn install
```

### 3. Створити .env.local файл
Створіть файл `.env.local` в директорії frontend:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_API_URL=http://localhost:1337/api
```

### 4. Запустити frontend
```bash
yarn dev
```

Frontend запуститься на `http://localhost:3000`

---

## 🚀 Запуск проекту

### Варіант 1: Локальний запуск

**Термінал 1 - Backend:**
```bash
cd backend
yarn develop
```

**Термінал 2 - Frontend:**
```bash
cd frontend
yarn dev
```

### Варіант 2: Docker (опціонально)

```bash
docker-compose up
```

---

## 📌 Важлива інформація

### База даних
- **SQLite база даних** (`backend/data/data.db`) тепер включена в репозиторій
- Містить всі продукти, категорії та дані
- При клонуванні проекту база даних автоматично завантажується
- Розмір: ~1.5MB

### Зображення продуктів
- Зображення зберігаються в `backend/public/uploads/`
- Якщо зображень немає, вони будуть автоматично створюватися при завантаженні
- Можна скопіювати зображення з основного проекту

### Доступи
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:1337/api
- **Strapi Admin:** http://localhost:1337/admin

### Перше налаштування Strapi Admin
При першому запуску backend потрібно створити адміністратора:
1. Відкрийте http://localhost:1337/admin
2. Створіть обліковий запис адміністратора
3. Налаштуйте права доступу для публічних API (Settings → Users & Permissions Plugin → Public)

### Корисні команди

**Backend:**
```bash
yarn develop    # Режим розробки
yarn start      # Продакшн режим
yarn build      # Збірка проекту
```

**Frontend:**
```bash
yarn dev        # Режим розробки
yarn build      # Збірка для продакшну
yarn start      # Запуск продакшн збірки
```

### Структура проекту
```
FlowerShop/
├── backend/           # Strapi backend
│   ├── data/         # База даних SQLite
│   ├── public/       # Публічні файли та завантаження
│   ├── src/          # Вихідний код API
│   └── config/       # Конфігурація Strapi
├── frontend/         # Next.js frontend
│   ├── app/          # App Router Next.js
│   ├── components/   # React компоненти
│   └── public/       # Статичні файли
└── uploads/          # Додаткові завантаження
```

---

## 🐛 Вирішення проблем

### Проблема: Не завантажуються зображення
**Рішення:** Перевірте, чи файли є в `backend/public/uploads/`. Якщо ні, скопіюйте з основного проекту.

### Проблема: Backend не запускається
**Рішення:** 
1. Перевірте `.env` файл
2. Видаліть `node_modules` та запустіть `yarn install` знову
3. Перевірте, чи порт 1337 не зайнятий

### Проблема: Frontend не може з'єднатися з Backend
**Рішення:**
1. Переконайтеся, що backend запущений
2. Перевірте `.env.local` у frontend
3. Перевірте, чи правильний URL: `http://localhost:1337`

### Проблема: Немає продуктів
**Рішення:** Після останнього оновлення база даних включена в репозиторій! Просто зробіть `git pull` щоб отримати останні зміни.

---

## 📞 Контакти

Якщо виникли питання або проблеми, перевірте документацію:
- `FINAL_SETUP_GUIDE.md`
- `UPLOAD_SYSTEM_DOCUMENTATION.md`
- `INVENTORY_SYSTEM_DOCUMENTATION.md`
- `SHIFT_SYSTEM_DOCUMENTATION.md`

---

**Успішної роботи з FlowerShop! 🌸**

