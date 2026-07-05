"use client";

export default function GlowBorder({ color = "#0F2B4B", radius = "12px" }: { color?: string; radius?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        padding: "3px",
        borderRadius: radius,
        backgroundImage: `conic-gradient(from 0deg, transparent 35%, ${color} 42%, transparent 49%)`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
      }}
    />
  );
}
