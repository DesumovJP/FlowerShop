@echo off
echo 🔄 Перебудова Docker з UTF-8 підтримкою...

echo 🛑 Зупиняємо контейнери...
docker-compose down -v

echo 🗑️ Видаляємо старі образи...
docker rmi flowershop3-strapi 2>nul

echo 🏗️ Збираємо новий образ...
docker-compose build --no-cache

echo 🚀 Запускаємо з новими налаштуваннями...
docker-compose up -d

echo ✅ Готово! Тепер Strapi підтримує UTF-8
echo 📝 Перевірте логи: docker-compose logs -f strapi









