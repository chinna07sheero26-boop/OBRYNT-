import React, { useState } from 'react';
import { Sparkles, ArrowDownRight, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCustomStudioClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCustomStudioClick,
}) => {
  const [heroShirtColor, setHeroShirtColor] = useState('#e7e7e2');
  const [heroTextColor, setHeroTextColor] = useState('#151515');

  const heroSwatches = [
    { color: '#e7e7e2', text: '#151515', label: 'Chalk' },
    { color: '#171717', text: '#d7ff3f', label: 'Black' },
    { color: '#a52e35', text: '#ffffff', label: 'Crimson' },
    { color: '#243c6b', text: '#ffffff', label: 'Navy' },
    { color: '#64745a', text: '#ffffff', label: 'Olive' },
  ];

  return (
    <section className="relative my-6 sm:my-8 bg-[#151515] text-white rounded-[26px] overflow-hidden shadow-xl border border-stone-800">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[420px]">
        {/* Left Copy Column */}
        <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center items-start z-10">
          <div className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#c6e85b] font-extrabold flex items-center gap-1.5 mb-3">
            <span>Your style. Your rules.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-[-0.05em] leading-[0.95] text-white mb-5 uppercase">
            WEAR<br />
            YOUR<br />
            <span className="text-[#d7ff3f]">IDENTITY.</span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base max-w-[460px] leading-relaxed mb-8">
            Discover everyday essentials, footwear, beauty and accessories — or step into our studio to create a custom garment that is completely yours.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={onExploreClick}
              className="px-6 py-3.5 bg-[#d7ff3f] hover:bg-[#cbf528] text-[#111111] font-black text-sm rounded-full transition-transform active:scale-95 cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <span>EXPLORE THE COLLECTION</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCustomStudioClick}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-sm rounded-full backdrop-blur-md transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#d7ff3f]" />
              <span>CUSTOM STUDIO</span>
            </button>
          </div>
        </div>

        {/* Right Art Column with Interactive Garment & Floating Glass Cards */}
        <div className="relative min-h-[320px] lg:min-h-[420px] grid place-items-center bg-[radial-gradient(circle_at_55%_40%,#454a31,#202020_56%,#151515)] p-6 overflow-hidden">
          {/* Floating Tag 1 */}
          <div className="absolute top-[12%] left-[8%] bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-white tracking-wide shadow-lg hidden sm:block pointer-events-none">
            <span>YOUR STYLE, YOUR WAY</span>
          </div>

          {/* Interactive Shirt Shape */}
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <div
              className="w-[210px] sm:w-[230px] h-[235px] sm:h-[255px] clip-shirt-preview shadow-2xl relative transition-colors duration-300"
              style={{ backgroundColor: heroShirtColor }}
            >
              {/* OBRYNT Center Typography */}
              <div
                className="absolute inset-0 flex items-center justify-center font-black tracking-[0.16em] text-xl transition-colors duration-300 pointer-events-none"
                style={{ color: heroTextColor }}
              >
                OBRYNT
              </div>
            </div>
          </div>

          {/* Floating Tag 2 */}
          <div className="absolute bottom-[14%] right-[8%] bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-white tracking-wide shadow-lg hidden sm:block pointer-events-none">
            <span className="flex items-center gap-1.5">
              <span>CREATE SOMETHING ORIGINAL</span>
              <span className="text-[#d7ff3f]">✳</span>
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
