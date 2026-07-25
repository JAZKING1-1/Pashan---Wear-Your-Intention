import { Link } from "@tanstack/react-router";
import logoImage from "@/assets/pashan-logo-transparent.png";

type LogoTone = "inherit" | "light" | "dark";

interface LogoProps {
  className?: string;
  title?: string;
}

export function PashanSymbol({
  className = "",
  title = "PASHAN peacock lettermark",
}: LogoProps) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`pashan-symbol-crop ${className}`}
      style={{
        display: 'block',
        overflow: 'visible',
        background: 'transparent'
      }}
    >
      <img 
        src={logoImage} 
        alt="" 
        aria-hidden 
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          background: 'transparent'
        }}
      />
    </span>
  );
}

export function PeacockGlyph({ className = "" }: { className?: string }) {
  return <PashanSymbol className={className} title="PASHAN symbol" />;
}

export function BrandMark({
  compact = false,
  tone = "inherit",
}: {
  compact?: boolean;
  tone?: LogoTone;
}) {
  return (
    <Link
      to="/"
      className={`brand-mark brand-mark-${tone} ${compact ? "is-compact" : ""}`}
      aria-label="PASHAN home"
    >
      <span className="brand-logo-window" style={{ display: 'block', overflow: 'visible', background: 'transparent' }}>
        <img 
          src={logoImage} 
          alt="" 
          aria-hidden 
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            background: 'transparent'
          }}
        />
      </span>
      <span className="sr-only">
        PASHAN{!compact && " - Wear Your Intention"}
      </span>
    </Link>
  );
}
