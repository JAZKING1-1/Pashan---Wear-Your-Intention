type OrnamentProps = { className?: string };
const decorative = { "aria-hidden": true, focusable: false } as const;
export function LeafDivider({ className }: OrnamentProps) {
  return (
    <svg {...decorative} className={className} viewBox="0 0 240 28">
      <path
        d="M2 14h82m72 0h82M84 14c14-18 26-18 36 0-10 18-22 18-36 0Zm72 0c-14-18-26-18-36 0 10 18 22 18 36 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m92 14 20 0m36 0-20 0" stroke="currentColor" />
    </svg>
  );
}
export function DoubleLineFrame({ className }: OrnamentProps) {
  return (
    <svg
      {...decorative}
      className={className}
      viewBox="0 0 160 100"
      preserveAspectRatio="none"
    >
      <rect
        x="2"
        y="2"
        width="156"
        height="96"
        rx="6"
        fill="none"
        stroke="currentColor"
      />
      <rect
        x="7"
        y="7"
        width="146"
        height="86"
        rx="4"
        fill="none"
        stroke="currentColor"
      />
      <path
        d="M7 24c12-10 20-10 30 0-10 10-18 10-30 0Zm116 52c12-10 20-10 30 0-10 10-18 10-30 0Z"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}
export function BotanicalSeal({ className }: OrnamentProps) {
  return (
    <svg {...decorative} className={className} viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="53"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" />
      <path
        d="M60 91V29M60 46c-18-15-28-4-24 9 12 2 20-1 24-9Zm0 15c18-15 28-4 24 9-12 2-20-1-24-9Zm0 15c-16-12-25-2-21 9 10 1 17-2 21-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
