import React, { useState } from 'react';
import { Sparkles, ArrowDownRight, ShieldCheck, Award } from 'lucide-react';
import { OBRYNT_EMBLEM_SRC, OBRYNT_LOGO_SRC } from './ObryntBrand';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCustomStudioClick: () => void;
  onOpenBrandAssets?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCustomStudioClick,
  onOpenBrandAssets,
}) => {
  const [heroShirtColor, setHeroShirtColor] = useState('#111111');
  const [heroTextColor, setHeroTextColor] = useState('#e5e7eb');

  const heroSwatches = [
    { color: '#111111', text: '#e5e7eb', label: 'Obsidian Black' },
    { color: '#1f2937', text: '#f3f4f6', label: 'Platinum Slate' },
    { color: '#f5f5f0', text: '#111111', label: 'Chalk White' },
    { color: '#450a0a', text: '#ffffff', label: 'Burgundy Crimson' },
    { color: '#172554', text: '#ffffff', label: 'Midnight Navy' },
  ];

  return (
    <section className="relative my-6 sm:my-8 bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#050505] text-white rounded-[28px] overflow-hidden shadow-2xl border border-stone-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-stone-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] min-h-[440px]">
        {/* Left Copy Column */}
        <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center items-start z-10">
          {/* Official Emblem Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-700/80 mb-4 shadow-sm">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-600 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-200">
              OFFICIAL OBRYNT ATELIER
            </span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              TIMELESS STYLE
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-[-0.05em] leading-[0.95] text-white mb-5 uppercase">
            WEAR<br />
            YOUR<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-stone-300 to-stone-400">
              IDENTITY.
            </span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base max-w-[480px] leading-relaxed mb-8 font-normal">
            Everyday apparel, footwear, beauty essentials, and a live bespoke design studio. Handcrafted with our official platinum silver hallmark.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={onExploreClick}
              className="px-6 py-3.5 bg-white hover:bg-stone-200 text-[#111111] font-black text-sm rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg inline-flex items-center gap-2"
            >
              <span>EXPLORE THE COLLECTION</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCustomStudioClick}
              className="px-5 py-3.5 bg-stone-900/80 hover:bg-stone-800 text-stone-100 border border-stone-700 font-bold text-sm rounded-full backdrop-blur-md transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-stone-300" />
              <span>CUSTOM STUDIO</span>
            </button>
          </div>
        </div>

        {/* Right Art Column with Official Silver Emblem Presentation */}
        <div className="relative min-h-[340px] lg:min-h-[440px] grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#262626,#141414_60%,#0a0a0a)] p-6 overflow-hidden border-t lg:border-t-0 lg:border-l border-stone-800">
          {/* Floating Official Authenticity Tag */}
          <div className="absolute top-[10%] left-[8%] bg-stone-900/90 border border-stone-700/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-stone-200 tracking-wide shadow-xl hidden sm:flex items-center gap-2 pointer-events-none">
            <div className="w-4 h-4 rounded-full overflow-hidden border border-stone-500 bg-black">
              <img src={OBRYNT_EMBLEM_SRC} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] tracking-wider uppercase font-extrabold text-stone-200">
              100% VERIFIED AUTHENTIC
            </span>
          </div>

          {/* Interactive Shirt Shape with Official OBRYNT Silver Emblem */}
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <div
              className="w-[220px] sm:w-[240px] h-[245px] sm:h-[265px] clip-shirt-preview shadow-2xl relative transition-colors duration-300"
              style={{ backgroundColor: heroShirtColor }}
            >
              {/* OBRYNT Official Silver Emblem & Typography */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-stone-700/80 bg-black shadow-lg mb-1.5">
                  <img
                    src={OBRYNT_EMBLEM_SRC}
                    alt="Official Emblem"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="font-serif font-black tracking-[0.22em] text-lg sm:text-xl uppercase transition-colors duration-300"
                  style={{ color: heroTextColor }}
                >
                  OBRYNT
                </div>
                <div
                  className="text-[9px] font-bold tracking-[0.25em] uppercase opacity-75"
                  style={{ color: heroTextColor }}
                >
                  TIMELESS STYLE
                </div>
              </div>
            </div>
          </div>

          {/* Floating Tag 2 */}
          <div className="absolute bottom-[14%] right-[8%] bg-stone-900/90 border border-stone-700/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-stone-200 tracking-wide shadow-xl hidden sm:flex items-center gap-2 pointer-events-none">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
            <span className="text-[11px] tracking-wider uppercase font-extrabold">
              BLACK & PLATINUM SILVER
            </span>
          </div>

          {/* Quick interactive color switcher on the bottom of the hero */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-bold mr-1">Preview</span>
            {heroSwatches.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setHeroShirtColor(s.color);
                  setHeroTextColor(s.text);
                }}
                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                  heroShirtColor === s.color ? 'scale-125 border-white ring-2 ring-[#d7ff3f]' : 'border-white/30 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: s.color }}
                title={`Preview ${s.label}`}
                aria-label={`Preview ${s.label}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
