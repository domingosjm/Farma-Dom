import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file first
dotenv.config();

// Load and validate environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8000'),
  
  // MySQL Local
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DATABASE: z.string().default('farmadom'),
  
  // Security
  JWT_SECRET: z.string().min(8).default('development-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Email (SMTP)
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@farmadom.ao'),

  // Upload
  UPLOAD_DIR: z.string().default('./uploads'),

  // App URL (para links de receita QR, etc.)
  APP_URL: z.string().default('http://localhost:8000'),
});

export const config = envSchema.parse(process.env);

export default config;
