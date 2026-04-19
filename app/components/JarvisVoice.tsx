import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createVoiceSession,
  executeCommand,
  parseCommand,
  requiresWakeWord,
  type VoiceSession,
} from "../audio/voiceCommands";
import { onSpeakingChange, unlock } from "../audio/bootAudio";
import { startMicAnalyser, stopMicAnalyser } from "../audio/micAnalyser";
import { duckTheme } from "../audio/musicEngine";
import { JarvisOrb, type JarvisOrbState } from "./JarvisOrb";

const HINTS = [
  '"Jarvis, open about"',
  '"Jarvis, show experience"',
  '"Jarvis, scroll down"',
  '"Jarvis, open email"',
  '"Jarvis, who is Nishant"',
  '"Jarvis, go to top"',
];

const WAKE_RE = /^\s*(hey\s+|ok\s+|okay\s+)?(jarvis|j\.?a\.?r\.?v\.?i\.?s\.?)([,.\s]|$)/i;

type LogEntry = { id: number; text: string; kind: "cmd" | "sys" | "err" | "ignored" };

export function JarvisVoice() {
  const [expanded, setExpanded] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [wakeWord, setWakeWord] = useState(true);
  const [speakOn, setSpeakOn] = useState(true);
  const [interim, setInterim] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  const logIdRef = useRef(0);
  const sessionRef = useRef<VoiceSession | null>(null);
  const speakOnRef = useRef(speakOn);
  const wakeWordRef = useRef(wakeWord);
  /** When JARVIS is ack'd (user said just "Jarvis"), open a follow-up window
   *  during which the next phrase bypasses the wake-word requirement. */
  const followUpUntilRef = useRef<number>(0);
  const FOLLOW_UP_MS = 10_000;
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => onSpeakingChange(setSpeaking), []);

  // Duck any currently-playing music down whenever JARVIS is speaking
  useEffect(() => {
    duckTheme(speaking);
  }, [speaking]);

  // Pause the mic while JARVIS is speaking so (a) the TTS doesn't feed back
  // into recognition, and (b) Chrome doesn't quietly drop the recognition session.
  useEffect(() => {
    const s = sessionRef.current;
    if (!s || !supported) return;
    if (speaking) {
      s.pause();
    } else {
      s.resume();
    }
  }, [speaking, supported]);

  // Pin the log to the bottom whenever new output lands
  useEffect(() => {
    const el = logScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, interim]);

  // Start/stop the live mic analyser so the orb can react to the user's voice
  useEffect(() => {
    if (listening && !muted) {
      startMicAnalyser();
    } else {
      stopMicAnalyser();
    }
  }, [listening, muted]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopMicAnalyser();
  }, []);

  useEffect(() => {
    speakOnRef.current = speakOn;
  }, [speakOn]);
  useEffect(() => {
    wakeWordRef.current = wakeWord;
  }, [wakeWord]);

  const pushLog = useCallback((text: string, kind: LogEntry["kind"] = "sys") => {
    logIdRef.current += 1;
    setLog((l) => [...l.slice(-7), { id: logIdRef.current, text, kind }]);
  }, []);

  // Create session + auto-start on mount (this runs after boot sequence, which
  // had a user gesture — mic permission prompt will appear once).
  useEffect(() => {
    // Try to unlock AudioContext for TTS responses. If the boot was completed
    // via "Silent Mode", this still counts as a valid attempt — unlock() is a no-op
    // without a gesture but doesn't error.
    unlock();

    const s = createVoiceSession({
      onInterim: (t) => setInterim(t),
      onFinal: (raw) => {
        setInterim("");
        const t = raw.trim();
        if (!t) return;

        const now = Date.now();
        const hasWake = WAKE_RE.test(t);
        const inFollowUp = now < followUpUntilRef.current;

        // Parse first, then decide if we should let it through.
        // Actionable commands (navigation, Q&A, actions) execute even without the wake word.
        // Only chatter/small-talk/unknown noise needs the wake word (or follow-up window).
        const cmd = parseCommand(t);
        const needsWake = requiresWakeWord(cmd);

        if (
          wakeWordRef.current &&
          !hasWake &&
          !inFollowUp &&
          needsWake
        ) {
          pushLog(`(ignored: "${t}")`, "ignored");
          return;
        }

        // JARVIS is engaging with the user — pop the console open so they see it react.
        setExpanded(true);

        pushLog(`you: ${t}`, "cmd");
        const out = executeCommand(cmd, speakOnRef.current);
        if (out) pushLog(out, cmd.kind === "unknown" ? "err" : "sys");

        // Open / close the follow-up window
        if (cmd.kind === "ack") {
          followUpUntilRef.current = Date.now() + FOLLOW_UP_MS;
          setAwaitingFollowUp(true);
          setTimeout(() => {
            if (Date.now() >= followUpUntilRef.current) setAwaitingFollowUp(false);
          }, FOLLOW_UP_MS + 100);
        } else {
          followUpUntilRef.current = 0;
          setAwaitingFollowUp(false);
        }
      },
      onState: setListening,
      onError: (msg) => pushLog(msg, "err"),
    });

    sessionRef.current = s;
    setSupported(s.supported);

    if (s.supported) {
      s.start();
      pushLog("VOICE :: awaiting wake word — say \"Jarvis …\"", "sys");
    } else {
      pushLog(
        "VOICE :: unsupported browser — try Chrome, Edge, or Safari.",
        "err"
      );
    }

    return () => {
      s.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle mute (stop/start session)
  const toggleMute = () => {
    const s = sessionRef.current;
    if (!s || !s.supported) return;
    if (muted) {
      s.start();
      pushLog("VOICE :: listening resumed", "sys");
      setMuted(false);
    } else {
      s.stop();
      pushLog("VOICE :: muted", "sys");
      setMuted(true);
    }
  };

  const quickSections = useMemo(
    () => [
      { id: "about", label: "About" },
      { id: "experience", label: "Experience" },
      { id: "skills", label: "Skills" },
      { id: "projects", label: "Projects" },
      { id: "contact", label: "Contact" },
    ],
    []
  );

  const statusText = !supported
    ? "UNSUPPORTED"
    : muted
    ? "MUTED"
    : listening
    ? awaitingFollowUp
      ? "AWAITING COMMAND…"
      : wakeWord
      ? "LIVE · WAKE WORD"
      : "LIVE · OPEN MIC"
    : "STARTING…";

  const statusDotClass =
    !supported || muted
      ? "bg-cyan-400/40"
      : awaitingFollowUp
      ? "bg-amber-300 hud-blink"
      : listening
      ? "bg-emerald-300 hud-blink"
      : "bg-amber-300 hud-blink";

  const orbState: JarvisOrbState = !supported
    ? "muted"
    : muted
    ? "muted"
    : speaking
    ? "speaking"
    : awaitingFollowUp
    ? "processing"
    : listening
    ? "listening"
    : "idle";

  return (
    <div className="fixed bottom-16 sm:bottom-24 right-3 sm:right-6 z-50 pointer-events-auto flex flex-col items-end gap-2 max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)]">
      {expanded && (
        <div className="hud-panel w-[min(380px,92vw)] p-4 hud-rise">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`relative w-5 h-5 rounded-full border ${
                  listening && !muted
                    ? "border-emerald-300 bg-emerald-400/30"
                    : "border-cyan-300 bg-cyan-400/10"
                }`}
              >
                {listening && !muted && (
                  <span className="absolute inset-0 rounded-full border border-emerald-300 animate-ping" />
                )}
              </div>
              <span className="hud-font text-cyan-200 text-xs tracking-[0.25em]">
                J.A.R.V.I.S.
              </span>
              <span className="hud-mono text-[0.65rem] text-cyan-300/80">
                {statusText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="hud-mono text-[0.7rem] text-cyan-400/70 hover:text-cyan-100 transition-colors"
              aria-label="Collapse JARVIS console"
            >
              COLLAPSE ✕
            </button>
          </div>

          <div className="hud-divider mb-3" />

          {/* Transcript + log */}
          <div
            ref={logScrollRef}
            className="hud-mono text-[0.75rem] text-cyan-200/90 leading-relaxed min-h-[110px] max-h-[200px] overflow-auto space-y-1 pr-1 scroll-smooth"
          >
            {log.length === 0 && (
              <div className="text-cyan-400/60">&gt; awaiting voice input…</div>
            )}
            {log.map((l) => (
              <div
                key={l.id}
                className={
                  l.kind === "err"
                    ? "text-amber-300"
                    : l.kind === "cmd"
                    ? "text-cyan-100"
                    : l.kind === "ignored"
                    ? "text-cyan-400/40 italic"
                    : "text-cyan-300/90"
                }
              >
                {l.text}
              </div>
            ))}
            {interim && (
              <div className="text-cyan-400/60 italic">&gt; {interim}…</div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {HINTS.map((h) => (
              <span
                key={h}
                className="hud-mono text-[0.65rem] text-cyan-300/80 border border-cyan-400/25 px-1.5 py-0.5"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {quickSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(s.id);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hud-mono text-[0.65rem] text-cyan-200 hover:text-white border border-cyan-400/40 hover:border-cyan-300 px-1.5 py-0.5 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="hud-divider my-3" />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleMute}
              disabled={supported === false}
              className={`hud-btn !py-2 !px-3 !text-[0.7rem] disabled:opacity-40 disabled:cursor-not-allowed ${
                muted ? "hud-btn-gold" : ""
              }`}
            >
              {muted ? "🎙 UNMUTE" : "◼ MUTE"}
            </button>

            <label className="hud-chip cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wakeWord}
                onChange={(e) => setWakeWord(e.target.checked)}
                className="accent-cyan-300 w-3 h-3"
              />
              WAKE WORD
            </label>

            <label className="hud-chip cursor-pointer select-none">
              <input
                type="checkbox"
                checked={speakOn}
                onChange={(e) => setSpeakOn(e.target.checked)}
                className="accent-cyan-300 w-3 h-3"
              />
              VOICE REPLY
            </label>
          </div>
        </div>
      )}

      {/* Floating 3D JARVIS orb — main interaction target.
          State-driven color, distortion, and pulse. Click to expand console. */}
      <div className="flex items-end gap-2">
        <div className="flex flex-col items-end gap-1 mb-1">
          <span
            className={`hud-mono text-[0.65rem] tracking-widest ${
              speaking
                ? "text-amber-300"
                : awaitingFollowUp
                ? "text-amber-300 hud-blink"
                : listening && !muted
                ? "text-emerald-300"
                : "text-cyan-300/80"
            }`}
          >
            {statusText}
          </span>
          {supported !== false && (
            <button
              type="button"
              onClick={toggleMute}
              className="hud-chip transition-all hover:brightness-150"
              aria-label={muted ? "Unmute JARVIS" : "Mute JARVIS"}
              title={muted ? "Unmute JARVIS" : "Mute JARVIS"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
              {muted ? "MUTED" : "LIVE"}
            </button>
          )}
        </div>
        <div className="origin-bottom-right scale-[0.72] sm:scale-100 transition-transform">
          <JarvisOrb
            state={orbState}
            size={104}
            onClick={() => setExpanded((o) => !o)}
            ariaLabel={expanded ? "Collapse JARVIS console" : "Open JARVIS console"}
          />
        </div>
      </div>
    </div>
  );
}
