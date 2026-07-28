import { Link } from "@tanstack/react-router";
import { BrandMark } from "./BrandMark";

export function SearchPage() {
  return (
    <div className="min-h-screen bg-cream py-24 text-ink">
      <div className="container-luxe mx-auto text-center">
        <h1 className="text-5xl font-serif mb-12">Search</h1>
        <form
          className="max-w-2xl mx-auto flex border-b-2 border-ink"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            placeholder="Search for stones, jewellery, intentions..."
            className="flex-grow bg-transparent p-4 outline-none text-lg"
          />
          <button
            type="submit"
            className="px-6 font-bold uppercase tracking-widest hover:text-pop-terracotta"
          >
            Search
          </button>
        </form>
        <p className="mt-8 text-muted-foreground">Results will appear here.</p>
      </div>
    </div>
  );
}
