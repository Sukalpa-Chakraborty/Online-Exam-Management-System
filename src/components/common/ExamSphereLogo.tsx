interface ExamSphereLogoProps {
  className?: string;
  size?: number;
}

export function ExamSphereLogo({ className = "h-full w-full", size = 44 }: ExamSphereLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30 ${className}`}
      style={{
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
      }}
    >
      <img
        src="/logo.png"
        alt="ExamSphere Logo"
        className="h-full w-full object-cover scale-[1.04] transition-transform duration-300 group-hover:scale-110"
        style={{
          clipPath: "circle(50% at 50% 50%)",
          WebkitClipPath: "circle(50% at 50% 50%)",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}

export default ExamSphereLogo;
