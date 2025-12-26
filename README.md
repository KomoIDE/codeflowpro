# CodeFlow Pro - Веб-редактор кода с AI-помощником

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/KomoIDE/codeflow)

![CodeFlow Pro Preview](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/36a99c4a-8919-4e6e-ac9e-e55974407200/public)

Современный веб-редактор кода с интеграцией искусственного интеллекта, работающий на Cloudflare. Проект предоставляет пользователям возможность разработки, редактирования и управления проектами прямо в браузере с использованием мощных AI-помощников.

## Особенности

- 🚀 Многофункциональный редактор кода (на базе Monaco Editor)
- ⚡️ Интеграция с AI (Google Gemini, OpenAI GPT, Anthropic Claude)
- 📦 Поддержка множества языков программирования
- 🔄 Управление проектами и файлами
- 🔐 Безопасная аутентификация
- 🎨 Адаптивный дизайн (работает на ПК и мобильных устройствах)
- 📱 Мобильные оверлеи для боковых панелей
- 🤖 AI помощник с возможностью выбора модели
- 👑 Админ-панель для управления
- 🔄 Совместная работа (в будущих версиях)
- 🧩 Плагины и расширения (в будущих версиях)

## Архитектура

### Фронтенд
- React 19
- React Router 7
- Vite 6
- TypeScript
- Tailwind CSS
- Monaco Editor

### Бэкенд
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- AI API интеграция (Gemini, GPT, Claude)

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/KomoIDE/codeflow.git
cd codeflow
```

### 2. Установка зависимостей

```bash
npm install
# или
bun install
```

### 3. Установка и настройка Cloudflare

```bash
npm install -g wrangler
wrangler login
```

### 4. Создание D1 базы данных

```bash
wrangler d1 create codeflow-d1
```

### 5. Настройка переменных окружения

```bash
wrangler secret put JWT_SECRET
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENAI_API_KEY
```

### 6. Запуск в режиме разработки

```bash
npm run dev
```

### 7. Деплой на production

```bash
npm run deploy
```

## Структура проекта

```
codeflow-pro-react/
├── app/                    # Исходники фронтенда
│   ├── lib/               # Библиотеки и утилиты
│   ├── routes/            # Файлы маршрутов
│   ├── components/        # Компоненты интерфейса
│   └── types.ts           # Типы TypeScript
├── workers/               # Файлы Cloudflare Worker
│   └── app.ts             # Основной файл worker
├── public/                # Статические файлы
├── wrangler.toml          # Конфигурация Cloudflare
├── package.json           # Зависимости проекта
├── tsconfig.json          # Конфигурация TypeScript
└── vite.config.ts         # Конфигурация Vite
```

## API

### Аутентификация
- `POST /api/auth/login` - Вход пользователя
- `POST /api/auth/register` - Регистрация пользователя

### Пользователи
- `GET /api/users/me` - Получить информацию о текущем пользователе

### Проекты
- `GET /api/projects` - Получить проекты пользователя
- `POST /api/projects` - Создать новый проект
- `GET /api/projects/:id` - Получить конкретный проект
- `PUT /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект

### Файлы
- `GET /api/projects/:projectId/files` - Получить файлы проекта
- `POST /api/projects/:projectId/files` - Создать файл
- `PUT /api/projects/:projectId/files/:fileId` - Обновить файл
- `DELETE /api/projects/:projectId/files/:fileId` - Удалить файл

### AI
- `POST /api/ai/generate` - Генерация кода с помощью AI

## Технологии

- Frontend: React 19, React Router 7, Vite 6, TypeScript
- Editor: Monaco Editor
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- AI: Gemini, GPT, Claude API
- Hosting: Cloudflare Pages/Workers
- Version Control: Git, GitHub

## Возможности AI

- Генерация кода по описанию
- Исправление ошибок в коде
- Добавление комментариев к коду
- Рефакторинг и оптимизация
- Ответы на вопросы о коде
- Поддержка нескольких языков программирования

## Мобильная версия

- Адаптивный дизайн для всех устройств
- Мобильные оверлеи для левой и правой панелей
- Оптимизированные сенсорные жесты
- Полнофункциональный редактор на мобильных устройствах

## Безопасность

- JWT-аутентификация
- Хеширование паролей
- CORS заголовки
- Защита от XSS и CSRF атак
- Ограничение скорости запросов

## Лицензия

MIT License - разрешено использование, изменение и распространение