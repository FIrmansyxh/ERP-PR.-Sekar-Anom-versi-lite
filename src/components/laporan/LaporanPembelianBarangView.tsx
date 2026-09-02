import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Search, 
  RotateCcw, 
  Download, 
  Calendar, 
  Tag, 
  User, 
  Package, 
  Ticket,
  Filter,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { TransaksiPembelian, Petani } from '../../types';
import { downloadCsvFile, downloadElementAsPdf } from '../../utils/printDownload';

interface LaporanPembelianBarangViewProps {
  transaksiList: TransaksiPembelian[];
  petaniList: Petani[];
  userRole?: string;
  onNavigateToTransaksi?: () => void;
}

export const LaporanPembelianBarangView: React.FC<LaporanPembelianBarangViewProps> = ({
  transaksiList = [],
  petaniList = [],
  userRole,
  onNavigateToTransaksi,
}) => {
  // Filter States (PRD Bab 8.1)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterKupon, setFilterKupon] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterNoBall, setFilterNoBall] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('ALL');

  // Applied Filter State (updates on "Cari Data" or reset)
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    kupon: 'ALL',
    grade: 'ALL',
    noBall: '',
    supplier: 'ALL',
  });

  // PDF Generation State (Direct Download)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printReportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!printReportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await downloadElementAsPdf(
        printReportRef.current,
        `Laporan_Pembelian_Barang_${new Date().toISOString().slice(0, 10)}.pdf`,
        { orientation: 'landscape' }
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Unique list of Kupons & Suppliers for dropdowns
  const uniqueKupons = useMemo(() => {
    const kupons = new Set<string>();
    transaksiList.forEach(t => {
      if (t.no_kupon) kupons.add(t.no_kupon);
    });
    return Array.from(kupons).sort();
  }, [transaksiList]);

  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    transaksiList.forEach(t => {
      if (t.petani_id && t.nama_petani) {
        map.set(t.petani_id, t.nama_petani);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transaksiList]);

  // Execute Filter Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      startDate: filterStartDate,
      endDate: filterEndDate,
      kupon: filterKupon,
      grade: filterGrade,
      noBall: filterNoBall.trim(),
      supplier: filterSupplier,
    });
  };

  // Reset Filters
  const handleReset = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterKupon('ALL');
    setFilterGrade('ALL');
    setFilterNoBall('');
    setFilterSupplier('ALL');
    setAppliedFilters({
      startDate: '',
      endDate: '',
      kupon: 'ALL',
      grade: 'ALL',
      noBall: '',
      supplier: 'ALL',
    });
  };

  // Filtered Transaksi Data
  const filteredData = useMemo(() => {
    return transaksiList.filter((item) => {
      // Filter Tanggal Dari
      if (appliedFilters.startDate && item.tanggal_transaksi) {
        const itemDate = item.tanggal_transaksi.split('T')[0];
        if (itemDate < appliedFilters.startDate) return false;
      }
      // Filter Tanggal Sampai
      if (appliedFilters.endDate && item.tanggal_transaksi) {
        const itemDate = item.tanggal_transaksi.split('T')[0];
        if (itemDate > appliedFilters.endDate) return false;
      }
      // Filter Kupon
      if (appliedFilters.kupon !== 'ALL' && item.no_kupon !== appliedFilters.kupon) {
        return false;
      }
      // Filter Grade
      if (appliedFilters.grade !== 'ALL' && item.kode_grade !== appliedFilters.grade) {
        return false;
      }
      // Filter No Ball
      if (appliedFilters.noBall) {
        const query = appliedFilters.noBall.toLowerCase();
        if (!item.no_bal?.toLowerCase().includes(query)) return false;
      }
      // Filter Supplier
      if (appliedFilters.supplier !== 'ALL' && item.petani_id !== appliedFilters.supplier) {
        return false;
      }
      return true;
    });
  }, [transaksiList, appliedFilters]);

  // Totals Calculation (PRD Bab 8.3)
  const totals = useMemo(() => {
    let totalBruto = 0;
    let totalNetto = 0;
    let totalHargaBeliRate = 0;
    let totalPotonganKuli = 0;
    let totalPotonganTikar = 0;
    let totalPotonganAll = 0;
    let totalNilaiHargaBeli = 0;
    let totalJumlahBayar = 0;

    filteredData.forEach((row) => {
      const bruto = row.jenis_timbang === 'bruto' ? (row.berat_terukur_kg || row.berat_kg + 2) : 0;
      const netto = row.berat_kg || 0;
      const hrgBeli = row.harga_per_kg || 0;
      const potKuli = row.potongan_kuli || 7000;
      const potTikar = row.potongan_tikar || 0;
      const potTotal = row.total_potongan || (potKuli + potTikar);
      const subtotalHrgBeli = row.total_harga_beli || (netto * hrgBeli);
      const jmlBayar = row.harga_final || (subtotalHrgBeli - potTotal);

      totalBruto += bruto;
      totalNetto += netto;
      totalHargaBeliRate += hrgBeli;
      totalPotonganKuli += potKuli;
      totalPotonganTikar += potTikar;
      totalPotonganAll += potTotal;
      totalNilaiHargaBeli += subtotalHrgBeli;
      totalJumlahBayar += jmlBayar;
    });

    return {
      totalBruto,
      totalNetto,
      totalHargaBeliRate,
      totalPotonganKuli,
      totalPotonganTikar,
      totalPotonganAll,
      totalNilaiHargaBeli,
      totalJumlahBayar,
      count: filteredData.length,
    };
  }, [filteredData]);

  // Export CSV / Excel Compatible
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'No',
      'Tanggal',
      'Kupon',
      'Supplier',
      'No Ball',
      'Grade',
      'Bruto (kg)',
      'Netto (kg)',
      'Harga Beli (Rp/kg)',
      'Potongan (Rp)',
      'Total Harga Beli (Rp)',
      'Jumlah Bayar (Rp)',
    ];

    const rows: (string | number)[][] = filteredData.map((row, idx) => {
      const bruto = row.jenis_timbang === 'bruto' ? (row.berat_terukur_kg || row.berat_kg + 2) : 0;
      const subtotalHrgBeli = row.total_harga_beli || (row.berat_kg * row.harga_per_kg);
      const jmlBayar = row.harga_final || (subtotalHrgBeli - (row.total_potongan || 7000));

      return [
        idx + 1,
        row.tanggal_transaksi ? row.tanggal_transaksi.split('T')[0] : '-',
        row.no_kupon || '-',
        row.nama_petani || '-',
        row.no_bal || '-',
        row.kode_grade || '-',
        bruto,
        row.berat_kg || 0,
        row.harga_per_kg || 0,
        row.total_potongan || 7000,
        subtotalHrgBeli,
        jmlBayar,
      ];
    });

    // Add Summary rows
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', 'TOTAL POTONGAN OUT (KULI)', '', '', '', totals.totalPotonganKuli, '', '']);
    rows.push(['', '', '', '', '', 'TOTAL POTONGAN GANTI TIKAR', '', '', '', totals.totalPotonganTikar, '', '']);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL AKUMULASI',
      totals.totalBruto,
      totals.totalNetto,
      '',
      totals.totalPotonganAll,
      totals.totalNilaiHargaBeli,
      totals.totalJumlahBayar,
    ]);

    downloadCsvFile(
      `Laporan_Pembelian_Barang_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* Header Banner */}
      <div className="bg-white p-4 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#b81d24] text-white">
              PRD Bab 8
            </span>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">
              Laporan Pembelian Barang
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Laporan rekapitulasi setoran timbang tembakau dari petani dengan filter multi-parameter dinamis dan kalkulasi potongan otomatis.
          </p>
        </div>

        {/* Top Action Buttons (Direct Download Only) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Excel / CSV</span>
          </button>
          
          <button
            onClick={handleDownloadPdf}
            disabled={filteredData.length === 0 || isGeneratingPdf}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] disabled:opacity-50 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download Laporan (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Form Card (PRD Bab 8.1) */}
      <div className="bg-white p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-gray-100">
          <Filter className="w-4 h-4 text-[#b81d24]" />
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
            Filter & Parameter Pencarian
          </span>
          <span className="text-[11px] text-gray-400">
            (Sesuaikan kriteria data lalu klik "Cari Data")
          </span>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Tanggal Dari */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Tanggal Dari
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none"
              />
            </div>
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Tanggal Sampai
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none"
              />
            </div>
          </div>

          {/* Kupon */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Kupon
            </label>
            <select
              value={filterKupon}
              onChange={(e) => setFilterKupon(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none"
            >
              <option value="ALL">Semua Kupon</option>
              {uniqueKupons.map(kup => (
                <option key={kup} value={kup}>{kup}</option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Grade
            </label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none"
            >
              <option value="ALL">Semua Grade</option>
              <option value="A">Grade A (Super)</option>
              <option value="B">Grade B (Premium)</option>
              <option value="C">Grade C (Standar)</option>
              <option value="D">Grade D (Medium)</option>
              <option value="E">Grade E (Ekonomis)</option>
              <option value="F">Grade F (Campuran)</option>
            </select>
          </div>

          {/* No. Ball */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              No. Ball
            </label>
            <input
              type="text"
              placeholder="Semua Ball / Cari..."
              value={filterNoBall}
              onChange={(e) => setFilterNoBall(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none"
            />
          </div>

          {/* Supplier (Petani) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Supplier (Petani)
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#b81d24] focus:outline-none rounded-none truncate"
            >
              <option value="ALL">Semua Supplier</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter Buttons */}
          <div className="sm:col-span-2 lg:col-span-6 flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-none transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Reset Filter</span>
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-none transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Data</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Summary Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white p-2.5 border border-gray-200">
          <div className="text-gray-500 text-[11px]">Total Data Ditemukan</div>
          <div className="text-base font-bold text-gray-900 mt-0.5">{totals.count} Transaksi Bal</div>
        </div>
        <div className="bg-white p-2.5 border border-gray-200">
          <div className="text-gray-500 text-[11px]">Total Netto Timbang</div>
          <div className="text-base font-bold text-blue-900 mt-0.5">
            {totals.totalNetto.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-500">kg</span>
          </div>
        </div>
        <div className="bg-white p-2.5 border border-gray-200">
          <div className="text-gray-500 text-[11px]">Total Potongan (Kuli + Tikar)</div>
          <div className="text-base font-bold text-amber-700 mt-0.5">
            Rp {totals.totalPotonganAll.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-white p-2.5 border border-gray-200">
          <div className="text-gray-500 text-[11px]">Total Jumlah Bayar Petani</div>
          <div className="text-base font-bold text-[#b81d24] mt-0.5">
            Rp {totals.totalJumlahBayar.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Data Table Card (PRD Bab 8.2 & Bab 8.3) */}
      <div className="bg-white border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Tabel Rekapitulasi Pembelian Barang
            </span>
            <span className="text-xs text-gray-500">
              ({filteredData.length} baris data)
            </span>
          </div>
          <span className="text-[11px] text-gray-500 italic">
            * Potongan standar kuli Rp 7.000 / bal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/90 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2 text-center w-10 border-r border-gray-200">No</th>
                <th className="py-2.5 px-2.5 border-r border-gray-200">Tanggal</th>
                <th className="py-2.5 px-2.5 border-r border-gray-200">Kupon</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Supplier</th>
                <th className="py-2.5 px-2.5 text-center border-r border-gray-200">No Ball</th>
                <th className="py-2.5 px-2 text-center border-r border-gray-200">Grade</th>
                <th className="py-2.5 px-2.5 text-right border-r border-gray-200">Bruto (kg)</th>
                <th className="py-2.5 px-2.5 text-right border-r border-gray-200">Netto (kg)</th>
                <th className="py-2.5 px-2.5 text-right border-r border-gray-200">Harga Beli</th>
                <th className="py-2.5 px-2.5 text-right border-r border-gray-200">Potongan</th>
                <th className="py-2.5 px-3 text-right border-r border-gray-200">Total Harga Beli</th>
                <th className="py-2.5 px-3 text-right bg-red-50/50 font-extrabold text-[#b81d24]">Jumlah Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold">Tidak ada data transaksi yang cocok dengan filter aktif.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Coba ubah tanggal atau klik "Reset Filter" untuk menampilkan seluruh transaksi.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const bruto = row.jenis_timbang === 'bruto' ? (row.berat_terukur_kg || row.berat_kg + 2) : 0;
                  const netto = row.berat_kg || 0;
                  const hrgBeli = row.harga_per_kg || 0;
                  const totalPotonganRow = row.total_potongan || 7000;
                  const totalHargaBeliRow = row.total_harga_beli || (netto * hrgBeli);
                  const jumlahBayarRow = row.harga_final || (totalHargaBeliRow - totalPotonganRow);
                  const tglDisplay = row.tanggal_transaksi ? row.tanggal_transaksi.split(' ')[0].split('T')[0] : '-';

                  return (
                    <tr 
                      key={row.transaksi_id || idx}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* 1. No */}
                      <td className="py-2 px-2 text-center text-gray-500 font-mono text-[11px] border-r border-gray-100">
                        {idx + 1}
                      </td>

                      {/* 2. Tanggal (YYYY-MM-DD) */}
                      <td className="py-2 px-2.5 text-gray-700 font-mono text-[11px] whitespace-nowrap border-r border-gray-100">
                        {tglDisplay}
                      </td>

                      {/* 3. Kupon (Full 1 row, never truncated) */}
                      <td className="py-2 px-2.5 font-mono text-gray-900 font-bold border-r border-gray-100 whitespace-nowrap">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] whitespace-nowrap font-mono font-bold text-[#b81d24]">
                          {row.no_kupon || '-'}
                        </span>
                      </td>

                      {/* 4. Supplier */}
                      <td className="py-2 px-3 text-gray-900 font-medium border-r border-gray-100">
                        <div className="font-semibold text-gray-800">{row.nama_petani}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{row.nomor_kartu}</div>
                      </td>

                      {/* 5. No Ball */}
                      <td className="py-2 px-2.5 text-center font-mono font-semibold text-gray-800 border-r border-gray-100">
                        {row.no_bal}
                      </td>

                      {/* 6. Grade */}
                      <td className="py-2 px-2 text-center border-r border-gray-100">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-xs ${
                          row.kode_grade === 'A' ? 'bg-zinc-900 text-white' :
                          row.kode_grade === 'B' ? 'bg-zinc-800 text-zinc-100' :
                          row.kode_grade === 'C' ? 'bg-blue-100 text-blue-900 font-bold' :
                          row.kode_grade === 'D' ? 'bg-purple-100 text-purple-900 font-bold' :
                          row.kode_grade === 'E' ? 'bg-gray-200 text-gray-800 font-bold' :
                          'bg-red-100 text-red-900 font-bold'
                        }`}>
                          {row.kode_grade}
                        </span>
                      </td>

                      {/* 7. Bruto */}
                      <td className="py-2 px-2.5 text-right font-mono text-gray-700 border-r border-gray-100">
                        {bruto > 0 ? bruto.toFixed(1) : '-'}
                      </td>

                      {/* 8. Netto */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-gray-900 border-r border-gray-100 bg-blue-50/20">
                        {netto.toFixed(1)}
                      </td>

                      {/* 9. Harga Beli */}
                      <td className="py-2 px-2.5 text-right font-mono text-gray-800 border-r border-gray-100">
                        {hrgBeli.toLocaleString('id-ID')}
                      </td>

                      {/* 10. Potongan */}
                      <td className="py-2 px-2.5 text-right font-mono text-amber-800 border-r border-gray-100">
                        {totalPotonganRow.toLocaleString('id-ID')}
                      </td>

                      {/* 11. Total Harga Beli */}
                      <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900 border-r border-gray-100">
                        {totalHargaBeliRow.toLocaleString('id-ID')}
                      </td>

                      {/* 12. Jumlah Bayar */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#b81d24] bg-red-50/30">
                        {jumlahBayarRow.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer Totals (PRD Bab 8.3) */}
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 text-gray-900 font-bold border-t-2 border-gray-300">
                {/* Baris Total Potongan Out */}
                <tr className="bg-amber-50/70 border-b border-amber-200/60 text-[11px]">
                  <td colSpan={6} className="py-1.5 px-3 text-right font-semibold text-amber-900 border-r border-gray-300">
                    Total Potongan Out (Kuli Operasional):
                  </td>
                  <td colSpan={3} className="py-1.5 px-2 border-r border-gray-300 text-gray-400 text-right">
                    Rp 7.000 × {totals.count} bal
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-amber-900 border-r border-gray-300">
                    Rp {totals.totalPotonganKuli.toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2} className="py-1.5 px-3 text-gray-400 text-right"></td>
                </tr>

                {/* Baris Total Potongan Ganti Tikar */}
                <tr className="bg-amber-50/70 border-b border-amber-200/60 text-[11px]">
                  <td colSpan={6} className="py-1.5 px-3 text-right font-semibold text-amber-900 border-r border-gray-300">
                    Total Potongan Ganti Tikar:
                  </td>
                  <td colSpan={3} className="py-1.5 px-2 border-r border-gray-300 text-gray-400 text-right">
                    Tambahan bila berlaku
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-amber-900 border-r border-gray-300">
                    Rp {totals.totalPotonganTikar.toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2} className="py-1.5 px-3 text-gray-400 text-right"></td>
                </tr>

                {/* Baris Total Akumulasi Utama */}
                <tr className="bg-gray-200/80 text-gray-950 font-extrabold text-xs">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider border-r border-gray-300">
                    TOTAL ({totals.count} Bal):
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono border-r border-gray-300">
                    {totals.totalBruto.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-blue-950 border-r border-gray-300">
                    {totals.totalNetto.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono border-r border-gray-300 text-gray-500">
                    -
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-amber-950 border-r border-gray-300">
                    Rp {totals.totalPotonganAll.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-gray-300">
                    Rp {totals.totalNilaiHargaBeli.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#b81d24] bg-red-100/60 text-sm">
                    Rp {totals.totalJumlahBayar.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Hidden Container for Direct PDF Export */}
      <div className="hidden">
        <div 
          ref={printReportRef} 
          id="printable-laporan-pembelian"
          className="w-full max-w-5xl bg-white p-6 text-gray-900 font-sans text-xs space-y-4"
        >
          {/* Kop Surat PR. Sekar Maju Sejahtera */}
          <div className="text-center border-b-2 border-gray-900 pb-3 mb-4">
            <h2 className="text-lg font-black tracking-widest uppercase text-gray-950">
              PR. SEKAR MAJU SEJAHTERA
            </h2>
            <p className="text-[11px] text-gray-600 tracking-wide font-medium">
              SISTEM DATA GUDANG & PENGADAAN TEMBAKAU RAJANGAN
            </p>
            <p className="text-[10px] text-gray-500">
              Jl. Raya Sentol Pamekasan - Madura | Telp: (0324) 321888 | Email: gudang@sekarmajusejahtera.co.id
            </p>
          </div>

          {/* Title & Metadata Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-center text-gray-900 underline">
              LAPORAN REKAPITULASI PEMBELIAN BARANG
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-gray-50 p-2 border border-gray-200">
              <div>
                <span className="font-semibold text-gray-600">Periode Tanggal:</span>{' '}
                <span>
                  {appliedFilters.startDate || 'Awal'} s/d {appliedFilters.endDate || 'Sekarang'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Filter Grade:</span>{' '}
                <span>{appliedFilters.grade === 'ALL' ? 'Semua Grade' : `Grade ${appliedFilters.grade}`}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Kupon:</span>{' '}
                <span>{appliedFilters.kupon === 'ALL' ? 'Semua Kupon' : appliedFilters.kupon}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Waktu Cetak Dokumen:</span>{' '}
                <span>{new Date().toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Print Table */}
          <table className="w-full text-left border-collapse border border-gray-300 text-[10px] mb-4">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300 uppercase">
                <th className="p-1 border border-gray-300 text-center">No</th>
                <th className="p-1 border border-gray-300">Tanggal</th>
                <th className="p-1 border border-gray-300">Kupon</th>
                <th className="p-1 border border-gray-300">Supplier</th>
                <th className="p-1 border border-gray-300 text-center">No Bal</th>
                <th className="p-1 border border-gray-300 text-center">Grade</th>
                <th className="p-1 border border-gray-300 text-right">Bruto (kg)</th>
                <th className="p-1 border border-gray-300 text-right">Netto (kg)</th>
                <th className="p-1 border border-gray-300 text-right">Harga (Rp)</th>
                <th className="p-1 border border-gray-300 text-right">Potongan (Rp)</th>
                <th className="p-1 border border-gray-300 text-right">Total Harga</th>
                <th className="p-1 border border-gray-300 text-right font-bold">Jumlah Bayar</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const bruto = row.jenis_timbang === 'bruto' ? (row.berat_terukur_kg || row.berat_kg + 2) : 0;
                const netto = row.berat_kg || 0;
                const hrgBeli = row.harga_per_kg || 0;
                const totalPotonganRow = row.total_potongan || 7000;
                const totalHargaBeliRow = row.total_harga_beli || (netto * hrgBeli);
                const jumlahBayarRow = row.harga_final || (totalHargaBeliRow - totalPotonganRow);
                const tglDisplay = row.tanggal_transaksi ? row.tanggal_transaksi.split(' ')[0].split('T')[0] : '-';

                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-1 border border-gray-300 text-center">{idx + 1}</td>
                    <td className="p-1 border border-gray-300 font-mono">{tglDisplay}</td>
                    <td className="p-1 border border-gray-300 font-mono">{row.no_kupon || '-'}</td>
                    <td className="p-1 border border-gray-300 font-medium">{row.nama_petani}</td>
                    <td className="p-1 border border-gray-300 text-center font-mono">{row.no_bal}</td>
                    <td className="p-1 border border-gray-300 text-center font-bold">{row.kode_grade}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono">{bruto > 0 ? bruto.toFixed(1) : '-'}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono font-semibold">{netto.toFixed(1)}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono">{hrgBeli.toLocaleString('id-ID')}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono">{totalPotonganRow.toLocaleString('id-ID')}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono">{totalHargaBeliRow.toLocaleString('id-ID')}</td>
                    <td className="p-1 border border-gray-300 text-right font-mono font-bold text-gray-950">
                      {jumlahBayarRow.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={6} className="p-1.5 border border-gray-300 text-right">TOTAL:</td>
                <td className="p-1.5 border border-gray-300 text-right font-mono">{totals.totalBruto.toFixed(1)} kg</td>
                <td className="p-1.5 border border-gray-300 text-right font-mono">{totals.totalNetto.toFixed(1)} kg</td>
                <td className="p-1.5 border border-gray-300 text-right">-</td>
                <td className="p-1.5 border border-gray-300 text-right font-mono">Rp {totals.totalPotonganAll.toLocaleString('id-ID')}</td>
                <td className="p-1.5 border border-gray-300 text-right font-mono">Rp {totals.totalNilaiHargaBeli.toLocaleString('id-ID')}</td>
                <td className="p-1.5 border border-gray-300 text-right font-mono text-black font-black">
                  Rp {totals.totalJumlahBayar.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Tanda Tangan Audit */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px]">
            <div>
              <p className="text-gray-600">Operator Loket Timbang</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-gray-900">( Siti Rahayu )</p>
            </div>
            <div>
              <p className="text-gray-600">Petugas QC & Mutu</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-gray-900">( drg. Hendra Kusuma )</p>
            </div>
            <div>
              <p className="text-gray-600">Kepala Gudang / Mengetahui</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-gray-900">( Bambang Sutrisno, S.T. )</p>
            </div>
          </div>
        </div>
      </div>

  </div>
);
};
