export const DAILY_NOTES_VERSION = 1;
export const dailyNotes = [
  "Begin with the next honest step.",
  "Let steadiness be your strength today.",
  "Carry less. Notice more.",
  "Choose what deserves your attention.",
  "A quiet decision can change a loud day.",
  "Return to the work in front of you.",
  "Make room for what is becoming clear.",
  "Your pace can still be purposeful.",
  "Protect the hour that matters most.",
  "Let courage be practical.",
  "Rest is part of making.",
  "Keep one promise to yourself today.",
  "Clarity often arrives after the pause.",
  "Choose presence over performance.",
  "Hold the intention; release the pressure.",
  "Small rituals make a day feel held.",
  "Move with care, then with conviction.",
  "Notice what already feels enough.",
  "Give your attention a direction.",
  "You do not have to hurry your becoming.",
  "Make the simple choice beautifully.",
  "Let today be shaped, not chased.",
  "Begin again without making it a failure.",
  "Keep the faith; make the work.",
  "What you repeat becomes your rhythm.",
  "Leave space for a better answer.",
  "Choose the quality you wish to practise.",
  "The next chapter can start quietly.",
  "Let your hands remind your mind.",
  "Stand gently, but stand fully.",
] as const;

export const getKolkataDateKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getDailyNote = (dateKey: string) => {
  const seed = `${DAILY_NOTES_VERSION}:${dateKey}`
    .split("")
    .reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  return dailyNotes[seed % dailyNotes.length]!;
};
