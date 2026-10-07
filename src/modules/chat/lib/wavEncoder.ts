export interface VoiceRecording {
  file: File;
  durationSeconds: number;
}

/** Standard RIFF/WAVE, mono PCM16 little-endian; sample rate comes from the AudioContext. */
export function encodeVoiceWav(chunks: ArrayBuffer[], sampleRate: number): VoiceRecording {
  const bytes = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  // RIFF has a 32-bit size field. This is a format boundary, not an invented backend limit.
  if (
    !bytes ||
    bytes > 0xffffffff - 36 ||
    chunks.some((chunk) => chunk.byteLength % 2) ||
    !Number.isInteger(sampleRate) ||
    sampleRate <= 0 ||
    sampleRate > 0xffffffff / 2
  ) {
    throw new Error("Invalid PCM for RIFF/WAVE");
  }
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, bytes, true);
  return {
    file: new File([header, ...chunks], `voice-message-${Date.now()}.wav`, { type: "audio/wav" }),
    durationSeconds: bytes / 2 / sampleRate,
  };
}
