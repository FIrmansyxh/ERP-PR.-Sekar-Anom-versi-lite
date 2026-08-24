import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Tag, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TabelHarga } from '../../types';
import { formatRupiah, validateGradeCode } from '../../utils/formatters';
import { hitungSimulasiHarga } from '../../data/initialHargaData';
import { ConfirmModal } from '../common/ConfirmModal';

interface HargaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNewPrice: (newPrice: TabelHarga, oldPriceIdToArchive?: string) => void;
  currentActivePrices: TabelHarga[];
  targetGradeCode?: string | null;
}

export const HargaFormModal: React.FC<HargaFormModalProps> = ({
  isOpen,
  onClose,
  onSaveNewPrice,
  currentActivePrices,
  targetGradeCode,
}) => {
  const isEditing = Boolean(targetGradeCode);
  const [kodeGrade, setKodeGrade] = useState('A');
  const [namaGrade, setNamaGrade] = useState('');
  const [hargaPerKg, setHargaPerKg] = useState<number>(140000);
  const [ratePotonganBal, setRatePotonganBal] = useState<number>(2000);
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggalBerlaku, setTanggalBerlaku] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (targetGradeCode) {
        const existing = currentActivePrices.find((h) => h.kode_grade === targetGradeCode);
        if (existing) {
          setKodeGrade(existing.kode_grade);
          setNamaGrade(existing.nama_grade || `Grade ${existing.kode_grade}`);
          setHargaPerKg(existing.harga_per_kg);
          setRatePotonganBal(existing.rate_potongan_per_bal || 2000);
          setDeskripsi(existing.ketentuan || existing.deskripsi || '');
          setTanggalBerlaku(existing.tanggal_berlaku || new Date().toISOString().split('T')[0]);
        }
      } else {
        setKodeGrade('');
        setNamaGrade('');
        setHargaPerKg(100000);
        setRatePotonganBal(2000);
        setDeskripsi('');
        setTanggalBerlaku(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
      setIsConfirmOpen(false);
    }
  }, [targetGradeCode, currentActivePrices, isOpen]);

  if (!isOpen) return null;

  const existingActive = currentActivePrices.find((h) => h.kode_grade === kodeGrade.trim().toUpperCase());
  const simulasi = hitungSimulasiHarga(hargaPerKg || 0, 45, 'bruto', ratePotonganBal || 2000);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const gradeVal = validateGradeCode(kodeGrade);
    if (!gradeVal.isValid) {
      newErrors.kodeGrade = gradeVal.message || 'Kode grade tidak valid.';
    }

    if (!isEditing && currentActivePrices.some(p => p.kode_grade.toUpperCase() === kodeGrade.trim().toUpperCase())) {
      newErrors.kodeGrade = `Grade "${kodeGrade.toUpperCase()}" sudah terdaftar aktif. Gunakan menu edit untuk mengubah tarifnya.`;
    }

    if (!hargaPerKg || hargaPerKg <= 0) {
      newErrors.hargaPerKg = 'Harga per Kg harus lebih dari Rp 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmSave = () => {
    const cleanCode = kodeGrade.trim().toUpperCase();
    const newPrice: TabelHarga = {
      harga_id: `HRG-2026-${cleanCode}-${Date.now().toString().slice(-4)}`,
      kode_grade: cleanCode,
      nama_grade: namaGrade.trim() || `Grade ${cleanCode} Tembakau Madura`,
      warna_badge: 'bg-slate-800 text-white',
      harga_per_kg: Number(hargaPerKg),
      rate_potongan_per_bal: Number(ratePotonganBal) || 2000,
      rate_potongan_per_10kg: Number(ratePotonganBal) || 2000,
      berat_standar_kg: 45,
      ketentuan: deskripsi.trim() || `Standar kualitas tembakau grade ${cleanCode}`,
      tanggal_berlaku: tanggalBerlaku,
      status: 'aktif',
      dibuat_oleh: 'Kepala Gudang PR. Sekar Anom',
      deskripsi: deskripsi.trim() || `Penyesuaian tarif acuan grade ${cleanCode}`,
    };

    onSaveNewPrice(newPrice, existingActive?.harga_id);
    setIsConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
        <div className="bg-white border border-gray-300 w-full max-w-lg rounded-none shadow-2xl flex flex-col text-xs text-gray-800">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#b81d24]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                  {isEditing ? `Edit Tarif Grade ${targetGradeCode}` : 'Tambah Grade & Tarif Baru'}
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  Master Kualitas & Tarif Pembelian PR. Sekar Anom
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Tarif</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* Input Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Kode Grade <span className="text-[#b81d24]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="Contoh: A1, A+, AB"
                  disabled={isEditing}
                  value={kodeGrade}
                  onChange={(e) => {
                    setKodeGrade(e.target.value.toUpperCase());
                    if (errors.kodeGrade) setErrors({ ...errors, kodeGrade: '' });
                  }}
                  className={`w-full bg-white border ${
                    errors.kodeGrade ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                  } rounded-sm px-3 py-2 text-xs font-mono font-bold uppercase text-gray-900 focus:outline-none focus:border-[#b81d24] disabled:bg-gray-100`}
                />
                {errors.kodeGrade ? (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{errors.kodeGrade}</p>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Maks. 3 karakter, karakter pertama harus huruf (contoh: A1, A+, AB).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Harga Beli per Kg <span className="text-[#b81d24]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    placeholder="Contoh: 140000"
                    value={hargaPerKg || ''}
                    onChange={(e) => {
                      setHargaPerKg(Number(e.target.value));
                      if (errors.hargaPerKg) setErrors({ ...errors, hargaPerKg: '' });
                    }}
                    className={`w-full bg-white border ${
                      errors.hargaPerKg ? 'border-red-500' : 'border-gray-300'
                    } rounded-sm pl-9 pr-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#b81d24]`}
                  />
                </div>
                {errors.hargaPerKg && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{errors.hargaPerKg}</p>
                )}
              </div>
            </div>

            {/* Nama / Kategori Grade */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">Nama / Keterangan Grade</label>
              <input
                type="text"
                placeholder="Contoh: Grade A1 Super (Daun Mahkota Atas Pilihan)"
                value={namaGrade}
                onChange={(e) => setNamaGrade(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              />
            </div>

            {/* Rate Potongan by Sistem (Rp 2.000 / bal) */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 text-xs">Rate Potongan Otomatis by Sistem:</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Diterapkan flat <strong>Rp 2.000 / bal</strong> (menggantikan rumus lama 2000/10kg).
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-amber-600 text-white font-mono font-bold text-xs rounded-sm">
                    Rp 2.000 / bal
                  </span>
                </div>
              </div>
            </div>

            {/* Tanggal Berlaku */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">Tanggal Mulai Berlaku</label>
              <input
                type="date"
                value={tanggalBerlaku}
                onChange={(e) => setTanggalBerlaku(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              />
            </div>

            {/* Deskripsi / Ciri Fisik Tembakau */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">Karakteristik & Ketentuan Mutu</label>
              <textarea
                rows={2}
                placeholder="Contoh: Daun mahkota atas, warna kuning keemasan, minyak tinggi, aroma pekat..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              />
            </div>

            {/* Live Calculation Preview Box */}
            <div className="bg-gray-50 border border-gray-300 p-3.5 space-y-2">
              <div className="font-bold text-gray-800 text-[11px] border-b border-gray-200 pb-1 flex items-center justify-between">
                <span>SIMULASI HITUNG 1 BAL (BRUTO 47 KG - TARA 2 KG = NETTO 45 KG)</span>
                <span className="text-[#b81d24] font-mono">Grade {kodeGrade || '...'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500">Harga Acuan per Kg:</span>
                  <div className="font-bold text-gray-900">{formatRupiah(hargaPerKg || 0)}/kg</div>
                </div>
                <div>
                  <span className="text-gray-500">Subtotal Kotor (45 kg):</span>
                  <div className="font-bold text-gray-900">{formatRupiah((hargaPerKg || 0) * 45)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Potongan Kuli Timbang:</span>
                  <div className="font-bold text-red-600">-Rp 7.000 / bal</div>
                </div>
                <div>
                  <span className="text-gray-500">Potongan Tembakau / Bal:</span>
                  <div className="font-bold text-red-600">-Rp 2.000 / bal</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-bold">
                <span className="text-gray-800 text-xs">Total Pembayaran Bersih per Bal:</span>
                <span className="text-[#b81d24] text-sm font-mono">
                  {formatRupiah(Math.max(0, (hargaPerKg || 0) * 45 - 9000))}
                </span>
              </div>
            </div>

          </form>

          {/* Footer Info */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Semua timbangan loket akan otomatis menggunakan acuan harga terbaru.</span>
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Perubahan Tarif Grade"
        message={`Apakah Anda yakin ingin menetapkan tarif Grade ${kodeGrade.toUpperCase()} sebesar ${formatRupiah(hargaPerKg)}/kg dengan potongan ${formatRupiah(ratePotonganBal)}/bal?`}
        variant="primary"
        confirmText="Ya, Simpan Tarif"
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
