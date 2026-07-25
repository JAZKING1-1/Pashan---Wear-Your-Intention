import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 120);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className={`flex items-center gap-1 text-ivory text-sm uppercase tracking-[0.25em] transition-colors ${isOpen ? 'text-[#C8A15A]' : 'hover:text-[#C8A15A]'}`} 
        aria-expanded={isOpen}
      >
        Shop <ChevronDown size={14} aria-hidden />
        {isOpen && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#C8A15A]"></span>}
      </button>

      <div 
        className={`fixed top-[80px] left-1/2 -translate-x-1/2 w-full max-w-[1200px] z-[999] bg-gradient-to-b from-[#31170F] to-[#25120D] border border-[#C8A15A]/20 shadow-2xl backdrop-blur-md transition-all duration-240 ease-out ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
        style={{ height: '440px' }}
      >
        <div className="container-luxe mx-auto flex gap-[120px] p-12">
          {/* Column 1: By Stone */}
          <div className="flex-1">
            <h3 className="text-[#C8A15A] text-xs uppercase tracking-[0.25em] mb-6">By Stone</h3>
            <div className="w-12 h-[1px] bg-[#C8A15A]/50 mb-8" />
            <div className="flex flex-col gap-3">
              {[
                { label: 'Tiger Eye', to: '/collections/tiger-eye' },
                { label: 'Pyrite', to: '/collections/pyrite' },
                { label: 'Hematite', to: '/collections/hematite' },
                { label: 'Amethyst', to: '/collections/amethyst' },
                { label: 'Green Quartz', to: '/collections/green-quartz' },
                { label: 'Lava Stone', to: '/collections/lava' },
              ].map(item => (
                <Link key={item.label} to={item.to} className="group text-ivory text-sm transition-all duration-180 hover:text-[#C8A15A] py-1 block overflow-hidden">
                    <span className="inline-block transition-transform duration-180 group-hover:translate-x-1.5">{item.label}</span>
                    <span className="block h-[1px] w-0 bg-[#C8A15A] transition-all duration-180 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Column 2: By Intention */}
          <div className="flex-1">
            <h3 className="text-[#C8A15A] text-xs uppercase tracking-[0.25em] mb-6">By Intention</h3>
            <div className="w-12 h-[1px] bg-[#C8A15A]/50 mb-8" />
            <div className="flex flex-col gap-3">
              {[
                { label: 'Courage', to: '/collections/tiger-eye' },
                { label: 'Prosperity', to: '/collections/pyrite' },
                { label: 'Focus', to: '/collections/hematite' },
                { label: 'Growth', to: '/collections/green-quartz' },
                { label: 'Stillness', to: '/collections/amethyst' },
                { label: 'Balance', to: '/collections/dhan-yog' },
              ].map(item => (
                <Link key={item.label} to={item.to} className="group text-ivory text-sm transition-all duration-180 hover:text-[#C8A15A] py-1 block overflow-hidden">
                    <span className="inline-block transition-transform duration-180 group-hover:translate-x-1.5">{item.label}</span>
                    <span className="block h-[1px] w-0 bg-[#C8A15A] transition-all duration-180 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Featured */}
          <div className="flex-1">
            <h3 className="text-[#C8A15A] text-xs uppercase tracking-[0.25em] mb-6">Featured</h3>
            <div className="w-12 h-[1px] bg-[#C8A15A]/50 mb-8" />
            <div className="flex flex-col gap-3">
              <Link to="/collections" className="group text-ivory text-sm transition-all duration-180 hover:text-[#C8A15A] py-1 block">Best Sellers</Link>
              <Link to="/collections" className="group text-ivory text-sm transition-all duration-180 hover:text-[#C8A15A] py-1 block">Gift Sets</Link>
              <Link to="/products/make-your-own" className="group text-ivory text-sm transition-all duration-180 hover:text-[#C8A15A] py-1 block">Craft Your Bracelet</Link>
              
              <div className="mt-8 bg-[#3d2117]/50 rounded-lg p-6 border border-[#C8A15A]/20 shadow-inner">
                <p className="text-ivory text-xs leading-relaxed mb-4">Every bracelet is handcrafted using natural stones chosen for intention, balance and timeless design.</p>
                <Link to="/collections" className="text-[#C8A15A] text-xs uppercase tracking-widest hover:underline">Explore Collections →</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 w-full border-t border-[#C8A15A]/20 p-6 flex justify-between items-center text-ivory text-xs">
            <span>Natural gemstones from Haridwar.</span>
            <Link to="/collections" className="hover:text-[#C8A15A]">View All Collections →</Link>
        </div>
      </div>
    </div>
  );
}
