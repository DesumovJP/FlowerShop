# 🎉 Фінальне налаштування Docker для Strapi з завантаженням зображень

## ✅ Що налаштовано

### 1. Docker Volume для зображень
```yaml
volumes:
  - ./uploads:/app/backend/public/uploads
```
**Важливо**: Це дозволяє зберігати зображення локально і не губити їх при перезапуску контейнера.

### 2. Повна конфігурація Docker
- ✅ **Dockerfile**: Налаштовано для Sharp та системних залежностей
- ✅ **docker-compose.yml**: Volume для uploads + права доступу
- ✅ **Strapi конфігурація**: Upload plugin з оптимізацією
- ✅ **Sharp**: Додано до залежностей для обробки зображень

## 🚀 Запуск проекту

### Крок 1: Запуск Docker контейнера
```bash
# Запустити контейнер
docker-compose up -d

# Перевірити статус
docker-compose ps

# Переглянути логи
docker-compose logs -f strapi
```

### Крок 2: Доступ до Strapi
- **Адмінка**: http://localhost:1337/admin
- **API**: http://localhost:1337/api

## 📁 Структура файлів

```
flowershop3/
├── uploads/                    # 📁 Локальна директорія для зображень
│   ├── [timestamp]_image.jpg   # Оригінальні файли
│   ├── [timestamp]_image_large.jpg  # Оптимізовані версії
│   └── [timestamp]_image_medium.jpg
├── backend/
│   └── public/
│       └── uploads/           # 🔗 Зв'язано з ./uploads через volume
└── docker-compose.yml         # Налаштування volumes
```

## 🔧 Налаштування завантаження

### Розміри файлів
- **Максимальний розмір**: 10MB
- **Підтримувані формати**: JPG, PNG, GIF, WebP
- **Оптимізація**: Автоматична з різними розмірами

### Breakpoints (розміри зображень)
- **xlarge**: 1920px
- **large**: 1000px  
- **medium**: 750px
- **small**: 500px
- **xsmall**: 64px

## 🧪 Тестування завантаження

### 1. Через адмінку Strapi
1. Відкрийте http://localhost:1337/admin
2. Перейдіть до **Content Manager**
3. Створіть новий **Bouquet** або **Singleflower**
4. Завантажте зображення
5. Перевірте, що файл з'явився в `./uploads/` директорії

### 2. Перевірка volume
```bash
# Переглянути файли в uploads
ls -la uploads/

# Переглянути файли в контейнері
docker exec -it flowershop3-strapi-1 ls -la /app/backend/public/uploads/
```

## 🔄 Управління контейнером

### Перезапуск
```bash
# Перезапустити контейнер
docker-compose restart

# Перезапустити з перебудовою
docker-compose down
docker-compose up -d --build
```

### Очищення
```bash
# Зупинити контейнер
docker-compose down

# Видалити контейнер та образи
docker-compose down --rmi all

# Очистити кеш Docker
docker system prune -f
```

## 🐛 Вирішення проблем

### Проблема: "EPERM: operation not permitted"
```bash
# Рішення: Перезапустити з новими правами
docker-compose down
docker-compose up -d
```

### Проблема: "Sharp module not found"
```bash
# Рішення: Перебудувати контейнер
docker-compose build --no-cache
docker-compose up -d
```

### Проблема: Зображення не зберігаються
```bash
# Перевірити volume
docker-compose exec strapi ls -la /app/backend/public/uploads/

# Перевірити права доступу
docker-compose exec strapi ls -la /app/backend/public/
```

## 📊 Моніторинг

### Логи контейнера
```bash
# Всі логи
docker-compose logs

# Логи в реальному часі
docker-compose logs -f strapi

# Останні 100 рядків
docker-compose logs --tail=100 strapi
```

### Статистика ресурсів
```bash
# Використання ресурсів
docker stats flowershop3-strapi-1

# Розмір контейнера
docker images flowershop3-strapi
```

## 🎯 Результат

Після успішного налаштування:

✅ **Strapi запущений** на http://localhost:1337  
✅ **Завантаження зображень** працює без помилок  
✅ **Volume налаштований** - зображення зберігаються локально  
✅ **Sharp працює** - оптимізація зображень активна  
✅ **Права доступу** налаштовані правильно  
✅ **Немає помилок EPERM** або Sharp  

## 🆘 Якщо щось не працює

1. **Перевірте логи**: `docker-compose logs -f strapi`
2. **Перезапустіть**: `docker-compose restart`
3. **Перебудуйте**: `docker-compose build --no-cache && docker-compose up -d`
4. **Очистіть кеш**: `docker system prune -f`

---

**🎉 Готово!** Тепер ви можете завантажувати зображення для букетів та одиночних квітів в адмінці Strapi без помилок, і всі файли будуть зберігатися локально в директорії `./uploads/`.













