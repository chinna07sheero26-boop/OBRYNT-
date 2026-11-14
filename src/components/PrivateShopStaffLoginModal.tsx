import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { ShopStaffCategory, ShopStaffSession } from '../types';
import { loginPrivateShopStaff } from '../services/vendorService';
import { OBRYNT_EMBLEM_SRC } from './ObryntBrand';

interface PrivateShopStaffLoginModalProps {
  isOpen: boolean;
  staffCategory: ShopStaffCategory;
  accessToken?: string;
  onClose: () => void;
  onSuccess: (session: ShopStaffSession) => void;
  onShowNotice: (msg: string) => void;
}

export const PrivateShopStaffLoginModal: React.FC<PrivateShopStaffLoginModalProps> = ({
  isOpen,
  staffCategory,
  accessToken,
  onClose,
  onSuccess,
  onShowNotice,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const title =
    staffCategory === 'ROADSIDE_STORE'
      ? 'Roadside Store Staff Login'
      : 'Garment Staff Login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Enter your private staff password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginPrivateShopStaff({
        staffType: staffCategory,
        password,
        accessToken: accessToken?.trim() || undefined,
      });

      if (!res.success || !res.session) {
        setError(res.error || 'Invalid staff access credentials.');
        return;
      }

      setPassword('');
      onShowNotice(`Authenticated · ${res.session.staffCode} workstation active`);
      onSuccess(res.session);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#121212] text-stone-100 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-black shrink-0">
              <img src={OBRYNT_EMBLEM_SRC} alt="OBRYNT" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">
                {title}
              </h2>
              <p className="text-[11px] text-stone-400">Private Shop Staff Access</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
            aria-label="Close staff login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-300 block">
              Staff Access Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter assigned staff password"
                className="w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-xl pl-3.5 pr-11 py-2.5 text-xs font-semibold text-white placeholder:text-stone-500 outline-hidden focus:border-[#d7ff3f]"
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
            className="w-full min-h-[44px] py-3 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] disabled:opacity-60 text-[#111111] text-xs font-black uppercase tracking-[0.16em] flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'VERIFYING...' : 'SIGN IN'}</span>
          </button>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <Lock className="w-3 h-3" />
            <span>Single-shop isolated staff access</span>
          </div>
        </form>
      </div>
    </div>
  );
};
