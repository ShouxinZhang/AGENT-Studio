export interface ChatUploadedFile {
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

export async function uploadChatFiles(files: File[]) {
    const form = new FormData();
    for (const f of files) {
        form.append("files", f);
    }

    const res = await fetch("/api/chat/uploads", {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`upload failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { files?: ChatUploadedFile[]; error?: string };
    if (!data.files) {
        throw new Error(data.error || "upload failed");
    }

    return data.files;
}
