"use client";

import { useEffect } from "react";

export function ParticlesBackground() {
  useEffect(() => {
    const initParticles = () => {
      if (typeof window !== "undefined" && (window as any).particlesJS) {
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
    };

    if (typeof window !== "undefined") {
      if (!(window as any).particlesJS && !document.getElementById("particles-script-js")) {
        const script = document.createElement("script");
        script.id = "particles-script-js";
        script.src = "https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js";
        script.onload = initParticles;
        document.body.appendChild(script);
      } else {
        // give it a small delay if the script is already loaded but component just mounted
        setTimeout(initParticles, 100);
      }
    }
  }, []);

  return (
    <div 
      id="particles-js" 
      className="absolute inset-0 z-10 w-full h-full mix-blend-screen pointer-events-none opacity-100" 
    />
  );
}
