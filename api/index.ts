import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "../server/routes";
import { seedInitialData } from "../server/seed";
import { ensureInitialSession } from "../server/scheduler";
import passport from "../server/auth";
import path from "path";
import { fileURLToPath } from "url";

// Vercel runtime configuration
export const config = {
  runtime: 'nodejs',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// PostgreSQL session store for production
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "pideci-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Initialize data (run once)
let initialized = false;
async function initialize() {
  if (!initialized) {
    try {
      await seedInitialData();
      await ensureInitialSession();
      initialized = true;
    } catch (error) {
      console.error("Initialization error:", error);
    }
  }
}

// Register routes
const server = await registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "../public");
  app.use(express.static(publicPath));
  
  // Catch-all handler for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

// Initialize on first request
app.use(async (req, res, next) => {
  await initialize();
  next();
});

// Export for Vercel serverless
export default app;
