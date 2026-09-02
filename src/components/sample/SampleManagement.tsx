import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Edit3, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Info,
  ArrowLeft,
  CheckSquare,
  Scale,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PengirimanSample, StatusSample, Barang, Gudang, Petani, UserRole } from '../../types';
import { SampleStatusUpdateModal } from './SampleStatusUpdateModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Pagination } from '../common/Pagination';
import { generateSampleId } from '../../utils/formatters';

interface SampleManagementProps {
  sampleList: PengirimanSample[];
  barangList: Barang[];
  gudangList?: Gudang[];
  petaniList?: Petani[];
  userRole: UserRole;
  onSaveNewSample?: (sample: PengirimanSample) => void;
  onSaveBatchSamples: (samples: PengirimanSample[], updatedBarangs: Barang[]) => void;
  onUpdateSample: (sample: PengirimanSample) => void;
}

export const SampleManagement: React.FC<SampleManagementProps> = ({
  sampleList = [],
  barangList = [],
  gudangList = [],
  petaniList = [],
  userRole,
  onSaveNewSample,
  onSaveBatchSamples,
  onUpdateSample,
}) => {
  // Page view mode: 'list' (History Table) or 'create' (In-page Sample Dispatch)
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // List View State
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [updatingSample, setUpdatingSample] = useState<PengirimanSample | null>(null);

  // In-Page Create Sample QC State
  const [tujuanBuyer, setTujuanBuyer] = useState('PT Djarum Kudus - Lab QC & R&D');
  const [customTujuan, setCustomTujuan] = useState('');
  const [sumberGudang, setSumberGudang] = useState(gudangList[0]?.nama_gudang || 'Gudang Pusat Induk');
  const [beratGramPerBal, setBeratGramPerBal] = useState<number>(250);
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split('T')[0]);
  const [dikirimOleh, setDikirimOleh] = useState('Petugas Lab QC PR. Sekar Maju Sejahtera');
  const [catatan, setCatatan] = useState('Pengujian organoleptik, kadar air, dan indeks nikotin laboratorium');

  // Filters for bal selection (Grade, Gudang, Petani)
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGudang, setFilterGudang] = useState<string>('all');
  const [filterPetani, setFilterPetani] = useState<string>('all');
  const [filterSearchBal, setFilterSearchBal] = useState<string>('');

  const [selectedBarangIds, setSelectedBarangIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const popularBuyers = [
    'PT Djarum Kudus - Lab QC & R&D',
    'PT Gudang Garam Tbk Kediri - QC Tembakau',
    'PT HM Sampoerna Surabaya - QA Plant',
    'Bentoel Group Malang - Lab Pengujian',
    'Pabrik Rokok Sukun Kudus',
    'PT Wismilak Inti Makmur Surabaya',
    'Lainnya (Tulis Manual)',
  ];

  // Available bal in warehouse
  const availableBalList = useMemo(() => {
    return barangList.filter((b) => b.status_stok === 'di_gudang' || b.status_stok === 'terkirim_sample');
  }, [barangList]);

  // Filtered bal for sample taking
  const filteredBalForSample = useMemo(() => {
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

  const selectedBalObjects = useMemo(() => {
    return barangList.filter((b) => selectedBarangIds.includes(b.barang_id));
  }, [barangList, selectedBarangIds]);

  // Filter List QC history
  const filteredSamples = useMemo(() => {
    return sampleList.filter((s) => {
      const matchSearch =
        searchQuery === '' ||
        s.tujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.catatan && s.catatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.sample_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;
      const matchGrade = selectedGrade === 'all' || s.kode_grade === selectedGrade;

      return matchSearch && matchStatus && matchGrade;
    });
  }, [sampleList, searchQuery, selectedStatus, selectedGrade]);

  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSamples.slice(start, start + itemsPerPage);
  }, [filteredSamples, currentPage, itemsPerPage]);

  const handleOpenCreatePage = () => {
    setSelectedBarangIds([]);
    setSumberGudang(gudangList[0]?.nama_gudang || 'Gudang Pusat Induk');
    setFilterGrade('all');
    setFilterGudang('all');
    setFilterPetani('all');
    setFilterSearchBal('');
    setErrorMessage('');
    setViewMode('create');
  };

  const handleToggleSelectBal = (id: string) => {
    setSelectedBarangIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredBalForSample.map((b) => b.barang_id);
    const allSelected = filteredIds.every((id) => selectedBarangIds.includes(id));

    if (allSelected) {
      setSelectedBarangIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedBarangIds, ...filteredIds]));
      setSelectedBarangIds(combined);
    }
  };

  const handleSubmitBatch = () => {
    if (selectedBarangIds.length === 0) {
      setErrorMessage('Pilih minimal 1 bal tembakau untuk diambil sample QC.');
      return;
    }
    const finalTujuan = tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer;
    if (!finalTujuan.trim()) {
      setErrorMessage('Tujuan lab / pabrik buyer wajib diisi.');
      return;
    }
    if (!sumberGudang.trim()) {
      setErrorMessage('Gudang asal pengambilan wajib dipilih.');
      return;
    }

    setErrorMessage('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSaveBatch = () => {
    const finalTujuan = tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer;
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newSamples: PengirimanSample[] = selectedBalObjects.map((bal, idx) => {
      return {
        sample_id: generateSampleId(bal.kode_grade, sampleList.length + idx + 1),
        barang_id: bal.barang_id,
        kode_grade: bal.kode_grade,
        tujuan: finalTujuan,
        sumber: sumberGudang,
        tanggal_kirim: tanggalKirim || dateFormatted,
        status: 'dikirim' as StatusSample,
        berat_sample_gram: Number(beratGramPerBal) || 250,
        dikirim_oleh: dikirimOleh,
        catatan: `Sample ${bal.no_bal} (${bal.berat_kg} kg) - ${catatan}`,
        nama_petani: bal.nama_petani,
      };
    });

    const updatedBarangs: Barang[] = selectedBalObjects.map((bal) => ({
      ...bal,
      status_stok: 'terkirim_sample',
    }));

    onSaveBatchSamples(newSamples, updatedBarangs);
    setIsConfirmOpen(false);
    setViewMode('list');
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* ========================================================================= */}
      {/* 1. VIEW MODE: CREATE SAMPLE QC IN-PAGE (NO MODAL / POPUP)                 */}
      {/* ========================================================================= */}
      {viewMode === 'create' ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Top Header */}
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
                  Proses Pengiriman Sample Uji Mutu (QC Lab)
                </h1>
                <p className="text-xs text-gray-500">
                  Pilih bal tembakau dan tentukan gudang asal pengambilan dari Master Gudang
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right mr-2 hidden sm:block">
                <span className="text-[11px] text-gray-500 block">Total Sample Dipilih:</span>
                <span className="text-xs font-bold font-mono text-[#b81d24]">
                  {selectedBarangIds.length} Bal Sample ({(selectedBarangIds.length * (beratGramPerBal / 1000)).toFixed(2)} kg)
                </span>
              </div>

              <button
                onClick={handleSubmitBatch}
                className="px-4 py-2 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-2 cursor-pointer shadow-xs"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Kirim {selectedBarangIds.length} Sample QC</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Info Box */}
          <div className="bg-white p-4 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
              1. Informasi Pengujian Mutu & Gudang Asal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Tujuan Lab / Pabrik */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Tujuan Lab / Buyer <span className="text-[#b81d24]">*</span>
                </label>
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
                    placeholder="Ketik nama lab / pabrik tujuan..."
                    value={customTujuan}
                    onChange={(e) => setCustomTujuan(e.target.value)}
                    className="mt-2 w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                  />
                )}
              </div>

              {/* Gudang Asal Pengambilan (Dropdown from Master Gudang) */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Gudang Asal Pengambilan <span className="text-[#b81d24]">*</span>
                </label>
                <select
                  value={sumberGudang}
                  onChange={(e) => setSumberGudang(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 font-bold text-gray-800 focus:outline-none focus:border-[#b81d24]"
                >
                  {gudangList.map((g) => (
                    <option key={g.gudang_id} value={g.nama_gudang || g.kode_gudang}>
                      {g.kode_gudang} - {g.nama_gudang} ({g.kepala_gudang})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  Terintegrasi langsung dari data Master Fasilitas Gudang
                </p>
              </div>

              {/* Berat Sample per Bal */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Berat Sample per Bal (Gram) <span className="text-[#b81d24]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={beratGramPerBal}
                    onChange={(e) => setBeratGramPerBal(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 font-bold text-gray-800 focus:outline-none focus:border-[#b81d24]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Gram</span>
                </div>
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

              {/* Petugas */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Petugas QC / Pengirim</label>
                <input
                  type="text"
                  value={dikirimOleh}
                  onChange={(e) => setDikirimOleh(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                />
              </div>

              {/* Catatan Pengujian */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Catatan Pengujian</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-sm px-3 py-2 text-gray-800 focus:outline-none focus:border-[#b81d24]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bal Selection with Filters */}
          <div className="bg-white border border-gray-200 shadow-xs">
            <div className="p-4 border-b border-gray-200 bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-[#b81d24]" />
                  <span>2. Filter & Pilih Bal Tembakau untuk Diuji Mutu</span>
                </h2>
                <p className="text-[11px] text-gray-500">
                  Filter berdasarkan Grade, Lokasi Gudang, dan Petani
                </p>
              </div>

              <span className="text-xs font-bold text-gray-700">
                {selectedBarangIds.length} dari {availableBalList.length} Bal Dipilih
              </span>
            </div>

            {/* In-Page Filters */}
            <div className="p-4 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white">
              {/* Grade */}
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

              {/* Gudang */}
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

              {/* Petani */}
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

              {/* Search */}
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

            {/* Quick Bulk Action */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 rounded-sm font-semibold text-gray-700 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#b81d24]" />
                  <span>Pilih Semua Hasil Filter ({filteredBalForSample.length} Bal)</span>
                </button>

                {selectedBarangIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBarangIds([])}
                    className="px-2.5 py-1 text-gray-500 hover:text-gray-800 text-xs font-medium cursor-pointer"
                  >
                    Batal Pilih Semua
                  </button>
                )}
              </div>

              <div className="text-gray-600">
                Menampilkan <strong className="text-gray-900">{filteredBalForSample.length}</strong> bal di gudang
              </div>
            </div>

            {/* Table Selection */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#f8f9fa] border-b border-gray-200 text-[11px] font-bold text-gray-700 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12 border-r border-gray-200">Pilih</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 w-36 font-mono">No. Bal / ID Bal</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-24">Grade</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-right w-28">Berat Bal (Kg)</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Lokasi Gudang</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Petani Pemasok</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28">Tgl Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredBalForSample.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Tidak ada bal tembakau yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredBalForSample.map((b) => {
                      const isSelected = selectedBarangIds.includes(b.barang_id);
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

            {/* Bottom Bar */}
            <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{selectedBarangIds.length}</span> bal sample terpilih dari gudang{' '}
                <strong className="text-gray-900">{sumberGudang}</strong>
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
                  onClick={handleSubmitBatch}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Proses & Kirim {selectedBarangIds.length} Sample QC</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* 2. VIEW MODE: LIST SAMPLE QC TABLE (WITH PAGINATION)                      */
        /* ========================================================================= */
        <div className="space-y-4">
          
          {/* 1. Filter Section */}
          <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="text-[#b81d24] font-black">▼</span>
                <span className="font-bold tracking-wide uppercase text-xs">Filter Data Sample QC</span>
              </div>
              {isFilterOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {isFilterOpen && (
              <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Status Pengujian</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
                  >
                    <option value="all">Semua Status</option>
                    <option value="dikirim">Dikirim (Transit Ekspedisi)</option>
                    <option value="diterima">Diterima (Sedang Uji Lab)</option>
                    <option value="disetujui">Disetujui (Lolos QC Pembelian)</option>
                    <option value="ditolak">Ditolak (Tidak Sesuai Standar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Grade Tembakau</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setCurrentPage(1);
                    }}
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

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('all');
                      setSelectedGrade('all');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm transition cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Table Card */}
          <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            
            {/* Header */}
            <div className="p-3 sm:px-4 sm:py-2.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
              <div>
                <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                  Daftar Pengiriman Sample Uji Mutu Laboratorium (QC)
                </h2>
                <p className="text-[11px] text-gray-500">
                  Monitoring hasil verifikasi kualitas tembakau oleh buyer dan laboratorium
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
                  <span>Buat Sample QC Baru</span>
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
                    placeholder="Cari ID Sample, Tujuan, Gudang..."
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
                    <th className="py-2.5 px-3 border-r border-gray-200 w-36 font-mono">Sample ID</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-20">Grade</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Tujuan Lab / Pabrik</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Gudang Asal</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28">Berat Sample</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28">Tgl Kirim</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-28">Status QC</th>
                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-xs">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        Tidak ada data sample pengujian yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((sample, index) => {
                      const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                      let statusBadge = (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Dikirim
                        </span>
                      );
                      if (sample.status === 'diterima') {
                        statusBadge = (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Uji Lab
                          </span>
                        );
                      } else if (sample.status === 'disetujui') {
                        statusBadge = (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-green-50 text-green-700 border border-green-200">
                            Disetujui
                          </span>
                        );
                      } else if (sample.status === 'ditolak') {
                        statusBadge = (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-red-50 text-red-700 border border-red-200">
                            Ditolak
                          </span>
                        );
                      }

                      return (
                        <tr key={sample.sample_id} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="py-2.5 px-3 text-center border-r border-gray-200 font-mono text-gray-600">
                            {itemNumber}
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 font-mono font-bold text-[#b81d24]">
                            {sample.sample_id}
                            <span className="block text-[10px] text-gray-400 font-normal">{sample.barang_id}</span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 text-center font-bold font-mono">
                            {sample.kode_grade}
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 font-medium text-gray-900">
                            {sample.tujuan}
                            {sample.catatan && (
                              <span className="block text-[10px] text-gray-500 font-normal truncate max-w-xs">
                                {sample.catatan}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 text-gray-700">
                            {sample.sumber}
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-800">
                            {sample.berat_sample_gram} Gram
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 text-center font-mono text-gray-600">
                            {sample.tanggal_kirim}
                          </td>
                          <td className="py-2.5 px-3 border-r border-gray-200 text-center">
                            {statusBadge}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => setUpdatingSample(sample)}
                              className="w-6 h-6 rounded-full bg-[#545b62] hover:bg-[#464c52] text-white flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs mx-auto"
                              title="Update Status QC / Respon Buyer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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
                totalItems={filteredSamples.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>

          </div>

        </div>
      )}

      {/* Update Sample Status Modal */}
      {updatingSample && (
        <SampleStatusUpdateModal
          isOpen={Boolean(updatingSample)}
          onClose={() => setUpdatingSample(null)}
          sample={updatingSample}
          onSaveStatus={(updated) => {
            onUpdateSample(updated);
            setUpdatingSample(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Pengiriman Sample QC"
        message={`Apakah Anda yakin ingin mengirim ${selectedBarangIds.length} sample uji mutu (${beratGramPerBal} gram/bal) dari gudang "${sumberGudang}" ke "${tujuanBuyer === 'Lainnya (Tulis Manual)' ? customTujuan : tujuanBuyer}"?`}
        variant="primary"
        confirmText="Ya, Kirim Sample QC"
        onConfirm={handleConfirmSaveBatch}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
};
