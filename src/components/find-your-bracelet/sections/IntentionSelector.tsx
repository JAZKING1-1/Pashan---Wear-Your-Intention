import React from 'react';

interface Intention {
  id: string;
  label: string;
}

const INTENTIONS: Intention[] = [
  { id: 'career', label: 'Career' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'focus', label: 'Focus' },
  { id: 'growth', label: 'Growth' },
  { id: 'calm', label: 'Calm' },
  { id: 'protection', label: 'Protection' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'balance', label: 'Balance' },
  { id: 'productivity', label: 'Productivity' },
];

interface Props {
  onSelect: (intentions: string[]) => void;
}

export function IntentionSelector({ onSelect }: Props) {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleIntention = (id: string) => {
    const next = selected.includes(id) 
      ? selected.filter(i => i !== id)
      : [...selected, id];
    setSelected(next);
    onSelect(next);
  };

  return (
    <div className="p-8 bg-[#F5F2EF] text-[#2E1A14]">
      <h3 className="font-serif text-3xl mb-6">What brings you here today?</h3>
      <div className="flex flex-wrap gap-3">
        {INTENTIONS.map((intention) => (
          <button
            key={intention.id}
            onClick={() => toggleIntention(intention.id)}
            className={`px-6 py-3 rounded-full border transition-all duration-300 ${
              selected.includes(intention.id)
                ? 'bg-[#2E1A14] text-white border-[#2E1A14]'
                : 'bg-transparent border-[#5E4A42]/30 hover:border-[#2E1A14]'
            }`}
          >
            {intention.label}
          </button>
        ))}
      </div>
    </div>
  );
}
