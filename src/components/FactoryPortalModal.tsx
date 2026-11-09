import React, { useState, useEffect } from 'react';
import {
  X,
  Factory,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  authenticateFactoryWithToken,
  authenticateFactoryWithKey,
} from '../services/factoryService';
import { FactoryPartner, FactorySession } from '../types';

interface FactoryPortalModalProps {
  isOpen: boolean;
  initialToken?: string;
  onClose: () => void;
  onSuccess: (factory: FactoryPartner, session: FactorySession) => void;
  onShowNotice?: (msg: string) => void;
}

export const FactoryPortalModal: React.FC<FactoryPortalModalProps> = ({
  isOpen,
  initialToken = '',
  onClose,
  onSuccess,
  onShowNotice,
}) => {
  const [authMode, setAuthMode] = useState<'token' | 'key'>('token');
  const [inviteToken, setInviteToken] = useState(initialToken);
  const [factoryId, setFactoryId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialToken) {
      setInviteToken(initialToken);
      setAuthMode('token');
    }
  }, [initialToken]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      let result;
      if (authMode === 'token') {
        if (!inviteToken.trim()) {
          setErrorMessage('Invitation token is required.');
          setIsLoading(false);
          return;
        }
        result = await authenticateFactoryWithToken(inviteToken);
      } else {
        if (!factoryId.trim() || !secretKey.trim()) {
          setErrorMessage('Factory ID and Secret Key are required.');
          setIsLoading(false);
          return;
        }
        result = await authenticateFactoryWithKey(factoryId, secretKey);
      }

      if (result.success && result.factory && result.session) {
        if (onShowNotice) {
          onShowNotice(`Welcome, ${result.factory.name}. Factory Sourcing Portal active.`);
        }
        onSuccess(result.factory, result.session);
        onClose();
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
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

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <Factory className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-wide text-white">Factory Partner Portal</h2>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Authorized apparel factory and mill partner portal. Authenticate with your invitation link or key.
          </p>
        </div>

        {/* Switcher */}
        <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('token');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              authMode === 'token' ? 'bg-stone-800 text-[#d7ff3f]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Invitation Token
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('key');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              authMode === 'key' ? 'bg-stone-800 text-[#d7ff3f]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Factory ID & Key
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'token' ? (
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Invitation Token / Link Key *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={inviteToken}
                onChange={(e) => {
                  setInviteToken(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g. FAC-INV-TIRUPUR-7781"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 transition-colors font-mono"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Factory ID or Email *
                </label>
                <input
                  type="text"
                  required
                  value={factoryId}
                  onChange={(e) => {
                    setFactoryId(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. FAC-TIRUPUR-101 or email"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Access Secret Key *
                </label>
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => {
                    setSecretKey(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#d7ff3f] hover:bg-[#cbf532] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Factory Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-stone-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>OBRYNT Direct Sourcing & Supplier Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
