import React, { useMemo } from 'react';
import { Collection, stoneIntentionWeights } from "@/data/products";
import { Link } from '@tanstack/react-router';

interface Props {
  selectedIntentions: string[];
  bracelets: Collection[];
}

export function RecommendationEngine({ selectedIntentions, bracelets }: Props) {
  const recommendations = useMemo(() => {
    if (selectedIntentions.length === 0) return [];

    const scoredBracelets = bracelets
      .filter((b) => !b.isCustom)
      .map((bracelet) => {
        const weights = stoneIntentionWeights[bracelet.slug] ?? {};
        let score = 0;
        selectedIntentions.forEach((intention) => {
          score += weights[intention] ?? 0;
        });
        
        // Normalize score: each intention contributes up to 5 points
        const maxPossible = selectedIntentions.length * 5;
        const percentage = maxPossible > 0 ? Math.min(100, Math.round((score / maxPossible) * 100)) : 0;
        
        return { bracelet, score, percentage };
      })
      .sort((a, b) => b.score - a.score);

    return scoredBracelets;
  }, [selectedIntentions, bracelets]);

  if (recommendations.length === 0) return null;

  const bestMatch = recommendations[0];
  const alternatives = recommendations.slice(1, 3);

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 bg-[#D1C9B8] text-[#2E1A14] rounded-2xl shadow-xl">
      <h3 className="font-serif text-4xl mb-10 text-center uppercase tracking-widest">Consultation Result</h3>
      
      {/* Best Match */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <img src={bestMatch.bracelet.image} alt={bestMatch.bracelet.stone} className="rounded-xl shadow-2xl" />
        <div>
            <h4 className="text-sm uppercase tracking-widest text-[#B87333] mb-2 font-bold">Best Match for you</h4>
            <h4 className="text-4xl font-serif mb-4">{bestMatch.bracelet.stone}</h4>
            <div className="w-full bg-[#2E1A14]/20 h-2 rounded-full mb-6">
                <div className="bg-[#B87333] h-2 rounded-full" style={{ width: `${bestMatch.percentage}%` }}></div>
            </div>
            <p className="mb-8 text-lg leading-relaxed text-[#2E1A14]/80">
              {bestMatch.bracelet.story.slice(0, 150)}...
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/products/$slug"
                params={{ slug: bestMatch.bracelet.slug }}
                className="flex-1 bg-[#2E1A14] text-[#F5F2EF] py-4 rounded-lg text-center font-bold hover:bg-[#4a2a20] transition-colors"
              >
                Make It Yours
              </Link>
              <Link 
                to="/products/$slug"
                params={{ slug: bestMatch.bracelet.slug }}
                className="flex-1 border border-[#2E1A14] py-4 rounded-lg text-center font-bold hover:bg-[#2E1A14]/10 transition-colors"
              >
                Explore Collection
              </Link>
            </div>
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="border-t border-[#2E1A14]/20 pt-12">
            <h5 className="font-serif text-xl mb-8">Alternative Perspectives</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {alternatives.map(alt => (
                    <div key={alt.bracelet.slug} className="flex gap-6 items-center">
                        <img src={alt.bracelet.image} alt={alt.bracelet.stone} className="w-24 h-24 rounded-lg object-cover" />
                        <div>
                            <p className="font-serif text-lg font-bold">{alt.bracelet.stone}</p>
                            <p className="text-sm text-[#2E1A14]/60 mb-3">{alt.percentage}% Match</p>
                            <Link 
                                to="/products/$slug"
                                params={{ slug: alt.bracelet.slug }}
                                className="text-[#B87333] underline text-sm font-bold"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
