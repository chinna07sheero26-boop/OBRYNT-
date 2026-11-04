import React, { useRef } from 'react';
import { RotateCw, Move, ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';
import { ArtworkPlacement } from '../types';

interface GarmentMockupProps {
  category: string;
  side: 'Front' | 'Back';
  garmentColor: string;
  placement: ArtworkPlacement;
  showPrintAreaGuide?: boolean;
  onPlacementChange?: (placement: ArtworkPlacement) => void;
  className?: string;
  isInteractive?: boolean;
}

export const GarmentMockup: React.FC<GarmentMockupProps> = ({
  category,
  side,
  garmentColor,
  placement,
  showPrintAreaGuide = true,
  onPlacementChange,
  className = '',
  isInteractive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine silhouette based on clothing category
  const isPants = category.toLowerCase().includes('track') || category.toLowerCase().includes('pant');
  const isHoodie = category.toLowerCase().includes('hoodie');
  const isSweatshirt = category.toLowerCase().includes('sweatshirt');
  const isPolo = category.toLowerCase().includes('polo');
  const isJacket = category.toLowerCase().includes('jacket');
  const isShirt = category.toLowerCase().includes('shirt') && !category.toLowerCase().includes('t-shirt');
  const isOversized = category.toLowerCase().includes('oversized');

  // Convert placement values
  const posX = placement.x || 0;
  const posY = placement.y || 0;
  const scale = placement.scale || 1;
  const rotation = placement.rotation || 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-[480px] mx-auto rounded-3xl overflow-hidden select-none flex items-center justify-center shadow-xl border border-stone-200/60 bg-gradient-to-b from-[#f3f3ee] to-[#e7e7df] ${className}`}
    >
      {/* Studio Lighting Radial Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.85)_0%,rgba(0,0,0,0.06)_100%)] pointer-events-none" />

      {/* Realistic Vector Garment Canvas */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full drop-shadow-[0_20px_25px_rgba(0,0,0,0.22)] transition-colors duration-300 z-10"
      >
        <defs>
          {/* Fabric Shadow Filter */}
          <filter id="garmentShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" floodOpacity="0.25" />
          </filter>
          {/* Subtle Fabric Grain & Fold Shading */}
          <linearGradient id="creaseShading" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="foldV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {isPants ? (
          /* Track Pants Silhouette */
          <g>
            <path
              d="M 170 80 L 330 80 L 345 220 L 320 460 L 260 460 L 250 250 L 240 460 L 180 460 L 155 220 Z"
              fill={garmentColor}
              stroke="#111111"
              strokeWidth="2.5"
            />
            {/* Waistband */}
            <rect x="170" y="80" width="160" height="26" rx="4" fill={garmentColor} stroke="#111111" strokeWidth="2" />
            {/* Drawstring */}
            <line x1="240" y1="95" x2="235" y2="150" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="260" y1="95" x2="265" y2="150" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            {/* Ankle Cuffs */}
            <rect x="180" y="445" width="40" height="15" rx="3" fill="#111111" opacity="0.3" />
            <rect x="280" y="445" width="40" height="15" rx="3" fill="#111111" opacity="0.3" />
          </g>
        ) : isHoodie ? (
          /* Heavyweight Hoodie Silhouette */
          <g>
            {/* Main Torso & Sleeves */}
            <path
              d="M 160 110 L 80 180 L 110 320 L 150 290 L 150 440 L 350 440 L 350 290 L 390 320 L 420 180 L 340 110 Z"
              fill={garmentColor}
              stroke="#111111"
              strokeWidth="2.5"
            />
            {/* Double Hood */}
            {side === 'Front' ? (
              <g>
                <path d="M 180 110 C 180 40, 320 40, 320 110 Z" fill={garmentColor} stroke="#111111" strokeWidth="2" />
                <path d="M 210 110 C 210 60, 290 60, 290 110 Z" fill="#111111" opacity="0.25" />
                {/* Drawcords */}
                <line x1="230" y1="110" x2="225" y2="175" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="270" y1="110" x2="275" y2="175" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                {/* Kangaroo Pocket */}
                <path d="M 180 340 L 320 340 L 335 410 L 165 410 Z" fill={garmentColor} stroke="#111111" strokeWidth="2" />
              </g>
            ) : (
              /* Back Hood resting on neck */
              <path d="M 180 100 C 180 30, 320 30, 320 100 C 300 135, 200 135, 180 100 Z" fill={garmentColor} stroke="#111111" strokeWidth="2.5" />
            )}
            {/* Hem Band and Cuff Band */}
            <rect x="150" y="425" width="200" height="20" fill="#111111" opacity="0.2" />
          </g>
        ) : isJacket ? (
          /* Bomber Jacket Silhouette */
          <g>
            <path
              d="M 160 105 L 85 175 L 115 310 L 155 280 L 155 435 L 345 435 L 345 280 L 385 310 L 415 175 L 340 105 Z"
              fill={garmentColor}
              stroke="#111111"
              strokeWidth="2.5"
            />
            {/* Zipper Line in Front */}
            {side === 'Front' && (
              <line x1="250" y1="105" x2="250" y2="435" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 3" />
            )}
            {/* Ribbed Collar */}
            <path d="M 190 105 C 220 120, 280 120, 310 105 Z" fill="#111111" opacity="0.3" stroke="#111111" strokeWidth="2" />
            {/* Waistband */}
            <rect x="155" y="415" width="190" height="22" fill="#111111" opacity="0.3" />
          </g>
        ) : isPolo ? (
          /* Polo Shirt Silhouette */
          <g>
            <path
              d="M 170 100 L 95 160 L 125 240 L 160 220 L 160 435 L 340 435 L 340 220 L 375 240 L 405 160 L 330 100 Z"
              fill={garmentColor}
              stroke="#111111"
              strokeWidth="2.5"
            />
            {side === 'Front' ? (
              <g>
                {/* Polo Collar Left and Right */}
                <polygon points="175,100 230,135 210,150 170,120" fill={garmentColor} stroke="#111111" strokeWidth="2" />
                <polygon points="325,100 270,135 290,150 330,120" fill={garmentColor} stroke="#111111" strokeWidth="2" />
                {/* 2-Button Placket */}
                <rect x="240" y="105" width="20" height="75" fill={garmentColor} stroke="#111111" strokeWidth="1.5" />
                <circle cx="250" cy="125" r="3.5" fill="#ffffff" />
                <circle cx="250" cy="155" r="3.5" fill="#ffffff" />
              </g>
            ) : (
              <path d="M 190 100 C 220 115, 280 115, 310 100 Z" fill={garmentColor} stroke="#111111" strokeWidth="2" />
            )}
          </g>
        ) : (
          /* Standard T-Shirt & Oversized T-Shirt Silhouette */
          <g>
            <path
              d={
                isOversized
                  ? 'M 160 95 L 70 170 L 105 260 L 150 240 L 150 445 L 350 445 L 350 240 L 395 260 L 430 170 L 340 95 Z'
                  : 'M 175 100 L 100 155 L 125 235 L 160 215 L 160 435 L 340 435 L 340 215 L 375 235 L 400 155 L 325 100 Z'
              }
              fill={garmentColor}
              stroke="#111111"
              strokeWidth="2.5"
            />
            {/* Neckline Collar */}
            {side === 'Front' ? (
              <path
                d="M 195 100 C 215 135, 285 135, 305 100 C 285 118, 215 118, 195 100 Z"
                fill={garmentColor}
                stroke="#111111"
                strokeWidth="2"
              />
            ) : (
              <path
                d="M 195 100 C 215 110, 285 110, 305 100 C 285 105, 215 105, 195 100 Z"
                fill={garmentColor}
                stroke="#111111"
                strokeWidth="2"
              />
            )}
            {/* Fabric Seams */}
            <path d="M 160 100 L 160 215" stroke="#000000" strokeWidth="1" opacity="0.25" />
            <path d="M 340 100 L 340 215" stroke="#000000" strokeWidth="1" opacity="0.25" />
          </g>
        )}

        {/* Shading overlay over the garment */}
        <rect x="0" y="0" width="500" height="500" fill="url(#creaseShading)" opacity="0.35" style={{ mixBlendMode: 'multiply' }} />
        <rect x="0" y="0" width="500" height="500" fill="url(#foldV)" opacity="0.2" style={{ mixBlendMode: 'overlay' }} />
      </svg>

      {/* Printable Area Boundary Guide */}
      <div
        className={`absolute z-20 pointer-events-none transition-all duration-300 ${
          isPants
            ? 'top-[22%] left-[36%] w-[28%] h-[40%]'
            : 'top-[26%] left-[32%] w-[36%] h-[46%]'
        } ${
          showPrintAreaGuide
            ? 'border-2 border-dashed border-[#d7ff3f] bg-[#d7ff3f]/5 rounded-xl shadow-[0_0_15px_rgba(215,255,63,0.25)]'
            : 'border-0'
        }`}
      >
        {showPrintAreaGuide && (
          <div className="absolute top-1 left-1.5 px-1.5 py-0.5 bg-[#111111]/80 backdrop-blur-xs text-[#d7ff3f] text-[9px] font-black uppercase tracking-widest rounded-md">
            Max Print Zone (350x450mm)
          </div>
        )}
      </div>

      {/* Placed Artwork Overlay */}
      {placement.url && (
        <div
          className="absolute z-30 transition-transform duration-75 cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto"
          style={{
            top: `calc(${isPants ? '40%' : '48%'} + ${posY}%)`,
            left: `calc(50% + ${posX}%)`,
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
            maxWidth: '170px',
            maxHeight: '170px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
          }}
        >
          <img
            src={placement.url}
            alt="Custom Artwork Print"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      )}

      {/* Perspective Badge */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1 bg-[#111111]/90 backdrop-blur-sm text-white rounded-full text-[11px] font-black uppercase tracking-wider border border-white/10 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#d7ff3f]" />
        <span>{side} View</span>
      </div>

      {/* Garment Fabric Stamp */}
      <div className="absolute top-4 right-4 z-30 text-right">
        <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">
          OBRYNT 3D PROTOTYPE
        </div>
        <div className="text-[11px] font-extrabold text-stone-800">
          {category}
        </div>
      </div>
    </div>
  );
};
