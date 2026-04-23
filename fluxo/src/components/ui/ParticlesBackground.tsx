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
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
          },
          interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { 
              grab: { distance: 200, line_linked: { opacity: 0.5 } }, 
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
    // Check every 100ms if particlesJS is available, up to 5 times
    let checks = 0;
    const interval = setInterval(() => {
      if ((window as any).particlesJS) {
        initParticles();
        clearInterval(interval);
      }
      if (++checks > 10) clearInterval(interval);
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
        className="absolute inset-0 z-0 w-full h-full pointer-events-auto" 
        style={{ mixBlendMode: 'screen' }}
      />
    </>
  );
}
