import { createApp } from "./app";
import { setupVite, serveStatic } from "./vite";
import { log } from "./utils";
import { seedInitialData } from "./seed";
import { ensureInitialSession } from "./scheduler";

(async () => {
  // Seed initial product data
  await seedInitialData();
  
  // Ensure initial session exists (manual day control)
  await ensureInitialSession();
  
  const { app, server } = await createApp();

  // Setup Vite or static serving based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
