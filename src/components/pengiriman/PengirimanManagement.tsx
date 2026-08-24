import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  RefreshCw,
  X,
  Info,
  ArrowLeft,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  Scale,
  Building2,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { PengirimanBarang, Barang, PengirimanSample, Gudang, Petani, UserRole } from '../../types';
import { SuratJalanPrintModal } from './SuratJalanPrintModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Pagination } from '../common/Pagination';
import { formatNumber, generateNoSuratJalanSimple } from '../../utils/formatters';

interface PengirimanManagementProps {
  pengirimanList: PengirimanBarang[];
  barangList: Barang[];
  sampleList?: PengirimanSample[];
  gudangList?: Gudang[];
  petaniList?: Petani[];
  userRole: UserRole;
  onSaveNewPengiriman: (pengiriman: PengirimanBarang, updatedBarangIds: string[]) => void;
}

export const PengirimanManagement: React.FC<PengirimanManagementProps> = ({
  pengirimanList = [],
  barangList = [],
  gudangList = [],
  petaniList = [],
  userRole,
  onSaveNewPengiriman,
}) => {
  // Page mode: 'list' (Surat Jalan table) or 'create' (In-page Delivery Order Creation)
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // List View State
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [printingSuratJalan, setPrintingSuratJalan] = useState<PengirimanBarang | null>(null);

  // In-Page Create Delivery Order State
  const [noSuratJalan, setNoSuratJalan] = useState('');
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split('T')[0]);
  const [tujuanBuyer, setTujuanBuyer] = useState('PT Djarum Kudus - Plant Pengolahan');
  const [customTujuan, setCustomTujuan] = useState('');
  const [driverNama, setDriverNama] = useState('Bpk. Slamet Riyadi');
  const [platNomor, setPlatNomor] = useState('M 8921 UA');
  const [noKontrak, setNoKontrak] = useState(`PO-DJA-${new Date().getFullYear()}-089`);
  const [catatan, setCatatan] = useState('Pengiriman bal tembakau lolos sortir siap pabrikasi.');

  // Create View Filters (Grade, Lokasi Gudang, Petani)
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGudang, setFilterGudang] = useState<string>('all');
  const [filterPetani, setFilterPetani] = useState<string>('all');
  const [filterSearchBal, setFilterSearchBal] = useState<string>('');

  // Selected Bal IDs for shipment
  const [selectedBalIds, setSelectedBalIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const popularBuyers = [
    'PT Djarum Kudus - Plant Pengolahan',
    'PT Gudang Garam Tbk Kediri - Gudang Produksi',
    'PT HM Sampoerna Surabaya - Kraksaan Plant',
    'Bentoel Group Malang - Pabrik Sukun',
    'PT Wismilak Inti Makmur Surabaya',
    'PR. Sukun Kudus',
    'Lainnya (Tulis Manual)',
  ];

  // Available bal in warehouse (status_stok === 'di_gudang' or 'terkirim_sample')
  const availableBalList = useMemo(() => {
    return barangList.filter((b) => b.status_stok === 'di_gudang' || b.status_stok === 'terkirim_sample');
  }, [barangList]);

  // Filtered bal for selection in 'create' page
  const filteredBalForShipment = useMemo(() => {
    return availableBalList.filter((b) => {
      if (filterGrade !== 'all' && b.kode_grade !== filterGrade) return false;
      
      if (filterGudang !== 'all') {
        const matchGudang =
          (b.gudang_id && b.gudang_id === filterGudang) ||
          b.lokasi_gudang.toLowerCase().includes(filterGudang.toLowerCase());
        if (!matchGudang) return false;
      }

      if (filterPetani !== 'all') {
        const matchPetani =
          (b.petani_id && b.petani_id === filterPetani) ||
          (b.nama_petani && b.nama_petani.toLowerCase() === filterPetani.toLowerCase());
        if (!matchPetani) return false;
      }

      if (filterSearchBal.trim()) {
        const q = filterSearchBal.toLowerCase().trim();
        const matchNoBal = b.no_bal.toLowerCase().includes(q);
        const matchId = b.barang_id.toLowerCase().includes(q);
        const matchPetaniName = (b.nama_petani || '').toLowerCase().includes(q);
        return matchNoBal || matchId || matchPetaniName;
      }

      return true;
    });
  }, [availableBalList, filterGrade, filterGudang, filterPetani, filterSearchBal]);

  // Summary of selected bal
  const selectedBalObjects = useMemo(() => {
    return barangList.filter((b) => selectedBalIds.includes(b.barang_id));
  }, [barangList, selectedBalIds]);

  const totalSelectedBal = selectedBalObjects.length;
  const totalSelectedBerat = selectedBalObjects.reduce((sum, b) => sum + (b.berat_kg || 0), 0);

  // List View Filtering
  const filteredPengiriman = useMemo(() => {
    return pengirimanList.filter((krm) => {
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase().trim();
      const matchNo = krm.no_surat_jalan.toLowerCase().includes(q);
      const matchTujuan = krm.tujuan.toLowerCase().includes(q);
      const matchDriver = (krm.driver_nama || '').toLowerCase().includes(q);
      const matchPlat = (krm.plat_nomor || '').toLowerCase().includes(q);
      return matchNo || matchTujuan || matchDriver || matchPlat;
    });
  }, [pengirimanList, searchQuery]);

  const totalPages = Math.ceil(filteredPengiriman.length / itemsPerPage) || 1;
  const paginatedPengiriman = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPengiriman.slice(start, start + itemsPerPage);
  }, [filteredPengiriman, currentPage, itemsPerPage]);

  const handleOpenCreatePage = () => {
    const nextSeq = pengirimanList.length + 1;
    setNoSuratJalan(generateNoSuratJalanSimple(nextSeq));
    setTanggalKirim(new Date().toISOString().split('T')[0]);
    setSelectedBalIds([]);
    setFilterGrade('all');
    setFilterGudang('all');
    setFilterPetani('all');
    setFilterSearchBal('');
    setErrorMessage('');
    setViewMode('create');
  };

  const handleToggleSelectBal = (id: string) => {
    setSelectedBalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredBalForShipment.map((b) => b.barang_id);
    const allSelected = filteredIds.every((id) => selectedBalIds.includes(id));

    if (allSelected) {
      // Unselect filtered ones
      setSelectedBalIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Add all filtered ones
      const combined = Array.from(new Set([...selectedBalIds, ...filteredIds]));
      setSelectedBalIds(combined);
    }
  };

  const handleSubmitShipment = () => {
    if (selectedBalIds.length === 0) {
      setErrorMessage('Pilih minimal 1 bal tembakau untuk dikirim.');
      return;
    }
    const finalTujuan = tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer;
    if (!finalTujuan.trim()) {
      setErrorMessage('Tujuan pengiriman pabrik wajib diisi.');
      return;
    }
    if (!driverNama.trim()) {
      setErrorMessage('Nama supir / driver wajib diisi.');
      return;
    }
    if (!platNomor.trim()) {
      setErrorMessage('Nomor polisi / plat kendaraan wajib diisi.');
      return;
    }

    setErrorMessage('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const finalTujuan = tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer;
    
    // Group grades
    const gradesBreakdown: Record<string, { bal: number; kg: number }> = {};
    selectedBalObjects.forEach((b) => {
      if (!gradesBreakdown[b.kode_grade]) {
        gradesBreakdown[b.kode_grade] = { bal: 0, kg: 0 };
      }
      gradesBreakdown[b.kode_grade].bal += 1;
      gradesBreakdown[b.kode_grade].kg += b.berat_kg || 0;
    });

    const newPengiriman: PengirimanBarang = {
      pengiriman_id: `KRM-${Date.now()}`,
      no_surat_jalan: noSuratJalan || generateNoSuratJalanSimple(pengirimanList.length + 1),
      tanggal_kirim: tanggalKirim,
      tujuan: finalTujuan,
      status: 'dikirim',
      total_bal: totalSelectedBal,
      total_berat_kg: totalSelectedBerat,
      driver_nama: driverNama,
      plat_nomor: platNomor.toUpperCase(),
      nomor_kontrak: noKontrak,
      catatan: catatan,
      petugas: 'Petugas Ekspedisi PR. Sekar Anom',
      barang_ids: selectedBalIds,
      rincian_grade: gradesBreakdown,
    };

    onSaveNewPengiriman(newPengiriman, selectedBalIds);
    setIsConfirmOpen(false);
    setViewMode('list');
    setPrintingSuratJalan(newPengiriman);
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* ========================================================================= */}
      {/* 1. VIEW MODE: CREATE DELIVERY ORDER IN-PAGE (NO MODAL / POPUP)            */}
      {/* ========================================================================= */}
      {viewMode === 'create' ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Top Control Bar */}
          <div className="bg-white p-4 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar</span>
              </button>
              <div>
                <h1 className="text-base font-bold text-gray-900 tracking-tight">
                  Proses Pengiriman Barang & Terbitkan Surat Jalan
                </h1>
                <p className="text-xs text-gray-500">
                  Pilih bal tembakau dengan filter Grade, Lokasi Gudang, dan Petani
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right mr-2 hidden sm:block">
                <span className="text-[11px] text-gray-500 block">Total Dipilih:</span>
                <span className="text-xs font-bold font-mono text-[#b81d24]">
                  {totalSelectedBal} Bal ({formatNumber(totalSelectedBerat)} kg)
                </span>
              </div>

              <button
                onClick={handleSubmitShipment}
                className="px-4 py-2 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-2 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Terbitkan Surat Jalan ({totalSelectedBal} Bal)</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Header Info Grid */}
          <div className="bg-white p-4 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
              1. Informasi Pengiriman & Kendaraan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* No Surat Jalan */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">No. Surat Jalan</label>
                <input
                  type="text"
                  value={noSuratJalan}
                  onChange={(e) => setNoSuratJalan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-sm px-3 py-2 font-mono font-bold text-gray-900 focus:outline-none"
                />
              </div>

              {/* Tanggal Kirim */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Tanggal Pengiriman</label>
                <input
                  type="date"
                  value={tanggalKirim}
                  onChange={(e) => setTanggalKirim(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                />
              </div>

              {/* Driver */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Nama Supir / Driver <span className="text-[#b81d24]">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Slamet Riyadi"
                  value={driverNama}
                  onChange={(e) => setDriverNama(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                />
              </div>

              {/* Plat Nomor */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Plat Kendaraan <span className="text-[#b81d24]">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: M 8921 UA"
                  value={platNomor}
                  onChange={(e) => setPlatNomor(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 font-mono font-bold text-gray-900 focus:outline-none focus:border-[#b81d24]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Tujuan Pabrik Buyer */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-1">Tujuan Pabrik / Buyer <span className="text-[#b81d24]">*</span></label>
                <select
                  value={tujuanBuyer}
                  onChange={(e) => setTujuanBuyer(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                >
                  {popularBuyers.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {tujuanBuyer === 'Lainnya (Tulis Manual)' && (
                  <input
                    type="text"
                    placeholder="Ketik nama pabrik / buyer tujuan..."
                    value={customTujuan}
                    onChange={(e) => setCustomTujuan(e.target.value)}
                    className="mt-2 w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                  />
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Catatan Pengiriman</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan surat jalan..."
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Filters & Bal Selection Table */}
          <div className="bg-white border border-gray-200 shadow-xs">
            <div className="p-4 border-b border-gray-200 bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-[#b81d24]" />
                  <span>2. Filter Stok Bal Tembakau Gudang</span>
                </h2>
                <p className="text-[11px] text-gray-500">
                  Filter berdasarkan Grade, Lokasi Gudang, dan Petani untuk memilih bal yang akan dikirim
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-700">
                  {selectedBalIds.length} dari {availableBalList.length} Bal Dipilih
                </span>
              </div>
            </div>

            {/* In-Page Filters */}
            <div className="p-4 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white">
              
              {/* 1. Filter Grade */}
              <div>
                <label className="block text-gray-600 font-bold mb-1">Filter Grade</label>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
                >
                  <option value="all">Semua Grade</option>
                  <option value="A">Grade A (Super)</option>
                  <option value="B">Grade B (Standar)</option>
                  <option value="C">Grade C (Medium)</option>
                  <option value="D">Grade D (Cacah)</option>
                  <option value="E">Grade E (Campuran)</option>
                  <option value="F">Grade F (Afkir)</option>
                </select>
              </div>

              {/* 2. Filter Lokasi Gudang */}
              <div>
                <label className="block text-gray-600 font-bold mb-1">Filter Lokasi Gudang</label>
                <select
                  value={filterGudang}
                  onChange={(e) => setFilterGudang(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
                >
                  <option value="all">Semua Lokasi Gudang</option>
                  {gudangList.map((g) => (
                    <option key={g.gudang_id} value={g.nama_gudang || g.kode_gudang}>
                      {g.kode_gudang} - {g.nama_gudang}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter Petani */}
              <div>
                <label className="block text-gray-600 font-bold mb-1">Filter Petani Asal</label>
                <select
                  value={filterPetani}
                  onChange={(e) => setFilterPetani(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
                >
                  <option value="all">Semua Petani</option>
                  {petaniList.map((p) => (
                    <option key={p.petani_id} value={p.petani_id}>
                      {p.petani_id} - {p.nama_petani}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Search No. Bal / ID */}
              <div>
                <label className="block text-gray-600 font-bold mb-1">Pencarian No. Bal / ID</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik No Bal / Nama Petani..."
                    value={filterSearchBal}
                    onChange={(e) => setFilterSearchBal(e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
                  />
                  {filterSearchBal && (
                    <button
                      onClick={() => setFilterSearchBal('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Bulk Action Bar */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 rounded-sm font-semibold text-gray-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#b81d24]" />
                  <span>Pilih Semua Hasil Filter ({filteredBalForShipment.length} Bal)</span>
                </button>

                {selectedBalIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBalIds([])}
                    className="px-2.5 py-1 text-gray-500 hover:text-gray-800 text-xs font-medium cursor-pointer"
                  >
                    Batal Pilih Semua
                  </button>
                )}
              </div>

              <div className="text-gray-600">
                Menampilkan <strong className="text-gray-900">{filteredBalForShipment.length}</strong> bal siap kirim
              </div>
            </div>

            {/* Bal Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#f8f9fa] border-b border-gray-200 text-[11px] font-bold text-gray-700 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-gray-200">Pilih</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 w-36 font-mono">No. Bal / ID Bal</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24">Grade</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-right w-28">Berat (Kg)</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Lokasi Gudang</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Petani Pemasok</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28">Tgl Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredBalForShipment.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Tidak ada bal tembakau yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredBalForShipment.map((b) => {
                      const isSelected = selectedBalIds.includes(b.barang_id);
                      return (
                        <tr
                          key={b.barang_id}
                          onClick={() => handleToggleSelectBal(b.barang_id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-50/70 hover:bg-red-100/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-2 px-3 text-center border-r border-gray-200">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectBal(b.barang_id)}
                              className="rounded border-gray-300 text-[#b81d24] focus:ring-[#b81d24] cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 font-mono font-bold text-gray-900">
                            {b.no_bal}
                            <span className="block text-[10px] text-gray-400 font-normal">{b.barang_id}</span>
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-center">
                            <span className="px-2 py-0.5 font-bold font-mono text-xs bg-gray-800 text-white rounded-sm">
                              {b.kode_grade}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                            {b.berat_kg} kg
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-gray-700">
                            {b.lokasi_gudang}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-gray-800 font-medium">
                            {b.nama_petani || '-'}
                            <span className="block text-[10px] font-mono text-gray-400">{b.petani_id}</span>
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-center font-mono text-gray-600">
                            {b.tanggal_masuk}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Floating Bar */}
            <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{totalSelectedBal}</span> bal terpilih • Total Berat:{' '}
                <span className="font-mono font-bold text-[#b81d24] text-sm">
                  {formatNumber(totalSelectedBerat)} kg
                </span>{' '}
                ({(totalSelectedBerat / 1000).toFixed(2)} Ton)
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-sm transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSubmitShipment}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Truck className="w-4 h-4" />
                  <span>Proses & Terbitkan Surat Jalan ({totalSelectedBal} Bal)</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* 2. VIEW MODE: LIST SURAT JALAN TABLE (WITH PAGINATION)                    */
        /* ========================================================================= */
        <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          
          {/* Card Header matching Screenshot */}
          <div className="p-3 sm:px-4 sm:py-2.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
            <div>
              <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                Daftar Surat Jalan / Pengiriman Barang (Delivery Order)
              </h2>
              <p className="text-[11px] text-gray-500">
                Riwayat ekspedisi pengiriman tembakau ke pabrik mitra & buyer
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#545b62] hover:bg-[#464c52] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang</span>
              </button>

              <button
                onClick={handleOpenCreatePage}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Pengiriman Baru</span>
              </button>
            </div>
          </div>

          {/* Table Controls (Tampil X Data Per Halaman & Pencarian) */}
          <div className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="text-gray-600">Data Per Halaman</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Pencarian:</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari No Surat Jalan, Tujuan, Driver..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-sm px-2.5 py-1 text-xs text-gray-800 w-52 sm:w-64 focus:outline-none focus:border-[#b81d24]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200 text-[11px] font-bold text-gray-700">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-gray-200">No</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 w-36 font-mono">No. Surat Jalan</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 w-28 text-center">Tanggal Kirim</th>
                  <th className="py-2.5 px-3 border-r border-gray-200">Tujuan Pabrik / Buyer</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24">Jumlah Bal</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 text-right w-28">Total Berat</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 w-36">Driver & Kendaraan</th>
                  <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24">Status</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-xs">
                {paginatedPengiriman.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      Tidak ada data surat jalan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  paginatedPengiriman.map((krm, index) => {
                    const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                    return (
                      <tr key={krm.pengiriman_id} className="hover:bg-[#f8f9fa] transition-colors">
                        {/* No */}
                        <td className="py-2.5 px-3 text-center border-r border-gray-200 font-mono text-gray-600">
                          {itemNumber}
                        </td>

                        {/* No Surat Jalan */}
                        <td className="py-2.5 px-3 border-r border-gray-200 font-mono font-bold text-[#b81d24]">
                          {krm.no_surat_jalan}
                        </td>

                        {/* Tanggal */}
                        <td className="py-2.5 px-3 border-r border-gray-200 text-center font-mono text-gray-600">
                          {krm.tanggal_kirim}
                        </td>

                        {/* Tujuan */}
                        <td className="py-2.5 px-3 border-r border-gray-200 font-medium text-gray-900">
                          {krm.tujuan}
                          {krm.catatan && (
                            <span className="block text-[10px] text-gray-500 font-normal truncate max-w-xs">
                              {krm.catatan}
                            </span>
                          )}
                        </td>

                        {/* Total Bal */}
                        <td className="py-2.5 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-800">
                          {krm.total_bal} Bal
                        </td>

                        {/* Total Berat */}
                        <td className="py-2.5 px-3 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                          {formatNumber(krm.total_berat_kg)} kg
                        </td>

                        {/* Driver & Plat */}
                        <td className="py-2.5 px-3 border-r border-gray-200 text-gray-700">
                          <div className="font-medium text-gray-900">{krm.driver_nama || '-'}</div>
                          <div className="text-[10px] font-mono text-gray-500">{krm.plat_nomor || '-'}</div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 border-r border-gray-200 text-center">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {krm.status === 'dikirim' ? 'Terkirim' : krm.status}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setPrintingSuratJalan(krm)}
                              className="w-6 h-6 rounded-full bg-[#17a2b8] hover:bg-[#138496] text-white flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs"
                              title="Cetak Surat Jalan (DO)"
                            >
                              <Printer className="w-3.5 h-3.5" />
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

          {/* Sliding 3-Number Window Pagination */}
          <div className="p-3 bg-white border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPengiriman.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>

        </div>
      )}

      {/* Print Surat Jalan Modal */}
      {printingSuratJalan && (
        <SuratJalanPrintModal
          isOpen={Boolean(printingSuratJalan)}
          onClose={() => setPrintingSuratJalan(null)}
          pengiriman={printingSuratJalan}
          barangList={barangList}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Penerbitan Surat Jalan"
        message={`Apakah Anda yakin ingin menerbitkan Surat Jalan ${noSuratJalan} untuk pengiriman ${totalSelectedBal} bal (${formatNumber(totalSelectedBerat)} kg) ke ${tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer}? Bal yang terpilih akan otomatis berstatus KELUAR dari inventaris.`}
        variant="primary"
        confirmText="Ya, Terbitkan Surat Jalan"
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
};
