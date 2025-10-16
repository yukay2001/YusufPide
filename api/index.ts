import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import bundled backend app
// @ts-ignore - Bundle created at build time  
import { createApp } from './_app.bundle.js';

// Create app instance (cached across Lambda invocations for performance)
let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    console.log('🔄 Creating Express app instance...');
    const { app } = await createApp();
    appInstance = app;
    console.log('✅ Express app ready');
  }
  return appInstance;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get cached Express app
    const app = await getApp();
    
    // Handle the request with Express
    await new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
