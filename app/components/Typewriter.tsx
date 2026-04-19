import { useEffect, useState } from "react";

export function Typewriter({
  text,
  speed = 28,
  startDelay = 0,
  className,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    let cancelled = false;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      if (i <= text.length) {
        setOut(text.slice(0, i));
        i++;
        id = setTimeout(tick, speed);
      }
    };
    const startId = setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(id);
      clearTimeout(startId);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {out}
      <span className="caret" style={{ height: "0.9em" }} />
    </span>
  );
}
