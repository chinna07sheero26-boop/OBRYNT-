import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Truck,
  CreditCard,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { FinancialBreakdown, OrderDetails, SupplierFulfilment, Supplier } from '../../types';

interface FinancialsTabProps {
  financials: FinancialBreakdown;
  orders: OrderDetails[];
  fulfilments: SupplierFulfilment[];
  suppliers: Supplier[];
  onShowNotice: (msg: string) => void;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({
  financials,
  orders,
  fulfilments,
  suppliers,
  onShowNotice,
}) => {
  // Export financial statement CSV
  const handleExportFinancialReport = () => {
    let csv = 'Metric,Amount (INR),Notes\n';
    csv += `Total Gross Sales (GMV),${financials.grossSales},Customer payments collected\n`;
    csv += `Supplier Wholesale Payables,${financials.supplierCostPayable},Liabilities owed to garment factories & brands\n`;
    csv += `Courier Shipping Liabilities,${financials.shippingCostLiability},Logistics partner fees\n`;
    csv += `Courier COD Handling Charges,${financials.courierCodFees},Cash collection processing fees\n`;
    csv += `Gross Platform Margin,${financials.platformGrossMargin},Pre-tax operational margin\n`;
    csv += `Estimated GST Provision (18%),${financials.estimatedTaxes},Applicable tax reserve\n`;
    csv += `Estimated Net Profit,${financials.estimatedNetProfit},Net margin after liabilities and tax\n`;
    csv += `Pending COD Remittances,${financials.pendingCodRemittances},Cash held by couriers pending settlement\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obrynt_financial_statement_${Date.now()}.csv`;
    link.click();
    onShowNotice('Financial Ledger CSV exported.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#d7ff3f]" />
            <span>Owner's Financial Ledger & Margin Engine</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Strict separation of customer sales, factory wholesale liabilities, courier logistics costs, taxes, and net profit.
          </p>
        </div>

        <button
          onClick={handleExportFinancialReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-full transition-colors cursor-pointer border border-stone-700 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#d7ff3f]" />
          <span>EXPORT LEDGER CSV</span>
        </button>
      </div>

      {/* KPI 4-Card Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross GMV */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Customer Gross Sales</span>
            <Receipt className="w-4 h-4 text-[#d7ff3f]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            ₹{financials.grossSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 font-mono">
            {orders.length} orders collected
          </div>
        </div>

        {/* Factory Liabilities */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Supplier Cost Payable</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            ₹{financials.supplierCostPayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Factory wholesale liability
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Gross Platform Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            ₹{financials.platformGrossMargin.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {financials.grossSales > 0
              ? `${Math.round((financials.platformGrossMargin / financials.grossSales) * 100)}% gross margin`
              : '0% gross margin'}
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-[#141414] border border-[#d7ff3f]/30 bg-gradient-to-br from-[#141414] to-[#1c220b] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#d7ff3f] text-xs font-bold">
            <span>Estimated Net Profit</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#d7ff3f] mt-2">
            ₹{financials.estimatedNetProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            After taxes, courier & COD fees
          </div>
        </div>
      </div>

      {/* Margin Waterfall Reconciliation Table */}
      <div className="bg-[#141414] border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#d7ff3f]" />
          <span>Accounting Margin Waterfall (Accurate Breakdown)</span>
        </h3>
        <p className="text-xs text-stone-400">
          OBRYNT adheres to strict accounting separation: money collected from shoppers is NOT profit until all supplier payables, shipping costs, and tax obligations are deducted.
        </p>

        <div className="divide-y divide-stone-800/80 border border-stone-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between p-3.5 bg-stone-900/60 font-bold text-white">
            <span>(+) Total Gross Customer Inflows (GMV)</span>
            <span className="text-sm">₹{financials.grossSales.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#141414] text-rose-300">
            <span>(-) Supplier Wholesale Payables (Factory Invoices)</span>
            <span>- ₹{financials.supplierCostPayable.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#141414] text-rose-300">
            <span>(-) Outbound Courier Shipping Costs (Delhivery / Blue Dart)</span>
            <span>- ₹{financials.shippingCostLiability.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#141414] text-amber-300">
            <span>(-) COD Handling & Cash Collection Fees</span>
            <span>- ₹{financials.courierCodFees.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-stone-900/80 font-bold text-emerald-400">
            <span>(=) Platform Gross Operating Margin</span>
            <span className="text-sm">₹{financials.platformGrossMargin.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#141414] text-stone-400">
            <span>(-) Estimated GST Tax Reserve (18% on Services Margin)</span>
            <span>- ₹{financials.estimatedTaxes.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#181d09] border-t-2 border-[#d7ff3f] font-black text-[#d7ff3f] text-sm sm:text-base">
            <span>(=) Estimated Final Net Profit to OBRYNT</span>
            <span>₹{financials.estimatedNetProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* COD Remittance Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Cash on Delivery (COD) In-Transit</span>
            </h4>
            <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Courier Escrow
            </span>
          </div>
          <p className="text-xs text-stone-400">
            COD cash collected by delivery couriers is remitted on a T+3 / weekly settlement cycle.
          </p>
          <div className="text-2xl font-black text-amber-300 font-mono">
            ₹{financials.pendingCodRemittances.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500">
            Pending reconciliation across active delivery manifests.
          </div>
        </div>

        <div className="bg-[#141414] border border-stone-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Online Payment Gateway (Razorpay/UPI)</span>
            </h4>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Verified T+1
            </span>
          </div>
          <p className="text-xs text-stone-400">
            Prepaid UPI, Netbanking and Cards settle directly into OBRYNT's verified merchant bank account.
          </p>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{(financials.grossSales - financials.pendingCodRemittances).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500">
            Verified online payment receipts captured and matched.
          </div>
        </div>
      </div>
    </div>
  );
};
