import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveDocument(file: File): Promise<{ url: string; localPath: string }> {
  // Ensure bucket exists (fails silently if it already does)
  try {
    await supabase.storage.createBucket('documents', { public: true });
  } catch(e) { }

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filename, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true
    });

  if (error) {
    throw new Error("Supabase Storage Error: " + error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filename);

  return { url: publicUrlData.publicUrl, localPath: filename };
}

export function getUploadDir(): string {
  return "/tmp";
}
