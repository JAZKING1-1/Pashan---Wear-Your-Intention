import type { Collection } from "@/data/products";

interface Props {
  active: Collection;
  profile: any;
}

export function StoneSpecificationCards({ active, profile }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      {profile.traitDetails.map((detail: string, i: number) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-white/70">{detail}</p>
        </div>
      ))}
    </div>
  );
}
