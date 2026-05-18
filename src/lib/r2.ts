import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `space-photos/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type || 'image/jpeg',
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(urls: string[]): Promise<void> {
  const publicBase = process.env.R2_PUBLIC_URL!;
  const keys = urls
    .filter(u => u.startsWith(publicBase))
    .map(u => u.slice(publicBase.length + 1)); // strip leading slash
  if (keys.length === 0) return;
  await r2.send(new DeleteObjectsCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Delete: { Objects: keys.map(Key => ({ Key })) },
  }));
}
