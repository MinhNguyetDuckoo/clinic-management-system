import { CreditCard, FileText, Receipt, ShieldCheck } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function CashierDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Thu ngân</h1>
        <p className="mt-2 text-slate-500">
          Quản lý hóa đơn, thanh toán và trạng thái thu tiền.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Hóa đơn" value="Unpaid" icon={Receipt} />
        <StatCard title="Thanh toán" value="Paid" icon={CreditCard} />
        <StatCard title="Chi tiết" value="Invoice" icon={FileText} />
        <StatCard title="Chống trùng" value="Transaction" icon={ShieldCheck} />
      </div>
    </div>
  );
}