import sharp from 'sharp';

const CLAUDE_IMAGE_MAX = 5 * 1024 * 1024;   // Anthropic hard limit
const CLAUDE_PDF_MAX   = 32 * 1024 * 1024;

export type ClaudeBlock =
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };

export async function prepareFileForClaude(blobUrl: string): Promise<ClaudeBlock> {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`تعذّر جلب الملف من التخزين (${res.status}).`);

  const contentType = res.headers.get('content-type') ?? '';
  const buf = Buffer.from(await res.arrayBuffer());

  // PDF: pass straight through (Claude accepts up to 32MB)
  if (contentType.includes('pdf')) {
    if (buf.byteLength > CLAUDE_PDF_MAX)
      throw new Error('ملف PDF يتجاوز 32 ميغابايت، وهو الحد الأقصى للتحليل.');
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') },
    };
  }

  // Image: normalize to a Claude-safe JPEG (long edge ≤ 2000px, < 5MB)
  const encode = (q: number) =>
    sharp(buf, { failOn: 'none' })
      .rotate()
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: q })
      .toBuffer();

  let quality = 88;
  let out = await encode(quality);
  while (out.byteLength > CLAUDE_IMAGE_MAX && quality > 50) {
    quality -= 12;
    out = await encode(quality);
  }
  if (out.byteLength > CLAUDE_IMAGE_MAX)
    throw new Error('تعذّر تصغير الصورة إلى ما دون 5 ميغابايت. استخدم صورة أوضح.');

  return {
    type: 'image',
    source: { type: 'base64', media_type: 'image/jpeg', data: out.toString('base64') },
  };
}
