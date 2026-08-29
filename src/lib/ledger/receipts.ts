import { supabase } from "@/integrations/supabase/client";

const BUCKET = "ledger-receipts";

export async function uploadReceipt(
  userId: string,
  file: File | Blob,
  extHint = "jpg",
): Promise<string> {
  const ext = file instanceof File ? (file.name.split(".").pop() ?? extHint) : extHint;
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file instanceof File ? file.type : "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getReceiptSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteReceiptFile(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
