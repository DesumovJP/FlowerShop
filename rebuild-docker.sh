#!/bin/bash

echo "🔄 Перебудова Docker контейнера для Strapi..."

# Зупиняємо та видаляємо існуючі контейнери
echo "🛑 Зупиняємо існуючі контейнери..."
docker-compose down

# Видаляємо старий образ
echo "🗑️ Видаляємо старий образ..."
docker rmi flowershop3-strapi 2>/dev/null || true

# Очищаємо кеш Docker
echo "🧹 Очищаємо кеш Docker..."
docker system prune -f

# Встановлюємо права доступу для uploads директорії
echo "📁 Встановлюємо права доступу для uploads..."
sudo chown -R 1001:1001 ./uploads 2>/dev/null || chown -R 1001:1001 ./uploads
chmod -R 755 ./uploads

# Перебудовуємо та запускаємо контейнери
echo "🔨 Перебудовуємо контейнери..."
docker-compose build --no-cache

echo "🚀 Запускаємо контейнери..."
docker-compose up -d

echo "✅ Готово! Strapi доступний на http://localhost:1337"
echo "📊 Для перегляду логів: docker-compose logs -f strapi"









