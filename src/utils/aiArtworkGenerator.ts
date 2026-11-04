// OBRYNT AI Clothing Design Studio — Artwork Generation Engine
// Generates transparent silkscreen vector artwork variations for apparel printing

export interface GeneratedArtworkOption {
  id: string;
  title: string;
  style: string;
  prompt: string;
  svgUrl: string; // Transparent SVG data-URI
  description: string;
  accentColor: string;
}

// Helper to encode SVG to clean Data URI
function svgToDataUri(svgContent: string): string {
  const cleanSvg = svgContent.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

export function generateThemedArtworkVariations(prompt: string, category: string = 'T-shirts'): GeneratedArtworkOption[] {
  const p = prompt.toLowerCase();
  const timestamp = Date.now();

  // Detect style or theme from prompt keywords
  let theme: 'anime' | 'dragon' | 'streetwear' | 'typography' | 'racing' | 'abstract' | 'gaming' | 'floral' | 'custom' = 'streetwear';

  if (p.includes('goku') || p.includes('anime') || p.includes('manga') || p.includes('naruto') || p.includes('saiyan')) {
    theme = 'anime';
  } else if (p.includes('dragon') || p.includes('ryu') || p.includes('drake') || p.includes('serpent')) {
    theme = 'dragon';
  } else if (p.includes('racing') || p.includes('car') || p.includes('turbo') || p.includes('speed') || p.includes('drift')) {
    theme = 'racing';
  } else if (p.includes('flower') || p.includes('floral') || p.includes('rose') || p.includes('botanical') || p.includes('sakura')) {
    theme = 'floral';
  } else if (p.includes('game') || p.includes('gaming') || p.includes('pixel') || p.includes('cyber') || p.includes('glitch')) {
    theme = 'gaming';
  } else if (p.includes('abstract') || p.includes('geometric') || p.includes('wave') || p.includes('liquid') || p.includes('lines')) {
    theme = 'abstract';
  } else if (p.includes('text') || p.includes('quote') || p.includes('minimalist') || p.includes('typography') || p.includes('name')) {
    theme = 'typography';
  }

  // Extract customer headline or fallback
  const userText = prompt.length > 25 ? prompt.slice(0, 24) : prompt;

  if (theme === 'anime') {
    return [
      {
        id: `art-anime-1-${timestamp}`,
        title: 'Saiyan Surge Crest',
        style: 'Anime Streetwear',
        prompt,
        accentColor: '#f59e0b',
        description: 'Blazing ki energy spikes with golden aura and bold kanji power insignia.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <defs>
              <linearGradient id="auragold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd000" />
                <stop offset="100%" stop-color="#f59e0b" />
              </linearGradient>
            </defs>
            <!-- Outer Burst Ring -->
            <circle cx="250" cy="250" r="210" fill="none" stroke="#d7ff3f" stroke-width="3" stroke-dasharray="12 8" opacity="0.8" />
            <circle cx="250" cy="250" r="195" fill="none" stroke="url(#auragold)" stroke-width="5" />
            <!-- Energy Spikes / Flames -->
            <polygon points="250,50 280,140 370,80 330,170 430,160 350,230 440,280 340,310 400,390 300,360 290,450 240,380 190,440 200,350 110,380 160,300 70,270 150,220 80,150 170,160 140,80 220,130" fill="none" stroke="#ffffff" stroke-width="3.5" opacity="0.85" />
            <!-- Center Power Disk -->
            <circle cx="250" cy="250" r="120" fill="#111111" stroke="#d7ff3f" stroke-width="4" />
            <!-- Kanji '悟' (Wisdom/Goku) -->
            <text x="250" y="275" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="95" fill="#ffd000" text-anchor="middle">悟</text>
            <!-- Badge Typography -->
            <path id="archTop" d="M 120 250 A 130 130 0 0 1 380 250" fill="none"/>
            <text font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="16" fill="#d7ff3f" letter-spacing="4">
              <textPath href="#archTop" startOffset="50%" text-anchor="middle">SUPER SAIYAN AURA · 9000+</textPath>
            </text>
            <text x="250" y="405" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="14" fill="#ffffff" letter-spacing="3" text-anchor="middle">OBRYNT ANIME DIVISION</text>
          </svg>
        `),
      },
      {
        id: `art-anime-2-${timestamp}`,
        title: 'Neo Tokyo Shonen Burst',
        style: 'Manga Graphic',
        prompt,
        accentColor: '#ef4444',
        description: 'Speed-line explosion with high-contrast manga panel framing and combat lightning.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Box Frame -->
            <rect x="75" y="75" width="350" height="350" rx="16" fill="#111111" stroke="#ffffff" stroke-width="4" />
            <rect x="85" y="85" width="330" height="330" fill="none" stroke="#ef4444" stroke-width="2" />
            <!-- Speed Lines Radial -->
            <g stroke="#ffffff" stroke-width="2" opacity="0.4">
              <line x1="250" y1="250" x2="100" y2="100" />
              <line x1="250" y1="250" x2="400" y2="100" />
              <line x1="250" y1="250" x2="100" y2="400" />
              <line x1="250" y1="250" x2="400" y2="400" />
              <line x1="250" y1="250" x2="250" y2="90" />
              <line x1="250" y1="250" x2="250" y2="410" />
              <line x1="250" y1="250" x2="90" y2="250" />
              <line x1="250" y1="250" x2="410" y2="250" />
            </g>
            <!-- Lightning Strike -->
            <polyline points="250,90 280,180 230,220 290,320 220,350 260,410" fill="none" stroke="#ffd000" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
            <!-- Halftone Dot Pattern -->
            <circle cx="150" cy="160" r="12" fill="#ef4444" />
            <circle cx="350" cy="340" r="16" fill="#ef4444" />
            <!-- Typography -->
            <text x="250" y="270" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="6" text-anchor="middle">LIMIT BREAKER</text>
            <text x="250" y="305" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="#d7ff3f" letter-spacing="8" text-anchor="middle">極限突破 // ULTRA INSTINCT</text>
          </svg>
        `),
      },
      {
        id: `art-anime-3-${timestamp}`,
        title: 'Dragon Sphere 7-Star Badge',
        style: 'Minimal Emblem',
        prompt,
        accentColor: '#f97316',
        description: 'Orb crest with faceted celestial stars and geometric streetwear seal.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Glowing Sphere -->
            <circle cx="250" cy="250" r="180" fill="#f97316" stroke="#ffffff" stroke-width="6" />
            <circle cx="250" cy="250" r="160" fill="none" stroke="#ffd000" stroke-width="3" stroke-dasharray="8 6" />
            <!-- Star Constellation Center -->
            <polygon points="250,150 260,180 290,180 265,200 275,230 250,210 225,230 235,200 210,180 240,180" fill="#dc2626" />
            <polygon points="210,240 215,255 230,255 218,265 222,280 210,270 198,280 202,265 190,255 205,255" fill="#dc2626" />
            <polygon points="290,240 295,255 310,255 298,265 302,280 290,270 278,280 282,265 270,255 285,255" fill="#dc2626" />
            <polygon points="250,300 255,315 270,315 258,325 262,340 250,330 238,340 242,325 230,315 245,315" fill="#dc2626" />
            <!-- Modern Streetwear Ribbon -->
            <rect x="60" y="235" width="380" height="45" rx="8" fill="#111111" stroke="#ffffff" stroke-width="2" />
            <text x="250" y="265" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="20" fill="#d7ff3f" letter-spacing="6" text-anchor="middle">DRAGON SOUL · EST. 2026</text>
          </svg>
        `),
      },
      {
        id: `art-anime-4-${timestamp}`,
        title: 'Kame Wave Cyberpunk Stencil',
        style: 'Vector Stencil',
        prompt,
        accentColor: '#38bdf8',
        description: 'Electrified energy sphere and speed shockwaves with modern streetwear typography.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Concentric rings -->
            <circle cx="250" cy="250" r="190" fill="none" stroke="#38bdf8" stroke-width="3" />
            <circle cx="250" cy="250" r="140" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 10" />
            <circle cx="250" cy="250" r="90" fill="#0284c7" stroke="#ffffff" stroke-width="5" />
            <circle cx="250" cy="250" r="45" fill="#ffffff" />
            <!-- Wave arcs -->
            <path d="M 60 250 Q 250 100 440 250 Q 250 400 60 250 Z" fill="none" stroke="#38bdf8" stroke-width="3" />
            <!-- Typographic surround -->
            <text x="250" y="90" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="10" text-anchor="middle">KA-ME-HA-ME-HA</text>
            <text x="250" y="430" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" fill="#38bdf8" letter-spacing="5" text-anchor="middle">PURE KINETIC OUTPUT · TOKYO LABS</text>
          </svg>
        `),
      },
    ];
  }

  if (theme === 'dragon') {
    return [
      {
        id: `art-dragon-1-${timestamp}`,
        title: 'Imperial Ryū Sovereign',
        style: 'Japanese Tattoo Art',
        prompt,
        accentColor: '#dc2626',
        description: 'Traditional coiled dragon crest with flame whiskers and cloud scrolls.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Solid Disk -->
            <circle cx="250" cy="250" r="210" fill="#171717" stroke="#dc2626" stroke-width="6" />
            <!-- Traditional Cloud Scrolls -->
            <path d="M 120 180 Q 150 140 190 160 Q 220 130 250 170" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <path d="M 270 340 Q 310 370 350 330 Q 380 360 410 320" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <!-- Coiling Serpent / Dragon Body -->
            <path d="M 140 330 C 100 230, 200 120, 260 140 C 330 160, 390 240, 340 330 C 290 410, 180 390, 230 300 C 270 230, 320 220, 300 180" fill="none" stroke="#dc2626" stroke-width="18" stroke-linecap="round" />
            <path d="M 140 330 C 100 230, 200 120, 260 140 C 330 160, 390 240, 340 330 C 290 410, 180 390, 230 300 C 270 230, 320 220, 300 180" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="10 8" />
            <!-- Dragon Head Silhouette & Horns -->
            <polygon points="300,170 340,130 355,160 380,140 360,185 325,195" fill="#ffd000" stroke="#ffffff" stroke-width="2" />
            <!-- Sacred Kanji '龍' (Dragon) -->
            <text x="250" y="275" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="80" fill="#ffffff" text-anchor="middle">龍</text>
            <text x="250" y="420" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#dc2626" letter-spacing="6" text-anchor="middle">IMPERIAL DRAGON OF THE EAST</text>
          </svg>
        `),
      },
      {
        id: `art-dragon-2-${timestamp}`,
        title: 'Cyber Wyvern Neon Matrix',
        style: 'Cyberpunk Vector',
        prompt,
        accentColor: '#d7ff3f',
        description: 'Geometric cybernetic dragon emblem with sharp faceted wings and telemetry.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Diamond Shield -->
            <polygon points="250,40 450,180 380,440 250,480 120,440 50,180" fill="#111111" stroke="#d7ff3f" stroke-width="5" />
            <!-- Wing Facets -->
            <polygon points="250,160 380,120 330,220 420,240 300,320 250,220" fill="none" stroke="#ffffff" stroke-width="3" />
            <polygon points="250,160 120,120 170,220 80,240 200,320 250,220" fill="none" stroke="#ffffff" stroke-width="3" />
            <!-- Cyber Skull / Dragon Face -->
            <polygon points="250,200 275,250 260,310 250,330 240,310 225,250" fill="#d7ff3f" />
            <!-- Horns -->
            <line x1="250" y1="200" x2="280" y2="130" stroke="#d7ff3f" stroke-width="6" stroke-linecap="round" />
            <line x1="250" y1="200" x2="220" y2="130" stroke="#d7ff3f" stroke-width="6" stroke-linecap="round" />
            <!-- Barcode & Serial -->
            <text x="250" y="390" font-family="'Space Grotesk', monospace" font-size="15" fill="#ffffff" letter-spacing="4" text-anchor="middle">PROTOCOL // WYVERN-99</text>
            <text x="250" y="420" font-family="'Space Grotesk', monospace" font-size="11" fill="#888888" letter-spacing="3" text-anchor="middle">OBRYNT HEAVY TECHNICAL APPAREL</text>
          </svg>
        `),
      },
      {
        id: `art-dragon-3-${timestamp}`,
        title: 'Ouroboros Infinity Dragon',
        style: 'Minimalist Line Art',
        prompt,
        accentColor: '#a855f7',
        description: 'Circular infinity dragon swallowing tail with celestial geometry.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="180" fill="none" stroke="#a855f7" stroke-width="6" />
            <circle cx="250" cy="250" r="140" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 6" />
            <!-- Scales ring -->
            <circle cx="250" cy="250" r="160" fill="none" stroke="#ffd000" stroke-width="8" stroke-dasharray="1 14" stroke-linecap="round" />
            <polygon points="250,70 275,55 265,85" fill="#a855f7" />
            <text x="250" y="245" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="4" text-anchor="middle">OUROBOROS</text>
            <text x="250" y="280" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#d7ff3f" letter-spacing="6" text-anchor="middle">ETERNAL CYCLE</text>
          </svg>
        `),
      },
      {
        id: `art-dragon-4-${timestamp}`,
        title: 'Shadow Drake Streetwear Badge',
        style: 'Distressed Stencil',
        prompt,
        accentColor: '#fb923c',
        description: 'Aggressive street brand insignia with dragon claws and bold typography.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect x="70" y="70" width="360" height="360" rx="24" fill="#1c1917" stroke="#fb923c" stroke-width="5" />
            <!-- Claw slash -->
            <path d="M 140 140 L 220 360 M 210 120 L 290 380 M 280 140 L 360 360" stroke="#ffffff" stroke-width="12" stroke-linecap="round" />
            <text x="250" y="400" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="28" fill="#fb923c" letter-spacing="6" text-anchor="middle">DRAKE CLAW</text>
          </svg>
        `),
      },
    ];
  }

  if (theme === 'racing') {
    return [
      {
        id: `art-racing-1-${timestamp}`,
        title: 'Apex GT Speed Division',
        style: 'Motorsport Decal',
        prompt,
        accentColor: '#ef4444',
        description: 'High-speed checkered chevron racing badge with twin aerodynamic stripes.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Shield -->
            <polygon points="250,50 440,140 390,430 250,470 110,430 60,140" fill="#111111" stroke="#ffffff" stroke-width="5" />
            <!-- Red Chevrons -->
            <polygon points="250,110 390,170 360,250 250,190 140,250 110,170" fill="#ef4444" />
            <!-- Racing Number 07 -->
            <text x="250" y="340" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="110" fill="#ffffff" text-anchor="middle">07</text>
            <!-- Checkered strip -->
            <rect x="150" y="365" width="200" height="15" fill="#d7ff3f" />
            <text x="250" y="415" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="6" text-anchor="middle">APEX MOTORSPORT</text>
          </svg>
        `),
      },
      {
        id: `art-racing-2-${timestamp}`,
        title: 'Tokyo Touge Drift Club',
        style: 'JDM Streetwear',
        prompt,
        accentColor: '#d7ff3f',
        description: 'Japanese midnight mountain racing insignia with kanji and tire tread patterns.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="190" fill="#111111" stroke="#d7ff3f" stroke-width="6" />
            <circle cx="250" cy="250" r="170" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8" />
            <!-- Tachometer Needle -->
            <line x1="250" y1="250" x2="350" y2="150" stroke="#ef4444" stroke-width="7" stroke-linecap="round" />
            <circle cx="250" cy="250" r="18" fill="#ffffff" />
            <text x="250" y="210" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="52" fill="#ffffff" text-anchor="middle">峠</text>
            <text x="250" y="325" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="22" fill="#d7ff3f" letter-spacing="6" text-anchor="middle">TOUGE MIDNIGHT</text>
            <text x="250" y="355" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="13" fill="#ffffff" letter-spacing="4" text-anchor="middle">DRIFT SPECIALIST // JAP</text>
          </svg>
        `),
      },
      {
        id: `art-racing-3-${timestamp}`,
        title: 'Twin Turbocharge Formula',
        style: 'Technical Diagram',
        prompt,
        accentColor: '#38bdf8',
        description: 'Impeller turbine blueprint with technical telemetry and PSI gauges.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="180" fill="none" stroke="#38bdf8" stroke-width="4" />
            <!-- Turbine blades -->
            <path d="M 250 250 Q 280 150 250 100 Q 220 150 250 250 Z" fill="#38bdf8" opacity="0.8" />
            <path d="M 250 250 Q 350 280 400 250 Q 350 220 250 250 Z" fill="#38bdf8" opacity="0.8" />
            <path d="M 250 250 Q 220 350 250 400 Q 280 350 250 250 Z" fill="#38bdf8" opacity="0.8" />
            <path d="M 250 250 Q 150 220 100 250 Q 150 280 250 250 Z" fill="#38bdf8" opacity="0.8" />
            <circle cx="250" cy="250" r="30" fill="#ffffff" />
            <text x="250" y="440" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="20" fill="#ffffff" letter-spacing="6" text-anchor="middle">TWIN TURBOCHARGED</text>
          </svg>
        `),
      },
      {
        id: `art-racing-4-${timestamp}`,
        title: 'Speedway Checkered Flag',
        style: 'Vintage Grand Prix',
        prompt,
        accentColor: '#facc15',
        description: 'Crossed checkered racing flags with vintage serif wreath.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="200" fill="#111111" stroke="#facc15" stroke-width="5" />
            <polygon points="170,160 250,190 250,260 170,230" fill="#ffffff" />
            <polygon points="330,160 250,190 250,260 330,230" fill="#d7ff3f" />
            <text x="250" y="320" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="4" text-anchor="middle">GRAND PRIX</text>
            <text x="250" y="360" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" fill="#facc15" letter-spacing="6" text-anchor="middle">1996 CIRCUIT</text>
          </svg>
        `),
      },
    ];
  }

  if (theme === 'floral') {
    return [
      {
        id: `art-floral-1-${timestamp}`,
        title: 'Sakura Moon Branch',
        style: 'Japanese Botanical',
        prompt,
        accentColor: '#f43f5e',
        description: 'Cherry blossom petals in moon crest with Japanese editorial calligraphy.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <!-- Full Moon -->
            <circle cx="250" cy="250" r="180" fill="#f43f5e" opacity="0.9" />
            <!-- Branch -->
            <path d="M 100 340 Q 200 280 260 220 T 380 140" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
            <path d="M 220 250 Q 280 290 350 280" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
            <!-- Blossom Petals -->
            <circle cx="260" cy="220" r="16" fill="#ffffff" />
            <circle cx="340" cy="160" r="18" fill="#ffd000" />
            <circle cx="350" cy="280" r="14" fill="#ffffff" />
            <circle cx="180" cy="290" r="12" fill="#ffd000" />
            <circle cx="390" cy="130" r="12" fill="#ffffff" />
            <!-- Kanji '桜' (Sakura) -->
            <text x="250" y="270" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="70" fill="#111111" text-anchor="middle">桜</text>
            <text x="250" y="440" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="8" text-anchor="middle">BLOOM IN ADVERSITY</text>
          </svg>
        `),
      },
      {
        id: `art-floral-2-${timestamp}`,
        title: 'Midnight Thorned Rose',
        style: 'Gothic Romance',
        prompt,
        accentColor: '#e11d48',
        description: 'Detailed vector rose with thorns, dripping dew and brutalist lettering.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect x="80" y="60" width="340" height="380" rx="16" fill="#111111" stroke="#e11d48" stroke-width="4" />
            <!-- Rose Blossom -->
            <circle cx="250" cy="180" r="60" fill="#e11d48" />
            <circle cx="250" cy="180" r="40" fill="#be123c" />
            <circle cx="250" cy="180" r="20" fill="#881337" />
            <!-- Stem and Thorns -->
            <path d="M 250 240 L 250 360" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
            <polygon points="250,270 230,260 250,285" fill="#ffffff" />
            <polygon points="250,310 270,300 250,325" fill="#ffffff" />
            <!-- Typography -->
            <text x="250" y="405" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="6" text-anchor="middle">NO ROSE WITHOUT THORN</text>
          </svg>
        `),
      },
      {
        id: `art-floral-3-${timestamp}`,
        title: 'Tropical Monstera Mirage',
        style: 'Line Art Botanical',
        prompt,
        accentColor: '#10b981',
        description: 'Clean Scandinavian botanical line art with tropical palm geometry.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="190" fill="none" stroke="#10b981" stroke-width="4" />
            <!-- Leaf outline -->
            <path d="M 250 100 C 330 150 340 300 250 380 C 160 300 170 150 250 100 Z" fill="#10b981" opacity="0.8" />
            <line x1="250" y1="100" x2="250" y2="400" stroke="#ffffff" stroke-width="4" />
            <text x="250" y="440" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="16" fill="#ffffff" letter-spacing="6" text-anchor="middle">OBRYNT BOTANICAL GARDENS</text>
          </svg>
        `),
      },
      {
        id: `art-floral-4-${timestamp}`,
        title: 'Golden Sunburst Sunflower',
        style: 'Vintage Engraving',
        prompt,
        accentColor: '#eab308',
        description: 'Radiant sunflower head with symmetry petals and celestial rays.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="80" fill="#713f12" stroke="#eab308" stroke-width="6" />
            <circle cx="250" cy="250" r="160" fill="none" stroke="#eab308" stroke-width="4" stroke-dasharray="14 10" />
            <text x="250" y="260" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="30" fill="#fef08a" letter-spacing="2" text-anchor="middle">SOLAR</text>
            <text x="250" y="440" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="#ffffff" letter-spacing="6" text-anchor="middle">FOLLOW THE LIGHT</text>
          </svg>
        `),
      },
    ];
  }

  if (theme === 'gaming') {
    return [
      {
        id: `art-gaming-1-${timestamp}`,
        title: 'Cyber Samurai Glitch Helmet',
        style: 'Cyberpunk Esports',
        prompt,
        accentColor: '#06b6d4',
        description: 'Futuristic mecha visor with reticle HUD and Japanese katakana.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="200" fill="#0f172a" stroke="#06b6d4" stroke-width="5" />
            <!-- Visor Hexagon -->
            <polygon points="250,130 360,190 360,310 250,370 140,310 140,190" fill="#06b6d4" opacity="0.3" stroke="#06b6d4" stroke-width="4" />
            <!-- Visor Glow Line -->
            <rect x="160" y="235" width="180" height="30" rx="6" fill="#d7ff3f" />
            <!-- Crosshair -->
            <line x1="250" y1="90" x2="250" y2="410" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 6" opacity="0.5" />
            <line x1="90" y1="250" x2="410" y2="250" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 6" opacity="0.5" />
            <text x="250" y="420" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="8" text-anchor="middle">CYBER PROTOCOL</text>
          </svg>
        `),
      },
      {
        id: `art-gaming-2-${timestamp}`,
        title: 'Retro Arcade 8-Bit Boss',
        style: 'Pixel Art Nostalgia',
        prompt,
        accentColor: '#a855f7',
        description: 'Pixelated arcade skull with game over glitch and scanlines.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect x="75" y="75" width="350" height="350" rx="20" fill="#18181b" stroke="#a855f7" stroke-width="5" />
            <text x="250" y="230" font-family="'Space Grotesk', monospace" font-weight="900" font-size="70" fill="#d7ff3f" letter-spacing="4" text-anchor="middle">1 UP</text>
            <text x="250" y="290" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="32" fill="#ffffff" letter-spacing="6" text-anchor="middle">PRESS START</text>
            <text x="250" y="360" font-family="'Plus Jakarta Sans', monospace" font-size="14" fill="#a855f7" letter-spacing="4" text-anchor="middle">INSERT COIN TO CONTINUE</text>
          </svg>
        `),
      },
      {
        id: `art-gaming-3-${timestamp}`,
        title: 'Crossed Mythic Broadswords',
        style: 'RPG Fantasy Crest',
        prompt,
        accentColor: '#eab308',
        description: 'Two radiant fantasy blades with winged crest and guild shield.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <polygon points="250,60 410,140 370,410 250,470 130,410 90,140" fill="#111111" stroke="#eab308" stroke-width="5" />
            <!-- Crossed swords -->
            <line x1="160" y1="160" x2="340" y2="340" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
            <line x1="340" y1="160" x2="160" y2="340" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
            <circle cx="250" cy="250" r="40" fill="#eab308" />
            <text x="250" y="410" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="18" fill="#ffffff" letter-spacing="6" text-anchor="middle">MYTHIC GUILD · LVL 99</text>
          </svg>
        `),
      },
      {
        id: `art-gaming-4-${timestamp}`,
        title: 'Respawn Protocol Glitch',
        style: 'Twitch / Streamer Decal',
        prompt,
        accentColor: '#ec4899',
        description: 'Bold warning glitch box with diamond reload reticle.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect x="80" y="160" width="340" height="180" rx="12" fill="#111111" stroke="#ec4899" stroke-width="5" />
            <text x="250" y="240" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="42" fill="#ffffff" letter-spacing="4" text-anchor="middle">RESPAWN</text>
            <text x="250" y="280" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="14" fill="#ec4899" letter-spacing="6" text-anchor="middle">SYSTEM READY // 100% HP</text>
          </svg>
        `),
      },
    ];
  }

  if (theme === 'abstract') {
    return [
      {
        id: `art-abstract-1-${timestamp}`,
        title: 'Topographic Flow Lines',
        style: 'Organic Contour',
        prompt,
        accentColor: '#10b981',
        description: 'Hypnotic elevation contour curves with modern studio typography.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="250" r="195" fill="#111111" stroke="#ffffff" stroke-width="4" />
            <!-- Topo curves -->
            <path d="M 120 180 Q 200 130 250 180 T 380 200" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <path d="M 100 230 Q 180 180 250 230 T 400 240" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <path d="M 90 280 Q 200 250 250 300 T 410 290" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <path d="M 110 330 Q 190 320 250 360 T 390 340" fill="none" stroke="#d7ff3f" stroke-width="4" />
            <text x="250" y="410" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="6" text-anchor="middle">ELEVATION 4800M // OBRYNT</text>
          </svg>
        `),
      },
      {
        id: `art-abstract-2-${timestamp}`,
        title: 'Bauhaus Geometric Harmony',
        style: 'Constructivist Art',
        prompt,
        accentColor: '#f59e0b',
        description: 'Primary shapes, solid circle arches and architectural grid balance.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <rect x="90" y="90" width="320" height="320" fill="none" stroke="#ffffff" stroke-width="4" />
            <circle cx="200" cy="200" r="90" fill="#f59e0b" />
            <rect x="230" y="180" width="140" height="180" fill="#dc2626" />
            <polygon points="140,360 250,230 360,360" fill="#2563eb" opacity="0.9" />
            <text x="250" y="445" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="18" fill="#ffffff" letter-spacing="6" text-anchor="middle">FORM FOLLOWS FUNCTION</text>
          </svg>
        `),
      },
      {
        id: `art-abstract-3-${timestamp}`,
        title: 'Liquid Chrome Distortion',
        style: 'Modern Acid Graphics',
        prompt,
        accentColor: '#d946ef',
        description: 'Molten liquid chrome droplet distortion with metallic gradient reflections.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <path d="M 250 100 C 370 120 420 230 380 330 C 340 430 200 440 130 350 C 60 260 130 80 250 100 Z" fill="#d946ef" stroke="#ffffff" stroke-width="6" />
            <circle cx="220" cy="210" r="40" fill="#ffffff" opacity="0.8" />
            <text x="250" y="320" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="6" text-anchor="middle">LIQUID MATRIX</text>
          </svg>
        `),
      },
      {
        id: `art-abstract-4-${timestamp}`,
        title: 'Celestial Horizon Ray',
        style: 'Minimal Solar',
        prompt,
        accentColor: '#f97316',
        description: 'Ascending sun disc over geometric horizon grid with cosmic aura.',
        svgUrl: svgToDataUri(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <circle cx="250" cy="210" r="110" fill="#f97316" />
            <line x1="60" y1="310" x2="440" y2="310" stroke="#ffffff" stroke-width="6" />
            <line x1="90" y1="340" x2="410" y2="340" stroke="#ffffff" stroke-width="4" />
            <line x1="130" y1="370" x2="370" y2="370" stroke="#ffffff" stroke-width="3" />
            <text x="250" y="430" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="16" fill="#f97316" letter-spacing="8" text-anchor="middle">HORIZON PROTOCOL</text>
          </svg>
        `),
      },
    ];
  }

  // Typography or Fallback Custom
  return [
    {
      id: `art-type-1-${timestamp}`,
      title: 'OBRYNT Heavy Box Industrial',
      style: 'Brutalist Streetwear',
      prompt,
      accentColor: '#d7ff3f',
      description: 'Bold solid industrial banner with barcode and technical specs.',
      svgUrl: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
          <rect x="50" y="140" width="400" height="220" rx="8" fill="#111111" stroke="#d7ff3f" stroke-width="5" />
          <text x="250" y="230" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="4" text-anchor="middle">${userText.toUpperCase()}</text>
          <text x="250" y="275" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="#d7ff3f" letter-spacing="6" text-anchor="middle">OBRYNT STUDIO // NO LIMITS</text>
          <!-- Barcode simulation -->
          <g fill="#ffffff" transform="translate(140, 305)">
            <rect x="0" y="0" width="4" height="25" />
            <rect x="8" y="0" width="8" height="25" />
            <rect x="20" y="0" width="3" height="25" />
            <rect x="28" y="0" width="12" height="25" />
            <rect x="44" y="0" width="6" height="25" />
            <rect x="54" y="0" width="2" height="25" />
            <rect x="62" y="0" width="14" height="25" />
            <rect x="80" y="0" width="5" height="25" />
            <rect x="90" y="0" width="8" height="25" />
            <rect x="104" y="0" width="4" height="25" />
            <rect x="112" y="0" width="12" height="25" />
            <rect x="130" y="0" width="6" height="25" />
            <rect x="140" y="0" width="8" height="25" />
            <rect x="154" y="0" width="3" height="25" />
            <rect x="162" y="0" width="10" height="25" />
            <rect x="178" y="0" width="4" height="25" />
            <rect x="186" y="0" width="12" height="25" />
            <rect x="204" y="0" width="6" height="25" />
            <rect x="214" y="0" width="4" height="25" />
          </g>
        </svg>
      `),
    },
    {
      id: `art-type-2-${timestamp}`,
      title: 'Neo-Tokyo Shibuya Script',
      style: 'Japanese Streetwear',
      prompt,
      accentColor: '#ef4444',
      description: 'Vertical Japanese katakana with crosshair reticle and neon glow.',
      svgUrl: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
          <circle cx="250" cy="250" r="190" fill="#111111" stroke="#ef4444" stroke-width="6" />
          <circle cx="250" cy="250" r="150" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8" />
          <text x="250" y="210" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="52" fill="#ef4444" text-anchor="middle">東京</text>
          <text x="250" y="275" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="32" fill="#ffffff" letter-spacing="4" text-anchor="middle">${userText.toUpperCase()}</text>
          <text x="250" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#d7ff3f" letter-spacing="6" text-anchor="middle">SHIBUYA DISTRICT · 03</text>
        </svg>
      `),
    },
    {
      id: `art-type-3-${timestamp}`,
      title: 'Arch Curved Editorial Serif',
      style: 'Minimalist Arch',
      prompt,
      accentColor: '#38bdf8',
      description: 'Graceful curved typography arch with starburst and year insignia.',
      svgUrl: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
          <path id="curvePath" d="M 80 280 A 170 170 0 0 1 420 280" fill="none" />
          <text font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="32" fill="#ffffff" letter-spacing="6">
            <textPath href="#curvePath" startOffset="50%" text-anchor="middle">${userText.toUpperCase()}</textPath>
          </text>
          <!-- Center Starburst -->
          <polygon points="250,220 256,238 274,244 256,250 250,268 244,250 226,244 244,238" fill="#d7ff3f" />
          <text x="250" y="330" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="20" fill="#38bdf8" letter-spacing="8" text-anchor="middle">OBRYNT · 2026</text>
          <text x="250" y="365" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="12" fill="#888888" letter-spacing="4" text-anchor="middle">LIMITED EDITION PIECE</text>
        </svg>
      `),
    },
    {
      id: `art-type-4-${timestamp}`,
      title: 'Crosshair Precision Stencil',
      style: 'Technical Grid',
      prompt,
      accentColor: '#facc15',
      description: 'Precision targeting grid with quadrant markers and technical coordinates.',
      svgUrl: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
          <circle cx="250" cy="250" r="190" fill="none" stroke="#facc15" stroke-width="4" />
          <line x1="60" y1="250" x2="440" y2="250" stroke="#facc15" stroke-width="2" />
          <line x1="250" y1="60" x2="250" y2="440" stroke="#facc15" stroke-width="2" />
          <rect x="130" y="195" width="240" height="110" rx="10" fill="#111111" stroke="#ffffff" stroke-width="3" />
          <text x="250" y="245" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="26" fill="#ffffff" letter-spacing="4" text-anchor="middle">${userText.toUpperCase()}</text>
          <text x="250" y="275" font-family="'Plus Jakarta Sans', monospace" font-size="11" fill="#d7ff3f" letter-spacing="4" text-anchor="middle">LAT 28.6139° N / 77.2090° E</text>
        </svg>
      `),
    },
  ];
}
