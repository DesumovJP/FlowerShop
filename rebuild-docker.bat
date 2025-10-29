@echo off
echo 🔄 Перебудова Docker контейнера для Strapi...

REM Зупиняємо та видаляємо існуючі контейнери
echo 🛑 Зупиняємо існуючі контейнери...
docker-compose down

REM Видаляємо старий образ
echo 🗑️ Видаляємо старий образ...
docker rmi flowershop3-strapi 2>nul

REM Очищаємо кеш Docker
echo 🧹 Очищаємо кеш Docker...
docker system prune -f

REM Встановлюємо права доступу для uploads директорії
echo 📁 Встановлюємо права доступу для uploads...
if not exist uploads mkdir uploads

REM Перебудовуємо та запускаємо контейнери
echo 🔨 Перебудовуємо контейнери...
docker-compose build --no-cache

echo 🚀 Запускаємо контейнери...
docker-compose up -d

echo ✅ Готово! Strapi доступний на http://localhost:1337
echo 📊 Для перегляду логів: docker-compose logs -f strapi
pause









