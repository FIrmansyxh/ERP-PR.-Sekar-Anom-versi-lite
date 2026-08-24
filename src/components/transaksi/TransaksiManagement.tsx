import React, { useState, useMemo } from 'react';
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
  Ban,
  FileText
} from 'lucide-react';
import { TransaksiPembelian, Petani, TabelHarga, Barang, UserRole, Gudang } from '../../types';
import { formatRupiah, generateBalId, generateNoBalSimple, formatDateDDMMYY } from '../../utils/formatters';
import { hitungSimulasiHarga, GRADE_COLOR_MAP } from '../../data/initialHargaData';
import { TransaksiFormModal } from './TransaksiFormModal';
import { TransaksiDetailModal } from './TransaksiDetailModal';
import { BarangBarcodeThermalModal } from '../barang/BarangBarcodeThermalModal';

interface TransaksiManagementProps {
  transaksiList: TransaksiPembelian[];
  petaniList: Petani[];
  hargaList: TabelHarga[];
  barangList: Barang[];
  gudangList?: Gudang[];
  userRole: UserRole;
  onSaveTransaksi: (newTx: TransaksiPembelian, generatedBarang: Barang | Barang[]) => void;
}

export const TransaksiManagement: React.FC<TransaksiManagementProps> = ({
  transaksiList = [],
  petaniList = [],
  hargaList = [],
  barangList = [],
  gudangList = [],
  userRole,
  onSaveTransaksi,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TransaksiPembelian | null>(null);
  const [printingThermalBarang, setPrintingThermalBarang] = useState<Barang | null>(null);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return transaksiList.filter((tx) => {
      if (gradeFilter !== 'all' && tx.kode_grade !== gradeFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = tx.transaksi_id.toLowerCase().includes(q);
        const matchNama = tx.nama_petani.toLowerCase().includes(q);
        const matchKartu = tx.nomor_kartu.toLowerCase().includes(q);
        const matchBal = tx.no_bal.toLowerCase().includes(q);
        return matchId || matchNama || matchKartu || matchBal;
      }
      return true;
    });
  }, [transaksiList, searchQuery, gradeFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const isAdmin = userRole === 'admin_gudang';

  const handleOpenPrintForTx = (tx: TransaksiPembelian) => {
    const relatedBarang = barangList.find((b) => b.barang_id === tx.barang_id_terkait || b.barcode === tx.barcode_terkait);
    if (relatedBarang) {
      setPrintingThermalBarang(relatedBarang);
    } else {
      // Create a temporary mock object for printing
      const tempBarang: Barang = {
        barang_id: tx.barang_id_terkait || tx.transaksi_id,
        barcode: tx.barcode_terkait || tx.transaksi_id,
        kode_grade: tx.kode_grade,
        no_bal: tx.no_bal,
        berat_kg: tx.berat_kg,
        status_stok: 'di_gudang',
        lokasi_gudang: 'Gudang Utama / Blok A-01',
        tanggal_masuk: tx.tanggal_transaksi,
        petani_id: tx.petani_id,
        nama_petani: tx.nama_petani,
      };
      setPrintingThermalBarang(tempBarang);
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* 1. Filter Section matching Screenshot image (1).png */}
      <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-800 bg-white hover:bg-gray-50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="text-[#b81d24] font-black">▼</span>
            <span className="font-bold tracking-wide uppercase text-xs">Filter</span>
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

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Cari Petani / Bal</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Ketik kode, nama petani, no bal..."
                className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#b81d24]"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
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

      {/* Barcode Intake Workflow Info */}
      <div className="bg-white border border-gray-200 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-[#b81d24] shrink-0" />
          <div className="text-gray-700 text-xs">
            <strong className="text-gray-900">Alur Transaksi Intake:</strong> Penerimaan tembakau dari petani adalah proses timbang & grading awal (tanpa scan barcode). Barcode bal digenerate otomatis dan dicetak label thermal saat bal disimpan di gudang untuk discan ketika dikeluarkan.
          </div>
        </div>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 font-mono text-[10px] rounded-xs shrink-0">
          TAHAP 1 • INTAKE TIMBANG
        </span>
      </div>

      {/* 2. Main Table Card matching Screenshot image (1).png */}
      <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        
        {/* Card Header matching Screenshot */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <h2 className="text-sm font-bold text-gray-800 tracking-tight">
            Daftar Transaksi / Intake Pembelian Tembakau
          </h2>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setGradeFilter('all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#545b62] hover:bg-[#464c52] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Transaksi</span>
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
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-600">Data Per Halaman</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600 font-medium">Pencarian:</span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-sm px-2.5 py-1 text-xs text-gray-800 w-48 sm:w-64 focus:outline-none focus:border-[#b81d24]"
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

        {/* Table View matching screenshot table layout */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-xs font-bold text-gray-700">
                <th className="py-2.5 px-3 text-center border-r border-gray-200 w-12">No</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Kode</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Tanggal</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Customer / Petani</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Sales / Operator</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Grade / Bal</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-center">Status</th>
                <th className="py-2.5 px-3 border-r border-gray-200 text-right">Total Final (Rp)</th>
                <th className="py-2.5 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr 
                      key={tx.transaksi_id}
                      className="hover:bg-[#f8f9fa] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center border-r border-gray-200 font-mono text-gray-600">
                        {itemNumber}
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono font-medium text-gray-900">
                        {tx.transaksi_id}
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 font-mono text-gray-600">
                        {tx.tanggal_transaksi.split(' ')[0]}
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 font-medium text-gray-900">
                        {tx.nama_petani} ({tx.nomor_kartu})
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 text-gray-700">
                        {tx.operator_nama}
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200">
                        <span className="font-bold text-gray-800">Grade {tx.kode_grade}</span> • {tx.no_bal} ({tx.berat_kg} kg)
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 text-center">
                        <span className="text-[11px] font-medium text-gray-800">
                          Disetujui
                        </span>
                      </td>

                      <td className="py-2.5 px-3 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                        {formatRupiah(tx.harga_final)}
                      </td>

                      {/* Circular Action Buttons matching screenshot */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Info & Nota Timbang (Dark Slate) */}
                          <button
                            onClick={() => setSelectedTxForDetail(tx)}
                            className="w-6 h-6 rounded-full bg-[#545b62] hover:bg-[#464c52] text-white flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs"
                            title="Lihat Rincian & Cetak Nota Timbang"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Label Thermal Barcode Bal (Teal) */}
                          <button
                            onClick={() => handleOpenPrintForTx(tx)}
                            className="w-6 h-6 rounded-full bg-[#17a2b8] hover:bg-[#138496] text-white flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs"
                            title="Cetak Label Thermal Barcode Bal"
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

        {/* Table Footer & Pagination */}
        <div className="p-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
          <div>
            Menampilkan {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} sampai{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-300 rounded-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
            >
              Sebelumnya
            </button>

            <span className="px-3 py-1 bg-[#b81d24] text-white rounded-sm font-bold text-xs">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 border border-gray-300 rounded-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>

      </div>

      {/* Modal Detail & Nota Timbang Transaksi */}
      {selectedTxForDetail && (
        <TransaksiDetailModal
          isOpen={Boolean(selectedTxForDetail)}
          onClose={() => setSelectedTxForDetail(null)}
          transaksi={selectedTxForDetail}
          onPrintBarcode={handleOpenPrintForTx}
        />
      )}

      {/* Modal Tambah Transaksi */}
      <TransaksiFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        petaniList={petaniList}
        hargaList={hargaList}
        gudangList={gudangList}
        onSaveTransaksi={onSaveTransaksi}
      />

      {/* Modal Cetak Label Thermal Barcode */}
      {printingThermalBarang && (
        <BarangBarcodeThermalModal
          isOpen={Boolean(printingThermalBarang)}
          onClose={() => setPrintingThermalBarang(null)}
          barang={printingThermalBarang}
        />
      )}

    </div>
  );
};
