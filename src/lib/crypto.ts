// AES-256-GCM 클라이언트 사이드 암호화 유틸리티
// 비공개 문서 내용을 DB 저장 전에 암호화 — DB 직접 조회 시 복호화 불가

export type EncryptedContent = {
  encrypted: true;
  iv: string;   // base64 encoded
  data: string; // base64 encoded ciphertext
};

export function isEncryptedContent(
  content: unknown
): content is EncryptedContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    (content as Record<string, unknown>).encrypted === true
  );
}

/** base64 → Uint8Array (ArrayBuffer 기반 — Web Crypto API 호환) */
function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Uint8Array → base64 */
function bytesToB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** base64 키 문자열을 CryptoKey로 임포트 */
async function importKey(b64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    b64ToBytes(b64Key),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 회원가입 시 1회 생성 — user_metadata.enc_key 에 저장
 * 사용자는 이 키를 직접 보거나 관리하지 않음
 */
export async function generateEncKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return bytesToB64(new Uint8Array(raw));
}

/**
 * TipTap JSON 콘텐츠를 암호화
 * DB에는 { encrypted: true, iv: "...", data: "..." } 형태로 저장됨
 */
export async function encryptContent(
  content: Record<string, unknown>,
  b64Key: string
): Promise<EncryptedContent> {
  const key = await importKey(b64Key);
  const ivBuf = new ArrayBuffer(12);
  const iv = new Uint8Array(ivBuf);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(content));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    key,
    plaintext
  );

  return {
    encrypted: true,
    iv: bytesToB64(iv),
    data: bytesToB64(new Uint8Array(ciphertext)),
  };
}

/**
 * 암호화된 콘텐츠를 복호화하여 TipTap JSON으로 반환
 */
export async function decryptContent(
  encrypted: EncryptedContent,
  b64Key: string
): Promise<Record<string, unknown>> {
  const key = await importKey(b64Key);
  const iv = b64ToBytes(encrypted.iv);
  const data = b64ToBytes(encrypted.data);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    key,
    data
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
}
