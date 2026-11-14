import React, { useState } from 'react';
import {
  X,
  Store,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Clock,
  Info,
  UserPlus,
} from 'lucide-react';
import { ShopStaffCategory, VendorAuthSession, VendorProfile } from '../types';
import { loginVendorPortal, resubmitPartnerMoreInfo } from '../services/vendorService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface VendorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: VendorAuthSession, profile?: VendorProfile) => void;
  onShowNotice: (msg: string) => void;
  onOpenPartnerOnboarding?: () => void;
  onOpenShopStaffLogin?: (staffCategory: ShopStaffCategory) => void;
}

export const VendorLoginModal: React.FC<VendorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowNotice,
  onOpenPartnerOnboarding,
  onOpenShopStaffLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [infoPromptMessage, setInfoPromptMessage] = useState<string | null>(null);

  // More-info resubmission fields
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitAddress, setResubmitAddress] = useState('');
  const [resubmitUrl, setResubmitUrl] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  if (!isOpen) return null;

  const getRoleTitle = (session: VendorAuthSession) => {
    if (session.partnerCategory === 'EXISTING_SUPPLIER') return 'Existing Supplier Dashboard';
    if (session.partnerCategory === 'ROADSIDE_STORE') return 'Roadside Store Dashboard';
    if (session.partnerCategory === 'GARMENT_SHOP') return 'Garment Shop Dashboard';
    return session.accountType === 'SHOP_OWNER' ? 'Dukani Shop Owner Panel' : 'Seller Partner Panel';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusCode(null);
    setInfoPromptMessage(null);

    if (!identifier.trim() || !password) {
      setError('Enter your Partner ID, Mobile Number, or Email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginVendorPortal(identifier.trim(), password);
      if (!result.success || !result.session) {
        setStatusCode(result.code || null);
        setInfoPromptMessage(result.infoRequestMessage || null);
        setError(result.error || 'Authentication failed.');
        return;
      }

      onShowNotice(`Welcome ${result.session.fullName} · ${getRoleTitle(result.session)} active`);
      setIdentifier('');
      setPassword('');
      onSuccess(result.session, result.profile);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitting(true);
    try {
      const res = await resubmitPartnerMoreInfo({
        identifier: identifier.trim(),
        password,
        address: resubmitAddress.trim() || undefined,
        existingWebsiteUrl: resubmitUrl.trim() || undefined,
        additionalInfo: resubmitNotes.trim() || undefined,
      });
      setStatusCode('APPLICATION_PENDING');
      setInfoPromptMessage(null);
      setError(res.message);
      onShowNotice('Updated partner details sent to OBRYNT Admin.');
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#121212] text-stone-100 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-[#d7ff3f]" />
                <span>OBRYNT Partner Login</span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Suppliers · Garment Shops · Roadside Stores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#d7ff3f] shrink-0 mt-0.5" />
            <div className="text-stone-300 leading-relaxed">
              <strong className="text-white block">Admin-Approved Partner Access</strong>
              New partners remain <strong>PENDING</strong> until verified by OBRYNT Admin. Sign in using Partner ID (SUP-, GAR-, RDS-, DUK-, SEL-), Mobile, or Email.
            </div>
          </div>

          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusCode === 'APPLICATION_PENDING'
                  ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                  : statusCode === 'MORE_INFO_REQUESTED'
                  ? 'bg-sky-950/60 border-sky-800 text-sky-200'
                  : 'bg-rose-950/70 border-rose-800 text-rose-200'
              }`}
            >
              {statusCode === 'APPLICATION_PENDING' ? (
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              ) : statusCode === 'MORE_INFO_REQUESTED' ? (
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <span>{error}</span>
            </div>
          )}

          {statusCode === 'MORE_INFO_REQUESTED' && (
            <form
              onSubmit={handleResubmitInfo}
              className="p-4 rounded-xl bg-stone-900 border border-sky-800/70 space-y-3 text-xs"
            >
              <div className="font-bold text-sky-300">
                Submit Requested Verification Info
              </div>
              {infoPromptMessage && (
                <p className="text-stone-300 italic">"{infoPromptMessage}"</p>
              )}
              <input
                type="text"
                value={resubmitAddress}
                onChange={(e) => setResubmitAddress(e.target.value)}
                placeholder="Updated business address (optional)"
                className="w-full min-h-[40px] bg-black border border-stone-700 rounded-lg px-3 text-white"
              />
              <input
                type="url"
                value={resubmitUrl}
                onChange={(e) => setResubmitUrl(e.target.value)}
                placeholder="Updated website / catalog URL (optional)"
                className="w-full min-h-[40px] bg-black border border-stone-700 rounded-lg px-3 text-white"
              />
              <textarea
                rows={2}
                required
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
                placeholder="Enter verification details requested by Admin..."
                className="w-full bg-black border border-stone-700 rounded-lg p-2.5 text-white"
              />
              <button
                type="submit"
                disabled={resubmitting}
                className="w-full min-h-[40px] rounded-lg bg-sky-400 text-black font-black cursor-pointer"
              >
                {resubmitting ? 'Sending...' : 'Send Updated Details for Re-Review'}
              </button>
            </form>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Partner ID, Mobile Number, or Email
              </label>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. SUP-1001, GAR-1001, RDS-1001, or +91 98..."
                className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your partner password"
                  className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-3 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-60 text-[#111111] text-xs font-black uppercase tracking-[0.16em] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Sign In to Partner Console'}</span>
            </button>
          </form>

          {(onOpenPartnerOnboarding || onOpenShopStaffLogin) && (
            <div className="pt-3 border-t border-stone-800 space-y-2.5">
              {onOpenPartnerOnboarding && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPartnerOnboarding();
                  }}
                  className="w-full min-h-[42px] py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#d7ff3f]" />
                  <span>New Partner Registration (Option A / B)</span>
                </button>
              )}

              {onOpenShopStaffLogin && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenShopStaffLogin('GARMENT_SHOP');
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-lg bg-black hover:bg-stone-900 border border-stone-800 text-[11px] font-bold text-stone-300 cursor-pointer"
                  >
                    Garment Staff Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenShopStaffLogin('ROADSIDE_STORE');
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-lg bg-black hover:bg-stone-900 border border-stone-800 text-[11px] font-bold text-stone-300 cursor-pointer"
                  >
                    Roadside Staff Login
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <Lock className="w-3 h-3" />
            <span>Role-isolated encrypted session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
