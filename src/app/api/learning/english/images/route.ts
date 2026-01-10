import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function safeExt(mime: string, fallbackName: string): string {
  const byMime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = byMime[mime];
  if (ext) return ext;
  const fromName = (fallbackName.split(".").pop() || "").toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return "png";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return Response.json({ error: `unsupported mime: ${file.type}` }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return Response.json({ error: `file too large (max ${MAX_BYTES} bytes)` }, { status: 413 });
    }

    const ext = safeExt(file.type, file.name);
    const id = crypto.randomUUID();

    // Store under public so it is directly reachable.
    const relDir = path.join("uploads", "learning", "english");
    const publicDir = path.join(process.cwd(), "public", relDir);
    await mkdir(publicDir, { recursive: true });

    const filename = `${id}.${ext}`;
    const absPath = path.join(publicDir, filename);
    await writeFile(absPath, buf);

    const urlPath = `/${relDir.replaceAll(path.sep, "/")}/${filename}`;
    return Response.json({ url: urlPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upload failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
