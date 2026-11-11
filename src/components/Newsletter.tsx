import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface NewsletterProps {
  onShowNotice: (msg: string) => void;
}

export const Newsletter: React.FC<NewsletterProps> = ({ onShowNotice }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    onShowNotice('Thank you. You are now subscribed to the OBRYNT Private Journal.');
  };

  return (
    <section className="my-14 sm:my-20 bg-neutral-50 border border-neutral-200 p-8 sm:p-12 lg:p-16 text-black">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-neutral-400 block">
          THE OBRYNT JOURNAL & PRIVATE CLIENT EDITIONS
        </span>
        
        <h2 className="font-luxury text-2xl sm:text-4xl font-bold tracking-[0.08em] text-black uppercase">
          Join The Inner Circle
        </h2>

        <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed max-w-xl mx-auto">
          Receive exclusive invitations to private seasonal runway drops, limited capsule editions, and tailored bespoke atelier collaborations.
        </p>

        {isSubscribed ? (
          <div className="bg-black text-white p-4 max-w-md mx-auto flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Welcome. Use private code <strong>OBRYNT10</strong> for 10% off.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-white text-black px-4 py-3.5 text-xs border border-neutral-300 outline-hidden focus:border-black placeholder:text-neutral-400"
              aria-label="Email address for newsletter"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-[0.18em] transition-colors cursor-pointer shrink-0"
            >
              SUBSCRIBE
            </button>
          </form>
        )}

        <p className="text-[10px] text-neutral-400 tracking-wider uppercase pt-2">
          By subscribing, you agree to our privacy policy. You can withdraw consent anytime.
        </p>
      </div>
    </section>
  );
};
