import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 4 * 1024 * 1024;

function imageExtension(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const head = bytes.length >= 6 ? bytes.toString("ascii", 0, 6) : "";
  if (head === "GIF87a" || head === "GIF89a") return "gif";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function storePublicImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) return { error: "Photographs must be 4 MB or smaller." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) return { error: "Use a JPG, PNG, WEBP or GIF photograph." };

  const name = `${randomBytes(16).toString("hex")}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "programs");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  return { url: `/uploads/programs/${name}` };
}

export async function removeStoredImage(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/programs/")) return;
  const name = path.basename(url);
  if (!/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(name)) return;
  await unlink(path.join(process.cwd(), "public", "uploads", "programs", name)).catch(() => undefined);
}
