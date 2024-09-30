import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { qrRoute } from "./routes/qr";
import { shortUrlRoute } from "./routes/shortUrlRoute";
import { assRoute } from "./routes/ass";

const app = new Hono();

app.use("*", logger());

const uploadRoute = new Hono();
uploadRoute.get(
  "/:id",
  async (c) => {
    const id = c.req.param("id");
    const path = import.meta.dir + `/uploads/${id}`;
    const file = Bun.file(path);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
      },
    });
  }
);

const apiRoutes = app
  .basePath("/api")
  .route("/qr", qrRoute)
  .route("/uploads", uploadRoute)
  .route("/ass", assRoute);

app.route("/s", shortUrlRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
