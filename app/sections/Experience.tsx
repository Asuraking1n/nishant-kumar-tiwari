import { SectionFrame } from "../components/HudOverlay";
import { experience } from "../data/profile";

export function Experience() {
  return (
    <SectionFrame id="experience" label="// MISSION LOG" title="Combat Record">
      <div className="relative">
        {/* Vertical timeline track */}
        <div className="absolute left-3 sm:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-400/70 via-cyan-400/30 to-transparent" />
        <ul className="space-y-6 sm:space-y-8">
          {experience.map((exp) => (
            <li key={exp.id} className="relative pl-10 sm:pl-20 reveal">
              {/* Node */}
              <div className="absolute -left-1 sm:left-4 top-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-300/50 hud-spin-slow-rev" />
                <div className="absolute inset-2 rounded-full border border-cyan-300/30 hud-spin-slow" />
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 hud-text-glow" />
              </div>

              <article className="hud-panel p-4 sm:p-7">
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />
                <div className="hud-corner-bl" />
                <div className="hud-corner-br" />

                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="hud-mono text-[0.65rem] text-cyan-400/70 tracking-widest mb-1">
                      {exp.id} // {exp.location.toUpperCase()}
                    </div>
                    <h3 className="hud-font text-xl sm:text-2xl text-cyan-100 hud-text-glow">
                      {exp.company}
                    </h3>
                    <div className="hud-mono text-sm text-amber-300/90 mt-0.5">
                      {exp.role}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="hud-chip">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          exp.status === "ACTIVE"
                            ? "bg-emerald-300 hud-blink"
                            : "bg-cyan-300/60"
                        }`}
                      />
                      {exp.status}
                    </div>
                    <div className="hud-mono text-[0.72rem] text-cyan-300/80">
                      {exp.duration}
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {exp.points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-cyan-100/90 text-sm">
                      <span className="text-amber-300 mt-[2px]">▸</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cyan-400/10">
                  {exp.stack.map((s) => (
                    <span key={s} className="hud-chip">
                      {s}
                    </span>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </SectionFrame>
  );
}
