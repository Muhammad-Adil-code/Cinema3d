"use client";

import { useRef, useState } from "react";
import { walkInput } from "@/lib/walkInput";

/** On-screen thumbstick for walking on touch devices. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const R = 46;

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > R) {
      x = (x / len) * R;
      y = (y / len) * R;
    }
    setKnob({ x, y });
    walkInput.joyX = x / R;
    walkInput.joyY = -y / R;
    walkInput.sprint = len > R * 1.4;
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    walkInput.joyX = walkInput.joyY = 0;
    walkInput.sprint = false;
  };

  return (
    <div
      ref={base}
      className="glass pointer-events-auto relative h-32 w-32 touch-none rounded-full"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => e.buttons && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-gradient-to-b from-[#ffd56e] to-[#d99a1e] shadow-[0_0_24px_rgba(245,196,81,0.6)]"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
