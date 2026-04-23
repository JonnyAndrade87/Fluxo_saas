"use client";

import { useEffect, useCallback, useRef } from "react";
import Script from "next/script";

export function ParticlesBackground() {
  const initialized = useRef(false);

  const initParticles = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).particlesJS && !initialized.current) {
      try {
        const container = document.getElementById("particles-js");
        if (!container) return;

        (window as any).particlesJS("particles-js", {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.4, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.3, width: 1 },
            move: { enable: true, speed: 1.8, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
          },
          interactivity: {
            detect_on: "window",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { 
              grab: { distance: 250, line_linked: { opacity: 0.6 } }, 
              push: { particles_nb: 4 }
            }
          },
          retina_detect: true
        });
        initialized.current = true;
      } catch (e) {
        console.error("Particles.js init error:", e);
      }
    }
  }, []);

  useEffect(() => {
    let checks = 0;
    const interval = setInterval(() => {
      if ((window as any).particlesJS) {
        initParticles();
        clearInterval(interval);
      }
      if (++checks > 15) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [initParticles]);

  return (
    <>
      <Script 
        src="/particles.min.js"
        onReady={initParticles}
        strategy="lazyOnload"
      />
      <div 
        id="particles-js" 
        className="absolute inset-0 z-0 w-full h-full pointer-events-none" 
        style={{ mixBlendMode: 'screen' }}
      />
    </>
  );
}
