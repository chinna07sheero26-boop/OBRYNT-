import React, { useEffect, useState } from 'react';
import {
  X,
  Globe,
  Store,
  ShoppingBag,
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PartnerCategory, RegistrationOption } from '../types';
import {
  createPartnerRegistrationLink,
  submitPartnerApplication,
  validatePartnerRegistrationToken,
} from '../services/vendorService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface PartnerOnboardingModalProps {
  isOpen: boolean;
  initialToken?: string;
  onClose: () => void;
  onOpenLogin: () => void;
  onShowNotice: (msg: string) => void;
}

const CATEGORY_META: Array<{
  id: PartnerCategory;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'EXISTING_SUPPLIER',
    title: 'Existing Suppliers',
    subtitle: 'Wholesalers, brand manufacturers, and established supplier websites/URLs.',
    badge: 'SUP-XXXX',
    icon: Globe,
  },
  {
    id: 'GARMENT_SHOP',
    title: 'Garment Shops',
    subtitle: 'Physical apparel showrooms, multi-brand garment stores & boutiques.',
    badge: 'GAR-XXXX',
    icon: ShoppingBag,
  },
  {
    id: 'ROADSIDE_STORE',
    title: 'Roadside Stores',
    subtitle: 'Local street-front fashion stalls, neighborhood shops & independent merchants.',
    badge: 'RDS-XXXX',
    icon: Store,
  },
];

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  initialToken = '',
  onClose,
  onOpenLogin,
  onShowNotice,
}) => {
  const [token, setToken] = useState(initialToken);
  const [tokenCheckState, setTokenCheckState] = useState<'none' | 'checking' | 'valid' | 'invalid'>('none');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [lockedCategory, setLockedCategory] = useState<PartnerCategory | null>(null);
  const [lockedOption, setLockedOption] = useState<RegistrationOption | null>(null);

  const [category, setCategory] = useState<PartnerCategory>('GARMENT_SHOP');
  const [option, setOption] = useState<RegistrationOption>('OPTION_A_EXISTING_URL');
  const [step, setStep] = useState<'category' | 'option' | 'form' | 'submitted'>('category');

  const [generatedPhoneUrl, setGeneratedPhoneUrl] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedPhoneLink, setCopiedPhoneLink] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    existingWebsiteUrl: '',
    password: '',
    notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    vendorCode: string;
    partnerCategory: PartnerCategory;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialToken) {
      setToken(initialToken);
      setTokenCheckState('checking');
      setTokenError(null);
      validatePartnerRegistrationToken(initialToken).then((res) => {
        if (!res.valid || !res.link) {
          setTokenCheckState('invalid');
          setTokenError(res.error || 'This registration link is invalid or expired.');
          return;
        }
        setTokenCheckState('valid');
        if (res.link.partnerCategory !== 'ANY') {
          setCategory(res.link.partnerCategory);
          setLockedCategory(res.link.partnerCategory);
        }
        if (res.link.registrationOption !== 'BOTH') {
          setOption(res.link.registrationOption);
          setLockedOption(res.link.registrationOption);
        }
        if (res.link.intendedBusinessName) {
          setForm((prev) => ({ ...prev, businessName: prev.businessName || res.link!.intendedBusinessName || '' }));
        }
        if (res.link.partnerCategory !== 'ANY' && res.link.registrationOption !== 'BOTH') {
          setStep('form');
        } else if (res.link.partnerCategory !== 'ANY') {
          setStep('option');
        } else {
          setStep('category');
        }
      });
    } else {
      setTokenCheckState('none');
      setTokenError(null);
      setLockedCategory(null);
      setLockedOption(null);
      setStep('category');
    }
  }, [isOpen, initialToken]);

  if (!isOpen) return null;

  const ensureValidToken = async (
    targetCategory: PartnerCategory,
    targetOption: RegistrationOption
  ): Promise<string> => {
    if (token && tokenCheckState === 'valid') return token;
    const created = await createPartnerRegistrationLink({
      partnerCategory: targetCategory,
      registrationOption: targetOption,
    });
    setToken(created.token);
    setTokenCheckState('valid');
    return created.token;
  };

  const handleGenerateOptionBPhoneLink = async () => {
    setGeneratingLink(true);
    setSubmitError(null);
    try {
      const created = await createPartnerRegistrationLink({
        partnerCategory: category,
        registrationOption: 'OPTION_B_NEW_PARTNER',
      });
      setToken(created.token);
      setTokenCheckState('valid');
      const fullUrl = `${window.location.origin}${created.registrationPath}`;
      setGeneratedPhoneUrl(fullUrl);
      onShowNotice('Unique mobile registration link generated (valid 24 hours).');
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to generate registration link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyPhoneLink = () => {
    if (!generatedPhoneUrl) return;
    navigator.clipboard.writeText(generatedPhoneUrl);
    setCopiedPhoneLink(true);
    setTimeout(() => setCopiedPhoneLink(false), 2000);
    onShowNotice('Registration link copied. Partner can open it on any phone.');
  };

  const handleProceedToForm = async (selectedOption: RegistrationOption) => {
    setOption(selectedOption);
    setSubmitError(null);
    if (selectedOption === 'OPTION_A_EXISTING_URL') {
      try {
        await ensureValidToken(category, 'OPTION_A_EXISTING_URL');
      } catch (err: any) {
        setSubmitError(err?.message || 'Unable to initialize registration session.');
        return;
      }
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const activeToken = await ensureValidToken(category, option);
      const res = await submitPartnerApplication({
        token: activeToken,
        partnerCategory: category,
        registrationOption: option,
        businessName: form.businessName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        existingWebsiteUrl:
          option === 'OPTION_A_EXISTING_URL' ? form.existingWebsiteUrl.trim() : undefined,
        password: form.password,
        notes: form.notes.trim() || undefined,
      });

      setSubmittedResult({
        vendorCode: res.vendorCode,
        partnerCategory: res.partnerCategory,
        message: res.message,
      });
      setStep('submitted');
      onShowNotice(`Partner application ${res.vendorCode} submitted for Admin approval.`);
    } catch (err: any) {
      setSubmitError(err?.message || 'Application submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCategoryMeta = CATEGORY_META.find((c) => c.id === category)!;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#111111] text-stone-100 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-black/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-white">
                OBRYNT Partner Onboarding
              </h2>
              <p className="text-[11px] text-stone-400">
                Existing Suppliers · Garment Shops · Roadside Stores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {tokenCheckState === 'checking' && (
            <div className="p-6 text-center text-xs text-stone-300">
              Verifying registration link...
            </div>
          )}

          {tokenCheckState === 'invalid' && (
            <div className="p-5 rounded-xl bg-rose-950/60 border border-rose-800 space-y-3">
              <div className="flex items-start gap-2.5 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm text-white mb-1">Registration Link Unavailable</strong>
                  <span>{tokenError}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setToken('');
                  setTokenCheckState('none');
                  setTokenError(null);
                  setStep('category');
                }}
                className="px-4 py-2 rounded-lg bg-white text-black text-xs font-black cursor-pointer"
              >
                Start Fresh Partner Application
              </button>
            </div>
          )}

          {tokenCheckState !== 'checking' && tokenCheckState !== 'invalid' && (
            <>
              {step === 'category' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7ff3f]">
                      Step 1 of 3
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Choose Your Partner Category
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Each partner type gets its own approval workflow, permissions, and dedicated dashboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CATEGORY_META.map((cat) => {
                      const Icon = cat.icon;
                      const selected = category === cat.id;
                      const disabled = lockedCategory !== null && lockedCategory !== cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setCategory(cat.id)}
                          className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 min-h-[136px] ${
                            disabled
                              ? 'opacity-35 cursor-not-allowed bg-stone-950 border-stone-900'
                              : selected
                              ? 'bg-[#1a1f10] border-[#d7ff3f] cursor-pointer'
                              : 'bg-[#171717] border-stone-800 hover:border-stone-600 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon className={`w-5 h-5 ${selected ? 'text-[#d7ff3f]' : 'text-stone-400'}`} />
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black border border-stone-800 text-stone-300">
                              {cat.badge}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">{cat.title}</div>
                            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                              {cat.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="text-xs text-stone-400 hover:text-white underline underline-offset-4 cursor-pointer text-left"
                    >
                      Already approved? Sign in to Partner Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(lockedOption ? 'form' : 'option')}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue as {activeCategoryMeta.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'option' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7ff3f]">
                        Step 2 of 3 · {activeCategoryMeta.title}
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        Select Registration Method
                      </h3>
                    </div>
                    {!lockedCategory && (
                      <button
                        type="button"
                        onClick={() => setStep('category')}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs text-stone-300 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className={`p-4 rounded-xl border space-y-3 ${
                        option === 'OPTION_A_EXISTING_URL'
                          ? 'bg-[#1a1f10] border-[#d7ff3f]'
                          : 'bg-[#171717] border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black text-[#d7ff3f] border border-stone-700">
                          Option A
                        </span>
                        <Globe className="w-4 h-4 text-[#d7ff3f]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          Already Have a Website / Supplier URL
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Submit your existing store URL or supplier catalog link along with business details and password. Email is optional.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={lockedOption === 'OPTION_B_NEW_PARTNER'}
                        onClick={() => handleProceedToForm('OPTION_A_EXISTING_URL')}
                        className="w-full min-h-[44px] py-2.5 rounded-lg bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-40 text-[#111111] text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Select Existing URL
                      </button>
                    </div>

                    <div
                      className={`p-4 rounded-xl border space-y-3 ${
                        option === 'OPTION_B_NEW_PARTNER'
                          ? 'bg-[#1a1f10] border-[#d7ff3f]'
                          : 'bg-[#171717] border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black text-white border border-stone-700">
                          Option B
                        </span>
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          New Partner – No Existing Website
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Generate a unique OBRYNT registration link to open on any phone, or complete your store application right here.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={generatingLink || lockedOption === 'OPTION_A_EXISTING_URL'}
                          onClick={handleGenerateOptionBPhoneLink}
                          className="w-full min-h-[40px] py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Link2 className="w-3.5 h-3.5 text-[#d7ff3f]" />
                          <span>
                            {generatingLink ? 'Generating Link...' : 'Generate Unique Phone Link'}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={lockedOption === 'OPTION_A_EXISTING_URL'}
                          onClick={() => handleProceedToForm('OPTION_B_NEW_PARTNER')}
                          className="w-full min-h-[44px] py-2.5 rounded-lg bg-white hover:bg-stone-200 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                        >
                          Select New Registration
                        </button>
                      </div>
                    </div>
                  </div>

                  {generatedPhoneUrl && (
                    <div className="p-4 rounded-xl bg-black border border-stone-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-[#d7ff3f] flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4" />
                          <span>Unique Mobile Registration Link Ready (24h Single-Use)</span>
                        </strong>
                        <button
                          type="button"
                          onClick={handleCopyPhoneLink}
                          className="px-2.5 py-1 rounded bg-[#d7ff3f] text-black font-black text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPhoneLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPhoneLink ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-stone-300 break-all bg-stone-950 p-2 rounded border border-stone-800">
                        {generatedPhoneUrl}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7ff3f]">
                        {activeCategoryMeta.title} ·{' '}
                        {option === 'OPTION_A_EXISTING_URL'
                          ? 'Option A (Existing URL)'
                          : 'Option B (New Registration)'}
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        Partner Application Details
                      </h3>
                    </div>
                    {!lockedOption && (
                      <button
                        type="button"
                        onClick={() => setStep('option')}
                        className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs text-stone-300 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {option === 'OPTION_A_EXISTING_URL' && (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Existing Website or Supplier URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={form.existingWebsiteUrl}
                        onChange={(e) => setForm({ ...form, existingWebsiteUrl: e.target.value })}
                        placeholder="https://yourstore.com/catalog"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Business / Shop Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        placeholder={
                          category === 'EXISTING_SUPPLIER'
                            ? 'e.g. Surat Textile Hub'
                            : category === 'GARMENT_SHOP'
                            ? 'e.g. Classic Loom Garments'
                            : 'e.g. Corner Fashion Stall'
                        }
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Owner Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="Full name"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Email Address {option === 'OPTION_A_EXISTING_URL' ? '(Optional)' : '(Optional / Recommended)'}
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="partner@business.com"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                      Complete Business Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Shop / warehouse door no., street, market landmark"
                      className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="City"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="State"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        placeholder="Pincode"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-hidden focus:border-[#d7ff3f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block mb-1">
                      Set Account Login Password * (Min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Create a secure password for your dashboard login"
                        className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl pl-3.5 pr-11 py-2 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-start gap-2.5 text-[11px] text-stone-300">
                    <ShieldCheck className="w-4 h-4 text-[#d7ff3f] shrink-0 mt-0.5" />
                    <span>
                      Your application is sent to OBRYNT Admin for verification. Accounts start as{' '}
                      <strong className="text-white">PENDING</strong> and cannot upload products or receive orders until Admin approves.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[48px] py-3 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-60 text-[#111111] text-xs font-black uppercase tracking-[0.16em] cursor-pointer"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application to OBRYNT Admin'}
                  </button>
                </form>
              )}

              {step === 'submitted' && submittedResult && (
                <div className="py-4 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-amber-300" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black uppercase tracking-wider">
                      Status: PENDING ADMIN APPROVAL
                    </span>
                    <h3 className="text-lg font-black text-white pt-1">
                      Application Submitted Successfully
                    </h3>
                    <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                      {submittedResult.message}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black border border-stone-800 font-mono text-xs inline-block text-left space-y-1">
                    <div>
                      <span className="text-stone-500">Application ID: </span>
                      <strong className="text-[#d7ff3f]">{submittedResult.vendorCode}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Category: </span>
                      <strong className="text-white">
                        {CATEGORY_META.find((c) => c.id === submittedResult.partnerCategory)?.title}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLogin();
                      }}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-white cursor-pointer"
                    >
                      Check Application Status via Login
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#d7ff3f] text-black text-xs font-black cursor-pointer"
                    >
                      Return to Storefront
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
