// workers/app.ts - Cloudflare Worker для CodeFlow Pro

import { createRequestHandler } from "@react-router/cloudflare";
import { DatabaseService } from "../app/lib/database";
import { AuthService } from "../app/lib/auth";

// Схема базы данных
const DB_SCHEMA = `
  -- Таблица пользователей
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    role TEXT DEFAULT 'user'
  );

  -- Таблица проектов
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_public INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Таблица файлов
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT,
    language TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Таблица AI запросов
  CREATE TABLE IF NOT EXISTS ai_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Индексы для улучшения производительности
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
  CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_requests(user_id);
`;

declare module "@react-router/cloudflare" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

// Основной объект обработки запросов
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Инициализация базы данных
    await this.initializeDatabase(env.DB);
    
    // CORS заголовки
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Обработка CORS preflight запросов
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Если это API запрос, обрабатываем его отдельно
    if (path.startsWith('/api/')) {
      try {
        const response = await this.handleApiRequest(request, env, ctx);
        // Добавляем CORS заголовки к API ответам
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        return newResponse;
      } catch (error) {
        console.error('API Error:', error);
        const errorResponse = new Response(
          JSON.stringify({ success: false, error: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        return errorResponse;
      }
    }
    
    // Для всех остальных запросов используем React Router
    const requestHandler = createRequestHandler({
      ...(process.env.NODE_ENV === "development"
        ? await import("../build/server/index.js")
        : { default: (await import("virtual:react-router/server-build")).default }),
      mode: "production",
    });
    
    const response = await requestHandler(request, {
      cloudflare: {
        env,
        ctx,
      },
    });
    
    // Добавляем CORS заголовки к основному ответу
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    return newResponse;
  },

  // Инициализация базы данных
  async initializeDatabase(db: D1Database) {
    await db.exec(DB_SCHEMA);
  },

  // Обработка API запросов
  async handleApiRequest(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const pathParts = url.pathname.substring(5).split('/'); // Убираем '/api/'
    const resource = pathParts[1];
    const resourceId = pathParts[2];
    const subResource = pathParts[3];

    // Создаем сервисы
    const dbService = new DatabaseService(env.DB);
    const authService = new AuthService(env.JWT_SECRET);

    switch (resource) {
      case 'auth':
        return await this.handleAuth(request, dbService, authService, subResource);
      case 'users':
        return await this.handleUsers(request, dbService, authService, resourceId);
      case 'projects':
        return await this.handleProjects(request, dbService, authService, resourceId);
      case 'files':
        return await this.handleFiles(request, dbService, authService, resourceId);
      case 'ai':
        return await this.handleAI(request, dbService, authService, subResource);
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'API endpoint not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' }}
        );
    }
  },

  // Обработка аутентификации
  async handleAuth(request: Request, dbService: DatabaseService, authService: AuthService, action: string | undefined) {
    if (request.method === 'POST' && action === 'login') {
      try {
        const { email, password } = await request.json();
        
        // Находим пользователя по email
        const user = await dbService.findUserByEmail(email);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid credentials' }),
            { status: 401, headers: { 'Content-Type': 'application/json' }}
          );
        }

        // Проверяем пароль (в реальном приложении используйте безопасную проверку)
        // Здесь для демонстрации просто проверим, что пароль не пустой
        if (!password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid credentials' }),
            { status: 401, headers: { 'Content-Type': 'application/json' }}
          );
        }

        // Создаем токен
        const token = await authService.createToken(user);

        return new Response(
          JSON.stringify({ 
            success: true, 
            token,
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request' }),
          { status: 400, headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'POST' && action === 'register') {
      try {
        const { email, password, username } = await request.json();
        
        // Проверяем, что email уникален
        const existingUser = await dbService.findUserByEmail(email);
        if (existingUser) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email already registered' }),
            { status: 409, headers: { 'Content-Type': 'application/json' }}
          );
        }

        // Хешируем пароль
        const passwordHash = await authService.hashPassword(password);

        // Создаем пользователя
        const user = await dbService.createUser({
          email,
          password_hash: passwordHash,
          username
        });

        // Создаем токен
        const token = await authService.createToken(user);

        return new Response(
          JSON.stringify({ 
            success: true, 
            token,
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Registration failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    );
  },

  // Обработка пользователей
  async handleUsers(request: Request, dbService: DatabaseService, authService: AuthService, userId: string | undefined) {
    // Проверяем аутентификацию
    const token = authService.extractTokenFromHeader(request.headers);
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    if (userId === 'me') {
      // Возвращаем информацию о текущем пользователе
      const user = await dbService.findUserById(payload.sub);
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' }}
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            created_at: user.created_at
          }
        }),
        { headers: { 'Content-Type': 'application/json' }}
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Not implemented' }),
      { status: 501, headers: { 'Content-Type': 'application/json' }}
    );
  },

  // Обработка проектов
  async handleProjects(request: Request, dbService: DatabaseService, authService: AuthService, projectId: string | undefined) {
    // Проверяем аутентификацию
    const token = authService.extractTokenFromHeader(request.headers);
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    if (request.method === 'GET') {
      if (projectId) {
        // Получаем конкретный проект
        const project = await dbService.getProjectById(projectId, payload.sub);
        if (!project) {
          return new Response(
            JSON.stringify({ success: false, error: 'Project not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' }}
          );
        }

        return new Response(
          JSON.stringify({ success: true, project }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } else {
        // Получаем все проекты пользователя
        const projects = await dbService.getProjectsByUserId(payload.sub);
        return new Response(
          JSON.stringify({ success: true, projects }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'POST') {
      // Создаем новый проект
      try {
        const { name, description } = await request.json();
        
        if (!name) {
          return new Response(
            JSON.stringify({ success: false, error: 'Name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' }}
          );
        }

        const project = await dbService.createProject({
          user_id: payload.sub,
          name,
          description
        });

        return new Response(
          JSON.stringify({ success: true, project }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create project' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'PUT' && projectId) {
      // Обновляем проект
      try {
        const { name, description } = await request.json();
        
        await dbService.updateProject(projectId, payload.sub, { name, description });
        
        const updatedProject = await dbService.getProjectById(projectId, payload.sub);
        
        return new Response(
          JSON.stringify({ success: true, project: updatedProject }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update project' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'DELETE' && projectId) {
      // Удаляем проект
      try {
        await dbService.deleteProject(projectId, payload.sub);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Project deleted' }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete project' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    );
  },

  // Обработка файлов
  async handleFiles(request: Request, dbService: DatabaseService, authService: AuthService, fileId: string | undefined) {
    // Проверяем аутентификацию
    const token = authService.extractTokenFromHeader(request.headers);
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Для файлов нам также нужен project_id
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }

    if (request.method === 'GET') {
      if (fileId) {
        // Получаем конкретный файл
        const file = await dbService.getFileById(fileId, projectId);
        if (!file) {
          return new Response(
            JSON.stringify({ success: false, error: 'File not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' }}
          );
        }

        return new Response(
          JSON.stringify({ success: true, file }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } else {
        // Получаем все файлы проекта
        const files = await dbService.getFilesByProjectId(projectId);
        return new Response(
          JSON.stringify({ success: true, files }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'POST') {
      // Создаем новый файл
      try {
        const { filename, content, language } = await request.json();
        
        if (!filename || !content) {
          return new Response(
            JSON.stringify({ success: false, error: 'Filename and content are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' }}
          );
        }

        const file = await dbService.createFile({
          project_id: projectId,
          filename,
          content,
          language: language || 'javascript'
        });

        return new Response(
          JSON.stringify({ success: true, file }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'PUT' && fileId) {
      // Обновляем файл
      try {
        const { content } = await request.json();
        
        if (typeof content !== 'string') {
          return new Response(
            JSON.stringify({ success: false, error: 'Content is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' }}
          );
        }

        await dbService.updateFile(fileId, projectId, content);
        
        const updatedFile = await dbService.getFileById(fileId, projectId);
        
        return new Response(
          JSON.stringify({ success: true, file: updatedFile }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    } else if (request.method === 'DELETE' && fileId) {
      // Удаляем файл
      try {
        await dbService.deleteFile(fileId, projectId);
        
        return new Response(
          JSON.stringify({ success: true, message: 'File deleted' }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    );
  },

  // Обработка AI запросов
  async handleAI(request: Request, dbService: DatabaseService, authService: AuthService, action: string | undefined) {
    // Проверяем аутентификацию
    const token = authService.extractTokenFromHeader(request.headers);
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' }}
      );
    }

    if (request.method === 'POST' && action === 'generate') {
      try {
        const { prompt, context, language, model } = await request.json();
        
        if (!prompt) {
          return new Response(
            JSON.stringify({ success: false, error: 'Prompt is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' }}
          );
        }

        // В реальном приложении здесь будет вызов AI API
        // Для демонстрации возвращаем фиктивный ответ
        const fakeResponse = `// Generated code for: ${prompt}\nconsole.log('Hello from AI!');`;
        const tokensUsed = 20;

        // Логируем запрос в базу данных
        await dbService.logAIRequest({
          user_id: payload.sub,
          project_id: null, // В реальном приложении передавайте project_id
          prompt,
          response: fakeResponse,
          tokens_used: tokensUsed
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            response: fakeResponse,
            tokens_used: tokensUsed
          }),
          { headers: { 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate code' }),
          { status: 500, headers: { 'Content-Type': 'application/json' }}
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' }}
    );
  }
};