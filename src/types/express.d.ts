import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };
      admin?: {
        sub: string;
        email: string;
        role: 'SUPER_ADMIN' | 'ADMIN';
        iat?: number;
        exp?: number;
      };
    }
  }
}
