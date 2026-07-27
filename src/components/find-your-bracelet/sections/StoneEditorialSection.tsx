import React from 'react';
import { Collection } from "@/data/products";

interface Props {
  active: Collection;
  profile: any; // Using any as the structure is defined in routes/find-your-bracelet.tsx
}

export function StoneEditorialSection({ active, profile }: Props) {
  return (
    <section className="py-24 bg-[#F5F2EF] text-[#2E1A14]">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-5xl mb-6">The Essence of {active.stone}</h2>
            <p className="text-xl text-[#5E4A42] leading-relaxed mb-6">
              {profile.guidance}
            </p>
            <div className="space-y-4">
              {profile.traitDetails.map((detail: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#B87333]"></span>
                    <span className="text-[#5E4A42]">{detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
            <img src={active.image} alt={active.stone} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
