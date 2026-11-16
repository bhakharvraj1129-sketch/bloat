import "server-only";
import sharp from "sharp";
import { aiProtection, config } from "@/lib/registry";

/** Shrink, re-encode and drop all metadata (EXIF, GPS, device). Returns null if still too large. */
export async function preparePhoto(bytes: Buffer): Promise<Buffer | null> {
  const limit = aiProtection.photo_max_mb * 1024 * 1024;
  for (const side of [config.ai.photo.max_side_px, 800]) {
    // sharp writes no metadata unless asked to; rotate() bakes in the orientation first.
    const out = await sharp(bytes, { failOn: "error" }).rotate().resize({ width: side, height: side, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    if (out.length <= limit) return out;
  }
  return null;
}

