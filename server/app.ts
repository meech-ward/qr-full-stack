import { Hono } from "hono";
// import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { qrRoute } from "./routes/qr";
import { shortUrlRoute } from "./routes/shortUrlRoute";
import { logger } from "./lib/logger";

const app = new Hono();

// Middleware for logging
app.use("*", async (c, next) => {
  const start = Date.now();

  // Add timing header
  c.res.headers.set("Server-Timing", "app;dur=0");

  await next();

  const end = Date.now();
  const duration = end - start;

  // Update timing header
  c.res.headers.set("Server-Timing", `app;dur=${duration}`);

  // Log request details
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
    },
    "Request processed"
  );
});

// Error handling middleware
app.onError((err, c) => {
  logger.error({
    err,
    path: c.req.path,
    method: c.req.method
  }, 'An error occurred')
  return c.text('Internal Server Error', 500)
})


const uploadRoute = new Hono();
uploadRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const path = import.meta.dir + `/uploads/${id}`;
  const file = Bun.file(path);
  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
    },
  });
});

const apiRoutes = app
  .basePath("/api")
  .route("/qr", qrRoute)
  .route("/uploads", uploadRoute)

app.route("/s", shortUrlRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
