// This file extends the Express types to include our custom session properties
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: any;
  }
} 