import { type CSSProperties } from "react";
import "./styles.css";

interface Props {
  image: string;
  name: string;
}

export function StoneHero({ image, name }: Props) {
  return (
    <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
      {/* Background Layers for Ambient Depth */}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent blur-[100px] opacity-40 animate-breathe" />
      <div className="absolute inset-0 bg-[url('/light-rays.png')] bg-cover bg-center opacity-10 animate-pulse" />
      
      {/* Floating Bracelet Layer */}
      <div className="relative z-10 animate-floating">
        <img
          src={image}
          alt={name}
          className="w-[500px] h-[500px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700"
        />
      </div>
    </div>
  );
}
