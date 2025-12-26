// app/lib/database.ts
import { User, Project, File, AIRequest } from './types';

export class DatabaseService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Методы для работы с пользователями
  async findUserById(id: string): Promise<User | null> {
    const user = await this.db.prepare(
      'SELECT id, email, username, created_at, updated_at, role FROM users WHERE id = ? AND is_active = 1'
    ).bind(id).first<User>();
    
    return user || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first<User>();
    
    return user || null;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'role'>): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const user: User = {
      id,
      ...userData,
      created_at: now,
      updated_at: now,
      is_active: 1,
      role: 'user'
    };

    await this.db.prepare(
      `INSERT INTO users (id, email, password_hash, username, created_at, updated_at, is_active, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user.id,
      user.email,
      user.password_hash,
      user.username || null,
      user.created_at,
      user.updated_at,
      user.is_active,
      user.role
    ).run();

    // Возвращаем только безопасные поля
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // Методы для работы с проектами
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const result = await this.db.prepare(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(userId).all<Project>();
    
    return result.results;
  }

  async getProjectById(id: string, userId: string): Promise<Project | null> {
    const project = await this.db.prepare(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first<Project>();
    
    return project || null;
  }

  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'is_public'>): Promise<Project> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const project: Project = {
      id,
      ...projectData,
      created_at: now,
      updated_at: now,
      is_public: 0
    };

    await this.db.prepare(
      `INSERT INTO projects (id, user_id, name, description, created_at, updated_at, is_public) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      project.id,
      project.user_id,
      project.name,
      project.description || null,
      project.created_at,
      project.updated_at,
      project.is_public
    ).run();

    return project;
  }

  async updateProject(id: string, userId: string, updateData: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>): Promise<void> {
    const fields = Object.keys(updateData).filter(key => 
      key !== 'id' && key !== 'user_id' && key !== 'created_at'
    );
    
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updateData as any)[field]);
    
    values.push(id, userId); // Добавляем id и userId в конец для WHERE

    await this.db.prepare(
      `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`
    ).bind(...values).run();
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    await this.db.prepare(
      'DELETE FROM projects WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
  }

  // Методы для работы с файлами
  async getFilesByProjectId(projectId: string): Promise<File[]> {
    const result = await this.db.prepare(
      'SELECT * FROM files WHERE project_id = ? ORDER BY filename'
    ).bind(projectId).all<File>();
    
    return result.results;
  }

  async getFileById(id: string, projectId: string): Promise<File | null> {
    const file = await this.db.prepare(
      'SELECT * FROM files WHERE id = ? AND project_id = ?'
    ).bind(id, projectId).first<File>();
    
    return file || null;
  }

  async createFile(fileData: Omit<File, 'id' | 'created_at' | 'updated_at'>): Promise<File> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const file: File = {
      id,
      ...fileData,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(
      `INSERT INTO files (id, project_id, filename, content, language, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      file.id,
      file.project_id,
      file.filename,
      file.content,
      file.language,
      file.created_at,
      file.updated_at
    ).run();

    return file;
  }

  async updateFile(id: string, projectId: string, content: string): Promise<void> {
    await this.db.prepare(
      'UPDATE files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND project_id = ?'
    ).bind(content, id, projectId).run();
  }

  async deleteFile(id: string, projectId: string): Promise<void> {
    await this.db.prepare(
      'DELETE FROM files WHERE id = ? AND project_id = ?'
    ).bind(id, projectId).run();
  }

  // Методы для работы с AI запросами
  async logAIRequest(requestData: Omit<AIRequest, 'id' | 'created_at'>): Promise<AIRequest> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const aiRequest: AIRequest = {
      id,
      ...requestData,
      created_at: now
    };

    await this.db.prepare(
      `INSERT INTO ai_requests (id, user_id, project_id, prompt, response, tokens_used, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      aiRequest.id,
      aiRequest.user_id,
      aiRequest.project_id,
      aiRequest.prompt,
      aiRequest.response,
      aiRequest.tokens_used,
      aiRequest.created_at
    ).run();

    return aiRequest;
  }

  async getAIRequestsByUserId(userId: string): Promise<AIRequest[]> {
    const result = await this.db.prepare(
      'SELECT * FROM ai_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all<AIRequest>();
    
    return result.results;
  }
}