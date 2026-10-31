import React, { useState } from 'react';
import { Sparkles, Bookmark, ShoppingBag, Check, RotateCw } from 'lucide-react';
import { CustomDesign } from '../types';

interface CustomDesignStudioProps {
  onAddCustomToCart: (design: CustomDesign) => void;
  onSaveDesign: (design: CustomDesign) => void;
  onShowNotice: (msg: string) => void;
}

export const CustomDesignStudio: React.FC<CustomDesignStudioProps> = ({
  onAddCustomToCart,
  onSaveDesign,
  onShowNotice,
}) => {
  const [shirtColor, setShirtColor] = useState('#171717');
  const [side, setSide] = useState<'Front' | 'Back'>('Front');
  const [designText, setDesignText] = useState('CREATE YOUR OWN PATH');
  const [printColor, setPrintColor] = useState('#ffffff');
  const [size, setSize] = useState('L');
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [placement, setPlacement] = useState<'center' | 'pocket' | 'large'>('center');

  const swatches = [
    { color: '#171717', name: 'Black' },
    { color: '#f5f4ed', name: 'White' },
    { color: '#a52e35', name: 'Red' },
    { color: '#243c6b', name: 'Navy' },
    { color: '#64745a', name: 'Olive' },
    { color: '#d8b9a5', name: 'Beige' },
    { color: '#2f343b', name: 'Charcoal' },
    { color: '#d7ff3f', name: 'Electric Lime' },
  ];

  const printColors = [
    { value: '#ffffff', name: 'White' },
    { value: '#111111', name: 'Black' },
    { value: '#d7ff3f', name: 'Lime' },
    { value: '#f05a9d', name: 'Pink' },
    { value: '#5ed8ff', name: 'Sky blue' },
    { value: '#f59e0b', name: 'Amber Gold' },
  ];

  const fonts = [
    { id: 'Outfit', name: 'Streetwear Sans' },
    { id: 'Plus Jakarta Sans', name: 'Modern Geometric' },
    { id: 'Space Grotesk', name: 'Bold Mono/Display' },
    { id: 'serif', name: 'Editorial Serif' },
  ];

  const currentColorName = swatches.find((s) => s.color === shirtColor)?.name || 'Custom';

  const currentDesign: CustomDesign = {
    text: designText.trim() || 'OBRYNT STUDIO',
    side,
    size,
    colorHex: shirtColor,
    colorName: currentColorName,
    textColor: printColor,
    fontFamily,
  };

  const handleAddToCart = () => {
    onAddCustomToCart(currentDesign);
    onShowNotice('Custom T-Shirt added to your bag!');
  };

  const handleSaveToAccount = () => {
    onSaveDesign(currentDesign);
    onShowNotice('Design saved to your account!');
  };

  return (
    <section id="design" className="my-12 sm:my-16 bg-[#e9e9e2] rounded-[24px] p-6 sm:p-10 lg:p-14 border border-[#d8d8ce] shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column: Studio Controls */}
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7a8e12] mb-1">
            OBRYNT Design Studio
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-[-0.05em] text-[#111111] mb-2 leading-tight">
            Make it yours.
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            Choose a T-shirt colour, add your bespoke typography, and preview the front or back in real time before you order. Crafted on 220 GSM combed jersey.
          </p>

          <div className="space-y-4">
            {/* T-Shirt Colour Swatches */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                T-shirt colour: <span className="font-bold text-stone-600 lowercase capitalize">({currentColorName})</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {swatches.map((swatch) => (
                  <button
                    key={swatch.color}
                    onClick={() => setShirtColor(swatch.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer relative shadow-sm ${
                      shirtColor === swatch.color
                        ? 'scale-115 border-white ring-2 ring-[#111111]'
                        : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.color }}
                    title={swatch.name}
                    aria-label={swatch.name}
                  >
                    {shirtColor === swatch.color && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check
                          className={`w-3.5 h-3.5 ${
                            swatch.color === '#f5f4ed' || swatch.color === '#d7ff3f'
                              ? 'text-black'
                              : 'text-white'
                          }`}
                        />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Side & Font Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-1">
                  Preview side
                </label>
                <div className="flex bg-white rounded-xl border border-[#d4d4cc] p-1">
                  <button
                    type="button"
                    onClick={() => setSide('Front')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      side === 'Front' ? 'bg-[#111111] text-white' : 'text-stone-600 hover:text-black'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('Back')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      side === 'Back' ? 'bg-[#111111] text-white' : 'text-stone-600 hover:text-black'
                    }`}
                  >
                    Back View
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-1">
                  Typography style
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-white border border-[#d4d4cc] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] outline-hidden focus:border-[#7a8e12] cursor-pointer"
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Design Text */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-1">
                Your design text <span className="text-[10px] text-stone-500 font-normal">({designText.length}/32 chars)</span>
              </label>
              <input
                type="text"
                value={designText}
                maxLength={32}
                onChange={(e) => setDesignText(e.target.value)}
                placeholder="e.g. CREATE YOUR OWN PATH"
                className="w-full bg-white border border-[#d4d4cc] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#111111] outline-hidden focus:ring-2 focus:ring-[#7a8e12] transition-all"
              />
            </div>

            {/* Text Color & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-1">
                  Print text colour
                </label>
                <div className="flex items-center gap-2 bg-white border border-[#d4d4cc] rounded-xl px-2.5 py-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-stone-300 shadow-xs shrink-0"
                    style={{ backgroundColor: printColor }}
                  />
                  <select
                    value={printColor}
                    onChange={(e) => setPrintColor(e.target.value)}
                    className="w-full bg-transparent border-0 outline-hidden text-xs font-bold text-[#111111] cursor-pointer"
                  >
                    {printColors.map((pc) => (
                      <option key={pc.value} value={pc.value}>
                        {pc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-1">
                  Garment size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-white border border-[#d4d4cc] rounded-xl px-3 py-2.5 text-xs font-bold text-[#111111] outline-hidden focus:border-[#7a8e12] cursor-pointer"
                >
                  <option value="S">S (Chest 38")</option>
                  <option value="M">M (Chest 40")</option>
                  <option value="L">L (Chest 42")</option>
                  <option value="XL">XL (Chest 44")</option>
                  <option value="XXL">XXL (Chest 46")</option>
                  <option value="3XL">3XL (Chest 48")</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Add to Bag & Save Design */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3.5 bg-[#111111] hover:bg-black text-[#d7ff3f] font-black text-xs sm:text-sm rounded-full transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#d7ff3f]" />
                <span>ADD CUSTOM T-SHIRT TO BAG · ₹799</span>
              </button>

              <button
                onClick={handleSaveToAccount}
                className="px-4 py-3.5 bg-white hover:bg-stone-100 text-[#111111] border border-[#d4d4cc] font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                title="Save this design to your account"
              >
                <Bookmark className="w-4 h-4 text-stone-600" />
                <span>Save</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal pt-1">
              Live studio preview: Custom orders are rendered in high-definition silkscreen simulation. 100% pre-shrunk heavyweight cotton with double-stitched hem.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Shirt Mockup Preview */}
        <div className="min-h-[380px] sm:min-h-[440px] rounded-2xl bg-gradient-to-br from-[#f7f7f2] to-[#d5d5cd] border border-[#d8d8ce] flex flex-col items-center justify-center relative p-6 overflow-hidden shadow-inner">
          {/* Top Label & Side Toggle */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider text-[#111111] uppercase shadow-xs">
              {side.toUpperCase()} VIEW
            </span>
            <span className="bg-black text-[#d7ff3f] px-2 py-1 rounded-md text-[10px] font-black">
              SIZE {size}
            </span>
          </div>

          <button
            onClick={() => setSide(side === 'Front' ? 'Back' : 'Front')}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-[#111111] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Flip View"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip</span>
          </button>

          {/* Realistic T-Shirt Geometry */}
          <div className="relative group transition-transform duration-300 hover:scale-102">
            <div
              className="w-[230px] sm:w-[260px] h-[265px] sm:h-[300px] clip-shirt-preview shadow-2xl relative transition-colors duration-300"
              style={{ backgroundColor: shirtColor }}
            >
              {/* Collar detail indication */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-b-2 rounded-b-full opacity-40 pointer-events-none"
                style={{ borderColor: shirtColor === '#171717' ? '#333' : '#999' }}
              />

              {/* Back Neck Tag if Back View */}
              {side === 'Back' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest uppercase opacity-40 text-stone-400">
                  OBRYNT
                </div>
              )}

              {/* Custom Printed Typography */}
              <div
                className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center break-words font-black tracking-wider uppercase transition-all duration-200 select-none px-2 pointer-events-none"
                style={{
                  color: printColor,
                  fontFamily,
                  fontSize: designText.length > 20 ? '14px' : designText.length > 12 ? '17px' : '21px',
                  lineHeight: '1.2',
                  textShadow: shirtColor === '#f5f4ed' && printColor === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.4)' : undefined,
                }}
              >
                {designText.trim() || 'YOUR DESIGN'}
              </div>

              {/* Brand Tagline on Sleeve */}
              <div className="absolute bottom-6 right-8 text-[8px] tracking-[0.2em] font-mono opacity-30 uppercase pointer-events-none" style={{ color: printColor }}>
                OB·26
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs font-bold text-stone-600 flex items-center gap-2">
            <span>Color: <strong>{currentColorName}</strong></span>
            <span>·</span>
            <span>Print: <strong style={{ color: printColor === '#ffffff' ? '#333' : printColor }}>{printColors.find(p => p.value === printColor)?.name}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};
