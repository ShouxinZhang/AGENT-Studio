import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

function formatDateDir(d: Date) {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
}

function sanitizeFilename(originalName: string) {
    const name = originalName.split("/").pop()?.split("\\").pop() ?? "file";
    const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    return cleaned.replace(/^_+/, "").slice(0, 200) || "file";
}

export async function POST(req: Request) {
    try {
        const form = await req.formData();

        const raw = [form.get("file"), ...form.getAll("files")].filter(Boolean);
        const files = raw.filter((v): v is File => v instanceof File);

        if (files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 400 });
        }

        const dateDir = formatDateDir(new Date());
        const uploadDir = path.join(process.cwd(), "public", "uploads", "chat", dateDir);
        await mkdir(uploadDir, { recursive: true });

        const uploaded = [] as Array<{
            url: string;
            name: string;
            mimeType: string;
            size: number;
        }>;

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return NextResponse.json(
                    { error: `File too large: ${file.name} (max 25MB)` },
                    { status: 400 }
                );
            }

            const safeName = sanitizeFilename(file.name);
            const id = crypto.randomUUID();
            const storedName = `${id}_${safeName}`;
            const absolutePath = path.join(uploadDir, storedName);

            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(absolutePath, buffer);

            uploaded.push({
                url: `/uploads/chat/${dateDir}/${storedName}`,
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
            });
        }

        return NextResponse.json({ files: uploaded });
    } catch (e) {
        console.error("upload failed", e);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
