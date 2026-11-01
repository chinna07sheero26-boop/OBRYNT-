import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Server,
  Lock,
  Building,
  CheckCircle2,
} from 'lucide-react';
import {
  validateStaffAccessCode,
  checkStaffServerStatus,
  StaffSession,
} from '../services/staffAuthService';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: StaffSession) => void;
  onShowNotice?: (msg: string) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowNotice,
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [serverMissing, setServerMissing] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);
  const [serverStatus, setServerStatus] = useState<{ checked: boolean; available: boolean }>({
    checked: false,
    available: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    // Check server status upon opening
    checkStaffServerStatus().then((status) => {
      if (!isSubscribed) return;
      setServerStatus({ checked: true, available: status.available });
      if (status.isLocked && status.lockRemainingSec > 0) {
        setLockoutSec(status.lockRemainingSec);
      }
    });

    const timer = setInterval(() => {
      setLockoutSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSec > 0 || isVerifying) return;

    setError('');
    setServerMissing(false);
    setIsVerifying(true);

    try {
      const result = await validateStaffAccessCode(accessCode);

      if (result.success && result.session) {
        onSuccess(result.session);
        setAccessCode('');
        setError('');
        onClose();
        if (onShowNotice) {
          onShowNotice('Authenticated: Staff Operations Session Active');
        }
      } else {
        if (result.isLocked && result.lockRemainingSec) {
          setLockoutSec(result.lockRemainingSec);
        }
        if (result.isServerConfigMissing) {
          setServerMissing(true);
        }
        setError(result.error || 'Invalid staff access code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#12161a] text-white rounded-3xl w-full max-w-md p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient cyan accent glow for staff portal */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            OBRYNT Staff Access Portal
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fulfillment, Inventory & Operations Team Authentication
          </p>

          {/* Server Validation Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-800 bg-slate-900/80">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            <span className="text-slate-300">
              Server-Side Cryptographic Validation
            </span>
          </div>
        </div>

        {/* Lockout Notice */}
        {lockoutSec > 0 ? (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-5 text-center my-4 space-y-2">
            <Clock className="w-7 h-7 text-rose-400 mx-auto" />
            <h4 className="text-sm font-bold text-rose-200">Staff Access Lockout Active</h4>
            <p className="text-xs text-slate-400">
              Repeated incorrect code attempts detected. Access is temporarily locked to protect against brute-force attacks.
            </p>
            <div className="text-lg font-mono font-black text-rose-400 pt-1">
              {Math.floor(lockoutSec / 60)}:
              {(lockoutSec % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Staff Keycode / Access Code
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  autoFocus
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setError('');
                    setServerMissing(false);
                  }}
                  placeholder="Enter 8-digit staff access code"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-sm font-medium text-white placeholder:text-slate-600 outline-hidden focus:border-cyan-400 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-1.5 text-xs text-rose-400 mt-2.5 font-medium leading-relaxed bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {serverMissing && (
                <div className="mt-3 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl text-xs text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Server className="w-3.5 h-3.5" />
                    <span>Backend Configuration Required</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ensure <code className="text-amber-200 font-mono">STAFF_ACCESS_CODE</code> is configured in your server environment variables.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || lockoutSec > 0}
              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating on Server...</span>
                </>
              ) : (
                <>
                  <span>UNLOCK STAFF OPERATIONS PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Role Demarcation Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 leading-normal space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Staff Role Permissions Only</span>
          </div>
          <p>
            Staff access grants permissions for order fulfillment, dispatch updates, and warehouse stock tracking. Financial reports and store governance require separate Owner credentials.
          </p>
        </div>
      </div>
    </div>
  );
};
