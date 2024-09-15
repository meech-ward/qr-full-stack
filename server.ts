import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { generateQrCodeWithText, generateQRCodeWithBuffer } from "./qr-gen";
const app = new Hono();

app.post("/api/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["image"] as File;
  const qrFile = body["qr"] as File;
  const text = body["text"] as string;

  if (!file) {
    return c.json({ error: "No file uploaded" }, 400);
  }
  // Check if the file is an image
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Uploaded file is not an image" }, 400);
  }
  // Generate a unique filename
  const filename = `${Date.now()}-${file.name}`;

  // Save the file
  // await Bun.write(`uploads/${filename}`, file);

  const fileBuffer = await file.arrayBuffer();

  let outputFileNames: { name: string, blend: string }[] = [];
  if (qrFile) {
    const qrFileBuffer = await qrFile.arrayBuffer();
    outputFileNames = await generateQRCodeWithBuffer(
      qrFileBuffer,
      fileBuffer,
      `uploads/${filename}`,
      100
    );
  } else {
    outputFileNames = await generateQrCodeWithText(
      text,
      fileBuffer,
      `uploads/${filename}`
    );
  }

  return c.json({
    message: "Image uploaded successfully",
    filename: filename,
    size: file.size,
    type: file.type,
    outputFileNames: outputFileNames,
  });
});


app.post("/api/save")

// Serve static files from the 'uploads' directory when accessed via /api/uploads
app.get("/api/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filePath = `uploads/${filename}`;

  try {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    } else {
      return c.json({ error: "File not found" }, 404);
    }
  } catch (error) {
    return c.json({ error: "Error retrieving file" }, 500);
  }
});

// Serve static files from the 'dist' directory (Vite's build output)
app.use("/*", serveStatic({ root: "./dist" }));

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server is running on ${port}`);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
