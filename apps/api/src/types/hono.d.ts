import type { AuthContext } from '../middleware/auth.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthContext;
  }
}