/**
 * OBRYNT Global Automatic Product Pricing Rule
 *
 * Mandatory Formula:
 * OBRYNT Selling Price = Supplier Price + ₹40
 *
 * Key Rules:
 * 1. Whenever a product is imported from an authorised supplier catalogue, URL, CSV, or API,
 *    automatically add exactly ₹40 to the supplier's original product price.
 * 2. Example: ₹269 supplier price must become ₹309 on OBRYNT.
 * 3. Applied to every imported product, including all variants and sizes.
 * 4. Keep the original supplier price stored separately in the database (`supplierPrice` / `wholesalePrice`).
 * 5. Display only the OBRYNT selling price to customers.
 * 6. Customer delivery charge must always display as FREE (₹0).
 * 7. Do not add ₹40 again when an existing product is updated or re-imported (idempotent).
 * 8. If the supplier price changes, recalculate the OBRYNT price using the new supplier price + ₹40.
 * 9. Show supplier price, ₹40 markup, and final selling price in the Admin Dashboard.
 */

export const OBRYNT_AUTOMATIC_MARKUP_INR = 40;

export interface PricingBreakdown {
  supplierPrice: number;
  markupAmount: number;
  sellingPrice: number;
}

/**
 * Calculates OBRYNT Selling Price from raw supplier price
 */
export function calculateObryntPrice(rawSupplierPrice: number | string | undefined | null): PricingBreakdown {
  const num = Number(rawSupplierPrice);
  const supplierPrice = !isNaN(num) && num > 0 ? Math.round(num) : 0;
  const markupAmount = OBRYNT_AUTOMATIC_MARKUP_INR;
  const sellingPrice = supplierPrice > 0 ? supplierPrice + markupAmount : 0;

  return {
    supplierPrice,
    markupAmount,
    sellingPrice,
  };
}

/**
 * Ensures an imported or existing product satisfies the pricing rule:
 * Selling Price = Supplier Price + ₹40
 * Idempotent: avoids adding ₹40 multiple times if product is re-saved or re-imported.
 */
export function applyProductPricingRule<
  T extends {
    price?: number;
    supplierPrice?: number;
    wholesalePrice?: number;
    markupAmount?: number;
  }
>(product: T, newSupplierPrice?: number): T {
  // Determine canonical supplier price:
  // 1. Explicitly provided newSupplierPrice
  // 2. Existing product.supplierPrice
  // 3. Existing product.wholesalePrice
  // 4. Backward-compatible fallback: product.price - 40 if price exists and is > 40
  let baseSupplierPrice: number;

  if (newSupplierPrice !== undefined && !isNaN(Number(newSupplierPrice))) {
    baseSupplierPrice = Math.max(0, Math.round(Number(newSupplierPrice)));
  } else if (product.supplierPrice !== undefined && !isNaN(Number(product.supplierPrice))) {
    baseSupplierPrice = Math.max(0, Math.round(Number(product.supplierPrice)));
  } else if (product.wholesalePrice !== undefined && !isNaN(Number(product.wholesalePrice))) {
    baseSupplierPrice = Math.max(0, Math.round(Number(product.wholesalePrice)));
  } else if (product.price !== undefined && Number(product.price) > OBRYNT_AUTOMATIC_MARKUP_INR) {
    baseSupplierPrice = Math.max(0, Math.round(Number(product.price) - OBRYNT_AUTOMATIC_MARKUP_INR));
  } else {
    baseSupplierPrice = Math.max(0, Math.round(Number(product.price) || 0));
  }

  const { supplierPrice, markupAmount, sellingPrice } = calculateObryntPrice(baseSupplierPrice);

  return {
    ...product,
    supplierPrice,
    wholesalePrice: supplierPrice, // keep wholesalePrice in sync for existing DB/UI references
    markupAmount,
    price: sellingPrice,
  };
}
