# 🐳 Налаштування Docker для Strapi з завантаженням файлів

## ✅ Що було налаштовано

### 1. Dockerfile оновлено
- Додано системні залежності для Sharp (vips-dev, python3, make, g++)
- Налаштовано права доступу для uploads директорії
- Створено безпечного користувача strapi
- Оптимізовано кешування Docker

### 2. docker-compose.yml оновлено
- Додано змінні середовища для правильної роботи
- Налаштовано користувача для безпеки
- Підключено volumes для uploads

### 3. Strapi конфігурація
- **plugins.ts**: Налаштовано upload plugin з оптимізацією зображень
- **middlewares.ts**: Налаштовано CORS та обмеження розміру файлів
- **package.json**: Додано Sharp для обробки зображень

### 4. Схеми контенту
- **Bouquet**: Підтримує множинні зображення
- **Singleflower**: Підтримує множинні зображення
- Обидві схеми мають UID поля для правильної роботи з API

## 🚀 Інструкції для запуску

### Крок 1: Перебудова Docker контейнера

**Для Windows:**
```bash
# Запустіть цей файл
rebuild-docker.bat
```

**Для Linux/Mac:**
```bash
# Зробіть файл виконуваним
chmod +x rebuild-docker.sh

# Запустіть скрипт
./rebuild-docker.sh
```

**Або вручну:**
```bash
# Зупинити контейнери
docker-compose down

# Видалити старий образ
docker rmi flowershop3-strapi

# Очистити кеш
docker system prune -f

# Перебудувати
docker-compose build --no-cache

# Запустити
docker-compose up -d
```

### Крок 2: Перевірка роботи

1. **Відкрийте Strapi адмінку**: http://localhost:1337/admin
2. **Перейдіть до Content Manager**
3. **Створіть новий Bouquet або Singleflower**
4. **Спробуйте завантажити зображення**

### Крок 3: Перевірка логів

```bash
# Переглянути логи Strapi
docker-compose logs -f strapi

# Переглянути логи всіх сервісів
docker-compose logs -f
```

## 🔧 Налаштування завантаження файлів

### Розміри файлів
- **Максимальний розмір файлу**: 10MB
- **Максимальний розмір форми**: 256MB
- **Підтримувані формати**: JPG, PNG, GIF, WebP

### Оптимізація зображень
- **Breakpoints**: xlarge (1920px), large (1000px), medium (750px), small (500px), xsmall (64px)
- **Responsive dimensions**: Увімкнено
- **Optimization**: Увімкнено

### Права доступу
- **Uploads директорія**: `/app/backend/public/uploads`
- **Користувач**: strapi (UID: 1001)
- **Права**: 755 (rwxr-xr-x)

## 🐛 Вирішення проблем

### Проблема: "EPERM: operation not permitted"
**Рішення**: Перезапустіть Docker з новими правами доступу
```bash
docker-compose down
docker-compose up -d
```

### Проблема: "Sharp module not found"
**Рішення**: Перебудуйте контейнер
```bash
docker-compose build --no-cache
```

### Проблема: "CORS error"
**Рішення**: Перевірте, що frontend запущений на localhost:3000

### Проблема: "File too large"
**Рішення**: Перевірте розмір файлу (максимум 10MB)

## 📁 Структура файлів

```
uploads/
├── [timestamp]_[filename].jpg    # Оригінальні файли
├── [timestamp]_[filename]_large.jpg    # Оптимізовані версії
├── [timestamp]_[filename]_medium.jpg
└── [timestamp]_[filename]_small.jpg
```

## 🔍 Тестування

### 1. Завантаження через адмінку
1. Відкрийте http://localhost:1337/admin
2. Перейдіть до Content Manager
3. Створіть новий Bouquet
4. Завантажте зображення
5. Перевірте, що файл з'явився в uploads директорії

### 2. Завантаження через API
```bash
curl -X POST http://localhost:1337/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test-image.jpg" \
  -F "ref=api::bouquet.bouquet" \
  -F "refId=YOUR_BOUQUET_ID" \
  -F "field=image"
```

## ✅ Перевірка успішного налаштування

Якщо все працює правильно, ви повинні побачити:
- ✅ Strapi запускається без помилок
- ✅ Можете завантажувати зображення в адмінці
- ✅ Файли зберігаються в uploads директорії
- ✅ Зображення відображаються в Content Manager
- ✅ Немає помилок Sharp або EPERM

## 🆘 Якщо щось не працює

1. **Перевірте логи**: `docker-compose logs -f strapi`
2. **Перезапустіть контейнер**: `docker-compose restart`
3. **Перебудуйте образ**: `docker-compose build --no-cache`
4. **Очистіть кеш**: `docker system prune -f`

---

**Готово!** 🎉 Тепер ви можете завантажувати зображення для букетів та одиночних квітів в адмінці Strapi без помилок EPERM та Sharp.









