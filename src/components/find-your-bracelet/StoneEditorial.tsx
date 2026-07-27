import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { StoneSpecificationCards } from "./StoneSpecificationCards";
import { StoneRitualTimeline } from "./StoneRitualTimeline";

interface Props {
  active: any;
  profile: any;
}

export function StoneEditorial({ active, profile }: Props) {
  return (
    <div className="p-12 h-full flex flex-col gap-6 overflow-y-auto">
      <span className="text-copper uppercase tracking-[0.2em] text-xs font-semibold">The Stone</span>
      <h1 className="font-serif text-5xl leading-tight">{active.stone}</h1>
      <h2 className="text-xl font-light text-white/90">{profile.nature[0]} - {profile.nature[1]} - {profile.nature[2]}</h2>
      
      <p className="text-base leading-relaxed text-white/70 font-serif italic my-4">
        {active.story}
      </p>

      <div className="border-t border-white/10 py-6 space-y-6">
        <h3 className="text-sm uppercase tracking-widest text-white/50">Details</h3>
        <StoneSpecificationCards active={active} profile={profile} />
        <StoneRitualTimeline />
      </div>

      <Link
        to="/products/$slug"
        params={{ slug: active.slug }}
        className="mt-4 flex items-center gap-4 text-copper hover:gap-6 transition-all duration-300 border-b border-copper pb-2 w-fit text-sm font-medium uppercase tracking-widest"
      >
        Discover {active.stone} <ArrowRight size={20} />
      </Link>
    </div>
  );
}
