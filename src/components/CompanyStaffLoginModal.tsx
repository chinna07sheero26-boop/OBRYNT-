import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { authenticateStaffPassword } from '../services/companyService';
import { CompanyAccount, CompanyStaffSession } from '../types';

interface CompanyStaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: CompanyAccount, session: CompanyStaffSession) => void;
  onShowNotice?: (msg: string) => void;
}

export const CompanyStaffLoginModal: React.FC<CompanyStaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowNotice,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [matchedCompany, setMatchedCompany] = useState<CompanyAccount | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    setMatchedCompany(null);

    try {
      const result = await authenticateStaffPassword(password);

      if (result.success && result.company && result.session) {
        setMatchedCompany(result.company);
        if (onShowNotice) {
          onShowNotice(`Authenticated: ${result.company.name} fulfillment session active.`);
        }
        setTimeout(() => {
          onSuccess(result.company!, result.session!);
          setPassword('');
          setMatchedCompany(null);
          onClose();
        }, 600);
      } else {
        setErrorMessage(result.error || 'Invalid staff access credentials. Verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-stone-800 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors cursor-pointer p-1"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-wide text-white">Staff Fulfillment Access</h2>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Authorized company fulfillment personnel portal. Enter your dedicated company staff password to proceed.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Staff Access Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter company access password..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success greeting if matched */}
          {matchedCompany && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verified: Redirecting to {matchedCompany.name} Fulfillment Console...</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {isLoading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Access Fulfillment Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-stone-800/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Tenant Cryptographic Isolation · OBRYNT Security Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
