import React, { useState } from 'react';
import { Truck, Lock, X, AlertCircle, ArrowRight, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { DeliveryCompany, DeliverySession } from '../types';
import { authenticateDeliveryLogin } from '../services/deliveryService';

interface DeliveryLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: DeliverySession) => void;
  onShowNotice: (msg: string) => void;
  defaultEmail?: string;
  defaultAccessCode?: string;
}

export const DeliveryLoginModal: React.FC<DeliveryLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowNotice,
  defaultEmail = '',
  defaultAccessCode = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [accessCode, setAccessCode] = useState(defaultAccessCode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = authenticateDeliveryLogin(email, accessCode);
      if (result.success && result.session) {
        onLoginSuccess(result.session);
        onClose();
        onShowNotice(`Welcome, ${result.session.companyName}! Restricted Dispatch Portal active.`);
      } else {
        setError(result.error || 'Authentication failed. Please verify your company email and access key.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-stone-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_80%_20%,rgba(215,255,63,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d7ff3f] text-[#111111] flex items-center justify-center font-black">
              <Truck className="w-5 h-5 text-[#111111]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7ff3f]">
                RESTRICTED LOGISTICS
              </div>
              <h3 className="text-lg font-black text-white">Delivery Partner Login</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Authorized dispatch portal for registered courier partners. Sign in using your company email and secret access key.
        </p>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-500" />
              <span>Authorized Company Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dispatch@bluedart-express.in"
              className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:border-[#d7ff3f] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-stone-500" />
              <span>Courier Secret Access Key</span>
            </label>
            <input
              type="password"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="DEL-BLUEDART-8891"
              className="w-full bg-[#1c1c1c] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-stone-500 focus:border-[#d7ff3f] outline-hidden"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#1a1a1a] border border-stone-800/80 text-[11px] text-stone-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span>Strict Privacy Enforced</span>
            </div>
            <div>
              Prepaid order prices are zeroed out. Only permitted recipient details and exact COD amounts are accessible.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black uppercase tracking-wider rounded-xl transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#d7ff3f]/10"
            >
              <span>ACCESS DISPATCH DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-[#111111]" />
            </button>
          </div>
        </form>

        {/* Demo Quick-fill helpers for test verification */}
        <div className="pt-3 border-t border-stone-800 text-center">
          <span className="text-[10px] text-stone-500 uppercase tracking-wider block mb-2">
            Quick Test Credentials (Pre-registered)
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('dispatch@bluedart-express.in');
                setAccessCode('DEL-BLUEDART-8891');
              }}
              className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-[#d7ff3f] text-[10px] font-bold cursor-pointer"
            >
              Blue Dart Express
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('ops.support@delhivery-logistics.com');
                setAccessCode('DEL-DELHIVERY-4420');
              }}
              className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-[#d7ff3f] text-[10px] font-bold cursor-pointer"
            >
              Delhivery Logistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
