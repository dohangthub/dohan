// Enregistrement vocal via l'API MediaRecorder du navigateur (web).
// Renvoie un contrôleur ; stop() -> data URL audio (base64) prêt à uploader.
export type Recorder = { stop: () => Promise<string | null>; cancel: () => void };

export function voiceSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof (globalThis as any).MediaRecorder !== 'undefined'
  );
}

export async function startRecording(): Promise<Recorder | null> {
  if (!voiceSupported()) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return null; // permission refusée
  }
  const MR: any = (globalThis as any).MediaRecorder;
  const rec = new MR(stream);
  const chunks: any[] = [];
  rec.ondataavailable = (e: any) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start();
  const stopStream = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise<string | null>((resolve) => {
        rec.onstop = () => {
          stopStream();
          const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
          const fr = new FileReader();
          fr.onloadend = () => resolve(typeof fr.result === 'string' ? fr.result : null);
          fr.onerror = () => resolve(null);
          fr.readAsDataURL(blob);
        };
        try { rec.stop(); } catch { stopStream(); resolve(null); }
      }),
    cancel: () => { try { rec.stop(); } catch {} stopStream(); },
  };
}
