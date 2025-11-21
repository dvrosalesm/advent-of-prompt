"use client";

import React from "react";

export function ChristmasLights() {
  return (
    <div className="fixed top-0 left-0 w-full h-12 pointer-events-none z-50 overflow-hidden flex justify-center gap-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full shadow-[0_0_10px_2px] animate-twinkle ${
            i % 3 === 0 ? "bg-red-500 shadow-red-500" :
            i % 3 === 1 ? "bg-green-500 shadow-green-500" :
            "bg-yellow-400 shadow-yellow-400"
          }`}
          style={{
            animationDelay: `${Math.random() * 2}s`,
            marginTop: `${i % 2 === 0 ? "-4px" : "4px"}`,
          }}
        />
      ))}
      {/* Wire */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-zinc-800/50" style={{ top: '2px' }}></div>
    </div>
  );
}

