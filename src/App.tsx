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
import {
  FactoryPartner,
  FactorySession,
  CompanyAccount,
  CompanyStaffSession,
  VendorAuthSession,
  ShopStaffCategory,
  ShopStaffSession,
} from './types';
import { DukaniDashboard } from './components/DukaniDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { ExistingSupplierDashboard } from './components/ExistingSupplierDashboard';
import { RoadsideStoreDashboard } from './components/RoadsideStoreDashboard';
import { VendorLoginModal } from './components/VendorLoginModal';
import { PartnerOnboardingModal } from './components/PartnerOnboardingModal';
import { PrivateShopStaffLoginModal } from './components/PrivateShopStaffLoginModal';
import { ShopStaffDashboard } from './components/ShopStaffDashboard';
import {
  getVendorSession,
  clearVendorSession,
  getShopStaffSession,
  clearShopStaffSession,
  distributeOrderToVendors,
} from './services/vendorService';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { ObryntWatermark, ObryntBrandMaterialsModal } from './components/ObryntBrand';
import { ObryntIntro3D, INTRO_SESSION_STORAGE_KEY } from './components/intro/ObryntIntro3D';
import { ArrowUpDown, ShieldCheck, Sparkles, SlidersHorizontal, Check, LogOut } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Store Settings & Promo Codes (Managed by Owner)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoredStoreSettings());
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => getStoredPromoCodes());

  // 3D Opening Intro (plays once per browsing session on public storefront)
  const [showIntroAnimation, setShowIntroAnimation] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      const isSpecialPortal =
        path.startsWith('/admin') ||
        path.startsWith('/staff') ||
        path.startsWith('/vendor') ||
        path.startsWith('/dukani') ||
        path.startsWith('/seller') ||
        path.startsWith('/partner') ||
        search.includes('owner=') ||
        search.includes('staff=') ||
        search.includes('delivery=') ||
        search.includes('factory=') ||
        search.includes('vendor=') ||
        search.includes('token=obreg_') ||
        hash === '#admin' ||
        hash === '#owner' ||
        hash === '#staff' ||
        hash === '#vendor';
      if (isSpecialPortal) return false;
      return sessionStorage.getItem(INTRO_SESSION_STORAGE_KEY) !== '1';
    } catch {
      return false;
    }
  });

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

  // Dukani, Existing Supplier, Garment Shop, Roadside Store & Seller Portal State
  const [vendorSession, setVendorSession] = useState<VendorAuthSession | null>(() => getVendorSession());
  const [isVendorDashboardOpen, setIsVendorDashboardOpen] = useState<boolean>(() =>
    Boolean(getVendorSession())
  );
  const [isVendorLoginOpen, setIsVendorLoginOpen] = useState<boolean>(false);

  // Partner Onboarding Modal (/partner-register?token=...)
  const [isPartnerOnboardingOpen, setIsPartnerOnboardingOpen] = useState<boolean>(false);
  const [partnerOnboardingToken, setPartnerOnboardingToken] = useState<string>('');

  // Private Shop Staff Login & Dashboard (/staff/garment & /staff/roadside)
  const [shopStaffSession, setShopStaffSession] = useState<ShopStaffSession | null>(() =>
    getShopStaffSession()
  );
  const [isShopStaffDashboardOpen, setIsShopStaffDashboardOpen] = useState<boolean>(() =>
    Boolean(getShopStaffSession())
  );
  const [isShopStaffLoginOpen, setIsShopStaffLoginOpen] = useState<boolean>(false);
  const [shopStaffCategory, setShopStaffCategory] = useState<ShopStaffCategory>('GARMENT_SHOP');
  const [shopStaffAccessToken, setShopStaffAccessToken] = useState<string>('');

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

  const refreshUnifiedCatalog = async () => {
    try {
      const res = await loadUnifiedProductCatalogue();
      setProducts(res.products);
    } catch (err) {
      console.error('Failed to refresh unified catalogue:', err);
    }
  };

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

        // 2. Check Private Shop Staff (/staff/garment & /staff/roadside) OR Company Staff Route
        const isGarmentStaffPath = pathname.startsWith('/staff/garment');
        const isRoadsideStaffPath = pathname.startsWith('/staff/roadside');

        if (isGarmentStaffPath || isRoadsideStaffPath) {
          const urlParams = new URLSearchParams(search);
          const accessParam = urlParams.get('access') || '';
          const cat: ShopStaffCategory = isRoadsideStaffPath ? 'ROADSIDE_STORE' : 'GARMENT_SHOP';
          const curShopStaff = getShopStaffSession();
          if (curShopStaff && curShopStaff.staffCategory === cat && !accessParam) {
            if (isMounted) {
              setShopStaffSession(curShopStaff);
              setIsShopStaffDashboardOpen(true);
            }
          } else if (isMounted) {
            setShopStaffCategory(cat);
            setShopStaffAccessToken(accessParam);
            setIsShopStaffLoginOpen(true);
          }
        } else if (isStaffRequested) {
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

        // 5. Check Partner Registration Route (/partner-register?token=obreg_...)
        const isPartnerRegisterRequested =
          pathname === '/partner-register' ||
          pathname.startsWith('/partner-register') ||
          search.includes('token=obreg_');

        if (isPartnerRegisterRequested) {
          const urlParams = new URLSearchParams(search);
          const regToken = urlParams.get('token') || '';
          if (isMounted) {
            setPartnerOnboardingToken(regToken);
            setIsPartnerOnboardingOpen(true);
          }
        }

        // 6. Check Partner Portal Route (/vendor, /dukani, /seller, /partner)
        const isVendorRequested =
          !isPartnerRegisterRequested &&
          (pathname === '/vendor' ||
            pathname.startsWith('/vendor') ||
            pathname === '/dukani' ||
            pathname.startsWith('/dukani') ||
            pathname === '/seller' ||
            pathname.startsWith('/seller') ||
            pathname === '/partner' ||
            pathname.startsWith('/partner') ||
            search.includes('vendor=true') ||
            hash === '#vendor');

        if (isVendorRequested) {
          const curVendor = getVendorSession();
          if (curVendor) {
            if (isMounted) {
              setVendorSession(curVendor);
              setIsVendorDashboardOpen(true);
            }
          } else {
            if (isMounted) {
              setIsVendorLoginOpen(true);
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

  // Dukani / Seller Portal Handlers
  const handleVendorLoginSuccess = (session: VendorAuthSession) => {
    setVendorSession(session);
    setIsVendorDashboardOpen(true);
  };

  const handleLogoutVendor = () => {
    clearVendorSession();
    setVendorSession(null);
    setIsVendorDashboardOpen(false);
    try {
      const p = window.location.pathname;
      if (p.startsWith('/vendor') || p.startsWith('/dukani') || p.startsWith('/seller') || window.location.hash.includes('vendor')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Signed out of Partner Console.');
  };

  const handleTriggerVendorAccess = () => {
    const cur = getVendorSession();
    if (cur) {
      setVendorSession(cur);
      setIsVendorDashboardOpen(true);
    } else {
      setIsVendorLoginOpen(true);
    }
  };

  const handleOpenShopStaffGateway = (cat: ShopStaffCategory) => {
    const cur = getShopStaffSession();
    if (cur && cur.staffCategory === cat) {
      setShopStaffSession(cur);
      setIsShopStaffDashboardOpen(true);
      return;
    }
    setShopStaffCategory(cat);
    setShopStaffAccessToken('');
    setIsShopStaffLoginOpen(true);
  };

  const handleShopStaffLoginSuccess = (session: ShopStaffSession) => {
    setShopStaffSession(session);
    setIsShopStaffDashboardOpen(true);
  };

  const handleLogoutShopStaff = () => {
    clearShopStaffSession();
    setShopStaffSession(null);
    setIsShopStaffDashboardOpen(false);
    try {
      if (window.location.pathname.startsWith('/staff/garment') || window.location.pathname.startsWith('/staff/roadside')) {
        window.history.replaceState({}, '', '/');
      }
    } catch {}
    showNotice('Signed out of shop staff workstation.');
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
    // Split multi-vendor items into isolated Dukani / Seller suborders automatically
    distributeOrderToVendors(order).catch(() => {});
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
            matchesCat = pAud === 'men' || pAud === 'unisex' || pCat.includes('men');
          } else if (activeCategory === 'Women') {
            matchesCat = pAud === 'women' || pAud === 'unisex' || pCat.includes('women');
          } else if (activeCategory === 'Kids') {
            matchesCat = pAud === 'kids' || pAud === 'unisex' || pCat.includes('kid');
          } else if (activeCategory === 'Trending') {
            matchesCat = (p.rating && p.rating >= 4.8) || (p.tag && p.tag.toLowerCase().includes('trend')) || p.stock > 40;
          } else if (activeCategory === 'New Arrivals') {
            matchesCat = true;
          } else if (activeCategory === 'Footwear') {
            matchesCat = pCat.includes('footwear') || pCat.includes('shoe') || p.type === 'shoe';
          } else if (activeCategory === 'Bags & Accessories') {
            matchesCat = pCat.includes('bag') || pCat.includes('accessor') || p.type === 'bag';
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

  // Curated Seasonal Slices for Homepage
  const newArrivalsProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const trendingProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5)).slice(0, 4);
  }, [products]);

  const bestSellersProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.reviewCount || 20) - (a.reviewCount || 20)).slice(4, 8);
  }, [products]);

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
    'Kids',
    'Trending',
    'New Arrivals',
    'T-Shirts',
    'Footwear',
    'Bags & Accessories',
    'Gym & Sports',
    'Innerwear',
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
        onRefreshCatalog={refreshUnifiedCatalog}
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

  // If Private Garment or Roadside Shop Staff session is active, show strictly isolated Shop Staff Console
  if (isShopStaffDashboardOpen && shopStaffSession) {
    return (
      <ShopStaffDashboard
        session={shopStaffSession}
        onLogout={handleLogoutShopStaff}
        onShowNotice={showNotice}
      />
    );
  }

  // If a Partner session is active, render their strictly isolated category dashboard
  if (isVendorDashboardOpen && vendorSession) {
    if (vendorSession.partnerCategory === 'EXISTING_SUPPLIER') {
      return (
        <ExistingSupplierDashboard
          session={vendorSession}
          onLogout={handleLogoutVendor}
          onBackToStorefront={() => setIsVendorDashboardOpen(false)}
          onShowNotice={showNotice}
        />
      );
    }
    if (vendorSession.partnerCategory === 'ROADSIDE_STORE') {
      return (
        <RoadsideStoreDashboard
          session={vendorSession}
          onLogout={handleLogoutVendor}
          onBackToStorefront={() => setIsVendorDashboardOpen(false)}
          onShowNotice={showNotice}
        />
      );
    }
    if (vendorSession.partnerCategory === 'GARMENT_SHOP' || vendorSession.accountType === 'SHOP_OWNER') {
      return (
        <DukaniDashboard
          session={vendorSession}
          onLogout={handleLogoutVendor}
          onBackToStorefront={() => setIsVendorDashboardOpen(false)}
          onShowNotice={showNotice}
        />
      );
    }
    return (
      <SellerDashboard
        session={vendorSession}
        onLogout={handleLogoutVendor}
        onBackToStorefront={() => setIsVendorDashboardOpen(false)}
        onShowNotice={showNotice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans relative selection:bg-black selection:text-white">
      {/* Cinematic 3D Website Opening Animation (First visit per browsing session) */}
      <ObryntIntro3D
        isOpen={showIntroAnimation}
        onComplete={() => setShowIntroAnimation(false)}
      />

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

      {/* Floating Owner Quick Bar - ONLY visible to verified store owner */}
      {isOwnerAuthenticated && (
        <aside aria-label="Owner Quick Bar" className="bg-black text-white px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-xs z-30">
          <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-medium text-neutral-300">
                Master Session: <strong className="text-white">Store Owner</strong> ({storeSettings.contactEmail})
              </span>
              <span className="text-neutral-600 hidden sm:inline">·</span>
              <span className="text-neutral-400 hidden sm:inline font-mono">
                GMV: <strong className="text-white">₹{orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}</strong> ({orders.length} orders)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOwnerDashboardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-[11px] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Owner Dashboard</span>
              </button>
              <button
                onClick={handleLogoutOwner}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer"
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
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex-1">
        {/* Editorial Fashion Hero */}
        <HeroBanner
          onExploreClick={scrollToShop}
          onCustomStudioClick={scrollToStudio}
          onOpenBrandAssets={() => setIsBrandMaterialsOpen(true)}
          onReplayIntro={() => setShowIntroAnimation(true)}
        />

        {/* Minimalist Trust Guarantees */}
        <TrustBadges />

        {/* Seasonal Fashion Collections: Women's, Men's, Kids', Accessories */}
        <CategoryGrid
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onOpenCustomStudio={scrollToStudio}
        />

        {/* HOMEPAGE EDITORIAL SECTIONS (Shown on default browsing mode) */}
        {activeCategory === 'All' && !searchQuery && (
          <div className="space-y-16 sm:space-y-24 my-12 sm:my-16">
            
            {/* 1. NEW ARRIVALS · RUNWAY COLLECTION */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-neutral-400 block mb-1">
                    AUTUMN / WINTER 2026 RUNWAY
                  </span>
                  <h2 className="font-luxury text-2xl sm:text-3xl font-bold tracking-[0.08em] text-black uppercase">
                    New Arrivals
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActiveCategory('New Arrivals');
                    scrollToShop();
                  }}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>Explore All New Arrivals</span>
                  <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {newArrivalsProducts.map((product) => {
                  const isWish = wishlist.some(
                    (p) => p.sku === product.sku || (p.id && p.id === product.id)
                  );
                  return (
                    <ProductCard
                      key={`new-${product.sku || product.id}`}
                      product={product}
                      onOpenDetail={setSelectedProduct}
                      onAddToCart={(p, s) => handleAddToCart(p, s, 1)}
                      isWishlisted={isWish}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  );
                })}
              </div>
            </section>

            {/* 2. TRENDING NOW · EDITORIAL SELECTS */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-neutral-400 block mb-1">
                    MOST COVETED BY STYLISTS
                  </span>
                  <h2 className="font-luxury text-2xl sm:text-3xl font-bold tracking-[0.08em] text-black uppercase">
                    Trending This Season
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActiveCategory('Trending');
                    scrollToShop();
                  }}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>View All Trending</span>
                  <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {trendingProducts.map((product) => {
                  const isWish = wishlist.some(
                    (p) => p.sku === product.sku || (p.id && p.id === product.id)
                  );
                  return (
                    <ProductCard
                      key={`trend-${product.sku || product.id}`}
                      product={product}
                      onOpenDetail={setSelectedProduct}
                      onAddToCart={(p, s) => handleAddToCart(p, s, 1)}
                      isWishlisted={isWish}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  );
                })}
              </div>
            </section>

            {/* 3. ELEGANT PROMOTIONAL SECTION: "THE ATELIER CAPSULE" */}
            <section className="bg-black text-white p-8 sm:p-12 lg:p-16 border border-neutral-900 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.28em] uppercase text-neutral-400 block">
                  CAPSULE EDITORIAL · BESPOKE EDITION
                </span>
                
                <h3 className="font-luxury text-2xl sm:text-4xl font-bold tracking-[0.12em] uppercase leading-tight text-white">
                  Monochrome Poetics: Pure Form & Function
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed max-w-lg">
                  Every OBRYNT silhouette is engineered with uncompromising garment integrity. Combed 280 GSM organic cotton, Italian Margom-style calfskin sneakers, and bespoke silkscreen customization.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={scrollToShop}
                    className="px-6 py-3.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer"
                  >
                    DISCOVER CAPSULE
                  </button>

                  <button
                    onClick={scrollToStudio}
                    className="px-6 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/40 font-bold text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
                    <span>CUSTOM PRINT STUDIO</span>
                  </button>
                </div>
              </div>

              <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden border border-neutral-800">
                <img
                  src="/images/editorial_accessories_footwear.jpg"
                  alt="OBRYNT Atelier Objects"
                  className="w-full h-full object-cover object-center brightness-[0.88] hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>

            {/* 4. BEST SELLERS · TIMELESS PIECES */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-neutral-400 block mb-1">
                    CLIENT ESSENTIALS
                  </span>
                  <h2 className="font-luxury text-2xl sm:text-3xl font-bold tracking-[0.08em] text-black uppercase">
                    Best Sellers
                  </h2>
                </div>
                <button
                  onClick={scrollToShop}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-black hover:underline underline-offset-4 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>View All Best Sellers</span>
                  <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {bestSellersProducts.map((product) => {
                  const isWish = wishlist.some(
                    (p) => p.sku === product.sku || (p.id && p.id === product.id)
                  );
                  return (
                    <ProductCard
                      key={`best-${product.sku || product.id}`}
                      product={product}
                      onOpenDetail={setSelectedProduct}
                      onAddToCart={(p, s) => handleAddToCart(p, s, 1)}
                      isWishlisted={isWish}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* COMPLETE CATALOGUE & CURATED BROWSE SECTION */}
        <section id="shop" className="my-14 sm:my-20 scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400 mb-1">
                {activeCategory === 'All' ? 'FULL CATALOGUE' : `COLLECTION / ${activeCategory.toUpperCase()}`}
              </div>
              <h2 className="font-luxury text-2xl sm:text-3xl font-bold tracking-[0.06em] text-black uppercase">
                {activeCategory === 'All' ? 'All Fashion Items' : activeCategory}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
                {filteredProducts.length} pieces available · Complimentary worldwide shipping over ₹{storeSettings.freeDeliveryThreshold}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-end flex-wrap">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-neutral-300 px-3 py-2 text-xs font-medium">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-0 outline-hidden text-xs font-semibold text-black cursor-pointer uppercase tracking-wider"
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
                  className="text-xs font-bold uppercase tracking-wider text-black underline underline-offset-4 hover:text-neutral-500 cursor-pointer ml-1"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Clean Segmented Category Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-neutral-100">
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
                  className={`px-3 py-1.5 text-xs uppercase tracking-[0.14em] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-black text-white font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 border border-neutral-200 p-8 my-6">
              <p className="font-luxury text-base font-bold text-black uppercase tracking-wider">
                No items match your criteria.
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto font-normal">
                Try selecting a different collection or clearing your search query.
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setActiveAudience('All');
                  setSearchQuery('');
                }}
                className="mt-6 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-[0.18em] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 my-6">
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

        {/* Account Section (Client Suite) */}
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
        isVendorAuth={Boolean(vendorSession)}
        onOpenVendorLogin={handleTriggerVendorAccess}
        onOpenPartnerOnboarding={() => {
          setPartnerOnboardingToken('');
          setIsPartnerOnboardingOpen(true);
        }}
        onOpenGarmentStaffLogin={() => handleOpenShopStaffGateway('GARMENT_SHOP')}
        onOpenRoadsideStaffLogin={() => handleOpenShopStaffGateway('ROADSIDE_STORE')}
        onOpenBrandAssets={() => setIsBrandMaterialsOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-3 text-xs font-semibold shadow-2xl z-50 flex items-center gap-2 border border-neutral-800 animate-in fade-in slide-in-from-bottom-2 duration-200 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
        deliveryFee={0}
        grandTotal={cartTotal}
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
        allProducts={products}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, s, q) => handleAddToCart(p, s, q)}
        onBuyNow={(p, s, q) => {
          handleAddToCart(p, s, q);
          setSelectedProduct(null);
          setIsCheckoutOpen(true);
        }}
        isWishlisted={
          selectedProduct
            ? wishlist.some(
                (p) => p.sku === selectedProduct.sku || (p.id && p.id === selectedProduct.id)
              )
            : false
        }
        onToggleWishlist={handleToggleWishlist}
        onOpenCustomStudio={scrollToStudio}
        onSelectProduct={setSelectedProduct}
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

      {/* Partner Login Modal */}
      <VendorLoginModal
        isOpen={isVendorLoginOpen}
        onClose={() => setIsVendorLoginOpen(false)}
        onSuccess={handleVendorLoginSuccess}
        onShowNotice={showNotice}
        onOpenPartnerOnboarding={() => {
          setPartnerOnboardingToken('');
          setIsPartnerOnboardingOpen(true);
        }}
        onOpenShopStaffLogin={(cat) => handleOpenShopStaffGateway(cat)}
      />

      {/* Three-Category Partner Onboarding (Option A / Option B) */}
      <PartnerOnboardingModal
        isOpen={isPartnerOnboardingOpen}
        initialToken={partnerOnboardingToken}
        onClose={() => setIsPartnerOnboardingOpen(false)}
        onOpenLogin={() => setIsVendorLoginOpen(true)}
        onShowNotice={showNotice}
      />

      {/* Private Garment & Roadside Store Staff Password-Only Gateway */}
      <PrivateShopStaffLoginModal
        isOpen={isShopStaffLoginOpen}
        staffCategory={shopStaffCategory}
        accessToken={shopStaffAccessToken}
        onClose={() => setIsShopStaffLoginOpen(false)}
        onSuccess={handleShopStaffLoginSuccess}
        onShowNotice={showNotice}
      />
    </div>
  );
}
