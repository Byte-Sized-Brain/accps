"use client";

export default function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: i % 3 === 0
              ? "rgba(6, 182, 212, 0.4)"
              : "rgba(139, 92, 246, 0.4)",
          }}
        />
      ))}
    </div>
  );
}
