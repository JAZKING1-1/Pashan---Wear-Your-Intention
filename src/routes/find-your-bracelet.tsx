import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { StoneFinderFeedback } from "@/components/StoneFinderFeedback";
import { collections } from "@/data/products";
import { StoneSelector } from "@/components/find-your-bracelet/StoneSelector";
import { StoneHero } from "@/components/find-your-bracelet/StoneHero";
import { StoneEditorial } from "@/components/find-your-bracelet/StoneEditorial";
import "@/components/find-your-bracelet/styles.css";

export const Route = createFileRoute("/find-your-bracelet")({
  component: FindPage,
});

// ... Keep existing stoneProfiles object ...
interface StoneProfile {
  nature: [string, string, string];
  bestFor: string;
  guidance: string;
  validation: string;
  traitDetails: [string, string, string];
}

const stoneProfiles: Record<string, StoneProfile> = {
  pyrite: {
    nature: ["Bold", "Metallic", "Energising"],
    bestFor: "ambitious starts, wealth-minded habits, and decisive action",
    guidance:
      "Choose Pyrite when you want a visible reminder to value your work, prepare carefully, and move with purpose.",
    validation:
      "A strong choice when you are building confidence, prosperity, or a braver relationship with opportunity.",
    traitDetails: [
      "A reminder to trust your preparation.",
      "Supports a bold, action-first mindset.",
      "Traditionally linked with prosperity.",
    ],
  },
  "tiger-eye": {
    nature: ["Focused", "Steady", "Courageous"],
    bestFor: "leadership, confident decisions, and calm forward movement",
    guidance:
      "Reach for Tiger Eye before a meeting, difficult choice, or new responsibility. Let its golden bands remind you to slow down and see clearly.",
    validation:
      "A thoughtful choice for confidence, leadership, courage, and clear decisions.",
    traitDetails: [
      "Encourages trust in your own judgement.",
      "A steady symbol for brave choices.",
      "Traditionally carried as a protective stone.",
    ],
  },
  hematite: {
    nature: ["Grounded", "Disciplined", "Stable"],
    bestFor: "deep work, firm boundaries, and steady daily routines",
    guidance:
      "Use Hematite as a cue to return to the present task. Its weight and mirror-dark finish suit structured, focused days.",
    validation:
      "A grounded choice when you want steadier focus, clearer boundaries, and dependable routines.",
    traitDetails: [
      "Traditionally linked with emotional steadiness.",
      "A practical reminder to finish one task at a time.",
      "Its weight gives a tangible sense of grounding.",
    ],
  },
  amethyst: {
    nature: ["Reflective", "Quiet", "Clear"],
    bestFor: "stillness, thoughtful communication, and evening reflection",
    guidance:
      "Choose Amethyst for moments that ask you to pause before responding. Pair it with a short breath or journaling ritual.",
    validation:
      "A gentle choice when you are seeking calm, balance, clarity, or a quieter pace.",
    traitDetails: [
      "A visual cue to soften the pace.",
      "Associated with emotional balance.",
      "Supports reflection before action.",
    ],
  },
  "green-quartz": {
    nature: ["Fresh", "Optimistic", "Renewing"],
    bestFor: "new chapters, positive habits, and patient personal growth",
    guidance:
      "Wear Green Quartz when beginning again. Let the fresh colour mark one small action you can repeat consistently.",
    validation:
      "A hopeful choice for renewal, positivity, growth, and patient progress.",
    traitDetails: [
      "Represents patient, natural growth.",
      "A bright reminder to notice possibility.",
      "Suited to fresh starts and renewed habits.",
    ],
  },
  lava: {
    nature: ["Elemental", "Textured", "Resilient"],
    bestFor: "change, endurance, courageous action, and rebuilding",
    guidance:
      "Choose Lava Stone when life feels in motion. Its porous texture is a reminder that strength can be shaped through change.",
    validation:
      "A resilient choice when you are navigating change, rebuilding strength, or choosing courage.",
    traitDetails: [
      "A symbol of strength shaped over time.",
      "Associated with brave movement through change.",
      "Its raw texture represents resilience.",
    ],
  },
  "dhan-yog": {
    nature: ["Composed", "Purposeful", "Abundant"],
    bestFor: "opportunity, focused effort, balanced ambition, and prosperity",
    guidance:
      "Dhan Yog combines five stones into one considered rhythm. Choose it when you want a layered reminder that opportunity also needs focus.",
    validation:
      "A considered choice for opportunity, focused ambition, prosperity, and balanced momentum.",
    traitDetails: [
      "A five-stone symbol for recognising possibility.",
      "Balances ambition with deliberate attention.",
      "Traditionally associated with prosperity.",
    ],
  },
};

const bracelets = collections.filter((collection) => !collection.isCustom);

function FindPage() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [exploredStones, setExploredStones] = useState<string[]>(() => {
    const initial = bracelets[1] ?? bracelets[0];
    return initial ? [initial.slug] : [];
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPrompted, setFeedbackPrompted] = useState(false);
  
  const active = bracelets[activeIndex] ?? bracelets[0];

  useEffect(() => {
    if (exploredStones.length < 2 || feedbackPrompted) return;

    const timer = window.setTimeout(() => {
      setFeedbackOpen(true);
      setFeedbackPrompted(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [exploredStones, feedbackPrompted]);

  if (!active) return null;

  const profile = stoneProfiles[active.slug] ?? stoneProfiles["tiger-eye"]!;
  const previewImage = active.images[1] ?? active.image;

  const chooseIndex = (index: number) => {
    const next = bracelets[index];
    if (!next) return;

    setActiveIndex(index);
    setExploredStones((current) =>
      current.includes(next.slug) ? current : [...current, next.slug],
    );
  };

  return (
    <SiteLayout>
      <section 
        className="luxe-page-container transition-colors duration-900 min-h-screen grid grid-cols-1 md:grid-cols-[280px_1fr_400px] gap-0" 
        style={{ backgroundColor: active.tone }}
      >
        <div className="flex flex-col border-r border-white/10">
            <h2 className="p-8 font-serif text-2xl border-b border-white/10">Stone Selector</h2>
            <StoneSelector 
              bracelets={bracelets} 
              activeIndex={activeIndex} 
              onSelect={chooseIndex} 
            />
        </div>
        
        <div className="relative flex items-center justify-center h-[50vh] md:h-screen w-full">
            <StoneHero 
              image={previewImage} 
              name={active.stone} 
            />
        </div>
        
        <div className="overflow-y-auto h-screen bg-black/5">
            <StoneEditorial 
              active={active} 
              profile={profile} 
            />
        </div>

        <StoneFinderFeedback
          open={feedbackOpen}
          selectedStone={active.stone}
          exploredStones={exploredStones}
          onOpenChange={setFeedbackOpen}
        />
      </section>
    </SiteLayout>
  );
}
