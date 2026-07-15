import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Edit3, Loader2, PackagePlus, Pill, Plus, Power, RefreshCcw, X } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { getUser } from "../../utils/authStorage";

type Category = {
  CategoryId: number;
  CategoryName: string;
};

type Medicine = {
  MedicineId: number;
  CategoryId: number;
  CategoryName: string;
  MedicineName: string;
  Unit: string;
  Price: number;
  StockQuantity: number;
  MinStockQuantity: number;
  IsActive: boolean;
};

type MedicineForm = {
  medicineName: string;
  categoryId: string;
  unit: string;
  price: string;
  stockQuantity: string;
  minStockQuantity: string;
  isActive: boolean;
};

type StockForm = {
  type: "IN" | "ADJUST";
  quantity: string;
  note: string;
};

const emptyMedicineForm: MedicineForm = {
  medicineName: "",
  categoryId: "",
  unit: "",
  price: "0",
  stockQuantity: "0",
  minStockQuantity: "10",
  isActive: true
};

const emptyStockForm: StockForm = {
  type: "IN",
  quantity: "1",
  note: ""
};

function currency(value: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function statusClass(isActive: boolean) {
  return isActive
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

export default function MedicineManagementPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [stockTarget, setStockTarget] = useState<Medicine | null>(null);
  const [medicineForm, setMedicineForm] = useState<MedicineForm>(emptyMedicineForm);
  const [stockForm, setStockForm] = useState<StockForm>(emptyStockForm);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [medicineRes, categoryRes] = await Promise.all([
        axiosClient.get("/medicines", { params: { includeInactive: true } }),
        axiosClient.get("/medicines/categories")
      ]);
      setMedicines(medicineRes.data.data || []);
      setCategories(categoryRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Khong the tai danh sach thuoc.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateForm() {
    setEditing(null);
    setMedicineForm({
      ...emptyMedicineForm,
      categoryId: categories[0] ? String(categories[0].CategoryId) : ""
    });
    setFormError("");
    setShowMedicineForm(true);
  }

  function openEditForm(medicine: Medicine) {
    setEditing(medicine);
    setMedicineForm({
      medicineName: medicine.MedicineName,
      categoryId: String(medicine.CategoryId || ""),
      unit: medicine.Unit,
      price: String(medicine.Price),
      stockQuantity: String(medicine.StockQuantity),
      minStockQuantity: String(medicine.MinStockQuantity),
      isActive: Boolean(medicine.IsActive)
    });
    setFormError("");
    setShowMedicineForm(true);
  }

  function closeMedicineForm() {
    setShowMedicineForm(false);
    setEditing(null);
    setFormError("");
    setMedicineForm(emptyMedicineForm);
  }

  function openStockAdjustment(medicine: Medicine) {
    setStockTarget(medicine);
    setStockForm(emptyStockForm);
    setFormError("");
    setShowStockForm(true);
  }

  function closeStockForm() {
    setShowStockForm(false);
    setStockTarget(null);
    setStockForm(emptyStockForm);
    setFormError("");
  }

  function validateMedicineForm() {
    if (!medicineForm.medicineName.trim()) return "Vui long nhap ten thuoc.";
    if (!medicineForm.categoryId) return "Vui long chon danh muc.";
    if (!medicineForm.unit.trim()) return "Vui long nhap don vi.";
    if (Number(medicineForm.price) < 0) return "Gia thuoc khong duoc am.";
    if (!editing && Number(medicineForm.stockQuantity) < 0) return "Ton kho khong duoc am.";
    if (Number(medicineForm.minStockQuantity) < 0) return "Ton toi thieu khong duoc am.";
    return "";
  }

  async function submitMedicineForm(event: FormEvent) {
    event.preventDefault();
    const validationError = validateMedicineForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    setFormError("");

    const payload = {
      medicineName: medicineForm.medicineName.trim(),
      categoryId: Number(medicineForm.categoryId),
      unit: medicineForm.unit.trim(),
      price: Number(medicineForm.price),
      minStockQuantity: Number(medicineForm.minStockQuantity),
      isActive: medicineForm.isActive
    };

    try {
      if (editing) {
        await axiosClient.put(`/medicines/${editing.MedicineId}`, payload);
        setMessage("Cap nhat thuoc thanh cong.");
      } else {
        await axiosClient.post("/medicines", {
          ...payload,
          stockQuantity: Number(medicineForm.stockQuantity)
        });
        setMessage("Them thuoc moi thanh cong.");
      }

      closeMedicineForm();
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Luu thong tin thuoc that bai.");
    } finally {
      setSaving(false);
    }
  }

  async function submitStockForm(event: FormEvent) {
    event.preventDefault();

    if (!stockTarget) return;
    if (Number(stockForm.quantity) <= 0) {
      setFormError("So luong phai lon hon 0.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    setFormError("");

    try {
      await axiosClient.post(`/medicines/${stockTarget.MedicineId}/stock-adjustment`, {
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        note: stockForm.note.trim(),
        createdBy: getUser()?.userId
      });
      setMessage("Cap nhat ton kho thanh cong.");
      closeStockForm();
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Cap nhat ton kho that bai.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(medicine: Medicine) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await axiosClient.patch(`/medicines/${medicine.MedicineId}/status`, {
        isActive: !medicine.IsActive
      });
      setMessage(medicine.IsActive ? "Da tam ngung thuoc." : "Da kich hoat thuoc.");
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Khong the cap nhat trang thai thuoc.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSwapDeadlock(reverse = false) {
    if (medicines.length < 2) return alert("Cần ít nhất 2 thuốc để test.");
    const medA = medicines[0].MedicineId;
    const medB = medicines[1].MedicineId;
    
    const body = reverse ? { medAId: medB, medBId: medA } : { medAId: medA, medBId: medB };
    
    try {
      setLoading(true);
      const res = await axiosClient.post("/medicines/demo/swap-stock", body);
      alert(res.data.message);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi (Deadlock)");
    } finally {
      setLoading(false);
    }
  }

  async function handleSwapFixed(reverse = false) {
    if (medicines.length < 2) return alert("Cần ít nhất 2 thuốc để test.");
    const medA = medicines[0].MedicineId;
    const medB = medicines[1].MedicineId;
    
    const body = reverse ? { medAId: medB, medBId: medA } : { medAId: medA, medBId: medB };
    
    try {
      setLoading(true);
      const res = await axiosClient.post("/medicines/demo/swap-stock-fixed", body);
      alert(res.data.message);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi hoán đổi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quan ly thuoc</h1>
          <p className="mt-2 text-slate-500">Cap nhat thong tin thuoc va ton kho co ghi nhan giao dich.</p>
        </div>

        <div className="flex gap-2 flex-wrap max-w-lg justify-end">
          <button
            onClick={() => handleSwapDeadlock(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60 text-sm"
          >
            Đổi Thuốc 1-2 (Lỗi DL)
          </button>
          <button
            onClick={() => handleSwapDeadlock(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60 text-sm"
          >
            Đổi Thuốc 2-1 (Lỗi DL)
          </button>
          
          <button
            onClick={() => handleSwapFixed(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-3 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-60 text-sm"
          >
            Đổi Thuốc 1-2 (Fix DL)
          </button>
          <button
            onClick={() => handleSwapFixed(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-3 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-60 text-sm"
          >
            Đổi Thuốc 2-1 (Fix DL)
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60 text-sm"
          >
            <RefreshCcw size={16} />
            Làm mới
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 text-sm"
          >
            <Plus size={16} />
            Thêm thuốc
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Ma thuoc</th>
                <th className="px-6 py-4 font-semibold">Ten thuoc</th>
                <th className="px-6 py-4 font-semibold">Danh muc</th>
                <th className="px-6 py-4 font-semibold">Don vi</th>
                <th className="px-6 py-4 font-semibold">Gia</th>
                <th className="px-6 py-4 font-semibold">Ton kho</th>
                <th className="px-6 py-4 font-semibold">Toi thieu</th>
                <th className="px-6 py-4 font-semibold">Trang thai</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.MedicineId} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-600">#{medicine.MedicineId}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{medicine.MedicineName}</td>
                  <td className="px-6 py-4 text-slate-600">{medicine.CategoryName || "-"}</td>
                  <td className="px-6 py-4 text-slate-600">{medicine.Unit}</td>
                  <td className="px-6 py-4 text-slate-600">{currency(medicine.Price)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{medicine.StockQuantity}</td>
                  <td className="px-6 py-4 text-slate-600">{medicine.MinStockQuantity}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(medicine.IsActive)}`}>
                      {medicine.IsActive ? "Dang hoat dong" : "Tam ngung"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditForm(medicine)}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 font-medium text-sky-700 hover:bg-sky-100"
                      >
                        <Edit3 size={16} />
                        Sua
                      </button>
                      <button
                        onClick={() => openStockAdjustment(medicine)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <PackagePlus size={16} />
                        Nhap kho
                      </button>
                      <button
                        onClick={() => changeStatus(medicine)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <Power size={16} />
                        {medicine.IsActive ? "Tam ngung" : "Kich hoat"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && medicines.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    Chua co thuoc nao.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMedicineForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <Pill className="text-sky-600" size={22} />
                <h2 className="text-xl font-bold text-slate-900">
                  {editing ? "Sua thuoc" : "Them thuoc"}
                </h2>
              </div>
              <button onClick={closeMedicineForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitMedicineForm} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Ten thuoc</label>
                  <input
                    value={medicineForm.medicineName}
                    onChange={(event) => setMedicineForm((prev) => ({ ...prev, medicineName: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Danh muc</label>
                  <select
                    value={medicineForm.categoryId}
                    onChange={(event) => setMedicineForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Chon danh muc</option>
                    {categories.map((category) => (
                      <option key={category.CategoryId} value={category.CategoryId}>
                        {category.CategoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Don vi</label>
                  <input
                    value={medicineForm.unit}
                    onChange={(event) => setMedicineForm((prev) => ({ ...prev, unit: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Gia</label>
                  <input
                    type="number"
                    min={0}
                    value={medicineForm.price}
                    onChange={(event) => setMedicineForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {!editing && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Ton kho ban dau</label>
                    <input
                      type="number"
                      min={0}
                      value={medicineForm.stockQuantity}
                      onChange={(event) => setMedicineForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Ton toi thieu</label>
                  <input
                    type="number"
                    min={0}
                    value={medicineForm.minStockQuantity}
                    onChange={(event) => setMedicineForm((prev) => ({ ...prev, minStockQuantity: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={medicineForm.isActive}
                  onChange={(event) => setMedicineForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4"
                />
                Dang hoat dong
              </label>

              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeMedicineForm} className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200">
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  Luu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockForm && stockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Nhap kho / dieu chinh kho</h2>
                <p className="text-sm text-slate-500">{stockTarget.MedicineName}</p>
              </div>
              <button onClick={closeStockForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitStockForm} className="space-y-5 p-6">
              <div>
                <label className="text-sm font-medium text-slate-700">Loai giao dich</label>
                <select
                  value={stockForm.type}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, type: event.target.value as "IN" | "ADJUST" }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="IN">Nhap kho</option>
                  <option value="ADJUST">Dieu chinh ton kho</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">So luong</label>
                <input
                  type="number"
                  min={1}
                  value={stockForm.quantity}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Ghi chu</label>
                <textarea
                  value={stockForm.note}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, note: event.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeStockForm} className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200">
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  Cap nhat kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
