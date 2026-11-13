import React from 'react';
import { ArrowDownRight, Sparkles, ShieldCheck } from 'lucide-react';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCustomStudioClick: () => void;
  onOpenBrandAssets?: () => void;
  onReplayIntro?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCustomStudioClick,
  onOpenBrandAssets,
  onReplayIntro,
}) => {
  return (
    <section className="relative my-4 sm:my-8 overflow-hidden bg-black text-white border border-neutral-900">
      {/* Editorial Runway Image Canvas */}
      <div className="relative min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] flex items-end">
        {/* Background Editorial Fashion Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_editorial_runway.jpg"
            alt="OBRYNT Fashion Editorial Runway"
            className="w-full h-full object-cover object-center brightness-[0.82] contrast-[1.08] transition-transform duration-1000 scale-100 hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
          {/* Subtle measured scrim for editorial typography legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-16 flex flex-col justify-end items-start">
          {/* Atelier Hallmark Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 mb-4 sm:mb-6">
            <div className="w-4 h-4 rounded-full overflow-hidden border border-white/40 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-200">
              OBRYNT ATELIER · AUTUMN / WINTER 2026
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-luxury text-3xl sm:text-5xl lg:text-[68px] font-bold tracking-[0.12em] uppercase leading-[1.05] text-white max-w-4xl mb-4 sm:mb-6">
            WEAR YOUR IDENTITY.
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-200 text-xs sm:text-sm lg:text-base max-w-xl font-normal leading-relaxed mb-8 tracking-wide">
            Minimalist tailoring, architectural outerwear, sculptural footwear, and bespoke print craftsmanship. Defined by our signature monochrome palette.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg inline-flex items-center justify-center gap-2"
            >
              <span>EXPLORE COLLECTION</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCustomStudioClick}
              className="w-full sm:w-auto px-8 py-4 bg-black/60 hover:bg-black/90 text-white border border-white/30 font-bold text-xs uppercase tracking-[0.2em] backdrop-blur-md transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              <span>CUSTOM STUDIO</span>
            </button>

            {onOpenBrandAssets && (
              <button
                onClick={onOpenBrandAssets}
                className="hidden md:inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white uppercase tracking-[0.16em] transition-colors ml-4 cursor-pointer"
              >
                <span>Brand Identity</span>
              </button>
            )}

            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="inline-flex items-center gap-1.5 text-xs text-[#e6c782] hover:text-white uppercase tracking-[0.16em] transition-colors sm:ml-2 cursor-pointer"
              >
                <span>3D Opening Film</span>
              </button>
            )}
          </div>

          {/* Editorial Ticker Strip */}
          <div className="mt-12 pt-6 border-t border-white/15 w-full flex flex-wrap items-center justify-between gap-4 text-[10px] sm:text-[11px] font-mono tracking-[0.18em] uppercase text-neutral-400">
            <div>01 · READY-TO-WEAR COLLECTION</div>
            <div>02 · BESPOKE SILKSCREEN STUDIO</div>
            <div>03 · WORLDWIDE COMPLIMENTARY SHIPPING</div>
            <div>04 · PLATINUM SILVER VERIFIED</div>
          </div>
        </div>
      </div>
    </section>
  );
};
