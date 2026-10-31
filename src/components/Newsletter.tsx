import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

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
    onShowNotice('Thanks! You are now subscribed to the OBRYNT drop list.');
  };

  return (
    <section className="my-12 sm:my-16 bg-[#d7ff3f] rounded-[22px] p-6 sm:p-10 lg:p-12 text-[#111111] shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-[-0.04em] mb-2 uppercase">
            Be first in the drop.
          </h2>
          <p className="text-sm font-medium text-stone-800 max-w-md">
            Get exclusive early access to limited capsule releases, artist studio collaborations, and custom fashion drops.
          </p>
        </div>

        {isSubscribed ? (
          <div className="bg-black/90 text-white rounded-full px-6 py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#d7ff3f]" />
            <span className="text-sm font-bold">
              Welcome to the inner circle! Use code <strong>OBRYNT10</strong> for 10% off.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full lg:max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 bg-white text-[#111111] px-5 py-3.5 rounded-full text-sm font-medium border border-black/10 outline-hidden focus:ring-2 focus:ring-black placeholder:text-stone-400 shadow-xs"
              aria-label="Email address for newsletter"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#111111] hover:bg-black text-white text-xs sm:text-sm font-black rounded-full transition-transform active:scale-95 cursor-pointer shadow-md uppercase tracking-wider shrink-0"
            >
              JOIN THE LIST
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
