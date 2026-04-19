/**
 * Live microphone analyser — writes normalized audio level (0..1) into a shared ref.
 * The orb reads `micLevel.current` inside its `useFrame` loop so it can react to the
 * user's voice amplitude in real time without triggering React re-renders.
 */

/** Shared ref. Import and read `.current` from anywhere (renderer, animation frame, etc.). */
export const micLevel: { current: number } = { current: 0 };

let stream: MediaStream | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array<ArrayBuffer> | null = null;
let rafId: number | null = null;
let running = false;
let starting = false;

export async function startMicAnalyser(): Promise<boolean> {
  if (running || starting) return running;
  if (typeof window === "undefined") return false;
  const AC =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC || !navigator.mediaDevices?.getUserMedia) return false;

  starting = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    ctx = new AC();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.65;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    running = true;

    const loop = () => {
      if (!running || !analyser || !dataArray) return;
      analyser.getByteTimeDomainData(dataArray);
      // Compute RMS against 128 (silence baseline for unsigned 8-bit PCM)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      // Typical speech RMS sits around 0.05–0.25. Boost and clamp.
      const boosted = Math.min(1, Math.max(0, rms * 5.5));
      // Smooth with previous value so the orb doesn't jitter on tiny spikes
      micLevel.current = micLevel.current * 0.55 + boosted * 0.45;
      rafId = requestAnimationFrame(loop);
    };
    loop();
    starting = false;
    return true;
  } catch {
    starting = false;
    running = false;
    return false;
  }
}

export function stopMicAnalyser() {
  running = false;
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (ctx && ctx.state !== "closed") {
    ctx.close().catch(() => {});
  }
  ctx = null;
  analyser = null;
  dataArray = null;
  micLevel.current = 0;
}

export function isMicAnalyserRunning() {
  return running;
}
