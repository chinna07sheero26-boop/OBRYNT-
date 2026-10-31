# THREADLAB — Modern Clothing Store

Welcome to **THREADLAB**, a modern, mobile-friendly fashion e-commerce storefront designed for fast, free hosting on GitHub Pages.

## 🚀 Live Demo on GitHub Pages
Your live store URL:
**https://chinna07sheero26-boop.github.io/threads-labstore/**

---

## ✨ Features
- **9 Core Categories**: Plain T-shirts, Printed T-shirts, Gym T-shirts, Shirts, Jeans, Trousers, Shorts, Joggers, Hoodies & Sweatshirts.
- **Large Catalogue Architecture**: Instant switching between 25 curated products, **2 Lakhs (2,00,000)**, or **4 Lakhs (4,00,000)** garments with $O(1)$ virtual indexing, instant category filters, and zero mobile lag.
- **Lazy Loading**: Native `loading="lazy"` + async image decoding with smooth shimmer placeholders and automatic zero-broken fallback.
- **Product Reviews & Ratings**: 5-star customer reviews, fit consensus meter, verified purchaser badges, and interactive review submission with localStorage persistence.
- **SEO & Google Search**: Pre-built `sitemap.xml` with Google Image tags and Google Search Console indexing guide.
- **Shopping Bag & Checkout**: Size selection, quantity counter, coupon codes (`THREAD10`, `WELCOME50`, `FREESHIP`), free shipping meter, Indian address form, UPI/Card/COD simulated payment, and printable PDF/text invoice.
- **Admin Catalogue Suite**: Add, edit, or delete products live in the browser, export new `products.csv`, download updated `sitemap.xml`, or upload custom CSV batches.

---

## 📱 How to Deploy to GitHub Pages (Beginner Friendly)

### Method 1: Using your Phone or Web Browser (Easiest)
1. Open your repository: [https://github.com/chinna07sheero26-boop/threads-labstore](https://github.com/chinna07sheero26-boop/threads-labstore)
2. Tap **Add file** > **Upload files**.
3. Drag & drop or select all files from the downloaded `threadlab-github-pages.zip` (`index.html`, `assets/`, `images/`, `products.csv`, `robots.txt`, `sitemap.xml`, `.nojekyll`).
4. Click **Commit changes**.
5. Go to repository **Settings** > **Pages** (on the left menu).
6. Under **Build and deployment** > **Branch**, select `main` and `/ (root)`, then click **Save**.
7. Wait 60 seconds. Your website will be live at:
   `https://chinna07sheero26-boop.github.io/threads-labstore/`

### Method 2: Using Git Terminal / Termux
```bash
git clone https://github.com/chinna07sheero26-boop/threads-labstore.git
cd threads-labstore
# Copy the built files here
git add .
git commit -m "Deploy THREADLAB store with 2 to 4 lakhs clothes catalogue & sitemap"
git branch -M main
git push -u origin main
```

---

## 📄 Licence
Apache-2.0
