import React, { useState } from 'react';
import { X, ShieldCheck, Key, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedPasscode?: string;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  savedPasscode = '2026',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Accept default owner passcode '2026' or 'obrynt' or any customized passcode
    if (pin.trim() === savedPasscode || pin.trim() === '2026' || pin.trim().toLowerCase() === 'obrynt') {
      onSuccess();
      onClose();
    } else {
      setError('Incorrect Owner PIN. (Default demo PIN is: 2026)');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] text-white rounded-3xl w-full max-w-sm p-6 sm:p-8 border border-stone-800 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#d7ff3f] text-[#111111] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#d7ff3f]/10">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            OBRYNT Owner Portal
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Restricted Merchant Access · Store Control Center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              Enter Owner Passcode
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter 4-digit PIN (Default: 2026)"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white tracking-widest placeholder:text-stone-600 outline-hidden focus:border-[#d7ff3f]"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black text-xs uppercase tracking-wider rounded-full transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>UNLOCK OWNER DASHBOARD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-800/80 text-center text-[11px] text-stone-500 leading-normal">
          This portal is hidden from public customers.<br />
          Default owner PIN: <strong className="text-stone-300">2026</strong> (customizable in settings).
        </div>
      </div>
    </div>
  );
};
