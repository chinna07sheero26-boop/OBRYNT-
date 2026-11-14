import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus,
  Upload,
  FileSpreadsheet,
  Download,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Video,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { VendorProduct, VendorProductApprovalStatus } from '../../types';
import {
  bulkUploadVendorProducts,
  createVendorProduct,
  deleteVendorProduct,
  updateVendorProduct,
} from '../../services/vendorService';
import { uploadProductImage } from '../../services/productService';

const MARKETPLACE_CATEGORIES = [
  'Men',
  'Women',
  'Kids',
  'Footwear',
  'Bags & Accessories',
  'T-Shirts',
  'Gym & Sports',
  'Innerwear',
  'Beauty & Makeup',
  'Other',
];

interface VendorCatalogManagerProps {
  products: VendorProduct[];
  vendorType: 'SHOP_OWNER' | 'SELLER';
  onRefresh: () => Promise<void>;
  onShowNotice: (msg: string) => void;
  defaultOpenBulk?: boolean;
}

export const VendorCatalogManager: React.FC<VendorCatalogManagerProps> = ({
  products,
  vendorType,
  onRefresh,
  onShowNotice,
  defaultOpenBulk = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | VendorProductApprovalStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(defaultOpenBulk);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    productCode: '',
    description: '',
    category: 'Men',
    subcategory: '',
    audience: 'Unisex',
    material: '',
    originalPrice: 1299,
    supplierPrice: 699,
    sellingPrice: 899,
    totalStock: 25,
    sizesText: 'S, M, L, XL',
    colorsText: 'Pitch Black, Ivory White',
    images: [] as string[],
    imageUrlInput: '',
    videoUrl: '',
    saveAsDraft: false,
    variants: [] as Array<{
      sku: string;
      size: string;
      color: string;
      originalPrice: number;
      supplierPrice: number;
      sellingPrice: number;
      stock: number;
    }>,
  });

  // Bulk upload state
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);

  const filteredProducts = products.filter((p) =>
    filterStatus === 'ALL' ? true : p.approvalStatus === filterStatus
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      productCode: '',
      description: '',
      category: 'Men',
      subcategory: '',
      audience: 'Unisex',
      material: '',
      originalPrice: 1299,
      supplierPrice: 699,
      sellingPrice: 899,
      totalStock: 25,
      sizesText: 'S, M, L, XL',
      colorsText: 'Pitch Black',
      images: [],
      imageUrlInput: '',
      videoUrl: '',
      saveAsDraft: false,
      variants: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: VendorProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      productCode: p.productCode,
      description: p.description,
      category: p.category,
      subcategory: p.subcategory || '',
      audience: p.audience || 'Unisex',
      material: p.material || '',
      originalPrice: p.originalPrice,
      supplierPrice: p.supplierPrice,
      sellingPrice: p.sellingPrice,
      totalStock: p.totalStock,
      sizesText: p.sizes.join(', '),
      colorsText: p.colors.join(', '),
      images: p.images || [],
      imageUrlInput: '',
      videoUrl: p.videoUrl || '',
      saveAsDraft: p.approvalStatus === 'draft',
      variants: (p.variants || []).map((v) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        originalPrice: v.originalPrice,
        supplierPrice: v.supplierPrice,
        sellingPrice: v.sellingPrice,
        stock: v.stock,
      })),
    });
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const res = await uploadProductImage(file);
        if (res.url) uploaded.push(res.url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
      onShowNotice(`Added ${uploaded.length} product photo(s).`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    const clean = form.imageUrlInput.trim();
    if (!clean) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, clean],
      imageUrlInput: '',
    }));
  };

  const handleGenerateVariantMatrix = () => {
    const sizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = form.colorsText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const baseSku = (form.productCode || 'ITEM').trim().toUpperCase();
    const generated: typeof form.variants = [];
    for (const sz of sizes.length ? sizes : ['Free Size']) {
      for (const col of colors.length ? colors : ['Standard']) {
        generated.push({
          sku: `${baseSku}-${sz.replace(/\s+/g, '')}-${col.slice(0, 3).toUpperCase()}`,
          size: sz,
          color: col,
          originalPrice: Number(form.originalPrice),
          supplierPrice: Number(form.supplierPrice),
          sellingPrice: Number(form.sellingPrice),
          stock: Math.max(1, Math.floor(Number(form.totalStock) / Math.max(1, sizes.length * colors.length))),
        });
      }
    }
    setForm((prev) => ({ ...prev, variants: generated }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sizes = form.sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const colors = form.colorsText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        productCode: form.productCode.trim() || undefined,
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        audience: form.audience,
        material: form.material.trim() || undefined,
        originalPrice: Number(form.originalPrice),
        supplierPrice: Number(form.supplierPrice),
        sellingPrice: Number(form.sellingPrice),
        totalStock:
          form.variants.length > 0
            ? form.variants.reduce((s, v) => s + Number(v.stock || 0), 0)
            : Number(form.totalStock),
        sizes: sizes.length ? sizes : ['Free Size'],
        colors: colors.length ? colors : ['Standard'],
        images:
          form.images.length > 0
            ? form.images
            : ['/images/product_tshirt_minimal_1793012315796.jpg'],
        videoUrl: form.videoUrl.trim() || undefined,
        variants: form.variants.length > 0 ? (form.variants as any) : undefined,
        saveAsDraft: form.saveAsDraft,
      };

      if (editingProduct) {
        const res = await updateVendorProduct(editingProduct.id, {
          ...payload,
          submitForApproval: !form.saveAsDraft && editingProduct.approvalStatus === 'draft' ? true : undefined,
        });
        onShowNotice(
          res.returnedForApproval
            ? `Updated "${res.product.name}" — moved to Admin Approval Queue.`
            : `Updated "${res.product.name}".`
        );
      } else {
        const created = await createVendorProduct(payload);
        onShowNotice(
          created.approvalStatus === 'draft'
            ? `Saved "${created.name}" as draft.`
            : `Submitted "${created.name}" for OBRYNT Admin Approval.`
        );
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      onShowNotice(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBulkTemplate = () => {
    const sampleRows = [
      {
        SKU: `${vendorType === 'SHOP_OWNER' ? 'SHOP' : 'SEL'}-001`,
        Title: 'Heavyweight Relaxed Cotton T-Shirt',
        Description: '240 GSM organic cotton drop-shoulder tee',
        Category: 'Men',
        Audience: 'Men',
        OriginalMRP: 1299,
        SupplierPrice: 599,
        SellingPrice: 799,
        Stock: 40,
        Sizes: 'S,M,L,XL',
        Colors: 'Black,White',
        ImageURL: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'OBRYNT_Vendor_Bulk_Template.xlsx');
    onShowNotice('Downloaded Excel bulk upload template.');
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const normalized = rows.map((r) => ({
        productCode: r.SKU || r.sku || r.ProductCode || undefined,
        name: r.Title || r.Name || r.name || r.ProductName || '',
        description: r.Description || r.description || '',
        category: r.Category || r.category || 'Men',
        audience: r.Audience || r.audience || 'Unisex',
        originalPrice: Number(r.OriginalMRP || r.MRP || r.SellingPrice || r.Price || 999),
        supplierPrice: Number(r.SupplierPrice || r.AgreedPrice || r.SellingPrice || r.Price || 499),
        sellingPrice: Number(r.SellingPrice || r.Price || r.sellingPrice || 0),
        totalStock: Number(r.Stock || r.stock || r.Quantity || 25),
        sizes: String(r.Sizes || r.sizes || 'S,M,L,XL')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: String(r.Colors || r.colors || 'Black')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        images: [String(r.ImageURL || r.imageUrl || '/images/product_tshirt_minimal_1793012315796.jpg')],
      }));
      setBulkRows(normalized);
      setBulkStatusMsg(`Parsed ${normalized.length} row(s) from "${file.name}". Ready to submit.`);
    } catch (err: any) {
      setBulkStatusMsg(`Failed to parse file: ${err.message}`);
    }
  };

  const handleSubmitBulkUpload = async () => {
    if (bulkRows.length === 0) return;
    setSaving(true);
    try {
      const res = await bulkUploadVendorProducts(bulkRows);
      setBulkStatusMsg(
        `Submitted ${res.createdCount} products to Admin Approval Queue.${
          res.skipped.length ? ` Skipped: ${res.skipped.join(', ')}` : ''
        }`
      );
      setBulkRows([]);
      onShowNotice(`Bulk uploaded ${res.createdCount} products for approval.`);
      await onRefresh();
    } catch (err: any) {
      setBulkStatusMsg(`Bulk upload error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const statusPill = (status: VendorProductApprovalStatus) => {
    if (status === 'approved') return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (status === 'pending_approval') return 'bg-amber-950 text-amber-300 border-amber-800';
    if (status === 'rejected') return 'bg-rose-950 text-rose-300 border-rose-800';
    if (status === 'out_of_stock') return 'bg-orange-950 text-orange-300 border-orange-800';
    return 'bg-stone-900 text-stone-400 border-stone-700';
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'pending_approval', 'approved', 'rejected', 'out_of_stock', 'draft'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#d7ff3f] text-[#111111] font-black'
                    : 'bg-[#141414] text-stone-400 border border-stone-800 hover:text-white'
                }`}
              >
                {st === 'ALL' ? `All (${products.length})` : st.replace(/_/g, ' ').toUpperCase()}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#d7ff3f]" />
            <span>CSV / Excel Bulk Upload</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] text-xs font-black cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Bulk Upload Drawer */}
      {isBulkOpen && (
        <div className="p-5 rounded-2xl bg-[#141414] border border-stone-800 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white">Bulk Upload Products (CSV / Excel)</h3>
              <p className="text-stone-400 mt-0.5">
                All bulk uploaded items enter Pending Approval before going live on the OBRYNT storefront.
              </p>
            </div>
            <button
              onClick={handleDownloadBulkTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 hover:text-white font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#d7ff3f]" />
              <span>Download Excel Template</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-dashed border-stone-600 text-stone-200 font-bold cursor-pointer">
              <Upload className="w-4 h-4 text-[#d7ff3f]" />
              <span>Select .CSV or .XLSX File</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBulkFileChange}
                className="hidden"
              />
            </label>

            {bulkRows.length > 0 && (
              <button
                onClick={handleSubmitBulkUpload}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#d7ff3f] text-[#111111] font-black cursor-pointer"
              >
                {saving ? 'UPLOADING...' : `SUBMIT ${bulkRows.length} PRODUCTS FOR APPROVAL`}
              </button>
            )}
          </div>

          {bulkStatusMsg && (
            <div className="p-3 rounded-xl bg-black/60 border border-stone-800 text-stone-200">
              {bulkStatusMsg}
            </div>
          )}
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#141414] border border-stone-800 text-center space-y-3">
          <Layers className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="text-sm font-black text-white">No Products Listed Yet</h3>
          <p className="text-xs text-stone-400">
            Add unlimited products individually or upload via CSV/Excel. Only Admin-approved products publish to OBRYNT customers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-[#141414] border border-stone-800 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={p.images[0] || '/images/product_tshirt_minimal_1793012315796.jpg'}
                  alt={p.name}
                  className="w-20 h-24 object-cover rounded-xl bg-stone-900 border border-stone-800 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-black text-[#d7ff3f]">
                      {p.productCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${statusPill(
                        p.approvalStatus
                      )}`}
                    >
                      {p.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white truncate">{p.name}</h4>
                  <p className="text-stone-400 line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-stone-300">
                    <span>
                      Selling: <strong className="text-[#d7ff3f]">₹{p.sellingPrice}</strong>
                    </span>
                    <span>
                      Agreed: <strong>₹{p.supplierPrice}</strong>
                    </span>
                    <span>
                      Stock: <strong className={p.totalStock === 0 ? 'text-rose-400' : 'text-white'}>{p.totalStock}</strong>
                    </span>
                    <span>Variants: {p.variants?.length || 1}</span>
                  </div>
                </div>
              </div>

              {p.rejectionReason && p.approvalStatus === 'rejected' && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                  Admin Feedback: {p.rejectionReason}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit / Stock</span>
                  </button>
                  {p.approvalStatus === 'draft' && (
                    <button
                      onClick={async () => {
                        await updateVendorProduct(p.id, { submitForApproval: true });
                        onShowNotice(`Submitted "${p.name}" for Admin approval.`);
                        await onRefresh();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#d7ff3f] text-[#111111] font-black cursor-pointer"
                    >
                      Submit for Approval
                    </button>
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.name}" (${p.productCode})?`)) return;
                    await deleteVendorProduct(p.id);
                    onShowNotice(`Deleted "${p.name}".`);
                    await onRefresh();
                  }}
                  className="p-1.5 text-stone-500 hover:text-rose-400 cursor-pointer"
                  aria-label="Delete product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#141414] border border-stone-800 rounded-3xl p-6 text-white space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black">
                {editingProduct ? `Edit Product · ${editingProduct.productCode}` : 'Add New Product to OBRYNT'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingProduct?.approvalStatus === 'approved' && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Stock quantity updates stay live immediately. Significant changes (title, price, category, photos) return the item to Pending Approval.
                </span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-400 font-bold mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tailored Linen Cuban Shirt"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">SKU / Code (Auto if blank)</label>
                  <input
                    type="text"
                    value={form.productCode}
                    disabled={Boolean(editingProduct)}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SHP-101"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono font-bold disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Fabric weight, fit, care instructions, craftsmanship..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {MARKETPLACE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Beauty">Beauty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Material / Fabric</label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="e.g. 100% Cotton"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Original MRP (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Agreed Supplier ₹ *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.supplierPrice}
                    onChange={(e) => setForm({ ...form, supplierPrice: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-[#d7ff3f] font-black"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.totalStock}
                    onChange={(e) => setForm({ ...form, totalStock: Number(e.target.value) })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={form.sizesText}
                    onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Colours (comma separated)</label>
                  <input
                    type="text"
                    value={form.colorsText}
                    onChange={(e) => setForm({ ...form, colorsText: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* Multi-image uploader + optional video */}
              <div className="p-3 rounded-2xl bg-black/50 border border-stone-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-stone-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#d7ff3f]" />
                    Product Photos ({form.images.length})
                  </span>
                  <label className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer">
                    {uploadingImage ? 'Uploading...' : '+ Upload Multiple Photos'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrlInput}
                    onChange={(e) => setForm({ ...form, imageUrlInput: e.target.value })}
                    placeholder="Or paste product image URL..."
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 text-white font-bold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-14 h-16 object-cover rounded-lg border border-stone-700"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-stone-400 font-bold mb-1 flex items-center gap-1">
                    <Video className="w-3 h-3" /> Optional Product Video URL
                  </label>
                  <input
                    type="text"
                    value={form.videoUrl}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Variants Builder */}
              <div className="p-3 rounded-2xl bg-black/50 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-300">
                    Size & Colour Variants ({form.variants.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateVariantMatrix}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[#d7ff3f] font-bold cursor-pointer"
                  >
                    Auto-Generate Variant Matrix
                  </button>
                </div>
                {form.variants.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {form.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center bg-stone-900 p-2 rounded-lg">
                        <span className="font-mono text-[10px] truncate">{v.sku}</span>
                        <span>{v.size}</span>
                        <span>{v.color}</span>
                        <input
                          type="number"
                          value={v.sellingPrice}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], sellingPrice: Number(e.target.value) };
                            setForm({ ...form, variants: next });
                          }}
                          className="bg-black border border-stone-700 rounded px-2 py-0.5 text-white"
                          title="Variant Selling Price"
                        />
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], stock: Number(e.target.value) };
                            setForm({ ...form, variants: next });
                          }}
                          className="bg-black border border-stone-700 rounded px-2 py-0.5 text-white"
                          title="Variant Stock"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-stone-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saveAsDraft}
                  onChange={(e) => setForm({ ...form, saveAsDraft: e.target.checked })}
                  className="accent-[#d7ff3f]"
                />
                <span>Save as Draft (do not submit for Admin approval yet)</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#d7ff3f] hover:bg-[#c9f530] text-[#111111] font-black cursor-pointer"
                >
                  {saving ? 'SAVING...' : editingProduct ? 'SAVE PRODUCT CHANGES' : 'SUBMIT TO ADMIN QUEUE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
