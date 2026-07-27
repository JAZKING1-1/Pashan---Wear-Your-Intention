import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { StoneFinderFeedback } from "@/components/StoneFinderFeedback";
import { collections } from "@/data/products";
import { StoneSelector } from "@/components/find-your-bracelet/StoneSelector";
import { RecommendationEngine } from "@/components/find-your-bracelet/sections/RecommendationEngine";
import { FAQ } from "@/components/find-your-bracelet/FAQ";
import { IntentionSelector } from "@/components/find-your-bracelet/sections/IntentionSelector";
import "@/components/find-your-bracelet/styles.css";

export const Route = createFileRoute("/find-your-bracelet")({
  component: FindPage,
});

const bracelets = collections.filter((collection) => !collection.isCustom);

function FindPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIntentions, setSelectedIntentions] = useState<string[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const active = bracelets[activeIndex] ?? bracelets[0];

  const chooseIndex = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <SiteLayout>
      <main className="flex flex-col min-h-screen">
        
        {/* Section 1: Luxury Hero */}
        <section className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-[#F5F2EF] text-[#2E1A14] overflow-hidden">
          {/* Background Textures */}
          <div className="absolute inset-0 bg-[url('/light-rays.png')] opacity-5 mix-blend-multiply"></div>
          <div className="absolute inset-0 radial-gradient-background"></div>
          
          <h1 className="font-serif text-6xl md:text-8xl mb-6 text-center z-10 relative fade-in-up">Find Your Stone</h1>
          <p className="font-sans text-xl text-center max-w-2xl text-[#2E1A14]/70 z-10 relative fade-in-up delay-200">
            Seven natural stones. Seven different energies. Choose the one that aligns with your present intention.
          </p>
          <div className="absolute bottom-10 animate-bounce text-[#2E1A14]/50 z-10">Scroll to explore</div>
        </section>

        {/* Section 2: Narrative Bridge (Removing whitespace) */}
        <section className="py-12 bg-[#2E1A14] text-[#F5F2EF] text-center">
            <p className="font-serif text-2xl italic">"The intention you set is the first step of the journey."</p>
        </section>

        {/* Section 3: Intention Selector */}
        <section className="py-20 bg-[#F5F2EF] text-[#2E1A14]">
            <h2 className="text-center font-serif text-3xl mb-12">What brings you here today?</h2>
            <IntentionSelector onSelect={setSelectedIntentions} />
        </section>

        {/* Section 4: Large Recommendation Experience */}
        <section className="py-20 bg-[#2E1A14] text-[#F5F2EF]">
            <RecommendationEngine selectedIntentions={selectedIntentions} bracelets={bracelets} />
        </section>

        {/* Section 5: Stone Explorer */}
        <section className="py-20 bg-[#F5F2EF] text-[#2E1A14]">
            <h2 className="text-center font-serif text-3xl mb-12">Explore the Collection</h2>
            <StoneSelector bracelets={bracelets} activeIndex={activeIndex} onSelect={chooseIndex} />
        </section>

        {/* Section 6: Immersive Editorial Story */}
        <section className="py-20 bg-[#2E1A14] text-[#F5F2EF] px-8">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <img src={active.image} alt={active.stone} className="rounded-xl shadow-2xl transition-all duration-500 hover:scale-105" />
                <div>
                    <h3 className="font-serif text-4xl mb-6">{active.stone}</h3>
                    <p className="font-sans text-lg mb-6 leading-relaxed text-[#F5F2EF]/80">{active.story}</p>
                    <p className="font-sans italic text-[#B87333]">"Natural stones do not change your life. They quietly remind you to change it yourself."</p>
                </div>
            </div>
        </section>
        
        {/* Section 7: Premium FAQ */}
        <section className="py-20 bg-[#F5F2EF] text-[#2E1A14]">
            <h2 className="text-center font-serif text-3xl mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto px-4">
                <FAQ />
            </div>
        </section>
        
        <StoneFinderFeedback
          open={feedbackOpen}
          selectedStone={active.stone}
          exploredStones={[]}
          onOpenChange={setFeedbackOpen}
        />
      </main>
    </SiteLayout>
  );
}
