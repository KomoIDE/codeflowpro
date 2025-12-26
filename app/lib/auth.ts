// app/lib/auth.ts
import { User } from './types';

export class AuthService {
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  // Создание JWT токена
  async createToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
    const payload = {
      sub: user.id, // subject - ID пользователя
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Токен действителен 24 часа
      iat: Math.floor(Date.now() / 1000) // время создания токена
    };

    // Кодируем заголовок JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    // Кодируем полезную нагрузку
    const payloadEncoded = btoa(JSON.stringify(payload));
    
    // Создаем подпись (в реальном приложении используйте криптографически безопасный метод)
    const signature = await this.sign(`${header}.${payloadEncoded}`, this.jwtSecret);
    
    return `${header}.${payloadEncoded}.${signature}`;
  }

  // Проверка JWT токена
  async verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
    try {
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return null;
      }

      // Проверяем подпись
      const expectedSignature = await this.sign(`${header}.${payload}`, this.jwtSecret);
      if (expectedSignature !== signature) {
        return null;
      }

      // Декодируем полезную нагрузку
      const decodedPayload = JSON.parse(atob(payload));
      
      // Проверяем срок действия токена
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < currentTime) {
        return null;
      }

      return {
        sub: decodedPayload.sub,
        email: decodedPayload.email
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  // Простая реализация подписи для демонстрации (НЕ использовать в продакшене!)
  private async sign(data: string, secret: string): Promise<string> {
    // В реальном приложении используйте Web Crypto API или библиотеку для JWT
    // Это упрощенная реализация для демонстрации
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(secret);
    
    // Простое "хеширование" для демонстрации (НЕ безопасно!)
    let hash = 0;
    const str = data + secret;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразуем в 32-битное целое
    }
    
    return btoa(Math.abs(hash).toString());
  }

  // Извлечение токена из заголовка Authorization
  extractTokenFromHeader(headers: Headers): string | null {
    const authHeader = headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Хеширование пароля (в реальном приложении используйте bcrypt или scrypt)
  async hashPassword(password: string): Promise<string> {
    // В реальном приложении используйте криптографически безопасный алгоритм хеширования
    // Это простая реализация для демонстрации
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Простое "хеширование" для демонстрации (НЕ использовать в продакшене!)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString();
  }

  // Проверка пароля
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }
}