import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  CartItem,
  FilterState,
  OrderDetails,
  TransactionRecord,
  CustomDesign,
  StoreSettings,
  PromoCode,
  ALL_CATEGORIES,
} from './types';
import { loadProductsCatalogue, DEFAULT_PRODUCTS } from './services/csvService';
import { loadUnifiedProductCatalogue } from './services/productService';
import {
  getStoredOrders,
  saveOrderToStorage,
  getStoredTransactions,
  getStoredSavedDesigns,
  saveDesignToStorage,
  deleteSavedDesign,
} from './services/orderService';
import {
  getStoredStoreSettings,
  saveStoreSettings,
  getStoredPromoCodes,
  savePromoCodes,
  updateOrderStatusInStorage,
} from './services/storeSettingsService';
import {
  isUserAuthorizedOwner,
  terminateActiveSession,
  createSessionFromSupabaseUser,
  AuthSession,
} from './services/authService';
import {
  checkIsAdminOrOwnerSession,
  signOutSupabaseAuth,
  onSupabaseAuthStateChange,
} from './services/supabaseClient';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { TrustBadges } from './components/TrustBadges';
import { CategoryGrid } from './components/CategoryGrid';
import { CustomDesignStudio } from './components/CustomDesignStudio';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AccountModal } from './components/AccountModal';
import { AccountSection } from './components/AccountSection';
import { OwnerDashboard } from './components/OwnerDashboard';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { StaffDashboard } from './components/StaffDashboard';
import { StaffLoginModal } from './components/StaffLoginModal';
import {
  isStaffAuthenticated,
  clearStaffSession,
  StaffSession,
} from './services/staffAuthService';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { DeliveryLoginModal } from './components/DeliveryLoginModal';
import {
  getDeliverySession,
  clearDeliverySession,
  isDeliveryAuthenticated,
  authenticateDeliveryLogin,
} from './services/deliveryService';
import { DeliveryCompany, DeliverySession } from './types';
import { CompanyDashboard } from './components/CompanyDashboard';
import { CompanyStaffLoginModal } from './components/CompanyStaffLoginModal';
import {
  getCompanyStaffSession,
  clearCompanyStaffSession,
} from './services/companyService';
import { FactoryDashboard } from './components/FactoryDashboard';
import { FactoryPortalModal } from './components/FactoryPortalModal';
import {
  getFactorySession,
  clearFactorySession,
} from './services/factoryService';
import { CompanyAccount, CompanyStaffSession, FactoryPartner, FactorySession } from './types';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { ObryntWatermark, ObryntBrandMaterialsModal } from './components/ObryntBrand';
import { ArrowUpDown, ShieldCheck, Sparkles, SlidersHorizontal, Check, LogOut } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Store Settings & Promo Codes (Managed by Owner)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoredStoreSettings());
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => getStoredPromoCodes());

  // Owner Authentication & Access State (Cryptographically Verified Session)
  // Public customers will have isOwnerAuthenticated = false by default
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    return isUserAuthorizedOwner();
  });
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState<boolean>(false);
  const [isOwnerLoginOpen, setIsOwnerLoginOpen] = useState<boolean>(false);

  // Staff Authentication & Operations Station State
  const [isStaffAuth, setIsStaffAuth] = useState<boolean>(() => isStaffAuthenticated());
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState<boolean>(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState<boolean>(false);

  // Restricted Delivery Company Portal State
  const [deliverySession, setDeliverySession] = useState<DeliverySession | null>(() => getDeliverySession());
  const [isDeliveryPortalOpen, setIsDeliveryPortalOpen] = useState<boolean>(() => Boolean(getDeliverySession()));
  const [isDeliveryLoginOpen, setIsDeliveryLoginOpen] = useState<boolean>(false);
  const [defaultDeliveryEmail, setDefaultDeliveryEmail] = useState<string>('');
  const [defaultDeliveryCode, setDefaultDeliveryCode] = useState<string>('');

  // Company Staff Fulfillment Portal State (Zero-dropdown, password based)
  const [companyStaffSession, setCompanyStaffSession] = useState<CompanyStaffSession | null>(() =>
    getCompanyStaffSession()
  );
  const [isCompanyDashboardOpen, setIsCompanyDashboardOpen] = useState<boolean>(() =>
    Boolean(getCompanyStaffSession())
  );
  const [isCompanyLoginOpen, setIsCompanyLoginOpen] = useState<boolean>(false);

  // Factory Partner Sourcing Portal State
  const [factorySession, setFactorySession] = useState<FactorySession | null>(() => getFactorySession());
  const [isFactoryDashboardOpen, setIsFactoryDashboardOpen] = useState<boolean>(() =>
    Boolean(getFactorySession())
  );
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState<boolean>(false);
  const [factoryModalToken, setFactoryModalToken] = useState<string>('');

  // Filter State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeAudience, setActiveAudience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Shopping Bag
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('obrynt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('obrynt_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders, Transactions, Saved Designs
  const [orders, setOrders] = useState<OrderDetails[]>(() => getStoredOrders());
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => getStoredTransactions());
  const [savedDesigns, setSavedDesigns] = useState<CustomDesign[]>(() => getStoredSavedDesigns());

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [accountTab, setAccountTab] = useState<'orders' | 'transactions' | 'wishlist' | 'designs'>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBrandMaterialsOpen, setIsBrandMaterialsOpen] = useState<boolean>(false);

  // Load products on mount (Supabase + local cache + defaults)
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const res = await loadUnifiedProductCatalogue();
        setProducts(res.products);
      } catch (err) {
        console.error('Failed to load catalogue, falling back to defaults:', err);
        const res = await loadProductsCatalogue();
        setProducts(res.products);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Sync Cart
  useEffect(() => {
    localStorage.setItem('obrynt_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Wishlist
  useEffect(() => {
    localStorage.setItem('obrynt_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Toast Helper
  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Dedicated /admin (Owner) & /staff (Staff Operations) Route & Access Controls
  // 1. Direct path navigation to /admin, #admin, /staff, #staff
  // 2. Secret URL parameters or keyboard shortcuts:
  //    Ctrl + Shift + O => Owner Control Center
  //    Ctrl + Shift + S => Staff Operations Station
  useEffect(() => {
    let isMounted = true;

    const verifyRoutes = async () => {
      try {
        const pathname = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;

        const isAdminRequested =
          pathname === '/admin' ||
          pathname.startsWith('/admin') ||
          search.includes('owner=true') ||
          hash === '#owner' ||
          hash === '#admin';

        const isStaffRequested =
          pathname === '/staff' ||
          pathname.startsWith('/staff') ||
          search.includes('staff=true') ||
          hash === '#staff';

        // 1. Check Owner/Admin Route
        if (isAdminRequested) {
          const supabaseCheck = await checkIsAdminOrOwnerSession();
          if (supabaseCheck.isAuthorized && supabaseCheck.user && supabaseCheck.profile) {
            if (isMounted) {
              setIsOwnerAuthenticated(true);
              await createSessionFromSupabaseUser(
                supabaseCheck.user.id,
                supabaseCheck.user.email || '',
                supabaseCheck.profile.role
              );
              setIsOwnerDashboardOpen(true);
            }
          } else if (isUserAuthorizedOwner()) {
            if (isMounted) {
              setIsOwnerAuthenticated(true);
              setIsOwnerDashboardOpen(true);
            }
          } else {
            if (isMounted) {
              setIsOwnerAuthenticated(false);
              setIsOwnerDashboardOpen(false);
              setIsOwnerLoginOpen(true);
            }
          }
        }

        // 2. Check Company Staff Route
        if (isStaffRequested) {
          const curCompanySession = getCompanyStaffSession();
          if (curCompanySession) {
            if (isMounted) {
              setCompanyStaffSession(curCompanySession);
              setIsCompanyDashboardOpen(true);
            }
          } else if (isStaffAuthenticated()) {
            if (isMounted) {
              setIsStaffAuth(true);
              setIsStaffDashboardOpen(true);
            }
          } else {
            if (isMounted) {
              setIsCompanyLoginOpen(true);
            }
          }
        }

        // 3. Check Delivery Company Route
        const isDeliveryRequested =
          pathname === '/delivery' ||
          pathname.startsWith('/delivery') ||
          search.includes('delivery=true') ||
          hash === '#delivery';

        if (isDeliveryRequested) {
          const curSession = getDeliverySession();
          if (curSession) {
            if (isMounted) {
              setDeliverySession(curSession);
              setIsDeliveryPortalOpen(true);
            }
          } else {
            if (isMounted) {
              setIsDeliveryLoginOpen(true);
            }
          }
        }

        // 4. Check Factory Partner Portal Route
        const isFactoryRequested =
          pathname === '/factory' ||
          pathname.startsWith('/factory') ||
          search.includes('factory_portal=true') ||
          search.includes('token=FAC-') ||
          hash === '#factory';

        if (isFactoryRequested) {
          const urlParams = new URLSearchParams(search);
          const tokenParam = urlParams.get('token') || '';
          if (tokenParam && isMounted) {
            setFactoryModalToken(tokenParam);
          }
          const curFacSession = getFactorySession();
          if (curFacSession) {
            if (isMounted) {
              setFactorySession(curFacSession);
              setIsFactoryDashboardOpen(true);
            }
          } else {
            if (isMounted) {
              setIsFactoryModalOpen(true);
            }
          }
        }
      } catch (err) {
        console.error('Error verifying portal routes:', err);
      }
    };

    verifyRoutes();

    // Real-time Supabase Auth state listener for Owner
    const { unsubscribe } = onSupabaseAuthStateChange(async (event, session, profile) => {
      if (session?.user && profile && (profile.role === 'owner' || profile.role === 'admin')) {
        setIsOwnerAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsOwnerAuthenticated(false);
        setIsOwnerDashboardOpen(false);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + O: Owner Dashboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        if (isUserAuthorizedOwner()) {
          setIsOwnerDashboardOpen((prev) => !prev);
        } else {
          setIsOwnerLoginOpen(true);
        }
      }

      // Ctrl + Shift + S: Staff Dashboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isStaffAuthenticated()) {
          setIsStaffDashboardOpen((prev) => !prev);
        } else {
          setIsStaffLoginOpen(true);
        }
      }

      // Ctrl + Shift + D: Delivery Partner Portal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const curSession = getDeliverySession();
        if (curSession) {
          setIsDeliveryPortalOpen((prev) => !prev);
        } else {
          setIsDeliveryLoginOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOwnerLoginSuccess = (session: AuthSession) => {
    setIsOwnerAuthenticated(true);
    setIsOwnerDashboardOpen(true);
    showNotice(`Owner authenticated · Master session active (${session.role.toUpperCase()})`);
  };

  const handleLogoutOwner = async () => {
    try {
      await signOutSupabaseAuth();
    } catch {}
    terminateActiveSession();
    setIsOwnerAuthenticated(false);
    setIsOwnerDashboardOpen(false);
    try {
      if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Logged out of Owner Mode. Public customer view is now active.');
  };

  const handleTriggerOwnerAccess = () => {
    if (isOwnerAuthenticated) {
      setIsOwnerDashboardOpen(true);
    } else {
      setIsOwnerLoginOpen(true);
    }
  };

  // Staff Portal Handlers
  const handleStaffLoginSuccess = (session: StaffSession) => {
    setIsStaffAuth(true);
    setIsStaffDashboardOpen(true);
    showNotice('Staff member authenticated · Operations station active');
  };

  const handleLogoutStaff = () => {
    clearStaffSession();
    setIsStaffAuth(false);
    setIsStaffDashboardOpen(false);
    try {
      if (window.location.pathname.startsWith('/staff') || window.location.hash.includes('staff')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Logged out of Staff Portal.');
  };

  const handleTriggerStaffAccess = () => {
    if (companyStaffSession || getCompanyStaffSession()) {
      setIsCompanyDashboardOpen(true);
    } else {
      setIsCompanyLoginOpen(true);
    }
  };

  // Company Staff Fulfillment Handlers
  const handleCompanyLoginSuccess = (company: CompanyAccount, session: CompanyStaffSession) => {
    setCompanyStaffSession(session);
    setIsCompanyDashboardOpen(true);
    showNotice(`Staff authenticated · ${company.name} fulfillment console active`);
  };

  const handleLogoutCompanyStaff = () => {
    clearCompanyStaffSession();
    setCompanyStaffSession(null);
    setIsCompanyDashboardOpen(false);
    try {
      if (window.location.pathname.startsWith('/staff') || window.location.hash.includes('staff')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Logged out of Company Fulfillment Console.');
  };

  // Factory Partner Sourcing Handlers
  const handleFactoryLoginSuccess = (factory: FactoryPartner, session: FactorySession) => {
    setFactorySession(session);
    setIsFactoryDashboardOpen(true);
    showNotice(`Factory authenticated · ${factory.name} sourcing portal active`);
  };

  const handleLogoutFactory = () => {
    clearFactorySession();
    setFactorySession(null);
    setIsFactoryDashboardOpen(false);
    try {
      if (
        window.location.pathname.startsWith('/factory') ||
        window.location.search.includes('factory_portal')
      ) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Logged out of Factory Portal.');
  };

  const handleOpenCompanyPortal = (company: CompanyAccount) => {
    const previewSession: CompanyStaffSession = {
      companyId: company.id,
      companyName: company.name,
      role: 'company_staff',
      token: `PREVIEW-${company.id}`,
      expiresAt: Date.now() + 1000 * 60 * 60 * 4,
      authenticatedAt: new Date().toISOString(),
    };
    setCompanyStaffSession(previewSession);
    setIsCompanyDashboardOpen(true);
  };

  const handleLaunchFactoryPortal = (token: string) => {
    setFactoryModalToken(token);
    setIsFactoryModalOpen(true);
  };

  // Delivery Company Portal Handlers
  const handleDeliveryLoginSuccess = (session: DeliverySession) => {
    setDeliverySession(session);
    setIsDeliveryPortalOpen(true);
    showNotice(`Delivery Partner authenticated: ${session.companyName}`);
  };

  const handleLogoutDelivery = () => {
    clearDeliverySession();
    setDeliverySession(null);
    setIsDeliveryPortalOpen(false);
    try {
      if (window.location.pathname.startsWith('/delivery') || window.location.hash.includes('delivery')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Logged out of Delivery Portal.');
  };

  const handleTriggerDeliveryAccess = (company?: DeliveryCompany) => {
    if (company) {
      const auth = authenticateDeliveryLogin(company.authorizedEmail, company.accessCode);
      if (auth.success && auth.session) {
        setDeliverySession(auth.session);
        setIsDeliveryPortalOpen(true);
        showNotice(`Opening Restricted Dashboard for "${company.companyName}"`);
        return;
      } else {
        setDefaultDeliveryEmail(company.authorizedEmail);
        setDefaultDeliveryCode(company.accessCode);
      }
    }

    const cur = getDeliverySession();
    if (cur) {
      setDeliverySession(cur);
      setIsDeliveryPortalOpen(true);
    } else {
      setIsDeliveryLoginOpen(true);
    }
  };

  // Owner Operations
  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('obrynt_custom_products', JSON.stringify(newProducts));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    const updated = updateOrderStatusInStorage(orderId, status);
    setOrders(updated);
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    const saved = saveStoreSettings(newSettings);
    setStoreSettings(saved);
  };

  const handleUpdatePromoCodes = (newCodes: PromoCode[]) => {
    const saved = savePromoCodes(newCodes);
    setPromoCodes(saved);
  };

  // Add Product to Cart
  const handleAddToCart = (product: Product, size: string = 'L', quantity: number = 1) => {
    const itemKey = `${product.sku || product.id}-${size}`;
    setCart((prev) => {
      const exists = prev.find((item) => item.id === itemKey);
      if (exists) {
        return prev.map((item) =>
          item.id === itemKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          size,
          quantity,
        },
      ];
    });
    showNotice(`Added "${product.name}" to your bag.`);
  };

  // Add Custom Studio Garment to Cart
  const handleAddCustomToCart = (design: CustomDesign) => {
    const itemKey = `custom-${Date.now()}`;
    const garmentCategory = design.category || 'T-Shirt';
    const garmentPrice = design.totalPrice || 998;
    const customProduct: Product = {
      sku: `OB-CUST-${Date.now().toString(36).toUpperCase()}`,
      name: `Custom ${garmentCategory} — ${design.text || 'Bespoke Print'}`,
      category: 'Custom Design',
      cat: 'Custom Design',
      audience: (design.gender || 'Unisex') as any,
      aud: (design.gender || 'Unisex') as any,
      price: garmentPrice,
      originalPrice: garmentPrice + 300,
      sizes: [design.size],
      color: design.colorHex,
      colorName: design.colorName,
      type: (garmentCategory.toLowerCase().includes('pant') ? 'pants' : garmentCategory.toLowerCase().includes('hoodie') ? 'hoodie' : 'shirt') as any,
      tag: 'BESPOKE AI PRINT',
      badge: 'CUSTOM',
      description: `Bespoke ${garmentCategory} (${design.fit || 'Regular fit'}, ${design.sleeve || 'Half sleeve'}, ${design.neckline || 'Round neck'}): "${design.text || 'Custom Artwork'}" on ${design.colorName} combed fabric.`,
      stock: 999,
      imageUrl: design.artworkUrl || './images/product_tshirt_minimal_1793012315796.jpg',
    };

    setCart((prev) => [
      ...prev,
      {
        id: itemKey,
        product: customProduct,
        size: design.size,
        quantity: 1,
        customDesign: design,
      },
    ]);
  };

  // Save Custom Design
  const handleSaveDesign = (design: CustomDesign) => {
    const updated = saveDesignToStorage(design);
    setSavedDesigns(updated);
  };

  // Delete Saved Design
  const handleDeleteSavedDesign = (id: string) => {
    const updated = deleteSavedDesign(id);
    setSavedDesigns(updated);
    showNotice('Design removed.');
  };

  // Update Cart Item Quantity
  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showNotice('Item removed from bag.');
  };

  // Wishlist Toggle
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.sku === product.sku || (p.id && p.id === product.id));
      if (exists) {
        showNotice(`Removed "${product.name}" from wishlist.`);
        return prev.filter((p) => p.sku !== product.sku && (!p.id || p.id !== product.id));
      } else {
        showNotice(`Saved "${product.name}" to wishlist.`);
        return [...prev, product];
      }
    });
  };

  // Open Account Modal
  const handleOpenAccount = (tab: 'orders' | 'transactions' | 'wishlist' | 'designs' = 'orders') => {
    setAccountTab(tab);
    setIsAccountOpen(true);
  };

  // Order Placed
  const handleOrderPlaced = (order: OrderDetails) => {
    const updatedOrders = saveOrderToStorage(order);
    setOrders(updatedOrders);
    setTransactions(getStoredTransactions());
  };

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Audience filter (Men, Women, Unisex, Beauty)
        const pAud = (p.audience || p.aud || '').toLowerCase();
        let matchesAudience = true;
        if (activeAudience !== 'All') {
          const aLower = activeAudience.toLowerCase();
          matchesAudience = pAud === aLower || (aLower === 'men' && pAud === 'unisex') || (aLower === 'women' && pAud === 'unisex');
        }

        // Category matching
        const pCat = (p.category || p.cat || '').toLowerCase();
        const activeLower = activeCategory.toLowerCase();
        let matchesCat = activeCategory === 'All';

        if (!matchesCat) {
          if (activeCategory === 'Men') {
            matchesCat = pAud === 'men' || pAud === 'unisex' || pCat === 'men';
          } else if (activeCategory === 'Women') {
            matchesCat = pAud === 'women' || pAud === 'unisex' || pCat === 'women';
          } else {
            matchesCat = pCat === activeLower || p.category === activeCategory || p.cat === activeCategory;
          }
        }

        // Search matching
        const searchTerms = searchQuery.trim().toLowerCase();
        let matchesSearch = true;
        if (searchTerms) {
          const haystack = `${p.name} ${p.category} ${p.cat || ''} ${p.audience || ''} ${p.description || ''} ${p.colorName || ''}`.toLowerCase();
          matchesSearch = haystack.includes(searchTerms);
        }

        return matchesAudience && matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
        return 0; // featured order
      });
  }, [products, activeCategory, activeAudience, searchQuery, sortBy]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const scrollToStudio = () => {
    setActiveCategory('Custom Design');
    setTimeout(() => {
      const el = document.getElementById('design');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const scrollToShop = () => {
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const filterTabNames = [
    'All',
    'Men',
    'Women',
    'T-Shirts',
    'Gym & Sports',
    'Innerwear',
    'Footwear',
    'Bags & Accessories',
    'Beauty & Makeup',
    'Custom Design',
  ];

  const audienceOptions = ['All', 'Men', 'Women', 'Unisex', 'Beauty'];

  // If the Owner Dashboard is active, show the full Owner Control Center
  if (isOwnerDashboardOpen) {
    return (
      <OwnerDashboard
        products={products}
        orders={orders}
        transactions={transactions}
        savedDesigns={savedDesigns}
        storeSettings={storeSettings}
        promoCodes={promoCodes}
        onUpdateProducts={handleUpdateProducts}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateSettings={handleUpdateSettings}
        onUpdatePromoCodes={handleUpdatePromoCodes}
        onCloseDashboard={() => setIsOwnerDashboardOpen(false)}
        onLogoutOwner={handleLogoutOwner}
        onShowNotice={showNotice}
        onOpenDeliveryPortal={handleTriggerDeliveryAccess}
        onOpenCompanyPortal={handleOpenCompanyPortal}
        onOpenFactoryPortal={handleLaunchFactoryPortal}
      />
    );
  }

  // If Company Staff Dashboard is active, show the isolated Company Fulfillment Console
  if (isCompanyDashboardOpen && companyStaffSession) {
    return (
      <CompanyDashboard
        session={companyStaffSession}
        onLogout={handleLogoutCompanyStaff}
        onShowNotice={showNotice}
      />
    );
  }

  // If Factory Partner Dashboard is active, show the Factory Sourcing Portal
  if (isFactoryDashboardOpen && factorySession) {
    return (
      <FactoryDashboard
        session={factorySession}
        onLogout={handleLogoutFactory}
        onShowNotice={showNotice}
      />
    );
  }

  // If the Staff Dashboard is active, show the Staff Operations Portal
  if (isStaffDashboardOpen) {
    return (
      <StaffDashboard
        products={products}
        orders={orders}
        onUpdateProducts={handleUpdateProducts}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onCloseStaffDashboard={() => setIsStaffDashboardOpen(false)}
        onLogoutStaff={handleLogoutStaff}
        onShowNotice={showNotice}
      />
    );
  }

  // If the Delivery Partner Dashboard is active, show the Restricted Courier Dashboard
  if (isDeliveryPortalOpen && deliverySession) {
    return (
      <DeliveryDashboard
        session={deliverySession}
        onLogout={handleLogoutDelivery}
        onShowNotice={showNotice}
        onBackToStorefront={() => setIsDeliveryPortalOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#111111] flex flex-col font-sans relative selection:bg-[#111111] selection:text-[#d7ff3f]">
      {/* Subtle OBRYNT Background Watermark */}
      <ObryntWatermark />

      {/* Top Navbar */}
      <Navbar
        cartCount={cart.reduce((s, x) => s + x.quantity, 0)}
        wishlistCount={wishlist.length}
        ordersCount={orders.length}
        activeCategory={activeCategory}
        announcementText={storeSettings.announcementText}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => handleOpenAccount('wishlist')}
        onOpenAccount={handleOpenAccount}
        onOpenOwnerDashboard={handleTriggerOwnerAccess}
        onScrollToStudio={scrollToStudio}
      />

      {/* Floating Owner Quick Bar - ONLY visible to the verified store owner */}
      {isOwnerAuthenticated && (
        <aside aria-label="Owner Quick Bar" className="bg-[#141414] text-white px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d7ff3f] animate-pulse" />
              <span className="font-bold text-stone-300">
                Logged in as <strong className="text-white">Store Owner</strong> ({storeSettings.contactEmail})
              </span>
              <span className="text-stone-500 hidden sm:inline">·</span>
              <span className="text-stone-400 hidden sm:inline">
                Live GMV: <strong className="text-[#d7ff3f]">₹{orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}</strong> ({orders.length} orders)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOwnerDashboardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-xs uppercase tracking-wider text-[11px]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Open Dashboard</span>
              </button>
              <button
                onClick={handleLogoutOwner}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-full text-[11px] font-bold transition-colors cursor-pointer"
                title="Lock Owner Mode and return to clean public shopper view"
              >
                <LogOut className="w-3 h-3" />
                <span>Lock</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Container */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        {/* Hero Section */}
        <HeroBanner
          onExploreClick={scrollToShop}
          onCustomStudioClick={scrollToStudio}
          onOpenBrandAssets={() => setIsBrandMaterialsOpen(true)}
        />

        {/* Professional Trust Guarantees */}
        <TrustBadges />

        {/* Categories Grid (Shop your way) */}
        <CategoryGrid
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onOpenCustomStudio={scrollToStudio}
        />

        {/* Collection Section */}
        <section id="shop" className="my-10 sm:my-14 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#e4e1da]">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7a8e12] mb-1">
                The collection
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-[-0.04em] text-[#111111]">
                Find your next favourite
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {filteredProducts.length} featured products · Verified authentic · Free delivery over ₹{storeSettings.freeDeliveryThreshold}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-end flex-wrap">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e4e1da] rounded-full px-3 py-1.5 text-xs font-bold shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-0 outline-hidden text-xs font-bold text-[#111111] cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {(activeCategory !== 'All' || activeAudience !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setActiveAudience('All');
                    setSearchQuery('');
                  }}
                  className="text-xs font-black text-[#111111] underline underline-offset-4 hover:text-stone-600 cursor-pointer ml-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Gender / Audience Curated Strip */}
          <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-black uppercase text-stone-400 tracking-wider shrink-0 mr-1">
              Curate By:
            </span>
            {audienceOptions.map((aud) => (
              <button
                key={aud}
                onClick={() => setActiveAudience(aud)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  activeAudience === aud
                    ? 'bg-[#111111] text-[#d7ff3f]'
                    : 'bg-white/80 hover:bg-white text-stone-600 border border-[#e4e1da]'
                }`}
              >
                {aud === 'All' ? 'All Genders & Lines' : aud}
              </button>
            ))}
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            {filterTabNames.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (cat === 'Custom Design') {
                      setActiveCategory('Custom Design');
                      scrollToStudio();
                    } else {
                      setActiveCategory(cat);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                    isActive
                      ? 'bg-[#111111] text-white border border-[#111111]'
                      : 'bg-white hover:bg-stone-100 text-[#111111] border border-[#e4e1da]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#e4e1da] p-8 my-6">
              <p className="text-base font-bold text-stone-700">
                No products match that filter or search yet.
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Try clearing your search query or selecting another category from the bar above.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setActiveAudience('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-5 py-2.5 bg-[#111111] text-[#d7ff3f] text-xs font-black rounded-full cursor-pointer uppercase tracking-wider"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 my-6">
              {filteredProducts.map((product) => {
                const isWish = wishlist.some(
                  (p) => p.sku === product.sku || (p.id && p.id === product.id)
                );
                return (
                  <ProductCard
                    key={product.sku || product.id}
                    product={product}
                    onOpenDetail={setSelectedProduct}
                    onAddToCart={(p, s) => handleAddToCart(p, s, 1)}
                    isWishlisted={isWish}
                    onToggleWishlist={handleToggleWishlist}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* OBRYNT Custom Design Studio */}
        <CustomDesignStudio
          onAddCustomToCart={handleAddCustomToCart}
          onSaveDesign={handleSaveDesign}
          onShowNotice={showNotice}
        />

        {/* Account Section (Everything in one account) */}
        <AccountSection
          ordersCount={orders.length}
          transactionsCount={transactions.length}
          wishlistCount={wishlist.length}
          savedDesignsCount={savedDesigns.length}
          onOpenModal={handleOpenAccount}
        />

        {/* Newsletter Section */}
        <Newsletter onShowNotice={showNotice} />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={setActiveCategory}
        onOpenAccount={handleOpenAccount}
        onScrollToStudio={scrollToStudio}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onOpenOwnerDashboard={handleTriggerOwnerAccess}
        isStaffAuthenticated={Boolean(companyStaffSession)}
        onOpenStaffLogin={handleTriggerStaffAccess}
        isDeliveryAuth={Boolean(deliverySession)}
        onOpenDeliveryLogin={() => handleTriggerDeliveryAccess()}
        onOpenBrandAssets={() => setIsBrandMaterialsOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111111] text-white px-5 py-3 rounded-full text-xs font-extrabold shadow-2xl z-50 flex items-center gap-2 border border-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#d7ff3f]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Drawers and Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onExploreShop={scrollToShop}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={cartTotal}
        discount={0}
        deliveryFee={cartTotal >= storeSettings.freeDeliveryThreshold ? 0 : cart.length > 0 ? storeSettings.standardDeliveryFee : 0}
        grandTotal={cartTotal >= storeSettings.freeDeliveryThreshold ? cartTotal : cartTotal + (cart.length > 0 ? storeSettings.standardDeliveryFee : 0)}
        onOrderPlaced={handleOrderPlaced}
        onClearCart={() => setCart([])}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        initialTab={accountTab}
        orders={orders}
        transactions={transactions}
        wishlist={wishlist}
        savedDesigns={savedDesigns}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={(p, s) => handleAddToCart(p, s || 'L', 1)}
        onAddCustomToCart={(d) => {
          handleAddCustomToCart(d);
          setIsAccountOpen(false);
          setIsCartOpen(true);
        }}
        onDeleteSavedDesign={handleDeleteSavedDesign}
        onOpenOwnerLogin={() => setIsOwnerLoginOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, s, q) => handleAddToCart(p, s, q)}
        isWishlisted={
          selectedProduct
            ? wishlist.some(
                (p) => p.sku === selectedProduct.sku || (p.id && p.id === selectedProduct.id)
              )
            : false
        }
        onToggleWishlist={handleToggleWishlist}
        onOpenCustomStudio={scrollToStudio}
      />

      {/* Cryptographically Verified Owner Security Gateway */}
      <OwnerLoginModal
        isOpen={isOwnerLoginOpen}
        onClose={() => setIsOwnerLoginOpen(false)}
        onSuccess={handleOwnerLoginSuccess}
        onShowNotice={showNotice}
      />

      {/* Server-Side Validated Staff Operations Gateway */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={handleStaffLoginSuccess}
        onShowNotice={showNotice}
      />

      {/* Zero-Dropdown Company Staff Fulfillment Login Gateway */}
      <CompanyStaffLoginModal
        isOpen={isCompanyLoginOpen}
        onClose={() => setIsCompanyLoginOpen(false)}
        onSuccess={handleCompanyLoginSuccess}
        onShowNotice={showNotice}
      />

      {/* Factory Partner Sourcing Portal Modal */}
      <FactoryPortalModal
        isOpen={isFactoryModalOpen}
        initialToken={factoryModalToken}
        onClose={() => setIsFactoryModalOpen(false)}
        onSuccess={handleFactoryLoginSuccess}
        onShowNotice={showNotice}
      />

      {/* Restricted Delivery Company Login Gateway */}
      <DeliveryLoginModal
        isOpen={isDeliveryLoginOpen}
        onClose={() => setIsDeliveryLoginOpen(false)}
        onLoginSuccess={handleDeliveryLoginSuccess}
        onShowNotice={showNotice}
        defaultEmail={defaultDeliveryEmail}
        defaultAccessCode={defaultDeliveryCode}
      />

      {/* Official OBRYNT Brand Identity & Packaging Asset Kit Modal */}
      <ObryntBrandMaterialsModal
        isOpen={isBrandMaterialsOpen}
        onClose={() => setIsBrandMaterialsOpen(false)}
        onShowNotice={showNotice}
      />
    </div>
  );
}
