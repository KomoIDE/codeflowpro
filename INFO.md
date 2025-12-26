# CodeFlow Pro - Веб-редактор кода с AI-помощником

## Описание
CodeFlow Pro - это облачный веб-редактор кода с интеграцией искусственного интеллекта, работающий на платформе Cloudflare. Проект предоставляет пользователям возможность разработки, редактирования и управления проектами прямо в браузере с использованием мощных AI-помощников.

## Особенности
- Многофункциональный редактор кода (на базе Monaco Editor)
- Интеграция с AI (Google Gemini, OpenAI GPT, Anthropic Claude)
- Поддержка множества языков программирования
- Управление проектами и файлами
- Адаптивный дизайн (работает на ПК и мобильных устройствах)
- Сворачиваемые папки в файловом дереве
- Темная/светлая тема
- Аутентификация пользователей
- Мобильные оверлеи для боковых панелей
- AI помощник с возможностью выбора модели
- Админ-панель для управления

## Технологии
- Frontend: React 19, React Router 7, Vite 6, TypeScript
- Editor: Monaco Editor
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite)
- AI: Gemini, GPT, Claude API
- Hosting: Cloudflare Pages/Workers

## Архитектура
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

## Установка и запуск
1. Установите Node.js и npm
2. Установите Wrangler CLI: `npm install -g wrangler`
3. Аутентифицируйтесь в Cloudflare: `wrangler login`
4. Установите зависимости: `npm install`
5. Запустите в режиме разработки: `npm run dev`

## Деплой
1. Создайте D1 базу данных: `wrangler d1 create codeflow-d1`
2. Обновите wrangler.toml с ID базы данных
3. Установите секреты: `wrangler secret put JWT_SECRET`
4. Деплой на production: `npm run deploy`

## API
- `/api/auth/login` - Вход пользователя
- `/api/auth/register` - Регистрация пользователя
- `/api/users/me` - Получить информацию о пользователе
- `/api/projects` - Управление проектами
- `/api/files` - Управление файлами
- `/api/ai/generate` - Генерация кода с помощью AI

## Лицензия
MIT License