import { motion } from "framer-motion";
import { useState } from "react";

export function ChooseCollection() {
  const [activeJourney, setActiveJourney] = useState<"rashi" | "sacred" | null>(
    null,
  );

  const chooseJourney = (journey: "rashi" | "sacred", id: string) => {
    setActiveJourney(journey);
    const element = document.getElementById(id);
    if (element) {
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    }
  };

  return (
    <section className="py-24 bg-[#F5F2EF] text-[#2E1A14] overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="font-serif text-5xl mb-6">Choose Your Rakhi Journey</h2>
        <p className="font-sans text-lg max-w-xl mx-auto opacity-80">
          Every Rakhi begins with a different intention. Some are guided by the
          stars. Others by the blessings you wish to give.
        </p>
      </div>

      <div className="rakhi-journey-grid">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => chooseJourney("rashi", "rashi-section")}
          className={`rakhi-journey-card is-rashi ${activeJourney === "rashi" ? "is-selected" : ""}`}
        >
          <div className="absolute inset-0 bg-stars opacity-50"></div>
          <h3 className="font-serif text-4xl mb-4 relative z-10">
            Rashi Collection
          </h3>
          <p className="mb-8 relative z-10 opacity-80">
            Find the Rakhi aligned with their zodiac.
          </p>
          <span className="rakhi-journey-action">
            {activeJourney === "rashi" ? "Opening Rashi" : "Explore Rashi"}
          </span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => chooseJourney("sacred", "sacred-section")}
          className={`rakhi-journey-card is-sacred ${activeJourney === "sacred" ? "is-selected" : ""}`}
        >
          <div className="absolute inset-0 bg-marble-texture opacity-30"></div>
          <h3 className="font-serif text-4xl mb-4 relative z-10">
            Sacred Intentions
          </h3>
          <p className="mb-8 relative z-10 opacity-80">
            Inspired by blessings, prosperity, and balance.
          </p>
          <span className="rakhi-journey-action">
            {activeJourney === "sacred" ? "Opening Sacred" : "Explore Sacred"}
          </span>
        </motion.button>
      </div>
      <p className="sr-only" aria-live="polite">
        {activeJourney ? `${activeJourney} collection selected` : ""}
      </p>
    </section>
  );
}
