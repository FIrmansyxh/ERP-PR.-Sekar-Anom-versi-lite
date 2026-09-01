import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  Plus, 
  Printer, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Trash2,
  Receipt,
  Tag,
  Scan,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  AlertTriangle,
  Building,
  Check,
  Sparkles
} from 'lucide-react';
import { TransaksiPembelian, Petani, TabelHarga, Barang, UserRole, Gudang } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { TransaksiFormModal } from './TransaksiFormModal';
import { TransaksiDetailModal } from './TransaksiDetailModal';
import { Proses1SortirModal } from './Proses1SortirModal';
import { Proses2TimbangModal } from './Proses2TimbangModal';
import { SampleLabelPrintModal, SampleLabelData } from './SampleLabelPrintModal';
import { BarangBarcodeThermalModal } from '../barang/BarangBarcodeThermalModal';
import { Pagination } from '../common/Pagination';
import { ConfirmModal } from '../common/ConfirmModal';

interface TransaksiManagementProps {
  transaksiList: TransaksiPembelian[];
  petaniList: Petani[];
  hargaList: TabelHarga[];
  barangList: Barang[];
  gudangList?: Gudang[];
  userRole: UserRole;
  onSaveTransaksi: (newTx: TransaksiPembelian, generatedBarang: Barang | Barang[]) => void;
  onDeleteTransaksi?: (transaksiId: string) => void;
}

type TabType = 'semua' | 'sortir' | 'timbang' | 'kasir';

export const TransaksiManagement: React.FC<TransaksiManagementProps> = ({
  transaksiList = [],
  petaniList = [],
  hargaList = [],
  barangList = [],
  gudangList = [],
  userRole,
  onSaveTransaksi,
  onDeleteTransaksi,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('semua');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Standby scanner input in main view
  const [standbyBarcode, setStandbyBarcode] = useState('');
  const [standbyFeedback, setStandbyFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const standbyInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isSortirModalOpen, setIsSortirModalOpen] = useState(false);
  const [isTimbangModalOpen, setIsTimbangModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTxForTimbang, setSelectedTxForTimbang] = useState<TransaksiPembelian | null>(null);
  const [selectedBarcodeForTimbang, setSelectedBarcodeForTimbang] = useState<string | undefined>(undefined);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TransaksiPembelian | null>(null);
  const [sampleLabelsToPrint, setSampleLabelsToPrint] = useState<SampleLabelData[] | null>(null);
  const [printingThermalBarang, setPrintingThermalBarang] = useState<Barang | null>(null);
  const [txToDelete, setTxToDelete] = useState<TransaksiPembelian | null>(null);

  // In-memory update for nota print status
  const [localPrintedTxIds, setLocalPrintedTxIds] = useState<Set<string>>(new Set());

  const handleUpdateNotaStatus = (txId: string) => {
    setLocalPrintedTxIds((prev) => new Set([...prev, txId]));
  };

  // Focus standby input when timbang tab is active
  useEffect(() => {
    if (activeTab === 'timbang') {
      setTimeout(() => {
        if (standbyInputRef.current) {
          standbyInputRef.current.focus();
        }
      }, 200);
    }
  }, [activeTab]);

  // Counts for workflow badges
  const countSortirQueue = useMemo(() => {
    return transaksiList.filter((t) => t.status_transaksi === 'menunggu' || (t.items || []).some((it) => (it.berat_kg || 0) <= 0)).length;
  }, [transaksiList]);

  const countSiapNota = useMemo(() => {
    return transaksiList.filter((t) => t.status_transaksi === 'lengkap' && (t.items || []).every((it) => (it.berat_kg || 0) > 0)).length;
  }, [transaksiList]);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return transaksiList.filter((tx) => {
      // Tab filter
      if (activeTab === 'sortir') {
        const hasUnweighed = (tx.items || []).some((it) => (it.berat_kg || 0) <= 0);
        if (tx.status_transaksi !== 'menunggu' && !hasUnweighed) return false;
      }
      if (activeTab === 'timbang') {
        const hasPendingBal = (tx.items || []).some((it) => (it.berat_kg || 0) <= 0);
        if (!hasPendingBal && tx.status_transaksi === 'lengkap') return false;
      }
      if (activeTab === 'kasir') {
        const isComplete = tx.status_transaksi === 'lengkap' && (tx.items || []).every((it) => (it.berat_kg || 0) > 0);
        if (!isComplete) return false;
      }

      // Grade filter
      if (gradeFilter !== 'all' && tx.kode_grade !== gradeFilter) return false;

      // Status filter
      if (statusFilter === 'lengkap' && tx.status_transaksi !== 'lengkap') return false;
      if (statusFilter === 'menunggu' && tx.status_transaksi !== 'menunggu') return false;
      if (statusFilter === 'sudah_cetak' && !localPrintedTxIds.has(tx.transaksi_id) && tx.status_nota !== 'sudah_cetak') return false;
      if (statusFilter === 'belum_cetak' && (localPrintedTxIds.has(tx.transaksi_id) || tx.status_nota === 'sudah_cetak')) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = tx.transaksi_id.toLowerCase().includes(q);
        const matchNama = tx.nama_petani.toLowerCase().includes(q);
        const matchKartu = (tx.nomor_kartu || '').toLowerCase().includes(q);
        const matchBal = (tx.no_bal || '').toLowerCase().includes(q);
        const matchKupon = (tx.no_kupon || '').toLowerCase().includes(q);
        return matchId || matchNama || matchKartu || matchBal || matchKupon;
      }
      return true;
    });
  }, [transaksiList, activeTab, gradeFilter, statusFilter, searchQuery, localPrintedTxIds]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleOpenTimbangForTx = (tx: TransaksiPembelian, specificBalCode?: string) => {
    setSelectedTxForTimbang(tx);
    setSelectedBarcodeForTimbang(specificBalCode);
    setIsTimbangModalOpen(true);
  };

  // Handle standby scanner gun in main weighing view (PRD auto-open)
  const handleStandbyScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = standbyBarcode.trim().toUpperCase();
    if (!cleanCode) return;

    // Search across all transactions for this bal barcode
    let foundTx: TransaksiPembelian | undefined;
    for (const tx of transaksiList) {
      const match = (tx.items || []).some(
        (it) =>
          (it.barcode && it.barcode.toUpperCase() === cleanCode) ||
          (it.no_bal && it.no_bal.toUpperCase() === cleanCode)
      );
      if (match) {
        foundTx = tx;
        break;
      }
    }

    if (foundTx) {
      setStandbyFeedback({
        text: `✓ Stiker Barcode "${cleanCode}" COCOK! Membuka workstation penimbangan Petani ${foundTx.nama_petani}...`,
        isError: false,
      });
      setStandbyBarcode('');
      handleOpenTimbangForTx(foundTx, cleanCode);
    } else {
      setStandbyFeedback({
        text: `✗ Stiker Barcode "${cleanCode}" tidak ditemukan di antrian. Pastikan sudah diinput pada Proses 1 Sortir.`,
        isError: true,
      });
      setStandbyBarcode('');
    }
  };

  const handleOpenSampleLabelForTx = (tx: TransaksiPembelian) => {
    const samples: SampleLabelData[] = (tx.items || []).map((item) => ({
      no_bal: item.no_bal,
      barcode: item.barcode || item.no_bal,
      kode_grade: item.kode_grade,
      nama_petani: tx.nama_petani,
      nomor_kartu: tx.nomor_kartu || tx.petani_id,
      tanggal_transaksi: tx.tanggal_transaksi ? tx.tanggal_transaksi.split(' ')[0].split('T')[0] : '-',
      no_kupon: tx.no_kupon,
      catatan: item.ganti_tikar ? 'Ganti Tikar (Biaya 75rb, Tara 2kg)' : 'Tikar Standar (Tara 3kg)',
    }));
    setSampleLabelsToPrint(samples);
  };

  const handleOpenPrintForTx = (tx: TransaksiPembelian) => {
    const relatedBarang = barangList.find((b) => b.barang_id === tx.barang_id_terkait || b.barcode === tx.barcode_terkait);
    if (relatedBarang) {
      setPrintingThermalBarang(relatedBarang);
    } else {
      const tempBarang: Barang = {
        barang_id: tx.barang_id_terkait || tx.transaksi_id,
        barcode: tx.barcode_terkait || tx.transaksi_id,
        kode_grade: tx.kode_grade,
        no_bal: tx.no_bal,
        berat_kg: tx.berat_kg,
        status_stok: 'di_gudang',
        lokasi_gudang: tx.lokasi_gudang || 'Gudang Pusat Induk / Blok A',
        tanggal_masuk: tx.tanggal_transaksi ? tx.tanggal_transaksi.split(' ')[0].split('T')[0] : new Date().toISOString().split('T')[0],
        petani_id: tx.petani_id,
        nama_petani: tx.nama_petani,
      };
      setPrintingThermalBarang(tempBarang);
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* Workflow Navigation Sub-tabs */}
      <div className="bg-white border border-gray-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('semua');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer rounded-xs whitespace-nowrap ${
                activeTab === 'semua'
                  ? 'bg-[#b81d24] text-white shadow-xs'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Transaksi & Intake</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'semua' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-800'
              }`}>
                {transaksiList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sortir');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer rounded-xs whitespace-nowrap ${
                activeTab === 'sortir'
                  ? 'bg-[#b81d24] text-white shadow-xs'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Proses 1: Meja Sortir & Sampel</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'sortir' ? 'bg-white/20 text-white' : 'bg-red-200 text-red-900 font-bold'
              }`}>
                {countSortirQueue}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('timbang');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer rounded-xs whitespace-nowrap ${
                activeTab === 'timbang'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Proses 2: Meja Timbang & Blok Gudang</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'timbang' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900 font-bold'
              }`}>
                {countSortirQueue}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('kasir');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer rounded-xs whitespace-nowrap ${
                activeTab === 'kasir'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Loket Kasir & Cetak Nota</span>
              <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'kasir' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900 font-bold'
              }`}>
                {countSiapNota}
              </span>
            </button>
          </div>

          {/* Quick Trigger Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSortirModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>+ Input Meja Sortir (Proses 1)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTxForTimbang(null);
                setSelectedBarcodeForTimbang(undefined);
                setIsTimbangModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>+ Buka Meja Timbang (Proses 2)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Standby Barcode Scanner Gun Bar (Active on Meja Timbang / Standby Mode) */}
      {activeTab === 'timbang' && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 border border-emerald-700 shadow-md animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  STANDBY MEJA TIMBANGAN (SCANNER GUN AKTIF)
                </span>
                <span className="text-xs text-emerald-300 font-medium">
                  Auto-Open Halaman Tembakau Sesuai Barcode Fisik
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Tembakkan Scanner ke Barcode Stiker Bal Fisik (misal: A0001)
              </h3>
              <p className="text-[11px] text-emerald-200/80 max-w-xl">
                Alat scanner akan otomatis memanggil dan membuka popup bal tembakau tersebut serta mengarahkan kursor langsung ke input berat timbangan.
              </p>
            </div>

            <div className="w-full md:w-auto flex-1 max-w-md">
              <form onSubmit={handleStandbyScanSubmit} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    ref={standbyInputRef}
                    type="text"
                    value={standbyBarcode}
                    onChange={(e) => setStandbyBarcode(e.target.value)}
                    placeholder="Scan stiker barcode bal fisik..."
                    className="w-full bg-emerald-950/80 border-2 border-emerald-400 font-mono font-black text-sm text-white px-3 py-2 rounded-sm focus:outline-none focus:border-white focus:bg-emerald-900 placeholder:text-emerald-400/60"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-emerald-400 font-mono">
                    ↵ Enter
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-sm transition cursor-pointer shadow-sm shrink-0"
                >
                  Panggil Bal
                </button>
              </form>
            </div>
          </div>

          {standbyFeedback && (
            <div className={`mt-3 px-3 py-1.5 rounded-xs text-xs font-bold flex items-center space-x-2 ${
              standbyFeedback.isError 
                ? 'bg-red-500/20 text-red-200 border border-red-500/40' 
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
            }`}>
              {standbyFeedback.isError ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{standbyFeedback.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Role-based Workflow Context Information */}
      <div className="bg-white border border-gray-200 p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <div className="w-7 h-7 rounded-sm bg-red-50 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-[#b81d24]" />
          </div>
          <div>
            <div className="font-bold text-gray-900 flex items-center space-x-2">
              <span>Alur Operasional Terintegrasi Scan Barcode (Sortir ➔ Timbang ➔ Blok Gudang ➔ Kasir):</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-[10px] rounded-xs font-bold">
                PRD Standard
              </span>
            </div>
            <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
              <strong>Sortir (Admin 1/2/3):</strong> Tembak stiker barcode fisik (misal: A0001 ➔ auto baris A0002) ➔ Input grade & harga (berat kosong) ➔ Centang Ganti Tikar (+75rb, tara 2kg / standar 3kg) ➔ Label sample identik barcode ➔ Simpan sample QC. <br />
              <strong>Timbang & Gudang:</strong> Standby scan di timbangan ➔ Tembak barcode ➔ Otomatis buka bal & input berat ➔ Tentukan Blok Simpan (Blok A/B/C/D) ➔ Masuk inventaris & Nota siap dicetak kasir.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-200 rounded-none shadow-xs">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#b81d24]" />
            <span className="font-bold tracking-wide uppercase text-xs">Filter & Pencarian Data</span>
          </div>
          {isFilterOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {isFilterOpen && (
          <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            
            {/* Grade Filter */}
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Grade Tembakau</label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              >
                <option value="all">Semua Grade (A - F)</option>
                <option value="A">Grade A (Super)</option>
                <option value="B">Grade B (Standar)</option>
                <option value="C">Grade C (Medium)</option>
                <option value="D">Grade D (Cacah)</option>
                <option value="E">Grade E (Campuran)</option>
                <option value="F">Grade F (Afkir)</option>
              </select>
            </div>

            {/* Status Nota Filter */}
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Status Penimbangan & Nota</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              >
                <option value="all">Semua Status</option>
                <option value="lengkap">Selesai Timbang (Siap Nota)</option>
                <option value="menunggu">Menunggu Timbang (Sortir Selesai)</option>
                <option value="sudah_cetak">Nota Sudah Dicetak</option>
                <option value="belum_cetak">Nota Belum Dicetak</option>
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Pencarian Cepat</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Ketik Kupon, ID, Petani, No. Bal..."
                className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm transition cursor-pointer font-semibold"
              >
                Reset Filter
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-xs">
        
        {/* Card Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              {activeTab === 'semua' && 'Daftar Transaksi Intake Pembelian Tembakau'}
              {activeTab === 'sortir' && 'Antrian Hasil Meja Sortir & Label Sampel QC'}
              {activeTab === 'timbang' && 'Antrian Meja Timbang & Alokasi Blok Gudang'}
              {activeTab === 'kasir' && 'Rekapitulasi Pembayaran Kasir & Status Nota'}
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              ({filteredData.length} data)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Table Pagination Size Control & Live Count */}
        <div className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Tampil</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-sm px-2 py-1 bg-white text-xs text-gray-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-600">Data Per Halaman</span>
          </div>

          <div className="text-[11px] text-gray-500 italic">
            * Tanggal format Tahun-Bulan-Tanggal (YYYY-MM-DD) • Nomor Kupon 1 baris utuh
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-xs font-bold text-gray-700">
                <th className="py-2.5 px-2.5 text-center border-r border-gray-200 w-10">No</th>
                <th className="py-2.5 px-3 border-r border-gray-200 whitespace-nowrap">No. Kupon</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Tanggal</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Customer / Petani</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Grade / Bal</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-center">Netto (Kg)</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-center">Status Timbang</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-center">Status Nota</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-right">Total Bersih (Rp)</th>
                <th className="py-2.5 px-3 text-center w-40">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    Tidak ada transaksi yang cocok dengan filter atau tab aktif.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  
                  // Validation: All items must have price and weight > 0
                  const isWeighingDone = (tx.items || []).length > 0
                    ? (tx.items || []).every((it) => (it.berat_kg || 0) > 0)
                    : (tx.berat_kg || 0) > 0;

                  const isPrinted = localPrintedTxIds.has(tx.transaksi_id) || tx.status_nota === 'sudah_cetak';
                  const dateOnly = tx.tanggal_transaksi ? tx.tanggal_transaksi.split(' ')[0].split('T')[0] : '-';

                  return (
                    <tr 
                      key={tx.transaksi_id}
                      className="hover:bg-[#f8f9fa] transition-colors"
                    >
                      {/* No */}
                      <td className="py-2.5 px-2.5 text-center border-r border-gray-200 font-mono text-gray-600">
                        {itemNumber}
                      </td>

                      {/* No Kupon (Full 1 row, never wrapped) */}
                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded-xs font-mono font-bold text-[#b81d24] whitespace-nowrap">
                          {tx.no_kupon || tx.transaksi_id}
                        </span>
                      </td>

                      {/* Tanggal (YYYY-MM-DD without hour) */}
                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono text-gray-700 whitespace-nowrap">
                        {dateOnly}
                      </td>

                      {/* Customer / Petani */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <div className="font-bold text-gray-900">{tx.nama_petani}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {tx.nomor_kartu || tx.petani_id} • {tx.desa_kecamatan || '-'}
                        </div>
                      </td>

                      {/* Grade / Bal */}
                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <div className="font-bold text-gray-800">
                          Grade {tx.kode_grade}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[160px]" title={tx.no_bal}>
                          {tx.total_bal || tx.items?.length || 1} Bal: {tx.no_bal}
                        </div>
                      </td>

                      {/* Netto (Kg) */}
                      <td className="py-2.5 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-900 whitespace-nowrap">
                        {isWeighingDone ? (
                          <span className="text-emerald-800 font-black">{tx.berat_kg} kg</span>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">0 kg (Menunggu)</span>
                        )}
                      </td>

                      {/* Status Timbang */}
                      <td className="py-2.5 px-3 border-r border-gray-200 text-center whitespace-nowrap">
                        {isWeighingDone ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xs inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Selesai Timbang</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenTimbangForTx(tx)}
                            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-xs inline-flex items-center space-x-1 cursor-pointer transition"
                            title="Klik untuk menimbang bal sekarang"
                          >
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Menunggu Timbang ➔</span>
                          </button>
                        )}
                      </td>

                      {/* Status Nota */}
                      <td className="py-2.5 px-3 border-r border-gray-200 text-center whitespace-nowrap">
                        {isPrinted ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-xs inline-flex items-center space-x-1">
                            <Check className="w-3 h-3 text-blue-700" />
                            <span>Sudah Dicetak</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-xs">
                            Belum Dicetak
                          </span>
                        )}
                      </td>

                      {/* Total Bersih */}
                      <td className="py-2.5 px-3 border-r border-gray-200 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {isWeighingDone ? (
                          formatRupiah(tx.harga_final)
                        ) : (
                          <span className="text-gray-400 font-mono">Rp 0 (Pending)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          {/* 1. Tombol Meja Timbang (Emerald) */}
                          <button
                            type="button"
                            onClick={() => handleOpenTimbangForTx(tx)}
                            className={`w-7 h-7 rounded-sm flex items-center justify-center text-white transition cursor-pointer shadow-xs ${
                              isWeighingDone ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                            }`}
                            title="Proses 2: Timbang & Alokasi Blok Gudang"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Cetak Label Sample QC Admin 3 (Amber Tag) */}
                          <button
                            type="button"
                            onClick={() => handleOpenSampleLabelForTx(tx)}
                            className="w-7 h-7 rounded-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Cetak Label Sample QC (Admin 3)"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Cetak Nota Timbang / Kasir (Teal) */}
                          <button
                            type="button"
                            onClick={() => setSelectedTxForDetail(tx)}
                            className={`w-7 h-7 rounded-sm flex items-center justify-center text-white transition cursor-pointer shadow-xs ${
                              isWeighingDone 
                                ? 'bg-[#17a2b8] hover:bg-[#138496]' 
                                : 'bg-gray-300 text-gray-500 cursor-pointer'
                            }`}
                            title={isWeighingDone ? 'Cetak Nota Timbang Kasir (PRD Bab 5)' : 'Selesaikan timbangan untuk mencetak nota'}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Transaction (Red) */}
                          {onDeleteTransaksi && (
                            <button
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              className="w-7 h-7 rounded-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="p-3 bg-white border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
          />
        </div>

      </div>

      {/* Modal Proses 1: Meja Sortir & Label QC (Admin 1, 2, 3) */}
      <Proses1SortirModal
        isOpen={isSortirModalOpen}
        onClose={() => setIsSortirModalOpen(false)}
        petaniList={petaniList}
        hargaList={hargaList}
        gudangList={gudangList}
        onSaveSortir={(newTx, sampleLabels) => {
          onSaveTransaksi(newTx, []);
          setIsSortirModalOpen(false);
          setSampleLabelsToPrint(sampleLabels);
        }}
      />

      {/* Modal Proses 2: Meja Timbang & Blok Gudang */}
      <Proses2TimbangModal
        isOpen={isTimbangModalOpen}
        onClose={() => {
          setIsTimbangModalOpen(false);
          setSelectedTxForTimbang(null);
          setSelectedBarcodeForTimbang(undefined);
        }}
        transaksiList={transaksiList}
        gudangList={gudangList}
        initialTransaksi={selectedTxForTimbang}
        initialBarcodeToSelect={selectedBarcodeForTimbang}
        onSaveTimbang={(updatedTx, generatedBarangList) => {
          onSaveTransaksi(updatedTx, generatedBarangList);
          setIsTimbangModalOpen(false);
          setSelectedTxForTimbang(null);
          setSelectedBarcodeForTimbang(undefined);
        }}
      />

      {/* Modal Cetak Label Sample QC (Admin 3) */}
      {sampleLabelsToPrint && (
        <SampleLabelPrintModal
          isOpen={Boolean(sampleLabelsToPrint)}
          onClose={() => setSampleLabelsToPrint(null)}
          samples={sampleLabelsToPrint}
          onConfirmStored={() => setSampleLabelsToPrint(null)}
        />
      )}

      {/* Modal Detail & Nota Timbang Transaksi (Dengan Validasi Selesai Timbang) */}
      {selectedTxForDetail && (
        <TransaksiDetailModal
          isOpen={Boolean(selectedTxForDetail)}
          onClose={() => setSelectedTxForDetail(null)}
          transaksi={selectedTxForDetail}
          onPrintBarcode={handleOpenPrintForTx}
          onUpdateNotaStatus={handleUpdateNotaStatus}
          onDeleteTransaksi={onDeleteTransaksi ? (id) => {
            onDeleteTransaksi(id);
            setSelectedTxForDetail(null);
          } : undefined}
        />
      )}

      {/* Modal Tambah Transaksi Batch Form */}
      <TransaksiFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        petaniList={petaniList}
        hargaList={hargaList}
        barangList={barangList}
        gudangList={gudangList}
        onSaveTransaksi={onSaveTransaksi}
      />

      {/* Modal Cetak Label Thermal Barcode Bal */}
      {printingThermalBarang && (
        <BarangBarcodeThermalModal
          isOpen={Boolean(printingThermalBarang)}
          onClose={() => setPrintingThermalBarang(null)}
          barang={printingThermalBarang}
        />
      )}

      {/* Konfirmasi Hapus Transaksi */}
      {txToDelete && (
        <ConfirmModal
          isOpen={Boolean(txToDelete)}
          title="Konfirmasi Hapus Transaksi"
          message={`Apakah Anda yakin ingin menghapus transaksi "${txToDelete.transaksi_id}" milik petani "${txToDelete.nama_petani}" (${txToDelete.berat_kg} Kg)?\n\nData bal inventaris gudang yang terkait transaksi ini juga akan dihapus dari stok aktif.`}
          confirmLabel="Hapus Transaksi"
          isDestructive={true}
          onConfirm={() => {
            if (onDeleteTransaksi && txToDelete) {
              onDeleteTransaksi(txToDelete.transaksi_id);
            }
            setTxToDelete(null);
          }}
          onCancel={() => setTxToDelete(null)}
        />
      )}

    </div>
  );
};
