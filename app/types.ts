// app/types.ts

// Типы для Cloudflare Workers
export interface Env {
  // Привязки к D1 базе данных
  DB: D1Database;
  
  // Привязки к AI
  AI: any;
  
  // Переменные окружения
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  VALUE_FROM_CLOUDFLARE: string;
}

// Типы для пользовательских данных
export interface User {
  id: string;
  email: string;
  username?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  role: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_public: number;
}

export interface File {
  id: string;
  project_id: string;
  filename: string;
  content: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface AIRequest {
  id: string;
  user_id: string;
  project_id: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

// Типы для AI
export interface AIPrompt {
  prompt: string;
  context?: string;
  language?: string;
  model?: string;
}

export interface AIResponse {
  success: boolean;
  response: string;
  tokens_used?: number;
  error?: string;
}

// Типы для API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreateFileRequest {
  filename: string;
  content: string;
  language: string;
}

// Типы для UI состояния
export interface AppState {
  editor: any; // Monaco editor instance
  activeFile: string;
  openFiles: Set<string>;
  theme: 'light' | 'dark' | 'system';
  isResizing: boolean;
  isMobile: boolean;
  expandedFolders: Set<string>;
  currentUser: User | null;
  currentProject: Project | null;
}

// Типы для DOM элементов
export interface DOMElements {
  themeToggle: HTMLElement | null;
  fileTree: HTMLElement | null;
  tabsContainer: HTMLElement | null;
  editorContainer: HTMLElement | null;
  aiInput: HTMLInputElement | null;
  aiSend: HTMLElement | null;
  chatMessages: HTMLElement | null;
  leftPanel: HTMLElement | null;
  rightPanel: HTMLElement | null;
  leftResizer: HTMLElement | null;
  rightResizer: HTMLElement | null;
  commandPaletteOverlay: HTMLElement | null;
  commandPaletteInput: HTMLInputElement | null;
  commandPaletteList: HTMLElement | null;
  cursorPosition: HTMLElement | null;
  statusText: HTMLElement | null;
  statusDot: HTMLElement | null;
}