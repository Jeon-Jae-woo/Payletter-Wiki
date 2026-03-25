import { supabase } from '@/lib/supabase';

const BUCKET = 'wiki-images';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function uploadImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  if (file.size > MAX_SIZE) {
    return { url: null, error: '파일 크기는 10MB 이하여야 합니다.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${userId}/img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file);
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}
