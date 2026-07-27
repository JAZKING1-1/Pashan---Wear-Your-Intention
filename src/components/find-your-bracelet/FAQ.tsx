import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  { question: "How do I choose the right stone?", answer: "Trust your intuition. The stone that calls to you is usually the one you need most at this moment." },
  { question: "Are the stones natural?", answer: "Yes, we source high-quality natural stones for all our creations." },
  { question: "How should I care for my bracelet?", answer: "Clean gently with a soft cloth and store in a cool, dry place." },
];

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqItems.map((item, index) => (
        <div key={index} className="border-b border-[#2E1A14]/20 pb-4">
          <button 
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            className="flex justify-between w-full text-left font-serif text-lg py-4 transition-colors hover:text-[#B87333]"
          >
            {item.question}
            <span>{activeIndex === index ? '−' : '+'}</span>
          </button>
          <div className={`overflow-hidden transition-all duration-350 ease-in-out ${activeIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-[#2E1A14]/70 font-sans pb-4">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
