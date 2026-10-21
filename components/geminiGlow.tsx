import React from "react";

export default function GeminiGlow() {
  return (
    <div className="relative w-full h-[400px] bg-black overflow-hidden flex items-center justify-center rounded-2xl">
      {/* Background container for blurred gradients */}
      <div className="absolute inset-0 opacity-70 pointer-events-none">
        
        {/* Orb 1: Deep Blue Core */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full blur-4xl animate-pulse-slow" />

        {/* Orb 2: Vibrant Purple / Magenta Shift */}
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/60 rounded-full blur-4xl animate-float" />

        {/* Orb 3: Accent Cyan / Leading Edge Highlight */}
        <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-cyan-400/40 rounded-full blur-3xl animate-pulse-fast" />
      </div>

      {/* Foreground Content / UI representation */}
      <div className="relative z-10 text-center px-4">
        <h3 className="text-white text-xl font-medium tracking-wide">
          Listening & Synthesizing...
        </h3>
        <p className="text-zinc-400 text-sm mt-2">
          Concentrated and diffused gradients active
        </p>
      </div>
    </div>
  );
}