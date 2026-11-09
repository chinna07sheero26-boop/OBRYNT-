import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Award, CheckCircle2, Copy, Check, Package, X } from 'lucide-react';

export const OBRYNT_LOGO_SRC = './obrynt-logo.jpg';
export const OBRYNT_EMBLEM_SRC = './obrynt-emblem.jpg';

interface ObryntLogoProps {
  variant?: 'emblem' | 'horizontal' | 'stacked' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'dark' | 'light' | 'platinum';
  className?: string;
  onClick?: () => void;
  showSubtitle?: boolean;
}

export const ObryntLogo: React.FC<ObryntLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'dark',
  className = '',
  onClick,
  showSubtitle = false,
}) => {
  // Dimension mappings
  const emblemSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32',
  };

  const textSizes = {
    xs: 'text-sm tracking-[0.18em]',
    sm: 'text-base tracking-[0.18em]',
    md: 'text-xl sm:text-2xl tracking-[0.2em]',
    lg: 'text-2xl sm:text-3xl tracking-[0.22em]',
    xl: 'text-3xl sm:text-4xl tracking-[0.24em]',
    '2xl': 'text-5xl tracking-[0.26em]',
  };

  const isLight = theme === 'light';

  // Only the emblem (circular crest)
  if (variant === 'emblem') {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-stone-800/80 bg-black shadow-md ${
          emblemSizes[size]
        } ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        title="OBRYNT Official Brand Emblem"
      >
        <img
          src={OBRYNT_EMBLEM_SRC}
          alt="OBRYNT Official Emblem"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  // Luxury badge with metallic border
  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-700/80 shadow-md ${
          onClick ? 'cursor-pointer hover:border-stone-500 transition-colors' : ''
        } ${className}`}
      >
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-stone-600 bg-black">
          <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-1.5 font-black text-xs tracking-[0.2em] text-stone-100">
          <span>OBRYNT</span>
          <span className="w-1 h-1 rounded-full bg-stone-400" />
          <span className="text-[10px] font-semibold text-stone-400 tracking-wider">OFFICIAL</span>
        </div>
      </div>
    );
  }

  // Stacked crest: Emblem on top, OBRYNT below
  if (variant === 'stacked') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center justify-center text-center ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
      >
        <div
          className={`rounded-2xl overflow-hidden border border-stone-800/80 bg-black shadow-xl mb-2.5 p-1 ${emblemSizes[size]}`}
        >
          <img
            src={OBRYNT_LOGO_SRC}
            alt="OBRYNT Crest"
            className="w-full h-full object-contain"
          />
        </div>
        <div
          className={`font-black font-serif ${textSizes[size]} ${
            isLight ? 'text-stone-900' : 'text-white'
          }`}
        >
          OBRYNT
        </div>
        {showSubtitle && (
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mt-1">
            TIMELESS STYLE
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal brandmark (Emblem + OBRYNT wordmark)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      aria-label="OBRYNT Official Brand"
    >
      {/* Official Silver Circular Emblem */}
      <div
        className={`rounded-full overflow-hidden shrink-0 border border-stone-700/80 bg-black shadow-sm ${emblemSizes[size]}`}
      >
        <img
          src={OBRYNT_EMBLEM_SRC}
          alt="OBRYNT Emblem"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Typography with Platinum Sheen */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-black font-serif tracking-[0.18em] ${
              isLight ? 'text-[#111111]' : 'text-white'
            } ${textSizes[size]}`}
          >
            OBRYNT
          </span>
          <span className="text-stone-400 ml-0.5 text-xs font-black">.</span>
        </div>
        {showSubtitle && (
          <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.28em] text-stone-400 uppercase mt-0.5">
            TIMELESS STYLE
          </span>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// BACKGROUND WATERMARK
// =========================================================================
export const ObryntWatermark: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.02] sm:opacity-[0.025] select-none ${className}`}
    >
      <img
        src={OBRYNT_LOGO_SRC}
        alt=""
        className="w-[650px] sm:w-[900px] max-w-none object-contain filter grayscale contrast-125"
      />
    </div>
  );
};

// =========================================================================
// CERTIFIED AUTHENTICITY BADGE
// =========================================================================
export const ObryntAuthenticitySeal: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`bg-gradient-to-br from-[#1c1c1c] via-[#111111] to-[#0a0a0a] border border-stone-700/80 rounded-2xl p-3.5 sm:p-4 text-white shadow-xl flex items-center gap-3.5 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-600 bg-black shadow-inner">
        <img src={OBRYNT_LOGO_SRC} alt="OBRYNT Authenticity" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-stone-200">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
          <span>OBRYNT ATELIER CERTIFIED</span>
        </div>
        <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
          100% Genuine · Platinum Silver Master Emblem · Timeless Style Quality Guaranteed
        </p>
      </div>
    </div>
  );
};

// =========================================================================
// BRAND MATERIALS & PACKAGING MODAL
// =========================================================================
export const ObryntBrandMaterialsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onShowNotice?: (msg: string) => void;
}> = ({ isOpen, onClose, onShowNotice }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPalette = () => {
    navigator.clipboard.writeText('Black: #000000 | Platinum Silver: #E5E7EB, #CCCCCC | White: #FFFFFF');
    setCopied(true);
    if (onShowNotice) onShowNotice('Official Brand Palette copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-stone-800 text-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-black">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wider text-white">
                OBRYNT BRAND ASSETS & PACKAGING
              </h2>
              <p className="text-xs text-stone-400 font-medium">
                Official Emblem, Luxury Packaging & Brand Standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Hero Emblem Presentation */}
          <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-stone-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between text-center sm:text-left">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-stone-700 bg-black shadow-2xl p-1 shrink-0">
              <img
                src={OBRYNT_LOGO_SRC}
                alt="OBRYNT Official Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-[11px] font-bold text-stone-300">
                <Sparkles className="w-3.5 h-3.5 text-stone-300" />
                <span>PERMANENT OFFICIAL LOGO</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-serif tracking-[0.2em] text-white">
                OBRYNT
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                Classical silver emblem featuring the upper crest diamond 'O', dual baroque flourish wings,
                and lower arc inscribed with <em>TIMELESS STYLE</em>.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start text-xs font-bold">
                <span className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                  Primary: Black & Platinum Silver
                </span>
                <span className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                  Accent: Pure White
                </span>
              </div>
            </div>
          </div>

          {/* Luxury Packaging Suite */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-300" />
              <span>Official Luxury Packaging Materials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Packaging Item 1: Rigid Apparel Box */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="h-28 rounded-lg bg-black border border-stone-800 flex items-center justify-center p-3 relative overflow-hidden mb-3">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-stone-400 to-transparent opacity-60" />
                    <img src={OBRYNT_EMBLEM_SRC} alt="Box Emblem" className="w-14 h-14 object-cover rounded-full border border-stone-700" />
                  </div>
                  <strong className="text-sm font-bold text-white block">Matte Rigid Apparel Box</strong>
                  <p className="text-xs text-stone-400 mt-1 leading-normal">
                    Velvet-touch carbon black finish with hot-stamped platinum silver foil OBRYNT emblem.
                  </p>
                </div>
                <span className="text-[10px] text-stone-500 font-mono mt-3 uppercase tracking-wider">
                  Specification: 350 GSM Heavy Board
                </span>
              </div>

              {/* Packaging Item 2: Damask Woven Label */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="h-28 rounded-lg bg-black border border-stone-800 flex items-center justify-center p-3 mb-3">
                    <div className="bg-[#141414] border border-stone-700 px-4 py-2 rounded flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-600">
                        <img src={OBRYNT_EMBLEM_SRC} alt="Label" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-serif font-black tracking-widest text-xs text-stone-200">OBRYNT</span>
                    </div>
                  </div>
                  <strong className="text-sm font-bold text-white block">High-Density Woven Label</strong>
                  <p className="text-xs text-stone-400 mt-1 leading-normal">
                    Damask neck & hem tag woven with metallic silver threads for irritation-free luxury feel.
                  </p>
                </div>
                <span className="text-[10px] text-stone-500 font-mono mt-3 uppercase tracking-wider">
                  Specification: 100D Damask Weave
                </span>
              </div>

              {/* Packaging Item 3: Authenticity Card & Seal */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="h-28 rounded-lg bg-black border border-stone-800 flex items-center justify-center p-3 mb-3">
                    <div className="w-24 h-16 rounded border border-stone-600 bg-gradient-to-br from-stone-900 to-black p-2 flex flex-col items-center justify-center text-center shadow-lg">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-500 mb-1">
                        <img src={OBRYNT_EMBLEM_SRC} alt="Seal" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-mono tracking-widest text-stone-300">CERTIFICATE</span>
                    </div>
                  </div>
                  <strong className="text-sm font-bold text-white block">Certificate of Authenticity</strong>
                  <p className="text-xs text-stone-400 mt-1 leading-normal">
                    Serialized warranty card with tamper-evident silver hologram seal included in every garment shipment.
                  </p>
                </div>
                <span className="text-[10px] text-stone-500 font-mono mt-3 uppercase tracking-wider">
                  Specification: QR Authenticated
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800">
            <button
              onClick={handleCopyPalette}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Palette Copied' : 'Copy Brand Color Palette'}</span>
            </button>

            <a
              href={OBRYNT_LOGO_SRC}
              download="OBRYNT-Official-Emblem.jpg"
              className="inline-flex items-center gap-2 px-5 py-2 bg-white hover:bg-stone-200 text-black rounded-xl text-xs font-black cursor-pointer transition-colors"
            >
              <span>Download Master Emblem Asset</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
