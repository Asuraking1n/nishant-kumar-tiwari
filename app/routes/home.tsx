import { lazy, Suspense, useEffect, useState } from "react";
import type { Route } from "./+types/home";

import { BootSequence } from "../components/BootSequence";
import { HudTopBar, HudSideRails } from "../components/HudOverlay";
import { JarvisVoice } from "../components/JarvisVoice";
import { SystemEffectsOverlay } from "../components/SystemEffectsOverlay";
import { About } from "../sections/About";
import { Experience } from "../sections/Experience";
import { Skills } from "../sections/Skills";
import { Projects } from "../sections/Projects";
import { Contact } from "../sections/Contact";
import { useRevealOnScroll } from "../components/RevealOnScroll";

// Load the 3D hero on the client only (three.js needs WebGL / browser APIs).
const Hero = lazy(() =>
  import("../sections/Hero").then((m) => ({ default: m.Hero }))
);

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nishant Kumar Tiwari // J.A.R.V.I.S. Dossier" },
    {
      name: "description",
      content:
        "Nishant Kumar Tiwari — Software Development Engineer (Frontend). JARVIS-themed portfolio running on the Stark Industries private network.",
    },
  ];
}

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useRevealOnScroll();

  return (
    <main className="relative min-h-screen">
      {clientReady && !booted && <BootSequence onDone={() => setBooted(true)} />}

      <HudTopBar />
      <HudSideRails />

      {/* 3D Hero — client only */}
      {clientReady ? (
        <Suspense fallback={<HeroFallback />}>
          <Hero />
        </Suspense>
      ) : (
        <HeroFallback />
      )}

      <About />
      <Experience />
      <Skills />
      <Projects />
      <Contact />

      {clientReady && booted && <JarvisVoice />}
      {clientReady && booted && <SystemEffectsOverlay />}

      <footer className="relative z-10 border-t border-cyan-400/10 py-6 px-4 sm:px-8 hud-mono text-[0.68rem] sm:text-[0.7rem] text-cyan-400/60">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center leading-relaxed">
          <span>© {new Date().getFullYear()} NISHANT KUMAR TIWARI</span>
          <span className="text-cyan-400/30">·</span>
          <span>
            <span className="text-amber-300">STARK INDUSTRIES</span> PRIVATE NETWORK
          </span>
          <span className="text-cyan-400/30">·</span>
          <span>NODE NKT-DEL-01 ONLINE</span>
        </div>
      </footer>
    </main>
  );
}

function HeroFallback() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="w-[60vmin] h-[60vmin] rounded-full border border-cyan-400/30 hud-spin-slow" />
      <div className="absolute w-[75vmin] h-[75vmin] rounded-full border border-cyan-400/20 hud-spin-slow-rev" />
      <div className="absolute text-center">
        <div className="hud-chip inline-flex hud-blink">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
          INITIALIZING HUD
        </div>
      </div>
    </section>
  );
}
