# CodeFlow Pro - Полное руководство по установке и использованию

## Обзор проекта

CodeFlow Pro - это облачный веб-редактор кода с интеграцией искусственного интеллекта, работающий на платформе Cloudflare. Проект предоставляет пользователям возможность разработки, редактирования и управления проектами прямо в браузере с использованием мощных AI-помощников.

## Технические требования

- Node.js >= 18.0.0
- npm или bun
- Аккаунт на Cloudflare
- wrangler CLI инструмент

## Установка и настройка

### 1. Установка зависимостей

```bash
npm install
# или
bun install
```

### 2. Установка Wrangler CLI

```bash
npm install -g wrangler
# или
bun install -g wrangler
```

### 3. Аутентификация в Cloudflare

```bash
wrangler login
```

### 4. Создание D1 базы данных

```bash
wrangler d1 create codeflow-d1
```

После создания базы данных обновите `wrangler.toml`, указав реальный ID базы данных:

```toml
[[d1_databases]]
binding = "DB"
database_name = "codeflow-d1"
database_id = "your-actual-database-id-here"
```

### 5. Установка переменных окружения

```bash
wrangler secret put JWT_SECRET
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENAI_API_KEY
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

## Деплой

### 1. Локальная разработка

```bash
npm run dev
# или
bun run dev
```

### 2. Деплой на production

```bash
npm run deploy
# или
bun run deploy
```

## Конфигурация

### wrangler.toml

```toml
name = "codeflow-pro"
main = "workers/app.ts"
compatibility_date = "2024-12-24"

# Переменные окружения
[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret-here"

# Привязка к D1 базе данных
[[d1_databases]]
binding = "DB"
database_name = "codeflow-d1"
database_id = "YOUR_DATABASE_ID_HERE"

# Привязка к AI
[ai]
binding = "AI"

# Настройки маршрутов
routes = [
  { pattern: "your-domain.workers.dev/*", zone_id: "YOUR_ZONE_ID_HERE" }
]
```

## API Эндпоинты

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
- `GET /api/projects/:projectId/files/:fileId` - Получить файл
- `PUT /api/projects/:projectId/files/:fileId` - Обновить файл
- `DELETE /api/projects/:projectId/files/:fileId` - Удалить файл

### AI
- `POST /api/ai/generate` - Генерация кода с помощью AI

## Безопасность

- Все API-запросы требуют JWT-токена в заголовке Authorization
- Пароли хешируются перед сохранением
- Реализована защита от CSRF и XSS атак
- CORS заголовки настроены для безопасности

## Особенности реализации

### Мобильная версия
- Адаптивный дизайн для всех устройств
- Мобильные оверлеи для боковых панелей
- Оптимизированные сенсорные жесты

### Интеграция с AI
- Поддержка нескольких провайдеров (Google Gemini, OpenAI GPT, Anthropic Claude)
- Возможность выбора модели и ввода API-ключа
- Локальное хранение настроек

### Редактор кода
- Monaco Editor с подсветкой синтаксиса
- Поддержка множества языков программирования
- Темная/светлая тема

## Возможные проблемы и решения

### 1. Ошибка "Database not initialized"
- Убедитесь, что D1 база данных создана
- Проверьте правильность database_id в wrangler.toml
- Убедитесь, что миграции применены

### 2. Ошибка CORS
- Проверьте, что включен Access-Control-Allow-Origin
- Убедитесь, что домен фронтенда указан в разрешенных

### 3. Ошибка аутентификации
- Проверьте правильность JWT_SECRET
- Убедитесь, что токены генерируются корректно

### 4. Ошибка с AI API
- Убедитесь, что API ключи настроены правильно
- Проверьте, что AI привязка настроена в wrangler.toml

## Мониторинг и логирование

Для просмотра логов worker используйте команду:

```bash
wrangler tail
```

## Резервное копирование

### База данных
```bash
wrangler d1 backup create codeflow-d1 --name "backup-$(date +%Y%m%d)"
```

### Код проекта
```bash
tar -czf codeflow-pro-backup-$(date +%Y%m%d).tar.gz codeflow-pro-react
```

## Лицензия

MIT License - разрешено использование, изменение и распространение