# Інструкція по створенню товарів

## Крок 1: Отримати API токен з Strapi

1. Відкрийте Strapi Admin: http://localhost:1337/admin
2. Перейдіть: Settings → API Tokens → Create new API Token
3. Назва: "Product Creator"
4. Token type: Full access
5. Скопіюйте згенерований токен

## Крок 2: Додати токен до .env файлу

Додайте до файлу `backend/.env`:

```
STRAPI_API_TOKEN=ваш_токен_тут
```

## Крок 3: Запустити скрипт

В директорії `backend`:

```bash
npm run create-products
```

Або через yarn:

```bash
yarn create-products
```

Або тимчасово через змінну оточення:

```powershell
$env:STRAPI_API_TOKEN='ваш_токен'; npm run create-products
```

## Що буде створено:

- ✅ 10 букетів (bouquet)
- ✅ 10 композицій (else)
- ✅ 10 одиночних квітів (singleflower)
- ✅ 10 супутніх товарів (else) - добрива, горщики, грунт тощо

Всі товари мають:
- Реалістичні назви українською
- Опис
- Ціни
- Кольори (де застосовно)
- Доступну кількість

**Після створення товарів вам потрібно буде додати фото вручну через Strapi Admin.**

