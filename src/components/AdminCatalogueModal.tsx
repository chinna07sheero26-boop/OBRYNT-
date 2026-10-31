import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  HelpCircle,
} from 'lucide-react';
import { Product, ALL_CATEGORIES, Category } from '../types';
import {
  CSV_HEADERS,
  parseCSV,
  csvRowsToProducts,
  downloadProductsCsvFile,
  downloadSitemapXmlFile,
  DEFAULT_PRODUCTS,
} from '../services/csvService';

interface AdminCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProducts: (newProducts: Product[]) => void;
}

export const AdminCatalogueModal: React.FC<AdminCatalogueModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProducts,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'manage' | 'add' | 'docs'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New product form state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Plain T-shirts');
  const [formPrice, setFormPrice] = useState('799');
  const [formSizes, setFormSizes] = useState('S, M, L, XL, XXL');
  const [formColor, setFormColor] = useState('Onyx Black');
  const [formDesc, setFormDesc] = useState('');
  const [formStock, setFormStock] = useState('30');
  const [formImageUrl, setFormImageUrl] = useState('/src/assets/images/product_tshirt_minimal_1793012315796.jpg');
  const [formBadge, setFormBadge] = useState('New Arrival');
  const [formMaterial, setFormMaterial] = useState('100% Combed Cotton');
  const [formFit, setFormFit] = useState('Relaxed Boxy Fit');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      showStatus('error', 'SKU and Product Name are required.');
      return;
    }

    const sizesArr = formSizes
      .split(/[,/|]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newProd: Product = {
      sku: formSku.trim(),
      name: formName.trim(),
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      sizes: sizesArr.length > 0 ? sizesArr : ['S', 'M', 'L', 'XL'],
      color: formColor.trim() || 'Standard',
      description: formDesc.trim() || 'Crafted with premium cotton fabric for everyday durability.',
      stock: parseInt(formStock, 10) || 0,
      imageUrl: formImageUrl.trim() || '/src/assets/images/product_tshirt_minimal_1793012315796.jpg',
      badge: formBadge.trim() || undefined,
      material: formMaterial.trim() || undefined,
      fit: formFit.trim() || undefined,
    };

    if (editingProduct) {
      // Update existing
      const updated = products.map((p) => (p.sku === editingProduct.sku ? newProd : p));
      onUpdateProducts(updated);
      showStatus('success', `Product ${newProd.sku} updated successfully!`);
      setEditingProduct(null);
    } else {
      // Add new
      if (products.some((p) => p.sku === newProd.sku)) {
        showStatus('error', `SKU "${newProd.sku}" already exists! Please use a unique SKU.`);
        return;
      }
      onUpdateProducts([newProd, ...products]);
      showStatus('success', `Product ${newProd.name} added to catalogue!`);
    }

    // Reset Form
    resetForm();
    setActiveTab('manage');
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormCategory(p.category as Category);
    setFormPrice(p.price.toString());
    setFormSizes(p.sizes.join(', '));
    setFormColor(p.color);
    setFormDesc(p.description);
    setFormStock(p.stock.toString());
    setFormImageUrl(p.imageUrl);
    setFormBadge(p.badge || '');
    setFormMaterial(p.material || '');
    setFormFit(p.fit || '');
    setActiveTab('add');
  };

  const handleDeleteProduct = (sku: string) => {
    if (window.confirm(`Are you sure you want to remove item ${sku}?`)) {
      const updated = products.filter((p) => p.sku !== sku);
      onUpdateProducts(updated);
      showStatus('success', `Product ${sku} removed from catalogue.`);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormCategory('Plain T-shirts');
    setFormPrice('799');
    setFormSizes('S, M, L, XL, XXL');
    setFormColor('Onyx Black');
    setFormDesc('');
    setFormStock('30');
    setFormImageUrl('/src/assets/images/product_tshirt_minimal_1793012315796.jpg');
    setFormBadge('');
    setFormMaterial('');
    setFormFit('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        const { products: parsedProds, errors } = csvRowsToProducts(rows);

        if (parsedProds.length > 0) {
          onUpdateProducts(parsedProds);
          showStatus(
            'success',
            `Successfully imported ${parsedProds.length} products from CSV!` +
              (errors.length > 0 ? ` (${errors.length} warnings)` : '')
          );
        } else {
          showStatus('error', errors[0] || 'No valid products found in CSV file.');
        }
      } catch (err) {
        showStatus('error', 'Error reading CSV file. Please verify CSV formatting.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToFactory = () => {
    if (window.confirm('Reset catalogue back to factory starter products?')) {
      onUpdateProducts(DEFAULT_PRODUCTS);
      showStatus('success', 'Catalogue reset to factory default products.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-stone-800" />
            <div>
              <h2 className="text-lg font-bold text-stone-950 font-display">
                Catalogue & CSV Management
              </h2>
              <p className="text-xs text-stone-500">
                Add, edit, remove products and export/import <code className="font-mono">products.csv</code> for GitHub Pages.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Actions Strip */}
        <div className="px-6 py-3 border-b border-stone-200 bg-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-stone-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'manage' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Manage Catalogue ({products.length})
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('add');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'add' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {editingProduct ? 'Edit Product' : '+ Add New Product'}
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'docs' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              CSV Schema Guide
            </button>
          </div>

          {/* Quick CSV Export / Import Buttons */}
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              <span>Import CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => downloadProductsCsvFile(products)}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-lg flex items-center gap-1.5 cursor-pointer"
              title="Download products.csv file ready to commit to GitHub"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download products.csv</span>
            </button>

            <button
              onClick={() => downloadSitemapXmlFile(products)}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-lg flex items-center gap-1.5 cursor-pointer"
              title="Download fresh sitemap.xml for Google Search indexing"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sitemap.xml</span>
            </button>

            <a
              href="./threadlab-github-pages.zip"
              download="threadlab-github-pages.zip"
              className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Download complete pre-built website for GitHub Pages"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download Web Files (.ZIP)</span>
            </a>

            <a
              href="./threadlab-source-code.zip"
              download="threadlab-source-code.zip"
              className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
              title="Download full project TypeScript source code"
            >
              <Download className="w-3.5 h-3.5 text-stone-700" />
              <span>Source Code (.ZIP)</span>
            </a>

            <button
              onClick={handleResetToFactory}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Reset to factory starter catalogue"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MANAGE CATALOGUE TABLE */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search catalogue by name, SKU, or category..."
                    className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div className="text-xs text-stone-500 font-mono">
                  {filteredProducts.length} items
                </div>
              </div>

              {/* Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Sizes</th>
                        <th className="py-2.5 px-3">Stock</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.sku} className="hover:bg-stone-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-8 h-8 rounded object-cover bg-stone-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="font-semibold text-stone-900 line-clamp-1 max-w-[200px]">
                                {p.name}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-stone-500">{p.sku}</td>
                          <td className="py-2.5 px-3 text-stone-700">{p.category}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                            ₹{p.price}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                            {p.sizes.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                p.stock > 10
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : p.stock > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.sku)}
                                className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT PRODUCT FORM */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveProduct} className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  {editingProduct ? `Edit Garment: ${editingProduct.sku}` : 'Add New Garment to Catalogue'}
                </h3>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    SKU Code (Unique ID)*
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. TL-PTS-09"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category*</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Name / Title*
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Heavyweight 240 GSM Boxy Plain Tee"
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Price in INR (₹)*
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="799"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Stock Quantity*
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="30"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Color*</label>
                  <input
                    type="text"
                    required
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="e.g. Onyx Black"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Sizes Available (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formSizes}
                  onChange={(e) => setFormSizes(e.target.value)}
                  placeholder="e.g. S, M, L, XL, XXL (or 30, 32, 34 for jeans)"
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Image URL or Path
                </label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="/src/assets/images/... or https://..."
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Garment Description
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Fabric specs, collar finish, drape, feel..."
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Best Seller, Limited"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Material</label>
                  <input
                    type="text"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    placeholder="e.g. 100% Combed Cotton"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Fit</label>
                  <input
                    type="text"
                    value={formFit}
                    onChange={(e) => setFormFit(e.target.value)}
                    placeholder="e.g. Boxy Oversized Fit"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-lg shadow-sm cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CSV SCHEMA DOCUMENTATION */}
          {activeTab === 'docs' && (
            <div className="max-w-3xl mx-auto space-y-6 text-xs text-stone-700">
              <div>
                <h3 className="text-base font-bold text-stone-950 font-display mb-2">
                  How products.csv Works with GitHub Pages
                </h3>
                <p className="leading-relaxed">
                  THREADLAB reads from <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">public/products.csv</code>. You can easily expand your catalogue to thousands of items without editing any HTML or code. Just edit your CSV file in Google Sheets or Microsoft Excel, save it as CSV, and download/commit it to your repository!
                </p>
              </div>

              {/* Required Columns Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-900 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">Column Header</th>
                      <th className="py-2 px-3">Required?</th>
                      <th className="py-2 px-3">Example Value</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">sku</td>
                      <td className="py-2 px-3 text-red-600 font-bold">Yes</td>
                      <td className="py-2 px-3 font-mono">TL-PTS-001</td>
                      <td className="py-2 px-3">Unique identifier code for each garment.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">name</td>
                      <td className="py-2 px-3 text-red-600 font-bold">Yes</td>
                      <td className="py-2 px-3">Heavyweight 240 GSM Boxy Tee</td>
                      <td className="py-2 px-3">Public garment title shown to customers.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">category</td>
                      <td className="py-2 px-3 text-red-600 font-bold">Yes</td>
                      <td className="py-2 px-3">Plain T-shirts</td>
                      <td className="py-2 px-3">One of the 9 official clothing categories.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">price</td>
                      <td className="py-2 px-3 text-red-600 font-bold">Yes</td>
                      <td className="py-2 px-3 font-mono">799</td>
                      <td className="py-2 px-3">Price in Indian Rupees (numbers only, no ₹ symbol in CSV).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">sizes</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3 font-mono">"S, M, L, XL, XXL"</td>
                      <td className="py-2 px-3">Comma-separated sizes (enclosed in quotes).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">color</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3">Onyx Black</td>
                      <td className="py-2 px-3">Garment color tone.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">description</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3">100% combed cotton jersey...</td>
                      <td className="py-2 px-3">Detailed product description.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">stock</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3 font-mono">45</td>
                      <td className="py-2 px-3">Number of units currently in warehouse.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">imageUrl</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3 font-mono text-[10px]">https://...</td>
                      <td className="py-2 px-3">Direct link or relative path to product photo.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">badge</td>
                      <td className="py-2 px-3 text-stone-500">Optional</td>
                      <td className="py-2 px-3">Best Seller</td>
                      <td className="py-2 px-3">Highlight label tag on product card.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sample Raw Row */}
              <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                <div className="text-stone-400 font-sans font-bold">Sample CSV Row Template:</div>
                <div className="text-stone-300">
                  sku,name,category,price,sizes,color,description,stock,imageUrl,badge,material,fit
                </div>
                <div className="text-emerald-400">
                  TL-PTS-099,Raw Hem Heavyweight Tee,Plain T-shirts,799,"S, M, L, XL",Onyx Black,Vintage washed 240 GSM jersey,40,https://images.unsplash.com/photo-1521572267360-ee0c2909d518,Essential,100% Cotton,Boxy
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
