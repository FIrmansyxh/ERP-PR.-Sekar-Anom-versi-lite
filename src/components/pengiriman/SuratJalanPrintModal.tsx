import React, { useRef } from 'react';
import { 
  Printer, 
  Download,
  Truck, 
  Building2, 
  User, 
  Calendar, 
  Scale, 
  Package, 
  FileText, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { PengirimanBarang, Barang } from '../../types';
import { downloadHtmlDocument } from '../../utils/printDownload';
import { formatNumber } from '../../utils/formatters';

interface SuratJalanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengiriman: PengirimanBarang | null;
  barangList: Barang[];
}

export const SuratJalanPrintModal: React.FC<SuratJalanPrintModalProps> = ({
  isOpen,
  onClose,
  pengiriman,
  barangList,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !pengiriman) return null;

  const handleDownload = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    downloadHtmlDocument(
      `SURAT_JALAN_${pengiriman.no_surat_jalan}.html`,
      `Surat Jalan Delivery Order - ${pengiriman.no_surat_jalan}`,
      content
    );
  };

  const handlePrint = () => {
    handleDownload();
    window.print();
  };

  const barangIds = pengiriman.barang_ids || [];
  const availableBarangList = barangList || [];

  const balDetails = barangIds.map((id, index) => {
    const found = availableBarangList.find((b) => b.barang_id === id);
    if (found) return found;
    return {
      barang_id: id,
      barcode: id,
      kode_grade: 'A',
      no_bal: `BAL-00${index + 1}`,
      berat_kg: (pengiriman.total_berat_kg || 0) / (pengiriman.total_bal || 1),
      status_stok: 'keluar' as const,
      lokasi_gudang: 'Gudang Utama',
      nama_petani: 'Petani Terdaftar',
      tanggal_masuk: pengiriman.tanggal_kirim,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-white border border-gray-300 w-full max-w-4xl rounded-none shadow-2xl flex flex-col text-xs text-gray-800 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Modal Topbar (hidden on print) */}
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white print:hidden">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#b81d24]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                Surat Jalan Pengiriman / Delivery Order (DO)
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                No. DO: <span className="font-mono font-bold text-gray-800">{pengiriman.no_surat_jalan}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#17a2b8] hover:bg-[#138496] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 md:p-8 bg-[#f8f9fa] overflow-y-auto max-h-[80vh] print:p-0 print:bg-white print:max-h-none">
          <div
            ref={printAreaRef}
            className="bg-white p-6 sm:p-8 border border-gray-300 shadow-sm max-w-3xl mx-auto text-gray-900 print:border-none print:shadow-none print:p-0"
          >
            {/* Header Surat Jalan */}
            <div className="border-b-2 border-gray-900 pb-4 mb-4 flex justify-between items-start">
              <div>
                <div className="text-base font-black tracking-tight text-[#b81d24] uppercase">
                  PR. SEKAR ANOM
                </div>
                <div className="text-xs font-semibold text-gray-800">
                  GUDANG INTAKE & PENGOLAHAN TEMBAKAU MADURA
                </div>
                <div className="text-[10px] text-gray-600 max-w-sm mt-0.5 leading-tight">
                  Jl. Raya Proppo No. 88, Kec. Proppo, Kab. Pamekasan, Madura - Jawa Timur
                  <br />
                  Telp: (0324) 321889 • Email: logistik@sekaranom.co.id
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  SURAT JALAN PENGIRIMAN
                </div>
                <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                  DELIVERY ORDER (DO)
                </div>
                <div className="text-xs font-mono font-bold text-[#b81d24] mt-1">
                  {pengiriman.no_surat_jalan}
                </div>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-gray-50 border border-gray-200 text-xs">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Tanggal Kirim</span>
                  <span className="font-semibold">: {pengiriman.tanggal_kirim}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Kepada / Tujuan</span>
                  <span className="font-bold text-gray-900">: {pengiriman.tujuan}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Nomor Kontrak</span>
                  <span className="font-mono font-medium">: {pengiriman.nomor_kontrak || '-'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Nama Driver</span>
                  <span className="font-semibold">: {pengiriman.driver_nama || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Plat Nomor</span>
                  <span className="font-mono font-bold text-gray-900">: {pengiriman.plat_nomor || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-gray-500 font-medium">Petugas Gudang</span>
                  <span className="font-semibold">: {pengiriman.petugas || 'Admin Ekspedisi'}</span>
                </div>
              </div>
            </div>

            {/* Table Detail Bal */}
            <div className="my-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
                Rincian Muatan Bal Tembakau
              </div>
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-800 text-[11px]">
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-10">No</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left w-32">ID Bal / No. Bal</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-20">Grade</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-24">Berat Netto</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left">Petani Pemasok</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left">Lokasi Gudang</th>
                  </tr>
                </thead>
                <tbody>
                  {balDetails.map((b, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="border border-gray-300 py-1 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-gray-300 py-1 px-2 font-mono font-bold">{b.no_bal || b.barang_id}</td>
                      <td className="border border-gray-300 py-1 px-2 text-center font-bold">{b.kode_grade}</td>
                      <td className="border border-gray-300 py-1 px-2 text-right font-mono">{b.berat_kg} kg</td>
                      <td className="border border-gray-300 py-1 px-2">{b.nama_petani || '-'}</td>
                      <td className="border border-gray-300 py-1 px-2">{b.lokasi_gudang || 'Gudang Pusat'}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={3} className="border border-gray-300 py-2 px-3 text-right">
                      TOTAL MUATAN:
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-right font-mono text-[#b81d24]">
                      {formatNumber(pengiriman.total_berat_kg)} kg
                    </td>
                    <td colSpan={2} className="border border-gray-300 py-2 px-3">
                      {pengiriman.total_bal} Bal ({(pengiriman.total_berat_kg / 1000).toFixed(2)} Ton)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-gray-300 text-center text-xs">
              <div>
                <p className="text-gray-500 mb-12">Petugas Gudang / Pengirim,</p>
                <p className="font-bold text-gray-900 border-t border-gray-400 pt-1 inline-block px-4">
                  ( {pengiriman.petugas || 'Admin Logistik'} )
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-12">Supir / Driver Ekspedisi,</p>
                <p className="font-bold text-gray-900 border-t border-gray-400 pt-1 inline-block px-4">
                  ( {pengiriman.driver_nama || 'Supir Kendaraan'} )
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-12">Penerima Pabrik / Buyer,</p>
                <p className="font-bold text-gray-900 border-t border-gray-400 pt-1 inline-block px-4">
                  ( ......................................... )
                </p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-6 pt-2 border-t border-gray-200 text-[9px] text-gray-500 flex justify-between">
              <span>Dicetak otomatis oleh Sistem Gudang PR. Sekar Anom</span>
              <span>Dokumen sah tanda terima pengiriman barang</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
