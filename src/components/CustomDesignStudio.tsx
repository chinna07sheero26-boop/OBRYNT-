import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Download,
  Bookmark,
  Check,
  RotateCw,
  Sliders,
  Eye,
  RefreshCw,
  Upload,
  Layers,
  Heart,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { CustomDesign, ArtworkPlacement, Product } from '../types';
import {
  CLOTHING_CATEGORIES,
  ClothingCategoryItem,
  GARMENT_COLOR_SWATCHES,
  SUGGESTED_PROMPT_CHIPS,
  generateClothingArtwork,
  downloadArtworkAsPng,
  saveCustomerDesign,
  getSavedCustomerDesigns,
  deleteCustomerDesign,
} from '../services/aiDesignService';
import { GeneratedArtworkOption } from '../utils/aiArtworkGenerator';
import { GarmentMockup } from './GarmentMockup';

interface CustomDesignStudioProps {
  onAddCustomToCart: (design: CustomDesign) => void;
  onSaveDesign: (design: CustomDesign) => void;
  onShowNotice: (msg: string) => void;
  onCloseStudio?: () => void;
  isStandalonePage?: boolean;
}

type StudioStep = 'category' | 'garment' | 'ai-generator' | 'placement' | 'final-review';

export const CustomDesignStudio: React.FC<CustomDesignStudioProps> = ({
  onAddCustomToCart,
  onSaveDesign,
  onShowNotice,
  onCloseStudio,
  isStandalonePage = false,
}) => {
  // Navigation & Stepper
  const [currentStep, setCurrentStep] = useState<StudioStep>('category');

  // Step 1: Selected Category
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategoryItem>(CLOTHING_CATEGORIES[0]);

  // Step 2: Garment Customization Options
  const [selectedGender, setSelectedGender] = useState<string>("Unisex T-shirts");
  const [selectedFit, setSelectedFit] = useState<string>('Regular fit');
  const [selectedNeckline, setSelectedNeckline] = useState<string>('Round neck');
  const [selectedSleeve, setSelectedSleeve] = useState<string>('Half sleeve');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedColor, setSelectedColor] = useState(GARMENT_COLOR_SWATCHES[0]);

  // Step 3: AI Artwork Generation
  const [prompt, setPrompt] = useState<string>('Goku anime-inspired design with flaming aura and bold kanji');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [artworkGallery, setArtworkGallery] = useState<GeneratedArtworkOption[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<GeneratedArtworkOption | null>(null);

  // Step 4: Garment Placement
  const [activeSide, setActiveSide] = useState<'Front' | 'Back'>('Front');
  const [frontPlacement, setFrontPlacement] = useState<ArtworkPlacement>({
    url: '',
    x: 0,
    y: -8,
    scale: 0.95,
    rotation: 0,
    preset: 'chest',
  });
  const [backPlacement, setBackPlacement] = useState<ArtworkPlacement>({
    url: '',
    x: 0,
    y: -5,
    scale: 0.85,
    rotation: 0,
    preset: 'chest',
  });
  const [showPrintGuide, setShowPrintGuide] = useState<boolean>(true);

  // Customer Design Library Drawer
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [savedLibrary, setSavedLibrary] = useState<CustomDesign[]>(() => getSavedCustomerDesigns());

  // Favorites tracking
  const [favoriteArtworks, setFavoriteArtworks] = useState<string[]>([]);

  // Sync category changes with default garment options
  const handleSelectCategory = (cat: ClothingCategoryItem) => {
    setSelectedCategory(cat);
    setSelectedGender(cat.genders[0] || 'Unisex');
    setSelectedFit(cat.fits[0] || 'Regular fit');
    setSelectedNeckline(cat.necklines[0] || 'Round neck');
    setSelectedSleeve(cat.sleeves[0] || 'Half sleeve');
    setSelectedSize(cat.sizes[2] || 'L'); // Default to L
    setCurrentStep('garment');
  };

  // Generate initial artworks on entering step 3
  const handleTriggerGenerate = async (customPrompt?: string) => {
    const textToGenerate = (customPrompt || prompt).trim();
    if (!textToGenerate) {
      onShowNotice('Please enter a description for your design.');
      return;
    }

    setIsGenerating(true);
    try {
      const results = await generateClothingArtwork(textToGenerate, selectedCategory.name, selectedColor.hex);
      setArtworkGallery(results);
      if (results.length > 0) {
        setSelectedArtwork(results[0]);
        // Auto-assign to current placement
        if (activeSide === 'Front') {
          setFrontPlacement((prev) => ({ ...prev, url: results[0].svgUrl }));
        } else {
          setBackPlacement((prev) => ({ ...prev, url: results[0].svgUrl }));
        }
      }
      onShowNotice(`Generated ${results.length} bespoke design options!`);
    } catch (err) {
      onShowNotice('Generation error. Loaded creative design presets.');
    } finally {
      setIsGenerating(false);
    }
  };

  // When stepping into AI Generator for the first time, auto-generate options if empty
  useEffect(() => {
    if (currentStep === 'ai-generator' && artworkGallery.length === 0) {
      handleTriggerGenerate();
    }
  }, [currentStep]);

  // Handle file upload from customer
  const handleCustomArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowNotice('Please upload an image file (PNG, SVG, or JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const customOption: GeneratedArtworkOption = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, '').slice(0, 20),
        style: 'Uploaded Graphic',
        prompt: `Custom upload: ${file.name}`,
        svgUrl: result,
        description: 'Customer high-resolution custom uploaded graphic.',
        accentColor: '#d7ff3f',
      };

      setArtworkGallery((prev) => [customOption, ...prev]);
      setSelectedArtwork(customOption);
      if (activeSide === 'Front') {
        setFrontPlacement((prev) => ({ ...prev, url: result }));
      } else {
        setBackPlacement((prev) => ({ ...prev, url: result }));
      }
      onShowNotice('Your custom graphic was uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Select favorite artwork from gallery
  const handleSelectArtwork = (art: GeneratedArtworkOption) => {
    setSelectedArtwork(art);
    if (activeSide === 'Front') {
      setFrontPlacement((prev) => ({ ...prev, url: art.svgUrl }));
    } else {
      setBackPlacement((prev) => ({ ...prev, url: art.svgUrl }));
    }
  };

  // Download artwork helper
  const handleDownloadArtwork = async (art: GeneratedArtworkOption) => {
    try {
      await downloadArtworkAsPng(art.svgUrl, `obrynt-${art.title.toLowerCase().replace(/\s+/g, '-')}`);
      onShowNotice('Artwork downloaded as high-res transparent PNG!');
    } catch {
      onShowNotice('Downloading artwork...');
    }
  };

  // Placement preset handlers
  const handleApplyPreset = (preset: 'pocket' | 'chest' | 'full' | 'lower') => {
    const activePlacement = activeSide === 'Front' ? frontPlacement : backPlacement;
    let updated: ArtworkPlacement = { ...activePlacement, preset: preset as any };

    if (preset === 'pocket') {
      updated = { ...updated, x: -22, y: -22, scale: 0.55, rotation: 0 };
    } else if (preset === 'chest') {
      updated = { ...updated, x: 0, y: -12, scale: 0.85, rotation: 0 };
    } else if (preset === 'full') {
      updated = { ...updated, x: 0, y: 0, scale: 1.25, rotation: 0 };
    } else if (preset === 'lower') {
      updated = { ...updated, x: 0, y: 22, scale: 0.7, rotation: 0 };
    }

    if (activeSide === 'Front') {
      setFrontPlacement(updated);
    } else {
      setBackPlacement(updated);
    }
  };

  // Compile full CustomDesign object
  const currentPlacement = activeSide === 'Front' ? frontPlacement : backPlacement;
  const currentArtworkUrl = frontPlacement.url || backPlacement.url || (selectedArtwork ? selectedArtwork.svgUrl : '');

  const totalPrice = selectedCategory.basePrice + selectedCategory.printPrice;

  const compiledDesign: CustomDesign = {
    id: `design-${Date.now()}`,
    text: selectedArtwork ? selectedArtwork.title : 'OBRYNT BESPOKE',
    side: activeSide,
    size: selectedSize,
    colorHex: selectedColor.hex,
    colorName: selectedColor.name,
    textColor: selectedColor.textColor,
    category: selectedCategory.name,
    clothingType: selectedCategory.name,
    gender: (selectedGender.includes('Women') ? 'Women' : selectedGender.includes('Men') ? 'Men' : 'Unisex') as any,
    fit: selectedFit,
    neckline: selectedNeckline,
    sleeve: selectedSleeve,
    artworkUrl: currentArtworkUrl,
    frontArtwork: frontPlacement.url ? frontPlacement : undefined,
    backArtwork: backPlacement.url ? backPlacement : undefined,
    prompt: prompt,
    stylePreset: selectedArtwork?.style || 'Streetwear',
    basePrice: selectedCategory.basePrice,
    printPrice: selectedCategory.printPrice,
    totalPrice: totalPrice,
    dateCreated: new Date().toISOString(),
  };

  // Save to account
  const handleSaveCurrentDesign = () => {
    const updated = saveCustomerDesign(compiledDesign);
    setSavedLibrary(updated);
    onSaveDesign(compiledDesign);
    onShowNotice('Custom garment saved to your OBRYNT Design Library!');
  };

  // Add to shopping bag
  const handleAddToCart = () => {
    onAddCustomToCart(compiledDesign);
    onShowNotice(`Added custom ${selectedCategory.name} (${selectedSize} / ${selectedColor.name}) to your bag!`);
  };

  // Load a saved design from library
  const handleLoadSavedDesign = (design: CustomDesign) => {
    const matchedCategory = CLOTHING_CATEGORIES.find((c) => c.name === design.category) || CLOTHING_CATEGORIES[0];
    setSelectedCategory(matchedCategory);
    if (design.size) setSelectedSize(design.size);
    if (design.fit) setSelectedFit(design.fit);
    if (design.neckline) setSelectedNeckline(design.neckline);
    if (design.sleeve) setSelectedSleeve(design.sleeve);

    const swatch = GARMENT_COLOR_SWATCHES.find((s) => s.hex === design.colorHex) || GARMENT_COLOR_SWATCHES[0];
    setSelectedColor(swatch);

    if (design.frontArtwork) setFrontPlacement(design.frontArtwork);
    else if (design.artworkUrl) setFrontPlacement((prev) => ({ ...prev, url: design.artworkUrl! }));

    if (design.backArtwork) setBackPlacement(design.backArtwork);

    setIsLibraryOpen(false);
    setCurrentStep('placement');
    onShowNotice(`Loaded saved design: "${design.text || 'Custom Design'}"`);
  };

  return (
    <section id="design" className="my-10 sm:my-14 bg-[#141414] text-[#f5f5f0] rounded-[32px] p-4 sm:p-8 lg:p-12 border border-[#2a2a2a] shadow-2xl relative overflow-hidden">
      {/* Background aesthetic grid & glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_70%_20%,rgba(215,255,63,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2a2a2a] relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d7ff3f] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d7ff3f]">
              OBRYNT AI CLOTHING STUDIO
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
            Design Your Own Apparel.
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
            Choose your garment silhouette, describe any artwork in plain words, generate with AI, and position your print with live 3D preview.
          </p>
        </div>

        {/* Studio Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#222222] hover:bg-[#2c2c2c] text-white border border-[#333333] text-xs font-bold transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#d7ff3f]" />
            <span>My Designs ({savedLibrary.length})</span>
          </button>

          {onCloseStudio && (
            <button
              onClick={onCloseStudio}
              className="p-2 rounded-full bg-[#222222] hover:bg-[#2c2c2c] text-stone-400 hover:text-white cursor-pointer transition-colors"
              title="Close Studio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Step Navigator */}
      <div className="py-5 border-b border-[#222222] overflow-x-auto no-scrollbar relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-max">
          {[
            { key: 'category', label: '1. Select Garment', stepNum: 1 },
            { key: 'garment', label: '2. Cut & Colors', stepNum: 2 },
            { key: 'ai-generator', label: '3. AI Artwork Studio', stepNum: 3 },
            { key: 'placement', label: '4. Placement & 3D Mockup', stepNum: 4 },
            { key: 'final-review', label: '5. Review & Order', stepNum: 5 },
          ].map((item, idx) => {
            const isCurrent = currentStep === item.key;
            const stepOrder: StudioStep[] = ['category', 'garment', 'ai-generator', 'placement', 'final-review'];
            const isCompleted = stepOrder.indexOf(currentStep) > idx;

            return (
              <React.Fragment key={item.key}>
                <button
                  onClick={() => setCurrentStep(item.key as StudioStep)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#d7ff3f] text-[#111111] shadow-lg shadow-[#d7ff3f]/10 font-black'
                      : isCompleted
                      ? 'bg-[#222222] text-white hover:bg-[#2a2a2a]'
                      : 'bg-[#181818] text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isCurrent
                        ? 'bg-[#111111] text-[#d7ff3f]'
                        : isCompleted
                        ? 'bg-[#d7ff3f] text-[#111111]'
                        : 'bg-[#2e2e2e] text-stone-400'
                    }`}
                  >
                    {isCompleted ? '✓' : item.stepNum}
                  </span>
                  <span>{item.label}</span>
                </button>
                {idx < 4 && <span className="text-stone-700 text-xs">/</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="py-8 relative z-10">
        {/* ==================================================================== */}
        {/* STEP 1: CLOTHING CATEGORY ENTRY CARDS                               */}
        {/* ==================================================================== */}
        {currentStep === 'category' && (
          <div>
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-[#d7ff3f]">
                STEP 1 OF 5
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Choose Your Clothing Canvas
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Select the apparel silhouette you want to customise. Each garment is engineered with high-GSM combed fabric and reinforced double-needle stitching.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {CLOTHING_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className={`group relative bg-[#1c1c1c] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${
                      isSelected
                        ? 'border-[#d7ff3f] ring-2 ring-[#d7ff3f]/50'
                        : 'border-[#2e2e2e] hover:border-stone-500'
                    }`}
                  >
                    {/* Clothing Image */}
                    <div className="aspect-4/3 w-full bg-[#111111] overflow-hidden relative">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-transparent to-transparent opacity-90" />
                      <div className="absolute top-2.5 right-2.5 bg-[#111111]/80 backdrop-blur-xs text-[#d7ff3f] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                        From ₹{cat.basePrice}
                      </div>
                    </div>

                    {/* Clothing Card Details */}
                    <div className="p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                        {cat.tagline}
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white mt-0.5 group-hover:text-[#d7ff3f] transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="mt-3.5 pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-stone-400">
                          {cat.fabric.split(' ')[0]} {cat.fabric.split(' ')[1]}
                        </span>
                        <span className="inline-flex items-center gap-1 font-black text-[#d7ff3f] text-xs group-hover:translate-x-1 transition-transform">
                          Customize <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 2: GARMENT OPTIONS (GENDER, FIT, NECKLINE, SLEEVE, COLOR, SIZE)*/}
        {/* ==================================================================== */}
        {currentStep === 'garment' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Live Mockup Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <GarmentMockup
                category={selectedCategory.name}
                side={activeSide}
                garmentColor={selectedColor.hex}
                placement={activeSide === 'Front' ? frontPlacement : backPlacement}
                showPrintAreaGuide={showPrintGuide}
                className="w-full"
              />

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setActiveSide('Front')}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    activeSide === 'Front'
                      ? 'bg-[#d7ff3f] text-[#111111]'
                      : 'bg-[#222222] text-stone-400 hover:text-white'
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setActiveSide('Back')}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                    activeSide === 'Back'
                      ? 'bg-[#d7ff3f] text-[#111111]'
                      : 'bg-[#222222] text-stone-400 hover:text-white'
                  }`}
                >
                  Back View
                </button>
              </div>
            </div>

            {/* Right Column: Tailored Options */}
            <div className="lg:col-span-7 bg-[#1c1c1c] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a]">
              <div className="flex items-center justify-between pb-4 border-b border-[#2e2e2e]">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#d7ff3f]">
                    GARMENT SPECIFICATION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {selectedCategory.name} Tailoring
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-400">Base Garment</div>
                  <div className="text-xl font-black text-white">₹{selectedCategory.basePrice}</div>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Gender / Line Selector */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                    Line / Silhouette:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.genders.map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedGender === g
                            ? 'bg-[#d7ff3f] text-[#111111] font-black'
                            : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fit Selector */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                    Fit & Cut:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.fits.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFit(f)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedFit === f
                            ? 'bg-[#d7ff3f] text-[#111111] font-black'
                            : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neckline / Collar */}
                {selectedCategory.necklines.length > 0 && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                      Collar & Neckline:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory.necklines.map((n) => (
                        <button
                          key={n}
                          onClick={() => setSelectedNeckline(n)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedNeckline === n
                              ? 'bg-[#d7ff3f] text-[#111111] font-black'
                              : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sleeves */}
                {selectedCategory.sleeves.length > 0 && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                      Sleeve Length:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory.sleeves.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSleeve(s)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedSleeve === s
                              ? 'bg-[#d7ff3f] text-[#111111] font-black'
                              : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Garment Color Swatches */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                    Fabric Shade: <span className="text-[#d7ff3f]">{selectedColor.name}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {GARMENT_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        onClick={() => setSelectedColor(swatch)}
                        className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer relative shadow-sm ${
                          selectedColor.hex === swatch.hex
                            ? 'border-[#d7ff3f] scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {selectedColor.hex === swatch.hex && (
                          <Check
                            className="w-4 h-4 mx-auto drop-shadow-md"
                            style={{ color: swatch.textColor }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Options */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                    Select Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory.sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-12 h-11 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-white text-[#111111] shadow-lg'
                            : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric Info Callout */}
                <div className="p-3.5 rounded-xl bg-[#222222] border border-[#2e2e2e] text-xs text-stone-400 flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-[#d7ff3f] shrink-0" />
                  <span>{selectedCategory.fabric} · Double Bio-Washed & Silicon Softened</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#2e2e2e]">
                <button
                  onClick={() => setCurrentStep('category')}
                  className="px-4 py-2.5 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Garment
                </button>
                <button
                  onClick={() => setCurrentStep('ai-generator')}
                  className="px-6 py-2.5 rounded-full bg-[#d7ff3f] hover:bg-[#cbf42f] text-[#111111] text-xs font-black transition-transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#d7ff3f]/10"
                >
                  <span>Next: Generate AI Artwork</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: AI DESIGN GENERATOR STUDIO                                  */}
        {/* ==================================================================== */}
        {currentStep === 'ai-generator' && (
          <div className="space-y-8">
            {/* Prompt Input Box */}
            <div className="bg-[#1c1c1c] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a] relative">
              <div className="max-w-3xl">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  AI TEXT-TO-APPAREL GENERATOR
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Describe the design you want...
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-1">
                  Our neural design engine converts your idea into print-ready transparent vector graphics.
                </p>

                {/* Prompt Field */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTriggerGenerate()}
                    placeholder="e.g., Goku anime-inspired design, dragon artwork, Japanese streetwear..."
                    className="flex-1 bg-[#111111] border border-[#333333] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-stone-500 focus:outline-hidden focus:border-[#d7ff3f]"
                  />
                  <button
                    onClick={() => handleTriggerGenerate()}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-[#d7ff3f] hover:bg-[#cbf42f] text-[#111111] rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#d7ff3f]/10"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#111111]" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#111111]" />
                        <span>Generate Designs</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt Suggestions Chips */}
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] font-bold text-stone-400">Try these:</span>
                  {SUGGESTED_PROMPT_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        setPrompt(chip.prompt);
                        handleTriggerGenerate(chip.prompt);
                      }}
                      className="px-3 py-1 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-300 text-xs font-medium border border-[#333333] hover:border-stone-500 transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Or Upload Customer Image */}
                <div className="mt-5 pt-4 border-t border-[#2a2a2a] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
                  <span>Have your own design or logo already?</span>
                  <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-200 border border-[#333333] cursor-pointer font-bold transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#d7ff3f]" />
                    <span>Upload PNG / SVG / JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomArtworkUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Generated Artworks Gallery */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Design Variations</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#262626] text-[#d7ff3f] text-xs font-bold">
                    {artworkGallery.length} Options
                  </span>
                </h4>
                <button
                  onClick={() => handleTriggerGenerate()}
                  disabled={isGenerating}
                  className="text-xs font-bold text-[#d7ff3f] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate More</span>
                </button>
              </div>

              {artworkGallery.length === 0 && isGenerating ? (
                <div className="text-center py-20 bg-[#1c1c1c] rounded-3xl border border-[#2a2a2a]">
                  <RefreshCw className="w-8 h-8 text-[#d7ff3f] animate-spin mx-auto mb-3" />
                  <div className="text-base font-bold text-white">Rendering AI Silkscreen Vector Graphics...</div>
                  <div className="text-xs text-stone-400 mt-1">Isolating artwork onto transparent canvas for apparel print.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {artworkGallery.map((art) => {
                    const isSelected = selectedArtwork?.id === art.id;
                    const isFav = favoriteArtworks.includes(art.id);

                    return (
                      <div
                        key={art.id}
                        onClick={() => handleSelectArtwork(art)}
                        className={`group bg-[#1c1c1c] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 flex flex-col ${
                          isSelected
                            ? 'border-[#d7ff3f] ring-2 ring-[#d7ff3f]/50'
                            : 'border-[#2a2a2a] hover:border-stone-500'
                        }`}
                      >
                        {/* Artwork Preview Card on Checkerboard or Dark */}
                        <div className="aspect-square w-full bg-[#111111] p-6 flex items-center justify-center relative overflow-hidden group-hover:bg-[#161616] transition-colors">
                          <img
                            src={art.svgUrl}
                            alt={art.title}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
                          />

                          {/* Quick Favorite Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavoriteArtworks((prev) =>
                                isFav ? prev.filter((id) => id !== art.id) : [...prev, art.id]
                              );
                              onShowNotice(isFav ? 'Removed from favorites' : 'Saved to favorites');
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-[#111111]/80 hover:bg-[#111111] text-stone-400 hover:text-white cursor-pointer transition-colors"
                            title="Favorite"
                          >
                            <Heart
                              className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                            />
                          </button>

                          {/* Style Tag */}
                          <div className="absolute top-2.5 left-2.5 bg-[#111111]/80 backdrop-blur-xs text-[#d7ff3f] px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                            {art.style}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="text-sm font-black text-white group-hover:text-[#d7ff3f] transition-colors">
                              {art.title}
                            </h5>
                            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                              {art.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#2a2a2a] flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectArtwork(art);
                                setCurrentStep('placement');
                              }}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#d7ff3f] text-[#111111]'
                                  : 'bg-[#262626] text-stone-300 hover:bg-[#333333]'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Use Artwork'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadArtwork(art);
                              }}
                              className="p-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-stone-300 hover:text-white cursor-pointer"
                              title="Download transparent PNG"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step Navigation Bottom Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-[#2e2e2e]">
              <button
                onClick={() => setCurrentStep('garment')}
                className="px-4 py-2.5 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Garment
              </button>
              <button
                onClick={() => setCurrentStep('placement')}
                disabled={!selectedArtwork && !currentArtworkUrl}
                className="px-6 py-2.5 rounded-full bg-[#d7ff3f] hover:bg-[#cbf42f] text-[#111111] text-xs font-black transition-transform active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-[#d7ff3f]/10"
              >
                <span>Proceed to Placement & Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 4: REALISTIC CLOTHING DESIGN PLACEMENT                          */}
        {/* ==================================================================== */}
        {currentStep === 'placement' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Interactive 3D Mockup */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <GarmentMockup
                category={selectedCategory.name}
                side={activeSide}
                garmentColor={selectedColor.hex}
                placement={currentPlacement}
                showPrintAreaGuide={showPrintGuide}
                className="w-full"
              />

              {/* View Switcher & Print Guide Toggle */}
              <div className="flex items-center justify-between w-full max-w-[480px] mt-4 px-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSide('Front')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      activeSide === 'Front'
                        ? 'bg-[#d7ff3f] text-[#111111]'
                        : 'bg-[#222222] text-stone-400 hover:text-white'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    onClick={() => setActiveSide('Back')}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      activeSide === 'Back'
                        ? 'bg-[#d7ff3f] text-[#111111]'
                        : 'bg-[#222222] text-stone-400 hover:text-white'
                    }`}
                  >
                    Back View
                  </button>
                </div>

                <button
                  onClick={() => setShowPrintGuide((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    showPrintGuide
                      ? 'bg-[#2e2e2e] text-[#d7ff3f]'
                      : 'bg-[#222222] text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPrintGuide ? 'Hide Print Bounds' : 'Show Bounds'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Placement Controls */}
            <div className="lg:col-span-6 bg-[#1c1c1c] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a] space-y-6">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  PLACEMENT & SCALE CONTROLS
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Adjust {activeSide} Artwork
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Position and resize your silkscreen graphic exactly how you want it on the garment.
                </p>
              </div>

              {/* Quick Placement Presets */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  Placement Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pocket', label: 'Left Pocket' },
                    { id: 'chest', label: 'Center Chest' },
                    { id: 'full', label: 'Full Front' },
                    { id: 'lower', label: 'Lower Hem' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p.id as any)}
                      className="px-3 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-stone-300 hover:text-white text-xs font-bold border border-[#333333] cursor-pointer text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resize / Scale Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  <span>Size & Scale:</span>
                  <span className="text-[#d7ff3f]">{Math.round(currentPlacement.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.05"
                  value={currentPlacement.scale}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value);
                    if (activeSide === 'Front') {
                      setFrontPlacement((prev) => ({ ...prev, scale: newScale }));
                    } else {
                      setBackPlacement((prev) => ({ ...prev, scale: newScale }));
                    }
                  }}
                  className="w-full accent-[#d7ff3f] cursor-pointer"
                />
              </div>

              {/* Vertical Position Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  <span>Vertical Position (Y):</span>
                  <span className="text-[#d7ff3f]">{currentPlacement.y > 0 ? `+${currentPlacement.y}%` : `${currentPlacement.y}%`}</span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={currentPlacement.y}
                  onChange={(e) => {
                    const newY = parseInt(e.target.value);
                    if (activeSide === 'Front') {
                      setFrontPlacement((prev) => ({ ...prev, y: newY }));
                    } else {
                      setBackPlacement((prev) => ({ ...prev, y: newY }));
                    }
                  }}
                  className="w-full accent-[#d7ff3f] cursor-pointer"
                />
              </div>

              {/* Horizontal Position Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  <span>Horizontal Position (X):</span>
                  <span className="text-[#d7ff3f]">{currentPlacement.x > 0 ? `+${currentPlacement.x}%` : `${currentPlacement.x}%`}</span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={currentPlacement.x}
                  onChange={(e) => {
                    const newX = parseInt(e.target.value);
                    if (activeSide === 'Front') {
                      setFrontPlacement((prev) => ({ ...prev, x: newX }));
                    } else {
                      setBackPlacement((prev) => ({ ...prev, x: newX }));
                    }
                  }}
                  className="w-full accent-[#d7ff3f] cursor-pointer"
                />
              </div>

              {/* Rotation Slider & Nudge Buttons */}
              <div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  <span>Rotation:</span>
                  <span className="text-[#d7ff3f]">{currentPlacement.rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={currentPlacement.rotation}
                    onChange={(e) => {
                      const newRot = parseInt(e.target.value);
                      if (activeSide === 'Front') {
                        setFrontPlacement((prev) => ({ ...prev, rotation: newRot }));
                      } else {
                        setBackPlacement((prev) => ({ ...prev, rotation: newRot }));
                      }
                    }}
                    className="flex-1 accent-[#d7ff3f] cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      const resetRot = 0;
                      if (activeSide === 'Front') {
                        setFrontPlacement((prev) => ({ ...prev, rotation: resetRot }));
                      } else {
                        setBackPlacement((prev) => ({ ...prev, rotation: resetRot }));
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#333333] text-stone-300 text-[11px] font-bold cursor-pointer"
                    title="Reset Angle"
                  >
                    0° Reset
                  </button>
                </div>
              </div>

              {/* Live Garment Color Switcher */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-300 mb-2">
                  Preview On Another Color: <span className="text-[#d7ff3f]">{selectedColor.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GARMENT_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => setSelectedColor(swatch)}
                      className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                        selectedColor.hex === swatch.hex
                          ? 'border-[#d7ff3f] scale-110 ring-2 ring-[#d7ff3f]/50'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>

              {/* Change Artwork or Download Artwork */}
              <div className="pt-4 border-t border-[#2e2e2e] flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep('ai-generator')}
                  className="text-xs font-bold text-[#d7ff3f] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choose Another Artwork</span>
                </button>

                {currentPlacement.url && (
                  <button
                    onClick={() => {
                      if (selectedArtwork) {
                        handleDownloadArtwork(selectedArtwork);
                      } else {
                        downloadArtworkAsPng(currentPlacement.url, 'obrynt-placed-artwork');
                        onShowNotice('Artwork downloaded!');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Artwork (PNG)</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#2e2e2e]">
                <button
                  onClick={() => setCurrentStep('ai-generator')}
                  className="px-4 py-2.5 rounded-full bg-[#262626] hover:bg-[#333333] text-stone-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Studio
                </button>
                <button
                  onClick={() => setCurrentStep('final-review')}
                  className="px-6 py-2.5 rounded-full bg-[#d7ff3f] hover:bg-[#cbf42f] text-[#111111] text-xs font-black transition-transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#d7ff3f]/10"
                >
                  <span>Review Final Product</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 5: FINAL PRODUCT SUMMARY & CART ORDER                           */}
        {/* ==================================================================== */}
        {currentStep === 'final-review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Side-by-Side Dual Mockup (Front & Back) */}
            <div className="lg:col-span-7 bg-[#1c1c1c] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a]">
              <div className="text-center sm:text-left mb-6">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  FINAL BESPOKE SPECIFICATION
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {selectedCategory.name} — {selectedColor.name}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  High-definition silkscreen render preview across both front and rear canvases.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Mockup */}
                <div className="flex flex-col items-center bg-[#161616] p-4 rounded-2xl border border-[#282828]">
                  <GarmentMockup
                    category={selectedCategory.name}
                    side="Front"
                    garmentColor={selectedColor.hex}
                    placement={frontPlacement}
                    showPrintAreaGuide={false}
                    className="w-full aspect-square"
                  />
                  <span className="mt-2 text-xs font-black uppercase text-stone-300">Front View</span>
                </div>

                {/* Back Mockup */}
                <div className="flex flex-col items-center bg-[#161616] p-4 rounded-2xl border border-[#282828]">
                  <GarmentMockup
                    category={selectedCategory.name}
                    side="Back"
                    garmentColor={selectedColor.hex}
                    placement={backPlacement}
                    showPrintAreaGuide={false}
                    className="w-full aspect-square"
                  />
                  <span className="mt-2 text-xs font-black uppercase text-stone-300">Back View</span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Breakdown & Checkout Buttons */}
            <div className="lg:col-span-5 bg-[#1c1c1c] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a] space-y-6">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d7ff3f]">
                  ORDER SUMMARY
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Bespoke Garment
                </h3>
              </div>

              {/* Garment Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Garment Type:</span>
                  <span className="font-bold text-white">{selectedCategory.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Line & Gender:</span>
                  <span className="font-bold text-white">{selectedGender}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Fit:</span>
                  <span className="font-bold text-white">{selectedFit}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Collar / Neck:</span>
                  <span className="font-bold text-white">{selectedNeckline}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Sleeve:</span>
                  <span className="font-bold text-white">{selectedSleeve}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Color Shade:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: selectedColor.hex }} />
                    {selectedColor.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Size:</span>
                  <span className="font-black text-[#d7ff3f] text-sm">{selectedSize}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#282828]">
                  <span className="text-stone-400">Design Title:</span>
                  <span className="font-bold text-white truncate max-w-[180px]">
                    {selectedArtwork ? selectedArtwork.title : 'Custom Graphic'}
                  </span>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Base Garment ({selectedCategory.fabric.split(' ')[0]} {selectedCategory.fabric.split(' ')[1]}):</span>
                  <span className="text-white font-bold">₹{selectedCategory.basePrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Precision HD Silkscreen Print:</span>
                  <span className="text-white font-bold">₹{selectedCategory.printPrice}</span>
                </div>
                <div className="pt-2 border-t border-[#2a2a2a] flex items-center justify-between text-sm">
                  <span className="font-black text-white">Total Custom Price:</span>
                  <span className="font-black text-xl text-[#d7ff3f]">₹{totalPrice}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-2xl bg-[#d7ff3f] hover:bg-[#cbf42f] text-[#111111] text-sm font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-[#d7ff3f]/10"
                >
                  <ShoppingBag className="w-4 h-4 text-[#111111]" />
                  <span>Add Custom Product to Cart (₹{totalPrice})</span>
                </button>

                <button
                  onClick={handleSaveCurrentDesign}
                  className="w-full py-3 rounded-2xl bg-[#262626] hover:bg-[#333333] text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#333333]"
                >
                  <Bookmark className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Save Design to My Library</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
                <button
                  onClick={() => setCurrentStep('placement')}
                  className="hover:text-white cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Adjust Placement
                </button>
                <button
                  onClick={() => setCurrentStep('category')}
                  className="hover:text-white cursor-pointer"
                >
                  Design Another Garment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* CUSTOMER DESIGN LIBRARY MODAL / DRAWER                               */}
      {/* ==================================================================== */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2e2e2e] rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#282828] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#d7ff3f]">
                  OBRYNT VAULT
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  My Saved Custom Designs ({savedLibrary.length})
                </h3>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-2 rounded-full bg-[#222222] text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {savedLibrary.length === 0 ? (
                <div className="text-center py-16">
                  <Bookmark className="w-10 h-10 text-stone-600 mx-auto mb-3" />
                  <p className="text-base font-bold text-stone-300">
                    No custom designs saved yet.
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Design a garment with AI and click "Save Design" to store it in your personal vault.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedLibrary.map((design) => (
                    <div
                      key={design.id}
                      className="bg-[#222222] rounded-2xl border border-[#2e2e2e] p-4 flex flex-col justify-between"
                    >
                      <div>
                        {/* Artwork Preview Thumbnail */}
                        <div className="w-full aspect-square bg-[#141414] rounded-xl p-3 flex items-center justify-center mb-3 relative overflow-hidden">
                          {design.artworkUrl ? (
                            <img
                              src={design.artworkUrl}
                              alt={design.text || 'Saved design'}
                              className="w-full h-full object-contain filter drop-shadow-md"
                            />
                          ) : (
                            <span className="text-xs font-bold text-stone-500">No Image Preview</span>
                          )}

                          <div
                            className="absolute bottom-2 right-2 w-4 h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: design.colorHex }}
                            title={design.colorName}
                          />
                        </div>

                        <h5 className="text-sm font-black text-white truncate">
                          {design.text || 'Custom Garment'}
                        </h5>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {design.category || 'T-shirt'} · {design.size} ({design.colorName})
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#2e2e2e] flex items-center gap-2">
                        <button
                          onClick={() => handleLoadSavedDesign(design)}
                          className="flex-1 py-1.5 rounded-xl bg-[#d7ff3f] text-[#111111] text-xs font-black hover:bg-[#cbf42f] transition-colors cursor-pointer"
                        >
                          Load & Edit
                        </button>
                        {design.artworkUrl && (
                          <button
                            onClick={() => downloadArtworkAsPng(design.artworkUrl!, `obrynt-saved-${design.id}`)}
                            className="p-1.5 rounded-xl bg-[#2e2e2e] hover:bg-[#383838] text-stone-300 hover:text-white cursor-pointer"
                            title="Download PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (design.id) {
                              const updated = deleteCustomerDesign(design.id);
                              setSavedLibrary(updated);
                              onShowNotice('Design removed from library.');
                            }
                          }}
                          className="p-1.5 rounded-xl bg-[#2e2e2e] hover:bg-red-950 text-stone-400 hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
