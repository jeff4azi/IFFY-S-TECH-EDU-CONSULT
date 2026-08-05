import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

/**
 * Compression presets
 *
 * "service"  — for landing-page service card images: aggressive compression,
 *              convert to WebP, max 250 KB, 1600 px wide. These are tiny
 *              thumbnails shown in a grid so quality loss is unnoticeable.
 *
 * "customer" — for customer-uploaded images in orders: lighter compression,
 *              keep original format, max 500 KB, 1920 px. These may need to
 *              be legible documents/photos so we preserve more quality.
 */
const PRESETS = {
  service: {
    maxSizeMB: 0.25,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.8,
  },
  customer: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  },
};

/**
 * Upload an image to Supabase Storage.
 *
 * @param {File}   file       - The image file to upload.
 * @param {string} bucketName - Storage bucket (default: "service-images").
 * @param {"service"|"customer"} preset
 *   - "service"  → 250 KB / 1600 px / WebP  (landing-page cards)
 *   - "customer" → 500 KB / 1920 px / original format (order uploads)
 *   Defaults to "service" so existing callers (Services.jsx) are unaffected.
 *
 * @returns {Promise<string>} Public URL of the uploaded image.
 */
export const uploadImage = async (
  file,
  bucketName = "service-images",
  preset = "service",
) => {
  try {
    const options = PRESETS[preset] ?? PRESETS.service;
    const compressedFile = await imageCompression(file, options);

    // Use .webp extension for service preset, preserve original otherwise
    const isWebp = options.fileType === "image/webp";
    const ext = isWebp ? "webp" : file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: isWebp ? "image/webp" : file.type || "image/jpeg",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Upload an order file (image or document) to the "order-files" bucket.
 * Images are compressed with the "customer" preset.
 * Non-image files are uploaded as-is.
 *
 * @returns {Promise<string>} Public URL of the uploaded file.
 */
export const uploadOrderFile = async (file) => {
  try {
    let fileToUpload = file;

    if (file.type.startsWith("image/")) {
      fileToUpload = await imageCompression(file, PRESETS.customer);
    }

    const originalName = file.name || "upload";
    const safeName = originalName
      .replace(/[^a-z0-9.\-_]/gi, "_")
      .substring(0, 60);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;

    const { error } = await supabase.storage
      .from("order-files")
      .upload(fileName, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("order-files").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading order file:", error);
    throw error;
  }
};

/**
 * Upload an admin deliverable file to the order-files bucket.
 * Returns { url, name } — name is the original filename preserved for display.
 *
 * @param {File} file
 * @returns {Promise<{ url: string, name: string }>}
 */
export const uploadDeliverable = async (file) => {
  try {
    const originalName = file.name || "deliverable";
    const safeName = originalName
      .replace(/[^a-z0-9.\-_]/gi, "_")
      .substring(0, 80);
    const fileName = `deliverables/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}`;

    const { error } = await supabase.storage
      .from("order-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("order-files").getPublicUrl(fileName);

    return { url: publicUrl, name: originalName };
  } catch (error) {
    console.error("Error uploading deliverable:", error);
    throw error;
  }
};
