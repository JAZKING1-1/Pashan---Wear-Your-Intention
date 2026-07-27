import * as React from "react";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LuxurySearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LuxurySearchOverlay({ open, onOpenChange }: LuxurySearchOverlayProps) {
  const popularSearches = ["Tiger Eye", "Pyrite", "Green Quartz", "Amethyst", "Lava Stone", "Hematite", "Dhan Yog"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-[rgba(18,13,10,0.58)] backdrop-blur-[14px] animate-in fade-in duration-250" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[92vw] max-w-[760px] translate-x-[-50%] translate-y-[-50%] rounded-[26px] bg-[#F8F4EE] border border-[rgba(183,110,69,0.18)] shadow-[0_40px_100px_rgba(0,0,0,0.22)] p-0 animate-in zoom-in-95 fade-in duration-350 grain">
        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-[26px]">
          <div className="p-8 pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-serif text-[#120D0A]">Search PASHAN</h2>
                <p className="text-sm text-[#756E64] mt-1">Find your bracelet, gemstone or intention.</p>
                <div className="h-[1px] w-12 bg-[#B76E45] mt-4" />
              </div>
              <button 
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-full bg-[#EAE3DC] flex items-center justify-center hover:rotate-90 transition-transform duration-300"
              >
                <X size={20} className="text-[#120D0A]" />
              </button>
            </div>
            
            <div className="relative flex items-center" cmdk-input-wrapper="">
              <Search className="absolute left-4 h-6 w-6 text-[#C3723C]" />
              <CommandPrimitive.Input
                placeholder="Search bracelets, gemstones, intentions..."
                className="w-full h-[68px] rounded-[18px] bg-[#FCF8F2] border border-transparent pl-14 pr-4 text-lg text-[#120D0A] placeholder:text-[#A8A096] focus:outline-none focus:border-[rgba(183,110,69,0.45)] focus:shadow-[0_0_15px_rgba(183,110,69,0.2)] transition-all duration-300"
              />
            </div>
          </div>

          <CommandPrimitive.List className="px-6 pb-6 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#C3723C] [&::-webkit-scrollbar-track]:bg-transparent">
            <CommandPrimitive.Empty className="py-12 text-center">
              <p className="text-lg font-serif text-[#120D0A]">No matching stone found.</p>
              <p className="text-sm text-[#756E64] mt-2">Try searching by stone name, emotion, or intention.</p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                 {["Prosperity", "Growth", "Protection", "Leadership", "Balance", "Grounding"].map(chip => (
                   <button key={chip} className="px-4 py-2 rounded-full border border-[#C3723C]/30 text-sm text-[#B76E45] hover:bg-[#C3723C]/10 transition-colors">
                     {chip}
                   </button>
                 ))}
              </div>
            </CommandPrimitive.Empty>
            
            <CommandPrimitive.Group heading="Popular" className="text-xs uppercase tracking-widest text-[#B76E45] font-medium mb-4 mt-4">
               <div className="flex flex-wrap gap-2 mt-2">
                 {popularSearches.map(item => (
                   <CommandPrimitive.Item key={item} className="px-4 py-2 rounded-full border border-[#C3723C]/30 text-sm text-[#B76E45] cursor-pointer hover:bg-[#C3723C]/10 transition-colors">
                     {item}
                   </CommandPrimitive.Item>
                 ))}
               </div>
            </CommandPrimitive.Group>
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
