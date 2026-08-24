import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FlaskConical, 
  Scan, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Truck, 
  Building2, 
  User, 
  FileText, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import { Barang, PengirimanSample } from '../../types';
import { generateSampleId } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface SampleWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangList: Barang[];
  onSaveBatchSamples: (newSamples: PengirimanSample[], updatedBarangs: Barang[]) => void;
}

export const SampleWizardModal: React.FC<SampleWizardModalProps> = ({
  isOpen,
  onClose,
  barangList,
  onSaveBatchSamples,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBarangIds, setSelectedBarangIds] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchBalQuery, setSearchBalQuery] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [beratGramPerBal, setBeratGramPerBal] = useState<number>(250);
  const [tujuanBuyer, setTujuanBuyer] = useState<string>('PT Djarum Kudus - Lab QC & R&D');
  const [customTujuan, setCustomTujuan] = useState<string>('');
  const [sumberGudang, setSumberGudang] = useState<string>('Gudang Utama Tembakau A1');
  const [dikirimOleh, setDikirimOleh] = useState<string>('Petugas QC & Sortir');
  const [catatan, setCatatan] = useState<string>('Pengujian organoleptik dan kadar air laboratorium');

  const scannerInputRef = useRef<HTMLInputElement>(null);

  const availableBal = barangList.filter(
    (b) => b.status_stok === 'di_gudang' || b.status_stok === 'terkirim_sample'
  );

  const popularBuyers = [
    'PT Djarum Kudus - Lab QC & R&D',
    'PT Gudang Garam Tbk Kediri - QC Tembakau',
    'PT HM Sampoerna Surabaya - QA Plant',
    'Bentoel Group Malang - Lab Pengujian',
    'Pabrik Rokok Sukun Kudus',
    'PT Wismilak Inti Makmur Surabaya',
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scannerInputRef.current?.focus(), 150);
    } else {
      setSelectedBarangIds([]);
      setScanFeedback(null);
      setBarcodeInput('');
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAvailableBal = availableBal.filter((b) => {
    return (
      searchBalQuery === '' ||
      b.barcode.toLowerCase().includes(searchBalQuery.toLowerCase()) ||
      b.no_bal.toLowerCase().includes(searchBalQuery.toLowerCase()) ||
      b.kode_grade.toLowerCase().includes(searchBalQuery.toLowerCase()) ||
      (b.nama_petani && b.nama_petani.toLowerCase().includes(searchBalQuery.toLowerCase()))
    );
  });

  const selectedBalObjects = barangList.filter((b) => selectedBarangIds.includes(b.barang_id));

  const toggleSelectBal = (id: string) => {
    setSelectedBarangIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleScanBarcode = (codeToScan: string) => {
    const trimmed = codeToScan.trim();
    if (!trimmed) return;

    const matched = availableBal.find(
      (b) =>
        b.barcode.toLowerCase() === trimmed.toLowerCase() ||
        b.no_bal.toLowerCase() === trimmed.toLowerCase()
    );

    if (!matched) {
      setScanFeedback({
        type: 'error',
        message: `Barcode / No. Bal "${trimmed}" tidak ditemukan di gudang!`,
      });
      setBarcodeInput('');
      return;
    }

    if (selectedBarangIds.includes(matched.barang_id)) {
      setScanFeedback({
        type: 'info',
        message: `Bal ${matched.no_bal} (${matched.barcode}) sudah tercentang dalam daftar sampel.`,
      });
      setBarcodeInput('');
      return;
    }

    setSelectedBarangIds((prev) => [...prev, matched.barang_id]);
    setScanFeedback({
      type: 'success',
      message: `BERHASIL SCAN: Bal #${matched.no_bal} (${matched.kode_grade} - ${matched.berat_kg}kg) berhasil ditambahkan!`,
    });
    setBarcodeInput('');
    setTimeout(() => scannerInputRef.current?.focus(), 100);
  };

  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanBarcode(barcodeInput);
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAvailableBal.map((b) => b.barang_id);
    setSelectedBarangIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedBarangIds([]);
  };

  const handleFinishBatchSample = () => {
    if (selectedBarangIds.length === 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmBatchSample = () => {
    const finalTujuan = tujuanBuyer === 'lainnya' ? (customTujuan.trim() || 'Pabrik Rokok Rekanan') : tujuanBuyer;
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const generatedSamples: PengirimanSample[] = [];
    const updatedBarangs: Barang[] = [];

    const effectiveWeightKg = Math.min(beratGramPerBal, 500) / 1000;

    selectedBalObjects.forEach((bal, idx) => {
      const sampleId = generateSampleId(bal.kode_grade, now, idx + 1);
      const newWeight = Math.max(0.1, Math.round((bal.berat_kg - effectiveWeightKg) * 100) / 100);

      const newSample: PengirimanSample = {
        sample_id: sampleId,
        barang_id: bal.barang_id,
        barcode_sumber: bal.barcode,
        kode_grade: bal.kode_grade,
        sumber: bal.lokasi_gudang || 'Gudang Utama',
        tujuan: finalTujuan,
        tanggal_kirim: dateFormatted,
        berat_sample_gram: Math.min(beratGramPerBal, 500),
        status: 'dikirim',
        catatan: catatan.trim() || `Pengambilan sampel ${beratGramPerBal} gram dari bal ${bal.no_bal} untuk uji lab`,
        dikirim_oleh: 'Operator QC Gudang Pamekasan',
      };

      generatedSamples.push(newSample);

      const updatedBal: Barang = {
        ...bal,
        berat_kg: newWeight,
        status_stok: 'terkirim_sample',
        catatan: `${bal.catatan || ''} | Sampel ${beratGramPerBal}g (${sampleId}) pada ${dateFormatted}. Netto: ${newWeight} kg.`.trim(),
      };

      updatedBarangs.push(updatedBal);
    });

    onSaveBatchSamples(generatedSamples, updatedBarangs);
    setIsConfirmOpen(false);
    onClose();
    setStep(1);
  };

  const totalReductionKg = (selectedBalObjects.length * Math.min(beratGramPerBal, 500)) / 1000;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
        <div className="bg-white border border-gray-300 w-full max-w-4xl rounded-none shadow-2xl flex flex-col max-h-[92vh] text-xs text-gray-800">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4 text-[#b81d24]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                  Pengiriman Sample Uji Mutu (Batch & Scan Barcode)
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  Langkah {step} dari 3: {step === 1 ? 'Scan / Pilih Bal Tembakau (Batch)' : step === 2 ? 'Pengaturan Gramasi & Lab Tujuan' : 'Konfirmasi Dispatch Sample'}
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
            </div>
          </div>

        {/* Wizard Progression Steps */}
        <div className="bg-[#f8f9fa] px-4 py-2 flex items-center justify-between border-b border-gray-200 text-xs">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#b81d24] font-bold' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-[#b81d24] text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </span>
            <span>1. Scan / Pilih Bal Batch ({selectedBarangIds.length} Terpilih)</span>
          </div>

          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#b81d24] font-bold' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-[#b81d24] text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </span>
            <span>2. Gramasi Sampel & Pabrik Tujuan</span>
          </div>

          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-[#b81d24] font-bold' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-[#b81d24] text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </span>
            <span>3. Konfirmasi & Potong Netto</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* STEP 1: SCAN BARCODE OR SELECT BAL BATCH */}
          {step === 1 && (
            <div className="space-y-3.5">
              
              {/* Barcode Scanner Box */}
              <div className="p-3 bg-[#f8f9fa] border border-gray-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                    <Scan className="w-4 h-4 text-[#b81d24]" />
                    <span>TEMBAKKAN BARCODE SCANNER (AUTO CENTANG)</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Scan = Otomatis Tercentang
                  </span>
                </div>

                <form onSubmit={handleScannerSubmit} className="flex gap-2">
                  <input
                    ref={scannerInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Arahkan barcode scanner / ketik misal: E-140826-034..."
                    className="flex-1 bg-white border border-[#ced4da] rounded-sm px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#b81d24]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#b81d24] hover:bg-[#a0181e] text-white rounded-sm font-bold text-xs flex items-center space-x-1 transition cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Scan Bal</span>
                  </button>
                </form>

                {/* Scan Feedback Banner */}
                {scanFeedback && (
                  <div
                    className={`p-2 border flex items-center space-x-2 text-xs ${
                      scanFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : scanFeedback.type === 'info'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    {scanFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span className="font-semibold text-[11px]">{scanFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Warehouse Bal Selection Table */}
              <div className="bg-white border border-gray-200 space-y-2.5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 text-xs block">
                      Daftar Bal Tembakau di Gudang (Bisa Pilih Batch)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Tersedia: {availableBal.length} Bal • Tercentang: <strong className="text-[#b81d24] font-mono">{selectedBarangIds.length} Bal</strong>
                    </span>
                  </div>

                  <div className="flex space-x-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm text-gray-700 font-semibold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm text-gray-700 font-semibold cursor-pointer"
                    >
                      Reset Pilihan
                    </button>
                  </div>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchBalQuery}
                    onChange={(e) => setSearchBalQuery(e.target.value)}
                    placeholder="Cari bal, no bal, barcode (E-140826-034), petani, grade..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ced4da] rounded-sm focus:outline-none focus:border-[#b81d24]"
                  />
                </div>

                {/* Checklist List */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-gray-100">
                  {filteredAvailableBal.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      Tidak ada bal yang cocok dengan pencarian
                    </div>
                  ) : (
                    filteredAvailableBal.map((b) => {
                      const isSelected = selectedBarangIds.includes(b.barang_id);
                      return (
                        <label
                          key={b.barang_id}
                          className={`flex items-center justify-between p-2 cursor-pointer transition text-xs ${
                            isSelected
                              ? 'bg-red-50/60 border border-[#b81d24] text-gray-900 font-bold'
                              : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectBal(b.barang_id)}
                              className="w-3.5 h-3.5 text-[#b81d24] rounded-none focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-gray-900">
                                  Bal #{b.no_bal}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 py-0.2 border border-gray-300">
                                  {b.barcode}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-500 font-normal">
                                Petani: {b.nama_petani} • Lokasi: {b.lokasi_gudang}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2.5">
                            <span className="px-2 py-0.5 bg-gray-800 text-white text-[10px] font-bold">
                              Grade {b.kode_grade}
                            </span>
                            <span className="font-mono font-bold text-gray-900 text-xs">
                              {b.berat_kg} kg
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Summary Band */}
                <div className="bg-[#f8f9fa] border border-gray-200 p-2.5 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 font-sans block">Total Bal Sampel:</span>
                    <span className="text-sm font-bold text-[#b81d24]">{selectedBarangIds.length} Bal Terpilih</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-sans block">Maksimal Sampel:</span>
                    <span className="text-xs font-semibold text-gray-700">0.50 kg (500g) per bal</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* STEP 2: GRAMASI SAMPLE & DESTINATION LAB */}
          {step === 2 && (
            <div className="space-y-3.5">
              
              {/* Gramasi Per Bal Configuration */}
              <div className="p-3.5 bg-[#f8f9fa] border border-gray-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                    <Scale className="w-4 h-4 text-[#b81d24]" />
                    <span>Berat Sample yang Diambil per Bal (Maksimal 500 gram)</span>
                  </span>
                  <span className="font-mono font-bold text-xs text-white bg-[#b81d24] px-2 py-0.5">
                    {beratGramPerBal} Gram ({(beratGramPerBal / 1000).toFixed(2)} kg/bal)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-600 font-medium mr-1">Preset:</span>
                  {[100, 200, 250, 350, 500].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setBeratGramPerBal(g)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer border ${
                        beratGramPerBal === g
                          ? 'bg-[#b81d24] text-white border-[#b81d24]'
                          : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {g}g {g === 500 ? '(Maks)' : ''}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={50}
                  max={500}
                  step={10}
                  value={beratGramPerBal}
                  onChange={(e) => setBeratGramPerBal(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-300 rounded-none appearance-none cursor-pointer accent-[#b81d24]"
                />

                <div className="p-2 bg-white border border-gray-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-600">
                    Jumlah Bal Terpilih: <strong>{selectedBarangIds.length} Bal</strong>
                  </span>
                  <span className="text-[#b81d24] font-bold">
                    Total Berat Sampel Diambil: {totalReductionKg.toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Destination Lab & QC Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">
                    Pilih Pabrik / Buyer / Lab QC Tujuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tujuanBuyer}
                    onChange={(e) => {
                      setTujuanBuyer(e.target.value);
                      setCustomTujuan('');
                    }}
                    className="w-full px-2.5 py-1.5 border border-[#ced4da] rounded-sm focus:border-[#b81d24] focus:outline-none bg-white text-gray-900"
                  >
                    {popularBuyers.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="lainnya">-- Input Nama Pabrik / Lab Baru Lainnya --</option>
                  </select>
                </div>

                {tujuanBuyer === 'lainnya' && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-gray-700 block">
                      Nama Pabrik / Lab Baru <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customTujuan}
                      onChange={(e) => setCustomTujuan(e.target.value)}
                      placeholder="Contoh: PT Tri Sakti Purwosari Makmur Pasuruan"
                      className="w-full px-2.5 py-1.5 border border-[#ced4da] rounded-sm focus:border-[#b81d24] focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">
                    Gudang Asal Pengambilan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sumberGudang}
                    onChange={(e) => setSumberGudang(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#ced4da] rounded-sm focus:border-[#b81d24] focus:outline-none bg-white text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">
                    Petugas QC / Pengirim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dikirimOleh}
                    onChange={(e) => setDikirimOleh(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#ced4da] rounded-sm focus:border-[#b81d24] focus:outline-none bg-white text-gray-900"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-gray-700 block">
                    Catatan Pengujian / Parameter QC Lab
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Uji kadar air, elastisitas rajangan, aroma tembakau..."
                    className="w-full px-2.5 py-1.5 border border-[#ced4da] rounded-sm focus:border-[#b81d24] focus:outline-none bg-white text-gray-900"
                  />
                </div>

              </div>

            </div>
          )}

          {/* STEP 3: BATCH CONFIRMATION & SUMMARY */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div className="bg-[#f8f9fa] p-3.5 border border-gray-200 space-y-2.5">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wider block">
                  Ringkasan Pengiriman Batch {selectedBarangIds.length} Sample Tembakau
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total Sample:</span>
                    <span className="font-bold text-gray-900">{selectedBarangIds.length} Sample Bal</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Berat per Sample:</span>
                    <span className="font-mono font-bold text-gray-900">{beratGramPerBal} Gram</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total Pengurangan Fisik:</span>
                    <span className="font-mono font-bold text-[#b81d24]">-{totalReductionKg.toFixed(2)} kg</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[10px]">Pabrik / Buyer Tujuan:</span>
                    <span className="font-bold text-gray-900">{tujuanBuyer === 'lainnya' ? customTujuan : tujuanBuyer}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Petugas QC:</span>
                    <span className="font-semibold text-gray-800">{dikirimOleh}</span>
                  </div>
                </div>

                {/* List of Bal Included */}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-bold block mb-1 text-[11px]">
                    Daftar Bal yang Diambil Sampel ({selectedBalObjects.length} Bal):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                    {selectedBalObjects.map((bal, idx) => {
                      const newW = Math.max(0.1, Math.round((bal.berat_kg - (beratGramPerBal / 1000)) * 100) / 100);
                      return (
                        <div
                          key={bal.barang_id}
                          className="flex items-center justify-between p-1.5 bg-white border border-gray-200"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">{idx + 1}.</span>
                            <span className="font-bold text-gray-900">Bal #{bal.no_bal}</span>
                            <span className="text-gray-500">({bal.barcode})</span>
                            <span className="px-1.5 py-0.2 bg-gray-800 text-white text-[10px]">Grade {bal.kode_grade}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400">{bal.berat_kg} kg ➔ </span>
                            <span className="font-bold text-[#b81d24]">{newW} kg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] border border-gray-300 p-2.5 text-gray-700 text-[11px] leading-relaxed">
                <strong>Catatan Sistem:</strong> Seluruh bal tembakau tetap tercatat aktif di gudang dengan berat netto yang disesuaikan secara otomatis. ID Sample resmi (SMP-DDMMYY-XXX) akan diterbitkan untuk masing-masing bal.
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#545b62] hover:bg-[#464c52] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#545b62] hover:bg-[#464c52] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>Batal</span>
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={selectedBarangIds.length === 0}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>Lanjut Langkah {step + 1} ({selectedBarangIds.length} Bal)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishBatchSample}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan & Kirim {selectedBarangIds.length} Sample</span>
            </button>
          )}
        </div>

      </div>
    </div>

    <ConfirmModal
      isOpen={isConfirmOpen}
      onClose={() => setIsConfirmOpen(false)}
      onConfirm={handleConfirmBatchSample}
      title="Konfirmasi Pengiriman Sample Batch"
      message={`Apakah Anda yakin ingin memproses dan mencatat pengiriman sample untuk ${selectedBarangIds.length} bal tembakau yang dipilih?`}
      confirmText="Ya, Kirim Sample"
      cancelText="Batal"
      variant="primary"
    />
  </>
);
};
