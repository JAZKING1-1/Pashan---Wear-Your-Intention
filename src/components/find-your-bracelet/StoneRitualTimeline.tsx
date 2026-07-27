export function StoneRitualTimeline() {
  return (
    <div className="flex flex-col gap-4 mt-8">
      <h3 className="font-serif text-xl text-copper">Ritual</h3>
      <div className="border-l border-copper/30 pl-4 space-y-4">
        <div className="relative">
          <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-copper" />
          <p className="text-sm">Pause and take a breath.</p>
        </div>
        <div className="relative">
          <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-copper/50" />
          <p className="text-sm">Observe the stone texture.</p>
        </div>
        <div className="relative">
          <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-copper/30" />
          <p className="text-sm">Set your intention.</p>
        </div>
      </div>
    </div>
  );
}
