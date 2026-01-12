import type { FileUIPart } from "ai";

function readAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

export async function filesToFileUIParts(files: File[]): Promise<FileUIPart[]> {
    const parts: FileUIPart[] = [];
    for (const file of files) {
        const url = await readAsDataUrl(file);
        parts.push({
            type: "file",
            mediaType: file.type || "application/octet-stream",
            filename: file.name,
            url,
        });
    }
    return parts;
}
