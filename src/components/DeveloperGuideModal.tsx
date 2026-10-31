import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Globe,
  Database,
  Lock,
  ExternalLink,
  ChevronRight,
  Terminal,
  Download,
} from 'lucide-react';

interface DeveloperGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperGuideModal: React.FC<DeveloperGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'fix-blank' | 'hosting' | 'seo' | 'payments' | 'auth' | 'images'>('fix-blank');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-lg font-bold text-stone-950 font-display flex items-center gap-2">
              <span>THREADLAB Store Owner Guide</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">GitHub Pages Ready</span>
            </h2>
            <p className="text-xs text-stone-500">
              Fix blank screen, Google Search indexing, free hosting, and payment gateways.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-stone-200 bg-stone-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('fix-blank')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'fix-blank' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-stone-700 hover:text-stone-950 bg-stone-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fix Blank Screen on GitHub</span>
          </button>
          <button
            onClick={() => setActiveSection('seo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'seo' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold">Add to Google Search</span>
          </button>
          <button
            onClick={() => setActiveSection('hosting')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'hosting' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>GitHub Pages on Android</span>
          </button>
          <button
            onClick={() => setActiveSection('payments')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'payments' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Gateway Setup</span>
          </button>
          <button
            onClick={() => setActiveSection('auth')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'auth' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Customer Accounts</span>
          </button>
          <button
            onClick={() => setActiveSection('images')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'images' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Product Photos</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-stone-800 text-xs sm:text-sm space-y-6">
          {/* Instant Download Card for User */}
          <div className="bg-stone-900 text-white rounded-xl p-4 sm:p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-display text-white">
                  Download Pre-Built Website Files
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  Pre-compiled static website ready to upload straight to GitHub Pages without running any commands!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <a
                href="./index-standalone.html"
                download="index.html"
                className="py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>Standalone index.html (Best)</span>
              </a>

              <a
                href="./threadlab-standalone-index.zip"
                download="threadlab-standalone-index.zip"
                className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>All-in-One .ZIP (770KB)</span>
              </a>

              <a
                href="./products.csv"
                download="products.csv"
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold rounded-lg flex items-center justify-center gap-2 text-xs transition-colors border border-stone-700"
              >
                <Download className="w-4 h-4 text-stone-300" />
                <span>products.csv File</span>
              </a>
            </div>
          </div>

          {/* SECTION: FIX BLANK SCREEN ON GITHUB */}
          {activeSection === 'fix-blank' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-emerald-950 font-display mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Why It Was Blank & How We Fixed It</span>
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  On Android phones, GitHub's file uploader cannot upload folders (like <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">assets/</code>), and GitHub Pages cannot compile TypeScript files without building. We have created a <strong>100% Self-Contained Standalone index.html</strong> where all JavaScript, CSS styles, and features are inlined into <strong>one single file</strong>!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Download the Single "index.html" File
                    </h4>
                    <p className="text-xs text-stone-600">
                      Tap the green <strong>"Standalone index.html (Best)"</strong> button above. It saves directly to your phone's Downloads as <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">index.html</code>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Upload index.html to your GitHub Repository
                    </h4>
                    <p className="text-xs text-stone-600">
                      Open your repo in Chrome on your phone: <a href="https://github.com/chinna07sheero26-boop/threads-labstore" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">github.com/chinna07sheero26-boop/threads-labstore</a>. Tap <strong>Add file</strong> → <strong>Upload files</strong>, select the <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">index.html</code> from your phone, and tap <strong>Commit changes</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Verify GitHub Pages Settings
                    </h4>
                    <p className="text-xs text-stone-600">
                      In your repo on GitHub, go to <strong>Settings</strong> (tab) → <strong>Pages</strong> (left sidebar). Under <strong>Branch</strong>, make sure <strong>main</strong> and <strong>/ (root)</strong> is selected. Tap <strong>Save</strong> if not already saved.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Refresh Your Store URL
                    </h4>
                    <p className="text-xs text-stone-600">
                      Wait 30–60 seconds for GitHub's server to update. Then open:
                    </p>
                    <div className="pt-1">
                      <a
                        href="https://chinna07sheero26-boop.github.io/threads-labstore/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950 text-white font-mono text-xs font-semibold hover:bg-stone-800"
                      >
                        <span>https://chinna07sheero26-boop.github.io/threads-labstore/</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ADD TO GOOGLE SEARCH (SEO) */}
          {activeSection === 'seo' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-blue-950 font-display mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-700" />
                  <span>How to Make Your Website Appear on Google Search</span>
                </h3>
                <p className="text-xs text-blue-900 leading-relaxed">
                  We have already added full <strong>Google SEO Meta Tags</strong>, <strong>Schema.org ClothingStore Structured Data</strong>, <strong>robots.txt</strong>, and <strong>sitemap.xml</strong> to your site. Follow these 4 simple steps so that when your friends search <strong>"THREADLAB"</strong> or <strong>"THREADLAB clothing"</strong>, Google displays your store!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Deploy Your Site to GitHub Pages
                    </h4>
                    <p className="text-xs text-stone-600">
                      Before Google can index your site, it must be live on the internet. Make sure your GitHub Pages link is active (e.g. <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">https://&lt;your-username&gt;.github.io/threadlab-store/</code>).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Open Google Search Console
                    </h4>
                    <p className="text-xs text-stone-600">
                      On your phone or computer, open Chrome and search for <strong>"Google Search Console"</strong> or go to <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">search.google.com/search-console</code>. Sign in with your Google / Gmail account.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Add Your Property & Submit Sitemap
                    </h4>
                    <p className="text-xs text-stone-600">
                      Choose <strong>"URL prefix"</strong> and paste your GitHub Pages website URL. In the left menu, tap <strong>Sitemaps</strong>, type <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">sitemap.xml</code>, and tap <strong>Submit</strong>. Googlebot will now read all your garment categories!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Tap "Request Indexing" for Fast Results
                    </h4>
                    <p className="text-xs text-stone-600">
                      In Search Console, paste your website URL in the top search box (<strong>URL Inspection</strong>) and tap <strong>"Request Indexing"</strong>. This tells Google to crawl your website immediately rather than waiting weeks.
                    </p>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1">
                  <span className="font-bold text-stone-900">Pro-tip for fast indexing:</span>
                  <p className="text-stone-600">
                    Send your website link to 3–5 friends on WhatsApp, post it on your Instagram bio, or link it on LinkedIn/Twitter. Real user clicks and backlinks signal to Google's ranking algorithms that your website is legitimate and active, helping it rank quickly!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: GITHUB PAGES FREE HOSTING ON ANDROID */}
          {activeSection === 'hosting' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-stone-950 font-display mb-1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-stone-900" />
                  <span>Step-by-Step: Host for Free using GitHub Pages (From Your Phone)</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  GitHub Pages provides 100% free hosting with free SSL (https://). You can manage your entire apparel store right from an Android browser without paying for expensive hosting servers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">Create a Free GitHub Account & Repository</h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Open Chrome on your phone, visit <strong>github.com</strong> and create a free account. Tap the <strong>+</strong> icon at the top and tap <strong>New repository</strong>. Name it <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">threadlab-store</code> and set it to <strong>Public</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">Download products.csv from this App</h4>
                    <p className="text-xs text-stone-600 mt-1">
                      In the THREADLAB app, click the <strong>CSV Admin</strong> button in the top navigation and click <strong>"Download products.csv"</strong>. The file will save directly to your phone's Downloads folder.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">Upload Project Files & Enable GitHub Pages</h4>
                    <p className="text-xs text-stone-600 mt-1">
                      On your repository page on GitHub:
                    </p>
                    <ul className="list-disc pl-5 text-xs text-stone-600 mt-1 space-y-1">
                      <li>Tap <strong>Add file</strong> → <strong>Upload files</strong> to upload your website code.</li>
                      <li>Go to <strong>Settings</strong> tab → <strong>Pages</strong> on the left menu.</li>
                      <li>Under <strong>Build and deployment</strong>, select <strong>GitHub Actions</strong> or select <strong>Deploy from a branch (gh-pages / root)</strong>.</li>
                      <li>Your free live store will be published at <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">https://&lt;your-username&gt;.github.io/threadlab-store/</code>!</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">Updating Products Anytime from Your Phone</h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Whenever you want to add new T-shirts, change prices in INR, or update stock: open <strong>Google Sheets</strong> on your Android phone, edit your columns, tap <strong>Share & Export → Save as CSV</strong>, and upload it to replace <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">public/products.csv</code> on GitHub! Your live store will update instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PAYMENT GATEWAY ARCHITECTURE */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-stone-950 font-display mb-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-stone-900" />
                  <span>Legitimate Payment Gateway Integration (India)</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  <strong>Crucial Security Rule:</strong> Never put payment secrets (<code className="font-mono bg-stone-200 px-1 py-0.5 rounded">rzp_live_secret</code> or Stripe private keys) in frontend code or on GitHub Pages. Any user can view frontend source code!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-lg border border-stone-200 space-y-2">
                  <h4 className="font-bold text-stone-950 text-xs sm:text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>The Recommended Free / Zero-Server Architecture:</span>
                  </h4>
                  <p className="text-xs text-stone-600">
                    Since GitHub Pages only hosts static files, connect payments using a free serverless proxy:
                  </p>
                  <div className="bg-stone-900 text-stone-200 p-3 rounded-lg font-mono text-[11px] space-y-1">
                    <div>1. Customer taps "Proceed to Payment" in THREADLAB</div>
                    <div>2. Frontend calls Free Cloudflare Worker or Supabase Edge Function:</div>
                    <div className="text-stone-400 pl-4">POST /api/create-razorpay-order &#123; amount: 1598, currency: "INR" &#125;</div>
                    <div>3. Serverless worker creates Order ID with Razorpay using secret key</div>
                    <div>4. Frontend opens official Razorpay Checkout modal with the Order ID:</div>
                    <div className="text-emerald-400 pl-4">razorpay = new window.Razorpay(options); razorpay.open();</div>
                    <div>5. Customer pays via UPI / Cards / NetBanking securely on Razorpay</div>
                    <div>6. Razorpay Webhook validates signature and confirms order!</div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1.5">
                  <h4 className="font-bold text-stone-900 text-xs">Top Indian Gateways to Apply for:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Razorpay:</strong> Best documentation, instant UPI QR, RuPay, NetBanking, and credit/debit cards.</li>
                    <li><strong>Cashfree Payments:</strong> Low transaction fees, instant settlements, UPI autopay.</li>
                    <li><strong>PhonePe Payment Gateway:</strong> High UPI success rates across India.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CUSTOMER ACCOUNTS BACKEND */}
          {activeSection === 'auth' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-stone-950 font-display mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-stone-900" />
                  <span>Customer Accounts, Login & Order History Architecture</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  GitHub Pages does not run a database. To store real customer passwords, encrypted login tokens, saved addresses, and persistent order histories, connect one of these free backend services:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-stone-950 text-sm">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Firebase Auth & Firestore (Google)</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Provides 100% free client-side SDK that works directly on GitHub Pages! Supports Google 1-tap sign-in, Phone SMS OTP login, and Firestore database to store customer addresses and orders.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Free Tier: 50,000 monthly active users
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-stone-950 text-sm">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Supabase (Open-Source PostgreSQL)</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Provides modern PostgreSQL relational database, Row Level Security (RLS) to keep customer data private, email passwordless magic links, and direct JS client library.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Free Tier: 500MB database + 50,000 users
                  </span>
                </div>
              </div>

              <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-700">
                <strong>Why this app uses local storage for the demo:</strong> You can test adding to bag, wishlisting items, and placing simulated orders right now without setting up any backend. When you're ready for production, plug in Firebase or Supabase!
              </div>
            </div>
          )}

          {/* SECTION 4: PRODUCT PHOTOS & SOURCING */}
          {activeSection === 'images' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-stone-950 font-display mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-stone-900" />
                  <span>How to Add Your Real Apparel Photos to THREADLAB</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  The initial products use sample photos. Here is how to replace them with your real clothing brand photos:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-lg border border-stone-200">
                  <h4 className="font-bold text-stone-950 text-xs sm:text-sm mb-1">
                    Option A: Free Image Hosting on Cloudinary or ImgBB
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Take high-resolution photos of your t-shirts or jeans on an off-white background with your phone. Upload them to <strong>cloudinary.com</strong> or <strong>imgbb.com</strong>, copy the direct image link (e.g. <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">https://res.cloudinary.com/.../tshirt.jpg</code>), and paste it into the <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">imageUrl</code> column in your CSV!
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-stone-200">
                  <h4 className="font-bold text-stone-950 text-xs sm:text-sm mb-1">
                    Option B: Keep Images in Your GitHub Repository
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Create a folder called <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">public/images/</code> in your GitHub repository. Upload your photos there (e.g. <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">black-tee.jpg</code>). In your <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">products.csv</code>, set <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">imageUrl</code> to <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">./images/black-tee.jpg</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-stone-950 hover:bg-stone-800 rounded-lg cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
