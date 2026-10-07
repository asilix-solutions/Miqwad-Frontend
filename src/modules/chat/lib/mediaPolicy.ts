/** PNG/WAV: VERIFIED BY LIVE REQUEST. JPEG: UNKNOWN; no retained request evidence. */
export const verifiedMediaTypes = ["image/png", "audio/wav"] as const;
export function supportedFile(file: File): boolean {
  return verifiedMediaTypes.some((type) => type === file.type);
}
export function isAudio(type: string | null): boolean {
  return type?.startsWith("audio/") ?? false;
}
