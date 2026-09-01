import React, { useState, useMemo, useRef } from 'react';
import { 
  DollarSign, 
  Search, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  User, 
  Scale, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Receipt, 
  Info, 
  ArrowRight,
  RefreshCw,
  Tag,
  Filter,
  Eye,
  CreditCard
} from 'lucide-react';
import { TransaksiPembelian, Petani, TabelHarga, Barang, Gudang, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { TransaksiDetailModal } from './TransaksiDetailModal';
import { PembayaranKasirModal } from './PembayaranKasirModal';
import { SampleLabelPrintModal, SampleLabelData } from './SampleLabelPrintModal';
import { BarangBarcodeThermalModal } from '../barang/BarangBarcodeThermalModal';
import { Pagination } from '../common/Pagination';
import { ConfirmModal } from '../common/ConfirmModal';

interface KasirPageViewProps {
  transaksiList: TransaksiPembelian[];
  petaniList: Petani[];
  hargaList: TabelHarga[];
  barangList: Barang[];
  gudangList?: Gudang[];
  userRole: UserRole;
  initialKuponNo?: string;
  initialTxId?: string;
  onSaveTransaksi: (newTx: TransaksiPembelian, generatedBarang: Barang | Barang[]) => void;
  onDeleteTransaksi?: (transaksiId: string) => void;
  onNavigateToSortir: () => void;
  onNavigateToTimbangan: (kuponNo?: string, txId?: string) => void;
}

export const KasirPageView: React.FC<KasirPageViewProps> = ({
  transaksiList = [],
  petaniList = [],
  hargaList = [],
  barangList = [],
  gudangList = [],
  userRole,
  initialKuponNo,
  initialTxId,
  onSaveTransaksi,
  onDeleteTransaksi,
  onNavigateToSortir,
  onNavigateToTimbangan,
}) => {
  // Filter States matching Screenshot 3
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterKupon, setFilterKupon] = useState(initialKuponNo || '');
  const [filterPetaniId, setFilterPetaniId] = useState('');
  const [filterStatusBayar, setFilterStatusBayar] = useState('all'); // all, lunas, belum_lunas
  const [filterStatusNota, setFilterStatusNota] = useState('all'); // all, sudah_cetak, belum_cetak

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TransaksiPembelian | null>(null);
  const [selectedTxForBayar, setSelectedTxForBayar] = useState<TransaksiPembelian | null>(null);
  const [sampleLabelsToPrint, setSampleLabelsToPrint] = useState<SampleLabelData[] | null>(null);
  const [printingThermalBarang, setPrintingThermalBarang] = useState<Barang | null>(null);
  const [txToDelete, setTxToDelete] = useState<TransaksiPembelian | null>(null);

  // In-memory printed status tracking
  const [localPrintedTxIds, setLocalPrintedTxIds] = useState<Set<string>>(new Set());

  const handleUpdateNotaStatus = (txId: string) => {
    setLocalPrintedTxIds((prev) => new Set([...prev, txId]));
  };

  const handleConfirmCashPayment = (
    txId: string,
    details: {
      metode: 'cash';
      noBuktiKas: string;
      dibayarOleh: string;
      catatanKasir: string;
    }
  ) => {
    const tx = transaksiList.find((t) => t.transaksi_id === txId);
    if (!tx) return;

    const updatedTx: TransaksiPembelian = {
      ...tx,
      status_pembayaran: 'lunas',
      metode_pembayaran: 'cash',
      no_bukti_kas: details.noBuktiKas,
      dibayar_oleh: details.dibayarOleh,
      catatan_kasir: details.catatanKasir,
      status_nota: 'sudah_cetak',
      dibayar_pada: new Date().toISOString(),
    };

    const relatedBarang = barangList.filter((b) => tx.barang_ids?.includes(b.barang_id));
    onSaveTransaksi(updatedTx, relatedBarang);
    handleUpdateNotaStatus(txId);

    if (selectedTxForDetail && selectedTxForDetail.transaksi_id === txId) {
      setSelectedTxForDetail(updatedTx);
    }
  };

  const handleMarkAsLunas = (txId: string) => {
    const tx = transaksiList.find((t) => t.transaksi_id === txId);
    if (!tx) return;

    // Default fast payment
    const now = new Date();
    const dateCompact = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = String(Math.floor(100 + Math.random() * 900));
    const generatedBkk = `BKK-${dateCompact}-${randomSuffix}`;

    handleConfirmCashPayment(txId, {
      metode: 'cash',
      noBuktiKas: tx.no_bukti_kas || generatedBkk,
      dibayarOleh: 'Kasir Loket 1',
      catatanKasir: 'Petani menyerahkan tiket timbang, pembayaran tunai (Cash) dicatat lunas ke kas.',
    });
  };

  // Filter logic
  const filteredList = useMemo(() => {
    return transaksiList.filter((tx) => {
      // Filter Tanggal Mulai
      if (startDate) {
        const txDate = (tx.tanggal_transaksi || '').split(' ')[0];
        if (txDate < startDate) return false;
      }
      // Filter Tanggal Akhir
      if (endDate) {
        const txDate = (tx.tanggal_transaksi || '').split(' ')[0];
        if (txDate > endDate) return false;
      }
      // Filter Kupon
      if (filterKupon.trim()) {
        const q = filterKupon.trim().toLowerCase();
        const matchKupon = (tx.no_kupon || '').toLowerCase().includes(q);
        const matchId = (tx.transaksi_id || '').toLowerCase().includes(q);
        const matchBal = (tx.no_bal || '').toLowerCase().includes(q);
        if (!matchKupon && !matchId && !matchBal) return false;
      }
      // Filter Petani
      if (filterPetaniId && tx.petani_id !== filterPetaniId) {
        return false;
      }
      // Filter Status Bayar & Kas (Cash vs Kredit)
      const isLunas = tx.status_pembayaran === 'lunas' || tx.metode_pembayaran === 'cash';
      if ((filterStatusBayar === 'lunas' || filterStatusBayar === 'cash') && !isLunas) return false;
      if ((filterStatusBayar === 'belum_lunas' || filterStatusBayar === 'kredit') && isLunas) return false;

      // Filter Status Nota
      const isPrinted = tx.status_nota === 'sudah_cetak' || localPrintedTxIds.has(tx.transaksi_id);
      if (filterStatusNota === 'sudah_cetak' && !isPrinted) return false;
      if (filterStatusNota === 'belum_cetak' && isPrinted) return false;

      return true;
    });
  }, [transaksiList, startDate, endDate, filterKupon, filterPetaniId, filterStatusBayar, filterStatusNota, localPrintedTxIds]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalTx = filteredList.length;
    const totalBal = filteredList.reduce((acc, t) => acc + (t.total_bal || (t.items ? t.items.length : 1)), 0);
    const totalNetto = Number(filteredList.reduce((acc, t) => acc + (t.berat_kg || 0), 0).toFixed(1));
    const totalKotor = filteredList.reduce((acc, t) => acc + (t.total_kotor || t.total_harga_beli || 0), 0);
    const totalPotongan = filteredList.reduce((acc, t) => acc + (t.total_potongan || 0), 0);
    const totalBayar = filteredList.reduce((acc, t) => acc + (t.harga_final || 0), 0);
    const avgHarga = totalNetto > 0 ? Math.round(totalKotor / totalNetto) : 0;

    const unweighedCount = filteredList.filter((t) => (t.items || []).some((it) => (it.berat_kg || 0) <= 0)).length;
    const readyCount = totalTx - unweighedCount;

    const lunasList = filteredList.filter((t) => t.status_pembayaran === 'lunas' || t.metode_pembayaran === 'cash');
    const belumLunasList = filteredList.filter((t) => t.status_pembayaran !== 'lunas' && t.metode_pembayaran !== 'cash');

    const lunasCount = lunasList.length;
    const lunasNominal = lunasList.reduce((acc, t) => acc + (t.harga_final || 0), 0);

    const belumLunasCount = belumLunasList.length;
    const belumLunasNominal = belumLunasList.reduce((acc, t) => acc + (t.harga_final || 0), 0);

    return {
      totalTx,
      totalBal,
      totalNetto,
      totalKotor,
      totalPotongan,
      totalBayar,
      avgHarga,
      unweighedCount,
      readyCount,
      lunasCount,
      lunasNominal,
      belumLunasCount,
      belumLunasNominal,
    };
  }, [filteredList]);

  // Pagination slice
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilterKupon('');
    setFilterPetaniId('');
    setFilterStatusBayar('all');
    setFilterStatusNota('all');
    setCurrentPage(1);
  };

  const handleOpenSampleLabelPrint = (tx: TransaksiPembelian) => {
    const items = tx.items || [];
    const labels: SampleLabelData[] = items.map((it) => ({
      no_bal: it.no_bal,
      barcode: it.barcode || it.no_bal,
      kode_grade: it.kode_grade,
      nama_petani: tx.nama_petani,
      nomor_kartu: tx.nomor_kartu || tx.petani_id,
      tanggal_transaksi: tx.tanggal_transaksi?.split(' ')[0] || new Date().toISOString().split('T')[0],
      no_kupon: tx.no_kupon,
      lokasi_sample_box: it.lokasi_simpan,
      catatan: `Grade ${it.kode_grade} - ${formatRupiah(it.harga_per_kg)}/kg`,
    }));
    setSampleLabelsToPrint(labels);
  };

  return (
    <div className="space-y-4 font-sans pb-10">
      
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b81d24]"></span>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Data Pembelian Barang (Kasir & Pencairan Nota)
            </h2>
            <span className="px-2 py-0.5 bg-red-50 text-[#b81d24] border border-red-200 text-[10px] font-bold rounded-xs">
              Proses 3: Rekap Transaksi & Cetak Nota
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lihat rekapitulasi data pembelian, cek kupon, verifikasi potongan kuli/tali/tikar, dan cetak nota resmi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onNavigateToSortir()}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-sm transition cursor-pointer"
          >
            + Intake Sortir Baru
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTimbangan()}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-sm transition cursor-pointer"
          >
            Meja Timbangan
          </button>
        </div>
      </div>

      {/* Filter Section matching Screenshot 3 */}
      <div className="bg-white border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-800">
            <Filter className="w-4 h-4 text-[#b81d24]" />
            <span>Filter Pencarian Data Pembelian</span>
          </div>
          <span className="text-[11px] text-gray-500">
            Ditemukan <strong>{filteredList.length}</strong> dari {transaksiList.length} transaksi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
          
          {/* Tanggal Mulai */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
            />
          </div>

          {/* Kupon */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Kupon / ID
            </label>
            <input
              type="text"
              value={filterKupon}
              onChange={(e) => setFilterKupon(e.target.value)}
              placeholder="Masukkan kupon..."
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
            />
          </div>

          {/* Petani */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Petani
            </label>
            <select
              value={filterPetaniId}
              onChange={(e) => setFilterPetaniId(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
            >
              <option value="">-- Semua Petani --</option>
              {petaniList.map((p) => (
                <option key={p.petani_id} value={p.petani_id}>
                  {p.nama_petani} ({p.nomor_kartu || p.petani_id})
                </option>
              ))}
            </select>
          </div>

          {/* Status Bayar */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Status Pembayaran & Kas
            </label>
            <select
              value={filterStatusBayar}
              onChange={(e) => setFilterStatusBayar(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
            >
              <option value="all">-- Semua Status Kas --</option>
              <option value="cash">🟢 Cash / Masuk Kas ({transaksiList.filter(t => t.status_pembayaran === 'lunas' || t.metode_pembayaran === 'cash').length})</option>
              <option value="kredit">🟡 Kredit / Hutang Petani ({transaksiList.filter(t => t.status_pembayaran !== 'lunas' && t.metode_pembayaran !== 'cash').length})</option>
            </select>
          </div>

          {/* Buttons: Cari Data */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="flex-1 py-1.5 bg-[#d89719] hover:bg-[#c28414] text-white font-bold text-xs rounded-sm transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-sm transition cursor-pointer"
              title="Reset Filter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Transaksi</span>
          <p className="text-base font-black text-gray-900 mt-0.5">{stats.totalTx} Nota</p>
          <span className="text-[10px] text-gray-400 font-medium">Batch setoran</span>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Bal</span>
          <p className="text-base font-black text-gray-900 mt-0.5">{stats.totalBal} Bal</p>
          <span className="text-[10px] text-gray-400 font-medium">Karung masuk</span>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Tonase Netto</span>
          <p className="text-base font-black text-slate-800 mt-0.5">{stats.totalNetto.toLocaleString('id-ID')} Kg</p>
          <span className="text-[10px] text-gray-500 font-medium">{(stats.totalNetto / 1000).toFixed(2)} Ton</span>
        </div>

        <div className="bg-white border border-gray-200 p-3 rounded-sm shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Pembelian</span>
          <p className="text-base font-black text-gray-900 mt-0.5">{formatRupiah(stats.totalBayar)}</p>
          <span className="text-[10px] text-red-500 font-medium">Pot: {formatRupiah(stats.totalPotongan)}</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-300 p-3 rounded-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Kas Keluar (Cash)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <p className="text-base font-black text-emerald-900 mt-0.5">{formatRupiah(stats.lunasNominal)}</p>
          <span className="text-[10px] text-emerald-700 font-bold">{stats.lunasCount} Nota Cair Masuk Kas</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-300 p-3 rounded-sm shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">Hutang Petani (Kredit)</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <p className="text-base font-black text-amber-900 mt-0.5">{formatRupiah(stats.belumLunasNominal)}</p>
          <span className="text-[10px] text-amber-800 font-bold">{stats.belumLunasCount} Tiket Belum Diserahkan</span>
        </div>
      </div>

      {/* Main Table matching Screenshot 3 */}
      <div className="bg-white border border-gray-200 shadow-2xs overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-[#b81d24]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Tabel Data Pembelian Barang & Status Kasir
            </h3>
          </div>
        </div>

        {/* Quick Filter Status Bar (Cash / Kredit) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#b81d24]" />
              Filter Status Kas:
            </span>
            
            <button
              type="button"
              onClick={() => {
                setFilterStatusBayar('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-sm transition cursor-pointer flex items-center space-x-1.5 ${
                filterStatusBayar === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <span>Semua</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                filterStatusBayar === 'all' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700 font-bold'
              }`}>
                {transaksiList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatusBayar('cash');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-sm transition cursor-pointer flex items-center space-x-1.5 ${
                filterStatusBayar === 'cash' || filterStatusBayar === 'lunas'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>🟢 Cash (Masuk Kas)</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                filterStatusBayar === 'cash' || filterStatusBayar === 'lunas' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {transaksiList.filter(t => t.status_pembayaran === 'lunas' || t.metode_pembayaran === 'cash').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatusBayar('kredit');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-sm transition cursor-pointer flex items-center space-x-1.5 ${
                filterStatusBayar === 'kredit' || filterStatusBayar === 'belum_lunas'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>🟡 Kredit (Tiket Pending)</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                filterStatusBayar === 'kredit' || filterStatusBayar === 'belum_lunas' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {transaksiList.filter(t => t.status_pembayaran !== 'lunas' && t.metode_pembayaran !== 'cash').length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-gray-500">
              Menampilkan <strong className="text-gray-800">{paginatedList.length}</strong> dari <strong className="text-gray-800">{filteredList.length}</strong> data
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Kupon</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Petani</th>
                <th className="py-3 px-3 text-center">Jumlah / Bal</th>
                <th className="py-3 px-3 text-right">Netto</th>
                <th className="py-3 px-3 text-right">Total Kotor</th>
                <th className="py-3 px-3 text-right">Potongan</th>
                <th className="py-3 px-3 text-right">Jumlah Bayar</th>
                <th className="py-3 px-3 text-center">Status Bayar</th>
                <th className="py-3 px-3 text-center">Status Nota</th>
                <th className="py-3 px-3 text-right">AVG</th>
                <th className="py-3 px-3 text-center w-36">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-gray-400">
                    <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700 text-xs">Tidak ada data transaksi pembelian yang cocok</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Ubah kata kunci pencarian atau tanggal filter di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((tx, index) => {
                  const seq = (currentPage - 1) * itemsPerPage + index + 1;
                  const items = tx.items || [];
                  const balCount = tx.total_bal || (items.length > 0 ? items.length : 1);
                  const isWeighed = items.length > 0 && items.every((it) => (it.berat_kg || 0) > 0);
                  const hasZeroWeight = items.some((it) => (it.berat_kg || 0) <= 0);
                  const isPrinted = tx.status_nota === 'sudah_cetak' || localPrintedTxIds.has(tx.transaksi_id);
                  const isLunas = tx.status_pembayaran === 'lunas';

                  // Calculate average price per kg for this transaction
                  const avgPrice = tx.berat_kg > 0 ? Math.round((tx.total_kotor || tx.total_harga_beli) / tx.berat_kg) : tx.harga_per_kg;

                  return (
                    <tr key={tx.transaksi_id} className="hover:bg-amber-50/30 transition">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-500">
                        {seq}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-xs">
                          {tx.no_kupon || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-medium">
                        {tx.tanggal_transaksi?.split(' ')[0] || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-900">{tx.nama_petani}</div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {tx.nomor_kartu || tx.petani_id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold text-gray-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {balCount} Bal
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {hasZeroWeight ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ⏳ Belum Timbang
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-emerald-800 text-xs">
                            {tx.berat_kg} Kg
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-700">
                        {formatRupiah(tx.total_kotor || tx.total_harga_beli)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                        -{formatRupiah(tx.total_potongan)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900 text-xs">
                        {formatRupiah(tx.harga_final)}
                      </td>

                      {/* Status Pembayaran & Kas (Cash vs Kredit) */}
                      <td className="py-2.5 px-3 text-center">
                        {isLunas ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>Cash (Masuk Kas)</span>
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5" title="Nomor Bukti Kas Keluar">
                              {tx.no_bukti_kas || 'BKK-LUNAS'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 shadow-2xs">
                              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>Kredit (Tiket Pending)</span>
                            </span>
                            <span className="text-[9px] text-amber-800 font-medium mt-0.5">
                              Belum Diserahkan
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Cetak Nota */}
                      <td className="py-2.5 px-3 text-center">
                        {isPrinted ? (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded font-bold text-[10px] inline-flex items-center space-x-1">
                            <span>Sudah Cetak</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-[10px] inline-flex items-center space-x-1">
                            <span>Belum Cetak</span>
                          </span>
                        )}
                      </td>

                      {/* AVG / Rata-rata per kg */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(avgPrice)}
                      </td>

                      {/* Opsi Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Tombol Bayar Cash jika belum lunas dan sudah ditimbang */}
                          {!isLunas && !hasZeroWeight && (
                            <button
                              type="button"
                              onClick={() => setSelectedTxForBayar(tx)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition cursor-pointer shadow-2xs flex items-center space-x-1"
                              title="Proses Pembayaran Cash ke Petani (Buku Kas)"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Bayar Cash</span>
                            </button>
                          )}

                          {/* Detail & Nota */}
                          <button
                            type="button"
                            onClick={() => setSelectedTxForDetail(tx)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition cursor-pointer"
                            title="Lihat Detail & Cetak Nota PDF"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Sample Label */}
                          <button
                            type="button"
                            onClick={() => handleOpenSampleLabelPrint(tx)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded transition cursor-pointer"
                            title="Cetak Label Sample QC Bal"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Timbang if not complete */}
                          {hasZeroWeight && (
                            <button
                              type="button"
                              onClick={() => onNavigateToTimbangan(tx.no_kupon, tx.transaksi_id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded transition cursor-pointer"
                              title="Lanjutkan Penimbangan"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-gray-500">
            Halaman {currentPage} dari {totalPages} ({filteredList.length} total data)
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Transaksi Detail & PDF Print Modal */}
      <TransaksiDetailModal
        isOpen={Boolean(selectedTxForDetail)}
        onClose={() => setSelectedTxForDetail(null)}
        transaksi={selectedTxForDetail}
        onUpdateNotaStatus={handleUpdateNotaStatus}
        onMarkAsLunas={handleMarkAsLunas}
        onOpenBayarModal={(tx) => setSelectedTxForBayar(tx)}
      />

      {/* Pembayaran Kasir Cash Modal */}
      <PembayaranKasirModal
        isOpen={Boolean(selectedTxForBayar)}
        onClose={() => setSelectedTxForBayar(null)}
        transaksi={selectedTxForBayar}
        onConfirmPembayaran={handleConfirmCashPayment}
      />

      {/* Sample Label Print Modal */}
      <SampleLabelPrintModal
        isOpen={Boolean(sampleLabelsToPrint)}
        onClose={() => setSampleLabelsToPrint(null)}
        samples={sampleLabelsToPrint || []}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete && onDeleteTransaksi) {
            onDeleteTransaksi(txToDelete.transaksi_id);
            setTxToDelete(null);
          }
        }}
        title="Hapus Transaksi Pembelian"
        message={`Apakah Anda yakin ingin menghapus transaksi "${txToDelete?.transaksi_id}" (Kupon: ${txToDelete?.no_kupon}, Petani: ${txToDelete?.nama_petani})? Data bal dan inventaris terkait akan ikut dihapus.`}
        confirmText="Ya, Hapus Transaksi"
        confirmVariant="danger"
      />

    </div>
  );
};
