"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function ParticlesBackground() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (isScriptLoaded && typeof window !== "undefined" && (window as any).particlesJS) {
      (window as any).particlesJS("particles-js", {
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 } },
          color: { value: "#ffffff" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
          move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
          detect_on: "window",
          events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
          modes: { 
            grab: { distance: 200, line_linked: { opacity: 0.8 } }, 
            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 }, 
            repulse: { distance: 200, duration: 0.4 }, 
            push: { particles_nb: 4 }, 
            remove: { particles_nb: 2 } 
          }
        },
        retina_detect: true
      });
    }
  }, [isScriptLoaded]);

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js" 
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div 
        id="particles-js" 
        className="absolute inset-0 z-[1] w-full h-full mix-blend-screen pointer-events-none opacity-50" 
      />
    </>
  );
}
