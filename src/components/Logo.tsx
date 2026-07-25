import logoImage from "@/assets/pashan-logo-transparent.png";

interface LogoProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export function Logo({ className = "", height, width }: LogoProps) {
  return (
    <div 
      className={`logo-container ${className}`} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        overflow: 'visible',
        background: 'transparent',
        height: height || '56px',
        width: width || 'auto'
      }}
    >
      <img
        src={logoImage}
        alt="PASHAN"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'center',
          background: 'transparent',
          overflow: 'visible'
        }}
      />
    </div>
  );
}