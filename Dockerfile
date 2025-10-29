FROM node:20-alpine

# Встановлюємо локалізацію для UTF-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

WORKDIR /app

# Встановлюємо системні залежності для Sharp та інших нативних модулів
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

# Встановлюємо Yarn 4 (Berry)
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

# Копіюємо package.json файли спочатку для кращого кешування
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Встановлюємо залежності
RUN yarn install

# Копіюємо весь монорепозиторій (виключаючи node_modules)
COPY . .

# Перевстановлюємо залежності в контейнері для правильної платформи
RUN rm -rf node_modules backend/node_modules && yarn install

# Встановлюємо права доступу для uploads директорії
RUN mkdir -p /app/backend/public/uploads && \
    chown -R node:node /app/backend/public/uploads && \
    chmod -R 755 /app/backend/public/uploads

# Збираємо Strapi
WORKDIR /app/backend
RUN yarn build

# Створюємо користувача для безпеки
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

# Встановлюємо права доступу
RUN chown -R strapi:nodejs /app && \
    chmod -R 755 /app

# Створюємо cache директорію для corepack
RUN mkdir -p /.cache/node/corepack/v1 && \
    chown -R strapi:nodejs /.cache && \
    chmod -R 755 /.cache

USER strapi

# Запускаємо Strapi
CMD ["yarn", "strapi", "develop"]
