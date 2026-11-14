import React, { useEffect, useMemo, useState } from 'react';
import {
  Store,
  UserPlus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Ban,
  Power,
  KeyRound,
  Trash2,
  Edit3,
  Eye,
  Package,
  ShoppingBag,
  Percent,
  DollarSign,
  FileText,
  Copy,
  Check,
  AlertCircle,
  X,
  Clock,
  Bell,
  Link2,
  Globe,
  Info,
  Users,
  ExternalLink,
} from 'lucide-react';
import {
  CommissionMode,
  PartnerCategory,
  PartnerNotification,
  PartnerRegistrationLink,
  PartnerStaffAccount,
  PartnersAdminOverviewCounts,
  RegistrationOption,
  VendorAccountStatus,
  VendorAccountType,
  VendorActivityLog,
  VendorCommissionRule,
  VendorProduct,
  VendorProfile,
  VendorSettlement,
  VendorSubOrder,
} from '../../types';
import {
  adminApprovePartner,
  adminApproveVendorProduct,
  adminChangeStaffStatus,
  adminChangeVendorStatus,
  adminCreateRegistrationLink,
  adminCreateStaffAccount,
  adminCreateVendor,
  adminDeleteCommissionRule,
  adminDeleteStaffAccount,
  adminDeleteVendor,
  adminGetPartnersOverview,
  adminGetVendorOverview,
  adminListCommissions,
  adminListNotifications,
  adminListRegistrationLinks,
  adminListSettlements,
  adminListStaffAccounts,
  adminListVendorLogs,
  adminListVendorOrders,
  adminListVendorProducts,
  adminListVendors,
  adminMarkNotificationsRead,
  adminMarkSettlementPaid,
  adminRejectPartner,
  adminRejectVendorProduct,
  adminRequestMoreInfo,
  adminResetStaffPassword,
  adminResetVendorPassword,
  adminRevokeRegistrationLink,
  adminSaveCommissionRule,
  adminUpdateVendor,
  adminUpdateVendorProductStatus,
} from '../../services/vendorService';

interface VendorManagementTabProps {
  onShowNotice: (msg: string) => void;
  onRefreshStorefrontCatalog?: () => Promise<void> | void;
  onPendingApprovalCountChange?: (count: number) => void;
}

type SubTab =
  | 'pending'
  | 'suppliers'
  | 'garments'
  | 'roadside'
  | 'approved'
  | 'rejected'
  | 'staff'
  | 'logs'
  | 'approvals'
  | 'orders'
  | 'commissions';

export const VendorManagementTab: React.FC<VendorManagementTabProps> = ({
  onShowNotice,
  onRefreshStorefrontCatalog,
  onPendingApprovalCountChange,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('pending');
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [overview, setOverview] = useState<PartnersAdminOverviewCounts | null>(null);
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [regLinks, setRegLinks] = useState<PartnerRegistrationLink[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<PartnerStaffAccount[]>([]);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [vendorOrders, setVendorOrders] = useState<VendorSubOrder[]>([]);
  const [commissions, setCommissions] = useState<VendorCommissionRule[]>([]);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [logs, setLogs] = useState<VendorActivityLog[]>([]);

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Filters
  const [vendorSearch, setVendorSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('pending_approval');

  // Create Partner / Vendor Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    partnerCategory: 'GARMENT_SHOP' as PartnerCategory,
    registrationOption: 'OPTION_B_NEW_PARTNER' as RegistrationOption,
    existingWebsiteUrl: '',
    createAsPending: false,
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    gstNumber: '',
    shopAddress: '',
    city: '',
    state: '',
    pincode: '',
    openingHours: '10:00 AM - 9:00 PM',
    pickupAddress: '',
    commissionMode: 'percentage' as CommissionMode,
    commissionRate: 10,
    fixedCommission: 0,
    platformFeePct: 2,
    notes: '',
  });
  const [createdCredentials, setCreatedCredentials] = useState<{
    vendorCode: string;
    email: string;
    temporaryPassword: string;
    secureLoginLink?: string;
    title: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Registration Link Generator Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    partnerCategory: 'ANY' as PartnerCategory | 'ANY',
    registrationOption: 'BOTH' as RegistrationOption | 'BOTH',
    intendedBusinessName: '',
    expiresInHours: 72,
    maxUses: 1,
  });
  const [generatedRegLinkUrl, setGeneratedRegLinkUrl] = useState<string | null>(null);

  // Partner Reject & Request-Info Modals
  const [rejectPartnerTarget, setRejectPartnerTarget] = useState<VendorProfile | null>(null);
  const [partnerRejectReason, setPartnerRejectReason] = useState('');
  const [infoPartnerTarget, setInfoPartnerTarget] = useState<VendorProfile | null>(null);
  const [partnerInfoMessage, setPartnerInfoMessage] = useState('');
  const [approvedBannerData, setApprovedBannerData] = useState<{
    vendorCode: string;
    businessName: string;
    loginUrl: string;
  } | null>(null);

  // Edit Vendor Modal
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    partnerCategory: 'GARMENT_SHOP' as PartnerCategory,
    existingWebsiteUrl: '',
    gstNumber: '',
    pickupAddress: '',
    commissionMode: 'percentage' as CommissionMode,
    commissionRate: 10,
    fixedCommission: 0,
    platformFeePct: 2,
    notes: '',
  });

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<VendorProfile | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState('');

  // Staff Account Creation & Issued Access Popup
  const [staffForm, setStaffForm] = useState({
    vendorId: '',
    staffLabel: 'Counter Staff',
    password: '',
  });
  const [issuedStaffCreds, setIssuedStaffCreds] = useState<{
    staffCode: string;
    shopName: string;
    temporaryPassword: string;
    staffAccessUrl: string;
    title: string;
  } | null>(null);

  // 360 Vendor Detail Drawer
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    vendor: VendorProfile;
    products: VendorProduct[];
    orders: VendorSubOrder[];
    settlements: VendorSettlement[];
    logs: VendorActivityLog[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Product Reject & Approve Modals
  const [rejectProductTarget, setRejectProductTarget] = useState<VendorProduct | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [priceOverrideDrafts, setPriceOverrideDrafts] = useState<Record<string, string>>({});

  // Commission Form
  const [commissionForm, setCommissionForm] = useState({
    scope: 'vendor' as 'global' | 'vendor' | 'product',
    vendorId: '',
    vendorProductId: '',
    commissionMode: 'percentage' as CommissionMode,
    percentageRate: 10,
    fixedAmount: 0,
    platformFeePct: 2,
    notes: '',
  });

  // Manual Settlement Modal
  const [settleTarget, setSettleTarget] = useState<VendorSettlement | null>(null);
  const [settleRef, setSettleRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  const loadAllMarketplaceData = async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const [ov, notifs, links, stf, v, p, o, c, s, l] = await Promise.all([
        adminGetPartnersOverview(),
        adminListNotifications(),
        adminListRegistrationLinks(),
        adminListStaffAccounts(),
        adminListVendors(),
        adminListVendorProducts(),
        adminListVendorOrders(),
        adminListCommissions(),
        adminListSettlements(),
        adminListVendorLogs(),
      ]);
      setOverview(ov);
      setNotifications(notifs);
      setRegLinks(links);
      setStaffAccounts(stf);
      setVendors(v);
      setVendorProducts(p);
      setVendorOrders(o);
      setCommissions(c);
      setSettlements(s);
      setLogs(l);
      if (onPendingApprovalCountChange) {
        const pendingApps = ov?.pendingApplications ?? 0;
        const pendingProds = p.filter((x) => x.approvalStatus === 'pending_approval').length;
        onPendingApprovalCountChange(pendingApps + pendingProds);
      }
    } catch (err: any) {
      setErrorBanner(
        err?.message ||
          'Unable to load partner data. Please ensure you signed in with the Admin server password.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMarketplaceData();
  }, []);

  const metrics = useMemo(() => {
    const pendingApps = vendors.filter(
      (v) => v.applicationStatus === 'pending' || v.applicationStatus === 'more_info_requested'
    ).length;
    const approvedCount = vendors.filter((v) => v.applicationStatus === 'approved').length;
    const rejectedCount = vendors.filter((v) => v.applicationStatus === 'rejected').length;
    const suppliersCount = vendors.filter((v) => v.partnerCategory === 'EXISTING_SUPPLIER').length;
    const garmentsCount = vendors.filter((v) => v.partnerCategory === 'GARMENT_SHOP').length;
    const roadsideCount = vendors.filter((v) => v.partnerCategory === 'ROADSIDE_STORE').length;
    const pendingProducts = vendorProducts.filter((p) => p.approvalStatus === 'pending_approval').length;
    const totalSales = vendorOrders
      .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
      .reduce((s, o) => s + o.subtotalSellingPrice, 0);
    const totalCommission = vendorOrders
      .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
      .reduce((s, o) => s + o.obryntCommission, 0);
    const totalPayable = vendorOrders
      .filter((o) => o.status !== 'rejected' && o.status !== 'cancelled')
      .reduce((s, o) => s + o.vendorPayableAmount, 0);

    return {
      pendingApps,
      approvedCount,
      rejectedCount,
      suppliersCount,
      garmentsCount,
      roadsideCount,
      pendingProducts,
      totalSales,
      totalCommission,
      totalPayable,
      unreadNotifs: notifications.filter((n) => !n.isRead).length,
    };
  }, [vendors, vendorProducts, vendorOrders, notifications]);

  const approvedShopPartners = useMemo(
    () =>
      vendors.filter(
        (v) =>
          v.applicationStatus === 'approved' &&
          (v.partnerCategory === 'GARMENT_SHOP' || v.partnerCategory === 'ROADSIDE_STORE')
      ),
    [vendors]
  );

  const visiblePartnerList = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    return vendors.filter((v) => {
      if (subTab === 'pending') {
        if (v.applicationStatus !== 'pending' && v.applicationStatus !== 'more_info_requested') {
          return false;
        }
      } else if (subTab === 'suppliers') {
        if (v.partnerCategory !== 'EXISTING_SUPPLIER') return false;
      } else if (subTab === 'garments') {
        if (v.partnerCategory !== 'GARMENT_SHOP') return false;
      } else if (subTab === 'roadside') {
        if (v.partnerCategory !== 'ROADSIDE_STORE') return false;
      } else if (subTab === 'approved') {
        if (v.applicationStatus !== 'approved') return false;
      } else if (subTab === 'rejected') {
        if (v.applicationStatus !== 'rejected') return false;
      }

      if (!q) return true;
      return (
        v.vendorCode.toLowerCase().includes(q) ||
        v.fullName.toLowerCase().includes(q) ||
        v.businessName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        (v.existingWebsiteUrl || '').toLowerCase().includes(q)
      );
    });
  }, [vendors, subTab, vendorSearch]);

  const filteredProducts = useMemo(() => {
    if (productStatusFilter === 'ALL') return vendorProducts;
    return vendorProducts.filter((p) => p.approvalStatus === productStatusFilter);
  }, [vendorProducts, productStatusFilter]);

  const categoryBadge = (cat: PartnerCategory) => {
    if (cat === 'EXISTING_SUPPLIER') {
      return { label: 'Existing Supplier', cls: 'bg-sky-950 text-sky-300 border-sky-800' };
    }
    if (cat === 'ROADSIDE_STORE') {
      return { label: 'Roadside Store', cls: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    }
    return { label: 'Garment Shop', cls: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
  };

  const appStatusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    if (status === 'more_info_requested') return 'bg-sky-950 text-sky-300 border-sky-800';
    if (status === 'rejected') return 'bg-rose-950 text-rose-300 border-rose-800';
    return 'bg-amber-950 text-amber-300 border-amber-800';
  };

  const statusBadgeClass = (status: VendorAccountStatus) => {
    if (status === 'active') return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (status === 'inactive') return 'bg-stone-800 text-stone-300 border-stone-700';
    if (status === 'suspended') return 'bg-amber-950 text-amber-300 border-amber-800';
    return 'bg-rose-950 text-rose-300 border-rose-800';
  };

  const productStatusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (status === 'pending_approval') return 'bg-amber-950 text-amber-300 border-amber-800';
    if (status === 'rejected') return 'bg-rose-950 text-rose-300 border-rose-800';
    if (status === 'out_of_stock') return 'bg-orange-950 text-orange-300 border-orange-800';
    if (status === 'disabled') return 'bg-stone-900 text-stone-500 border-stone-700';
    return 'bg-stone-800 text-stone-300 border-stone-700';
  };

  // Handlers
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountType: VendorAccountType =
        createForm.partnerCategory === 'EXISTING_SUPPLIER' ? 'SELLER' : 'SHOP_OWNER';
      const res = await adminCreateVendor({
        ...createForm,
        accountType,
      });
      setIsCreateOpen(false);
      setCreatedCredentials({
        ...res.initialCredentials,
        title: `Partner Created (${res.vendor.vendorCode})`,
      });
      setCreateForm({
        partnerCategory: 'GARMENT_SHOP',
        registrationOption: 'OPTION_B_NEW_PARTNER',
        existingWebsiteUrl: '',
        createAsPending: false,
        fullName: '',
        businessName: '',
        email: '',
        phone: '',
        password: '',
        gstNumber: '',
        shopAddress: '',
        city: '',
        state: '',
        pincode: '',
        openingHours: '10:00 AM - 9:00 PM',
        pickupAddress: '',
        commissionMode: 'percentage',
        commissionRate: 10,
        fixedCommission: 0,
        platformFeePct: 2,
        notes: '',
      });
      onShowNotice(`Created ${res.vendor.vendorCode} (${res.vendor.businessName})`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleGenerateAdminRegLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminCreateRegistrationLink(linkForm);
      const fullUrl = `${window.location.origin}${res.registrationPath}`;
      setGeneratedRegLinkUrl(fullUrl);
      onShowNotice('Expiring partner registration link generated.');
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleApprovePartner = async (v: VendorProfile) => {
    try {
      const res = await adminApprovePartner(v.id);
      const fullLoginUrl = `${window.location.origin}${res.secureLoginLink || `/vendor?partner=${v.vendorCode}`}`;
      setApprovedBannerData({
        vendorCode: v.vendorCode,
        businessName: v.businessName,
        loginUrl: fullLoginUrl,
      });
      onShowNotice(`Approved ${v.businessName} (${v.vendorCode}). Account is now ACTIVE.`);
      await loadAllMarketplaceData();
      if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleRejectPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectPartnerTarget) return;
    try {
      await adminRejectPartner(
        rejectPartnerTarget.id,
        partnerRejectReason.trim() || 'Application did not meet OBRYNT partner requirements.'
      );
      setRejectPartnerTarget(null);
      setPartnerRejectReason('');
      onShowNotice(`Rejected ${rejectPartnerTarget.vendorCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoPartnerTarget) return;
    try {
      await adminRequestMoreInfo(
        infoPartnerTarget.id,
        partnerInfoMessage.trim() || 'Please share updated address proof and product catalog details.'
      );
      setInfoPartnerTarget(null);
      setPartnerInfoMessage('');
      onShowNotice(`Requested additional information from ${infoPartnerTarget.vendorCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const openEditVendor = (v: VendorProfile) => {
    setEditingVendor(v);
    setEditForm({
      fullName: v.fullName,
      businessName: v.businessName,
      phone: v.phone,
      email: v.email || '',
      partnerCategory: v.partnerCategory || 'GARMENT_SHOP',
      existingWebsiteUrl: v.existingWebsiteUrl || '',
      gstNumber: v.gstNumber || '',
      pickupAddress: v.pickupAddress || '',
      commissionMode: v.commissionMode,
      commissionRate: v.commissionRate,
      fixedCommission: v.fixedCommission,
      platformFeePct: v.platformFeePct ?? 2,
      notes: v.notes || '',
    });
  };

  const handleSaveVendorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    try {
      await adminUpdateVendor(editingVendor.id, editForm);
      setEditingVendor(null);
      onShowNotice(`Updated account ${editingVendor.vendorCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (v: VendorProfile, status: VendorAccountStatus) => {
    try {
      await adminChangeVendorStatus(v.id, status);
      onShowNotice(`${v.vendorCode} status changed to ${status.toUpperCase()}`);
      await loadAllMarketplaceData();
      if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    try {
      const res = await adminResetVendorPassword(
        resetTarget.id,
        customResetPassword.trim() || undefined
      );
      setResetTarget(null);
      setCustomResetPassword('');
      setCreatedCredentials({
        vendorCode: res.vendorCode,
        email: res.email,
        temporaryPassword: res.temporaryPassword,
        title: 'Password Reset Successfully',
      });
      onShowNotice(`Password reset for ${res.vendorCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleDeleteVendor = async (v: VendorProfile) => {
    if (
      !window.confirm(
        `Delete partner ${v.vendorCode} (${v.businessName})?\n\nIf historical orders or settlements exist, financial retention rules archive and block the account cleanly.`
      )
    ) {
      return;
    }
    try {
      const res = await adminDeleteVendor(v.id);
      onShowNotice(res.message);
      await loadAllMarketplaceData();
      if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleCreateStaffAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.vendorId) {
      onShowNotice('Select an approved Garment Shop or Roadside Store first.');
      return;
    }
    try {
      const res = await adminCreateStaffAccount({
        vendorId: staffForm.vendorId,
        staffLabel: staffForm.staffLabel.trim() || 'Store Staff',
        password: staffForm.password.trim() || undefined,
      });
      setIssuedStaffCreds({
        staffCode: res.staffAccount.staffCode,
        shopName: res.staffAccount.shopName,
        temporaryPassword: res.temporaryPassword,
        staffAccessUrl: `${window.location.origin}${res.staffAccessPath}`,
        title: 'Private Shop Staff Access Created',
      });
      setStaffForm({ vendorId: '', staffLabel: 'Counter Staff', password: '' });
      onShowNotice(`Created staff access ${res.staffAccount.staffCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleResetStaffPassword = async (staff: PartnerStaffAccount) => {
    try {
      const res = await adminResetStaffPassword(staff.id);
      setIssuedStaffCreds({
        staffCode: res.staffCode,
        shopName: res.shopName,
        temporaryPassword: res.temporaryPassword,
        staffAccessUrl: `${window.location.origin}${res.staffAccessPath}`,
        title: 'Staff Access Link & Password Rotated',
      });
      onShowNotice(`Rotated access link & password for ${res.staffCode}`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleOpenDetailDrawer = async (vendorId: string) => {
    setDetailVendorId(vendorId);
    setDetailLoading(true);
    try {
      const overviewRes = await adminGetVendorOverview(vendorId);
      setDetailData(overviewRes);
    } catch (err: any) {
      onShowNotice(`Error loading partner overview: ${err.message}`);
      setDetailVendorId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApproveProduct = async (p: VendorProduct) => {
    try {
      const overrideVal = priceOverrideDrafts[p.id] ? Number(priceOverrideDrafts[p.id]) : undefined;
      await adminApproveVendorProduct(p.id, overrideVal);
      onShowNotice(`Approved "${p.name}" for live OBRYNT storefront!`);
      await loadAllMarketplaceData();
      if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleRejectProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectProductTarget) return;
    try {
      await adminRejectVendorProduct(
        rejectProductTarget.id,
        rejectReason.trim() || 'Listing details need clarification.'
      );
      setRejectProductTarget(null);
      setRejectReason('');
      onShowNotice(`Rejected "${rejectProductTarget.name}"`);
      await loadAllMarketplaceData();
      if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminSaveCommissionRule({
        scope: commissionForm.scope,
        vendorId: commissionForm.scope === 'vendor' ? commissionForm.vendorId || undefined : undefined,
        vendorProductId:
          commissionForm.scope === 'product' ? commissionForm.vendorProductId || undefined : undefined,
        commissionMode: commissionForm.commissionMode,
        percentageRate: Number(commissionForm.percentageRate),
        fixedAmount: Number(commissionForm.fixedAmount),
        platformFeePct: Number(commissionForm.platformFeePct),
        notes: commissionForm.notes,
      });
      onShowNotice(`Commission rule (${commissionForm.scope}) saved.`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const handleMarkSettlementPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget || !settleRef.trim()) return;
    try {
      await adminMarkSettlementPaid(settleTarget.id, settleRef.trim(), settleNotes.trim() || undefined);
      setSettleTarget(null);
      setSettleRef('');
      setSettleNotes('');
      onShowNotice(`Settlement ${settleTarget.settlementCode} marked SETTLED.`);
      await loadAllMarketplaceData();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const txt = `OBRYNT Partner Credentials\nPartner ID: ${createdCredentials.vendorCode}\nLogin: ${createdCredentials.email}\nPassword: ${createdCredentials.temporaryPassword}\nPortal: ${window.location.origin}${createdCredentials.secureLoginLink || '/vendor'}`;
    navigator.clipboard.writeText(txt);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
    onShowNotice('Partner credentials copied to clipboard.');
  };

  const isPartnerDirectoryTab =
    subTab === 'pending' ||
    subTab === 'suppliers' ||
    subTab === 'garments' ||
    subTab === 'roadside' ||
    subTab === 'approved' ||
    subTab === 'rejected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Partner Onboarding, Approvals & Staff Access
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-[#d7ff3f] text-[#111111] text-[10px] font-black uppercase tracking-wider">
              3-Category Multi-Tenant
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Review Existing Suppliers, Garment Shops & Roadside Stores, manage pending approvals, generate registration links, and issue isolated shop staff passwords.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer relative"
          >
            <Bell className={`w-4 h-4 ${metrics.unreadNotifs > 0 ? 'text-[#d7ff3f]' : ''}`} />
            <span>Notifications</span>
            {metrics.unreadNotifs > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#d7ff3f] text-black font-black text-[10px] tabular-nums">
                {metrics.unreadNotifs}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratedRegLinkUrl(null);
              setIsLinkModalOpen(true);
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl border border-stone-700 cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-[#d7ff3f]" />
            <span>Generate Reg Link</span>
          </button>

          <button
            type="button"
            onClick={loadAllMarketplaceData}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black rounded-xl cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* Admin Notification Feed Banner */}
      {(showNotifDrawer || metrics.pendingApps > 0) && notifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#151811] border border-[#d7ff3f]/40 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-black text-white">
              <Bell className="w-4 h-4 text-[#d7ff3f]" />
              <span>
                Admin Partner Notifications ({metrics.unreadNotifs} unread · {metrics.pendingApps} pending approval)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {metrics.unreadNotifs > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await adminMarkNotificationsRead();
                    await loadAllMarketplaceData();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
                >
                  Mark All Read
                </button>
              )}
              {showNotifDrawer && (
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(false)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {(showNotifDrawer ? notifications : notifications.filter((n) => !n.isRead).slice(0, 3)).map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                  n.isRead
                    ? 'bg-black/40 border-stone-800 text-stone-400'
                    : 'bg-black/80 border-stone-700 text-white'
                }`}
              >
                <div>
                  <strong className="text-[#d7ff3f] mr-2">{n.title}:</strong>
                  <span>{n.message}</span>
                </div>
                <span className="text-[10px] font-mono text-stone-500 shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvedBannerData && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-emerald-300 block">
              Approved {approvedBannerData.businessName} ({approvedBannerData.vendorCode})
            </strong>
            <span className="text-stone-200 font-mono break-all">
              Secure Login Link: {approvedBannerData.loginUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(approvedBannerData.loginUrl);
                onShowNotice('Secure partner login link copied.');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#d7ff3f] text-black font-black flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Login Link</span>
            </button>
            <button
              type="button"
              onClick={() => setApprovedBannerData(null)}
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={loadAllMarketplaceData}
            className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-stone-400 block">Registrations</span>
          <div className="text-xl font-black text-white mt-1 tabular-nums">
            {overview?.totalRegistrations ?? vendors.length}
          </div>
          <span className="text-[10px] text-emerald-400">
            {overview?.activePartners ?? 0} active now
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-amber-400 block">Pending Review</span>
          <div className="text-xl font-black text-amber-300 mt-1 tabular-nums">{metrics.pendingApps}</div>
          <span className="text-[10px] text-stone-500">Partner apps</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-sky-300 block">Suppliers</span>
          <div className="text-xl font-black text-white mt-1 tabular-nums">{metrics.suppliersCount}</div>
          <span className="text-[10px] text-stone-500">Existing URLs</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-indigo-300 block">Garment Shops</span>
          <div className="text-xl font-black text-white mt-1 tabular-nums">{metrics.garmentsCount}</div>
          <span className="text-[10px] text-stone-500">Showrooms</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-emerald-300 block">Roadside Stores</span>
          <div className="text-xl font-black text-white mt-1 tabular-nums">{metrics.roadsideCount}</div>
          <span className="text-[10px] text-stone-500">Local merchants</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-stone-400 block">Shop Staff</span>
          <div className="text-xl font-black text-white mt-1 tabular-nums">{staffAccounts.length}</div>
          <span className="text-[10px] text-stone-500">
            {staffAccounts.filter((s) => s.status === 'active').length} active
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-stone-800">
          <span className="text-[10px] font-black uppercase text-stone-400 block">Partner GMV</span>
          <div className="text-xl font-black text-[#d7ff3f] mt-1 tabular-nums">
            ₹{metrics.totalSales.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-stone-500">{metrics.pendingProducts} pending SKUs</span>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-stone-800">
        {[
          { id: 'pending', label: `Pending Applications (${metrics.pendingApps})`, icon: Clock },
          { id: 'suppliers', label: `Existing Suppliers (${metrics.suppliersCount})`, icon: Globe },
          { id: 'garments', label: `Garment Shops (${metrics.garmentsCount})`, icon: Store },
          { id: 'roadside', label: `Roadside Stores (${metrics.roadsideCount})`, icon: Store },
          { id: 'approved', label: `Approved Partners (${metrics.approvedCount})`, icon: CheckCircle2 },
          { id: 'rejected', label: `Rejected (${metrics.rejectedCount})`, icon: XCircle },
          { id: 'staff', label: `Staff Accounts (${staffAccounts.length})`, icon: Users },
          { id: 'approvals', label: `Product Approvals (${metrics.pendingProducts})`, icon: Package },
          { id: 'orders', label: `Suborders (${vendorOrders.length})`, icon: ShoppingBag },
          { id: 'commissions', label: `Settlements (${settlements.length})`, icon: Percent },
          { id: 'logs', label: `Partner Activity (${logs.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as SubTab)}
              className={`min-h-[40px] px-3.5 py-2 rounded-t-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? 'bg-[#d7ff3f] text-[#111111]'
                  : 'bg-[#141414] text-stone-400 hover:text-white border border-stone-800 border-b-0'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* PARTNER DIRECTORY & APPROVAL LIST (6 PARTNER TABS) */}
      {/* ================================================================ */}
      {isPartnerDirectoryTab && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 max-w-md flex items-center bg-[#141414] border border-stone-800 rounded-xl px-3.5 py-2 focus-within:border-[#d7ff3f]">
              <Search className="w-4 h-4 text-stone-500 mr-2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search ID, business, owner, mobile, email, URL..."
                className="w-full bg-transparent outline-hidden text-xs text-white placeholder:text-stone-500"
              />
            </div>

            <div className="text-[11px] text-stone-400">
              Showing <strong className="text-white">{visiblePartnerList.length}</strong> partner record(s)
            </div>
          </div>

          {visiblePartnerList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#141414] border border-stone-800 text-center space-y-2 text-xs text-stone-400">
              <Store className="w-9 h-9 text-stone-600 mx-auto" />
              <div className="font-black text-white text-sm">No Partners in This Section</div>
              <p>Applications submitted via Option A / B links or added by Admin appear here immediately.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePartnerList.map((v) => {
                const cat = categoryBadge(v.partnerCategory);
                return (
                  <div
                    key={v.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-black text-[#d7ff3f] border border-stone-700">
                            {v.vendorCode}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${cat.cls}`}>
                            {cat.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${appStatusBadge(
                              v.applicationStatus
                            )}`}
                          >
                            {v.applicationStatus.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusBadgeClass(
                              v.status
                            )}`}
                          >
                            Account: {v.status}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {v.registrationOption === 'OPTION_A_EXISTING_URL'
                              ? 'Option A · URL'
                              : v.registrationOption === 'OPTION_B_NEW_PARTNER'
                              ? 'Option B · Mobile Link'
                              : 'Admin Created'}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white">
                          {v.businessName}{' '}
                          <span className="text-xs font-medium text-stone-400">· Owner: {v.fullName}</span>
                        </h3>

                        <div className="text-xs text-stone-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Mobile: <strong className="text-stone-200">{v.phone}</strong></span>
                          {v.email && <span>Email: <strong className="text-stone-200">{v.email}</strong></span>}
                          <span>Registered: {new Date(v.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>

                        {v.pickupAddress && (
                          <div className="text-xs text-stone-400">
                            Address: <span className="text-stone-300">{v.pickupAddress}</span>
                          </div>
                        )}

                        {v.existingWebsiteUrl && (
                          <div className="text-xs flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            <a
                              href={v.existingWebsiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-300 hover:underline font-mono inline-flex items-center gap-1"
                            >
                              <span>{v.existingWebsiteUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {v.rejectionReason && v.applicationStatus === 'rejected' && (
                          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                            Rejection Reason: {v.rejectionReason}
                          </div>
                        )}

                        {v.infoRequestMessage && v.applicationStatus === 'more_info_requested' && (
                          <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800 text-xs text-sky-200">
                            Requested Info: {v.infoRequestMessage}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-center bg-black/50 p-3 rounded-xl border border-stone-800 text-xs shrink-0">
                        <div>
                          <span className="text-[10px] text-stone-500 block">Products</span>
                          <strong className="text-white tabular-nums">{v.stats?.totalProducts ?? 0}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Stock</span>
                          <strong className="text-white tabular-nums">{v.stats?.totalStockUnits ?? 0}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Orders</span>
                          <strong className="text-white tabular-nums">{v.stats?.totalOrders ?? 0}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Sales</span>
                          <strong className="text-[#d7ff3f] tabular-nums">
                            ₹{(v.stats?.totalSales ?? 0).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {v.applicationStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApprovePartner(v)}
                            className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d7ff3f] hover:bg-[#c9f530] text-black font-black cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Activate</span>
                          </button>
                        )}

                        {v.applicationStatus !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectPartnerTarget(v);
                              setPartnerRejectReason('');
                            }}
                            className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {v.applicationStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              setInfoPartnerTarget(v);
                              setPartnerInfoMessage('');
                            }}
                            className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-800 font-bold cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Request More Info</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDetailDrawer(v.id)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#d7ff3f]" />
                          <span>360° Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditVendor(v)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setResetTarget(v)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {v.applicationStatus === 'approved' && v.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v, 'active')}
                            className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold cursor-pointer"
                          >
                            <Power className="w-3 h-3" />
                            <span>Activate</span>
                          </button>
                        )}
                        {v.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v, 'suspended')}
                            className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold cursor-pointer"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Suspend</span>
                          </button>
                        )}
                        {v.status !== 'blocked' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v, 'blocked')}
                            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Block</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(v)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800 font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* STAFF ACCOUNTS SECTION (GARMENT STAFF & ROADSIDE STORE STAFF) */}
      {/* ================================================================ */}
      {subTab === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleCreateStaffAccess}
              className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4 text-xs"
            >
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#d7ff3f]" />
                  <span>Create Private Shop Staff Access</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-1">
                  Generates a unique private shop staff password & secret access link. Public staff login screens never list shops.
                </p>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">
                  Select Approved Garment Shop or Roadside Store *
                </label>
                <select
                  required
                  value={staffForm.vendorId}
                  onChange={(e) => setStaffForm({ ...staffForm, vendorId: e.target.value })}
                  className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                >
                  <option value="">Choose an approved shop...</option>
                  {approvedShopPartners.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorCode} — {v.businessName} ({v.partnerCategory === 'ROADSIDE_STORE' ? 'Roadside Store' : 'Garment Shop'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Staff Label</label>
                  <input
                    type="text"
                    value={staffForm.staffLabel}
                    onChange={(e) => setStaffForm({ ...staffForm, staffLabel: e.target.value })}
                    placeholder="e.g. Floor Staff / Packing Counter"
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Staff Password (Optional — auto-generated)
                  </label>
                  <input
                    type="text"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder="Unique shop password"
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-black font-black cursor-pointer"
              >
                Create Staff Password & Private Access Link
              </button>
            </form>

            <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3 text-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Private Staff Portal Entry URLs
              </h3>
              <p className="text-stone-400">
                Both entry screens show only a password prompt — zero shop lists, names, or owner info.
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black border border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase text-indigo-300 font-black block">
                      Garment Shop Staff Portal
                    </span>
                    <span className="font-mono text-white">{window.location.origin}/staff/garment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/staff/garment`);
                      onShowNotice('Copied Garment Staff Login URL.');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-stone-200 font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-black border border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-300 font-black block">
                      Roadside Store Staff Portal
                    </span>
                    <span className="font-mono text-white">{window.location.origin}/staff/roadside</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/staff/roadside`);
                      onShowNotice('Copied Roadside Store Staff Login URL.');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-stone-200 font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {staffAccounts.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
                No private shop staff accounts created yet.
              </div>
            ) : (
              staffAccounts.map((stf) => (
                <div
                  key={stf.id}
                  className="p-4 rounded-2xl bg-[#141414] border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#d7ff3f] bg-black px-2 py-0.5 rounded">
                        {stf.staffCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 font-bold uppercase text-[10px]">
                        {stf.staffCategory === 'ROADSIDE_STORE' ? 'Roadside Staff' : 'Garment Staff'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          stf.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}
                      >
                        {stf.status}
                      </span>
                    </div>
                    <div className="font-black text-white">
                      {stf.shopName} ({stf.vendorCode}) ·{' '}
                      <span className="font-normal text-stone-400">{stf.staffLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetStaffPassword(stf)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#d7ff3f]" />
                      <span>Reset Password & Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminChangeStaffStatus(
                          stf.id,
                          stf.status === 'active' ? 'inactive' : 'active'
                        );
                        onShowNotice(`Staff ${stf.staffCode} updated.`);
                        await loadAllMarketplaceData();
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
                    >
                      {stf.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminDeleteStaffAccount(stf.id);
                        onShowNotice(`Removed staff ${stf.staffCode}`);
                        await loadAllMarketplaceData();
                      }}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PRODUCT APPROVAL QUEUE */}
      {/* ================================================================ */}
      {subTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'pending_approval', label: 'Pending Approval' },
              { id: 'approved', label: 'Approved & Live' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'disabled', label: 'Disabled' },
              { id: 'draft', label: 'Drafts' },
              { id: 'ALL', label: 'All Partner Products' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setProductStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  productStatusFilter === f.id
                    ? 'bg-[#d7ff3f] text-[#111111] font-black'
                    : 'bg-[#141414] text-stone-400 border border-stone-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
              No partner products found in "{productStatusFilter}".
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={p.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                      alt={p.name}
                      className="w-20 h-24 object-cover rounded-xl bg-stone-900 border border-stone-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-[#d7ff3f] bg-black px-2 py-0.5 rounded">
                          {p.productCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${productStatusBadge(
                            p.approvalStatus
                          )}`}
                        >
                          {p.approvalStatus.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400">
                          {p.vendorCode} · {p.shopName || p.vendorName}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white truncate">{p.name}</h4>
                      <p className="text-xs text-stone-400 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-300 pt-1">
                        <span>Category: <strong>{p.category}</strong></span>
                        <span>Stock: <strong>{p.totalStock}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/60 border border-stone-800 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Partner Cost</span>
                      <strong className="text-stone-200">₹{p.supplierPrice}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Original MRP</span>
                      <strong className="text-stone-400 line-through">₹{p.originalPrice}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">OBRYNT Price</span>
                      <input
                        type="number"
                        value={priceOverrideDrafts[p.id] ?? p.sellingPrice}
                        onChange={(e) =>
                          setPriceOverrideDrafts({ ...priceOverrideDrafts, [p.id]: e.target.value })
                        }
                        className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs font-black text-[#d7ff3f] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-xs">
                    <div className="flex items-center gap-2">
                      {p.approvalStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApproveProduct(p)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      )}
                      {p.approvalStatus !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectProductTarget(p);
                            setRejectReason('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                    {p.approvalStatus === 'approved' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await adminUpdateVendorProductStatus(p.id, 'disabled');
                          onShowNotice(`Disabled "${p.name}" from storefront.`);
                          await loadAllMarketplaceData();
                          if (onRefreshStorefrontCatalog) await onRefreshStorefrontCatalog();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold cursor-pointer"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SUBORDERS */}
      {/* ================================================================ */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          {vendorOrders.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#141414] border border-stone-800 text-center text-xs text-stone-400">
              No partner suborders generated yet.
            </div>
          ) : (
            <div className="space-y-3">
              {vendorOrders.map((o) => (
                <div key={o.id} className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-[#d7ff3f] bg-black px-2.5 py-1 rounded">
                        {o.suborderCode}
                      </span>
                      <span className="text-stone-400">
                        Parent: <strong className="text-white">{o.parentOrderCode}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 font-bold">
                        {o.vendorCode} · {o.shopName || o.vendorName}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-stone-900 border border-stone-700 font-black uppercase text-[10px]">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-4 text-stone-300">
                    <div>Customer: <strong>{o.customerName}</strong> ({o.deliveryAddress.city})</div>
                    <div>
                      Selling: <strong>₹{o.subtotalSellingPrice}</strong> · Payable:{' '}
                      <strong className="text-[#d7ff3f]">₹{o.vendorPayableAmount}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* COMMISSIONS & SETTLEMENTS */}
      {/* ================================================================ */}
      {subTab === 'commissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveCommission}
              className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4 text-xs"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#d7ff3f]" />
                <span>Configure Commission Rule</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={commissionForm.scope}
                  onChange={(e) => setCommissionForm({ ...commissionForm, scope: e.target.value as any })}
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="global">Global Default</option>
                  <option value="vendor">Partner-Specific</option>
                  <option value="product">Product Override</option>
                </select>
                <select
                  value={commissionForm.commissionMode}
                  onChange={(e) =>
                    setCommissionForm({ ...commissionForm, commissionMode: e.target.value as CommissionMode })
                  }
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ₹/unit</option>
                  <option value="percentage_plus_fixed">% + Fixed</option>
                </select>
              </div>
              {commissionForm.scope === 'vendor' && (
                <select
                  required
                  value={commissionForm.vendorId}
                  onChange={(e) => setCommissionForm({ ...commissionForm, vendorId: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="">Choose partner...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorCode} — {v.businessName}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={commissionForm.percentageRate}
                  onChange={(e) =>
                    setCommissionForm({ ...commissionForm, percentageRate: Number(e.target.value) })
                  }
                  placeholder="Comm %"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <input
                  type="number"
                  value={commissionForm.fixedAmount}
                  onChange={(e) =>
                    setCommissionForm({ ...commissionForm, fixedAmount: Number(e.target.value) })
                  }
                  placeholder="Fixed ₹"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <input
                  type="number"
                  value={commissionForm.platformFeePct}
                  onChange={(e) =>
                    setCommissionForm({ ...commissionForm, platformFeePct: Number(e.target.value) })
                  }
                  placeholder="Fee %"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#d7ff3f] text-black font-black rounded-xl cursor-pointer"
              >
                Save Commission Rule
              </button>
            </form>

            <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-2 text-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Active Rules</h3>
              {commissions
                .filter((r) => r.isActive)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-white">{r.vendorName || r.productName || 'Global Default'}</strong>
                      <div className="text-stone-400">
                        {r.percentageRate}% + ₹{r.fixedAmount} · Fee {r.platformFeePct}%
                      </div>
                    </div>
                    {r.id !== 'comm-global-default' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await adminDeleteCommissionRule(r.id);
                          await loadAllMarketplaceData();
                        }}
                        className="text-stone-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3 text-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#d7ff3f]" />
              <span>Manual Settlement Ledger</span>
            </h3>
            {settlements.length === 0 ? (
              <div className="py-8 text-center text-stone-500">No settlements yet.</div>
            ) : (
              settlements.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-black/50 border border-stone-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <strong className="font-mono text-white">{s.settlementCode}</strong> ·{' '}
                    <span className="text-stone-300">{s.vendorName}</span> ({s.vendorCode})
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#d7ff3f] font-black">₹{s.netVendorPayable}</span>
                    <span className="uppercase text-[10px] font-bold">{s.settlementStatus}</span>
                    {s.settlementStatus !== 'settled' && s.settlementStatus !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettleTarget(s);
                          setSettleRef('');
                          setSettleNotes('');
                        }}
                        className="px-3 py-1 rounded bg-[#d7ff3f] text-black font-black cursor-pointer"
                      >
                        Mark Settled
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PARTNER ACTIVITY LOGS */}
      {/* ================================================================ */}
      {subTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Partner Activity & Security Audit Trail
          </h3>
          {logs.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-500">No partner activity logged yet.</div>
          ) : (
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 text-xs">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black text-[#d7ff3f] font-mono text-[10px] font-bold">
                        {l.actorRole}
                      </span>
                      <span className="font-mono text-stone-400 text-[11px]">{l.action}</span>
                      {l.vendorCode && (
                        <span className="text-[10px] text-stone-300 font-bold">({l.vendorCode})</span>
                      )}
                    </div>
                    <p className="text-stone-200 mt-1">{l.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 shrink-0">
                    {new Date(l.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: GENERATE EXPIRING REGISTRATION LINK */}
      {/* ================================================================ */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsLinkModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 my-8 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black">Generate Expiring Partner Registration Link</h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAdminRegLink} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Partner Category</label>
                  <select
                    value={linkForm.partnerCategory}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, partnerCategory: e.target.value as any })
                    }
                    className="w-full min-h-[40px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold"
                  >
                    <option value="ANY">Any Partner Category</option>
                    <option value="EXISTING_SUPPLIER">Existing Supplier Only</option>
                    <option value="GARMENT_SHOP">Garment Shop Only</option>
                    <option value="ROADSIDE_STORE">Roadside Store Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Allowed Registration Option</label>
                  <select
                    value={linkForm.registrationOption}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, registrationOption: e.target.value as any })
                    }
                    className="w-full min-h-[40px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold"
                  >
                    <option value="BOTH">Both Option A & Option B</option>
                    <option value="OPTION_A_EXISTING_URL">Option A (Existing URL)</option>
                    <option value="OPTION_B_NEW_PARTNER">Option B (New Store)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Intended Business (Optional)</label>
                  <input
                    type="text"
                    value={linkForm.intendedBusinessName}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, intendedBusinessName: e.target.value })
                    }
                    placeholder="Pre-fill shop name"
                    className="w-full min-h-[40px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Expires In (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={linkForm.expiresInHours}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, expiresInHours: Number(e.target.value) })
                    }
                    className="w-full min-h-[40px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[42px] rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
              >
                Generate Secure Link
              </button>
            </form>

            {generatedRegLinkUrl && (
              <div className="p-3 rounded-xl bg-black border border-stone-700 space-y-2">
                <div className="font-mono text-[11px] text-[#d7ff3f] break-all">{generatedRegLinkUrl}</div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedRegLinkUrl);
                    onShowNotice('Registration link copied to clipboard.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#d7ff3f] text-black font-black flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Registration Link</span>
                </button>
              </div>
            )}

            {regLinks.length > 0 && (
              <div className="pt-2 border-t border-stone-800 space-y-1.5 max-h-40 overflow-y-auto">
                <div className="font-bold text-stone-400">Recent Links</div>
                {regLinks.slice(0, 6).map((l) => (
                  <div
                    key={l.id}
                    className="p-2 rounded-lg bg-black/50 border border-stone-800 flex items-center justify-between"
                  >
                    <span>
                      {l.partnerCategory} · <strong className="uppercase">{l.status}</strong> ({l.usedCount}/{l.maxUses})
                    </span>
                    {l.status === 'active' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await adminRevokeRegistrationLink(l.id);
                          await loadAllMarketplaceData();
                        }}
                        className="text-rose-400 hover:underline font-bold cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: ADMIN ADD PARTNER DIRECTLY */}
      {/* ================================================================ */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black">Add OBRYNT Partner Account</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Partner Category *</label>
                  <select
                    value={createForm.partnerCategory}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, partnerCategory: e.target.value as PartnerCategory })
                    }
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  >
                    <option value="EXISTING_SUPPLIER">Existing Supplier (SUP-)</option>
                    <option value="GARMENT_SHOP">Garment Shop (GAR-)</option>
                    <option value="ROADSIDE_STORE">Roadside Store (RDS-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Registration Option</label>
                  <select
                    value={createForm.registrationOption}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        registrationOption: e.target.value as RegistrationOption,
                      })
                    }
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  >
                    <option value="OPTION_A_EXISTING_URL">Option A: Existing Website / URL</option>
                    <option value="OPTION_B_NEW_PARTNER">Option B: New Store (No Website)</option>
                    <option value="ADMIN_CREATED">Direct Admin Provisioning</option>
                  </select>
                </div>
              </div>

              {createForm.registrationOption === 'OPTION_A_EXISTING_URL' && (
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Existing Website / Supplier URL</label>
                  <input
                    type="url"
                    value={createForm.existingWebsiteUrl}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, existingWebsiteUrl: e.target.value })
                    }
                    placeholder="https://supplier-site.com"
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Business / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.businessName}
                    onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Password (Auto if blank)</label>
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Complete Business Address</label>
                <input
                  type="text"
                  value={createForm.pickupAddress}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, pickupAddress: e.target.value, shopAddress: e.target.value })
                  }
                  className="w-full min-h-[42px] bg-stone-900 border border-stone-700 rounded-xl px-3 text-white font-bold outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 text-stone-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={createForm.createAsPending}
                  onChange={(e) => setCreateForm({ ...createForm, createAsPending: e.target.checked })}
                />
                <span>Queue as PENDING for approval review instead of activating immediately</span>
              </label>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
                >
                  Save Partner Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ONE-TIME PARTNER CREDENTIALS POPUP */}
      {/* ================================================================ */}
      {createdCredentials && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCreatedCredentials(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-[#d7ff3f]/50 rounded-2xl p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-[#d7ff3f]">{createdCredentials.title}</h3>
            <div className="p-4 rounded-xl bg-black border border-stone-800 font-mono text-xs space-y-2">
              <div>
                <span className="text-stone-500">Partner ID: </span>
                <strong className="text-[#d7ff3f]">{createdCredentials.vendorCode}</strong>
              </div>
              <div>
                <span className="text-stone-500">Login ID / Mobile / Email: </span>
                <strong className="text-white">{createdCredentials.email}</strong>
              </div>
              <div>
                <span className="text-stone-500">Password: </span>
                <strong className="text-emerald-400">{createdCredentials.temporaryPassword}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCredentialsText}
                className="flex-1 py-2.5 rounded-xl bg-[#d7ff3f] text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCreds ? 'Copied' : 'Copy Details'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-200 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ONE-TIME PRIVATE STAFF ACCESS CREDENTIALS POPUP */}
      {/* ================================================================ */}
      {issuedStaffCreds && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIssuedStaffCreds(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-[#d7ff3f]/50 rounded-2xl p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-[#d7ff3f]">{issuedStaffCreds.title}</h3>
            <p className="text-xs text-stone-300">
              Share this unique private access link and password ONLY with staff of{' '}
              <strong className="text-white">{issuedStaffCreds.shopName}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-black border border-stone-800 font-mono text-xs space-y-2">
              <div>
                <span className="text-stone-500">Staff ID: </span>
                <strong className="text-[#d7ff3f]">{issuedStaffCreds.staffCode}</strong>
              </div>
              <div>
                <span className="text-stone-500">Password: </span>
                <strong className="text-emerald-400">{issuedStaffCreds.temporaryPassword}</strong>
              </div>
              <div className="pt-1 border-t border-stone-800">
                <span className="text-stone-500 block">Private Staff Link:</span>
                <span className="text-white break-all text-[11px]">{issuedStaffCreds.staffAccessUrl}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `OBRYNT Private Staff Access\nStaff Link: ${issuedStaffCreds.staffAccessUrl}\nPassword: ${issuedStaffCreds.temporaryPassword}`
                  );
                  onShowNotice('Staff link and password copied.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#d7ff3f] text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Staff Link & Password</span>
              </button>
              <button
                type="button"
                onClick={() => setIssuedStaffCreds(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-200 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* REJECT PARTNER & REQUEST MORE INFO MODALS */}
      {/* ================================================================ */}
      {rejectPartnerTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setRejectPartnerTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-rose-300">
              Decline {rejectPartnerTarget.businessName} ({rejectPartnerTarget.vendorCode})
            </h3>
            <form onSubmit={handleRejectPartnerSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={partnerRejectReason}
                onChange={(e) => setPartnerRejectReason(e.target.value)}
                placeholder="Reason for rejecting application..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-3 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectPartnerTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {infoPartnerTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setInfoPartnerTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-sky-300">
              Request More Info · {infoPartnerTarget.businessName}
            </h3>
            <form onSubmit={handleRequestInfoSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={partnerInfoMessage}
                onChange={(e) => setPartnerInfoMessage(e.target.value)}
                placeholder="Specify what details or documents are needed..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-3 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInfoPartnerTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-400 text-black font-black cursor-pointer"
                >
                  Send Info Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* EDIT PARTNER, RESET PASSWORD, PRODUCT REJECT, SETTLEMENT, 360 DRAWER */}
      {/* ================================================================ */}
      {editingVendor && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setEditingVendor(null)}
        >
          <div
            className="w-full max-w-lg bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black">Edit {editingVendor.vendorCode}</h3>
              <button type="button" onClick={() => setEditingVendor(null)} className="text-stone-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveVendorEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Owner Name"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
                <input
                  type="text"
                  required
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  placeholder="Business Name"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.partnerCategory}
                  onChange={(e) =>
                    setEditForm({ ...editForm, partnerCategory: e.target.value as PartnerCategory })
                  }
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="EXISTING_SUPPLIER">Existing Supplier</option>
                  <option value="GARMENT_SHOP">Garment Shop</option>
                  <option value="ROADSIDE_STORE">Roadside Store</option>
                </select>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Mobile"
                  className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <input
                type="text"
                value={editForm.pickupAddress}
                onChange={(e) => setEditForm({ ...editForm, pickupAddress: e.target.value })}
                placeholder="Business / Pickup Address"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setResetTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black">Reset Password · {resetTarget.vendorCode}</h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="text"
                value={customResetPassword}
                onChange={(e) => setCustomResetPassword(e.target.value)}
                placeholder="Optional custom password (min 6 chars)"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rejectProductTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setRejectProductTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-rose-300">Reject "{rejectProductTarget.name}"</h3>
            <form onSubmit={handleRejectProductSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-3 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectProductTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {settleTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSettleTarget(null)}
        >
          <div
            className="w-full max-w-md bg-[#141414] border border-stone-800 rounded-2xl p-6 text-white space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black">Record Settlement · {settleTarget.settlementCode}</h3>
            <form onSubmit={handleMarkSettlementPaid} className="space-y-3">
              <input
                type="text"
                required
                value={settleRef}
                onChange={(e) => setSettleRef(e.target.value)}
                placeholder="UTR / Bank / UPI Reference *"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
              />
              <input
                type="text"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                placeholder="Notes"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] text-black font-black cursor-pointer"
                >
                  Mark Settled
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailVendorId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end"
          onClick={() => {
            setDetailVendorId(null);
            setDetailData(null);
          }}
        >
          <div
            className="w-full max-w-2xl bg-[#111111] border-l border-stone-800 h-full overflow-y-auto p-6 space-y-6 text-white text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="text-lg font-black">Partner 360° Overview</h3>
              <button
                type="button"
                onClick={() => {
                  setDetailVendorId(null);
                  setDetailData(null);
                }}
                className="p-2 rounded-full bg-stone-900 text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {detailLoading || !detailData ? (
              <div className="py-12 text-center text-stone-400">Loading partner ledger...</div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#181818] border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-[#d7ff3f]">{detailData.vendor.vendorCode}</span>
                    <span className="uppercase font-black text-stone-300">
                      {detailData.vendor.applicationStatus} · {detailData.vendor.status}
                    </span>
                  </div>
                  <h4 className="text-base font-black">{detailData.vendor.businessName}</h4>
                  <p className="text-stone-400">
                    {detailData.vendor.fullName} · {detailData.vendor.phone} {detailData.vendor.email ? `· ${detailData.vendor.email}` : ''}
                  </p>
                  <p className="text-stone-400">{detailData.vendor.pickupAddress}</p>
                  {detailData.vendor.existingWebsiteUrl && (
                    <p className="text-sky-300 font-mono">{detailData.vendor.existingWebsiteUrl}</p>
                  )}
                </div>

                <div>
                  <h5 className="font-black uppercase tracking-wider text-stone-300 mb-2">
                    Products ({detailData.products.length})
                  </h5>
                  <div className="space-y-2">
                    {detailData.products.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[#181818] border border-stone-800 flex justify-between">
                        <span><strong>{p.name}</strong> ({p.productCode})</span>
                        <span className="text-[#d7ff3f] font-bold">₹{p.sellingPrice} · Stock: {p.totalStock}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-black uppercase tracking-wider text-stone-300 mb-2">
                    Suborders ({detailData.orders.length})
                  </h5>
                  <div className="space-y-2">
                    {detailData.orders.map((o) => (
                      <div key={o.id} className="p-3 rounded-xl bg-[#181818] border border-stone-800 flex justify-between">
                        <span className="font-mono font-bold text-white">{o.suborderCode}</span>
                        <span className="text-[#d7ff3f] font-bold">₹{o.vendorPayableAmount} ({o.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
