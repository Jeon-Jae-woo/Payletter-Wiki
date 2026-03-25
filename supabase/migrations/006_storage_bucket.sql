-- 이미지 전용 Storage 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-images', 'wiki-images', true)
ON CONFLICT DO NOTHING;

-- 로그인한 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wiki-images');

-- 업로드한 본인만 삭제 가능
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wiki-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 이미지는 누구나 조회 가능 (public bucket)
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wiki-images');
