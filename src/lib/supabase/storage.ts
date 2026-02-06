import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function getBucket() {
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Bucket storage belum diatur');
  }
  return bucket;
}

export async function uploadMedia(file: File, pathPrefix: string) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket();
  const ext = file.name.split('.').pop() || 'bin';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${pathPrefix}/${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

export async function removeMedia(path: string) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
