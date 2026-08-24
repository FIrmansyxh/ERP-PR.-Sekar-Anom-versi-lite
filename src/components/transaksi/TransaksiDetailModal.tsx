import React, { useRef } from 'react';
import { 
  Printer, 
  Download,
  ArrowLeft, 
  Receipt
} from 'lucide-react';
import { TransaksiPembelian } from '../../types';
import { formatRupiah, generateBarcodeBars } from '../../utils/formatters';
import { downloadHtmlDocument } from '../../utils/printDownload';

interface TransaksiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: TransaksiPembelian | null;
  onPrintBarcode?: (tx: TransaksiPembelian) => void;
}

export const TransaksiDetailModal: React.FC<TransaksiDetailModalProps> = ({
  isOpen,
  onClose,
  transaksi,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaksi) return null;

  const handleDownload = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    downloadHtmlDocument(
      `NOTA_TIMBANG_${transaksi.transaksi_id.replace(/\//g, '_')}.html`,
      `Nota Timbang - ${transaksi.transaksi_id} (${transaksi.nama_petani})`,
      content,
      `
      .doc-container {
        max-width: 700px !important;
      }
      `
    );
  };

  const handlePrintNota = () => {
    handleDownload();
    window.print();
  };

  const items = transaksi.items && transaksi.items.length > 0 
    ? transaksi.items 
    : [
        {
          item_id: 'item-1',
          no_bal: transaksi.no_bal,
          kode_grade: transaksi.kode_grade,
          berat_kg: transaksi.berat_kg,
          harga_per_kg: transaksi.harga_per_kg,
          total_kotor: transaksi.total_kotor || (transaksi.berat_kg * transaksi.harga_per_kg),
          potongan: transaksi.total_potongan,
          subtotal_bersih: transaksi.harga_final,
        }
      ];

  const barcodeBars = generateBarcodeBars(transaksi.transaksi_id);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white border border-gray-300 w-full max-w-3xl rounded-none shadow-xl flex flex-col text-xs text-gray-800 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-[#b81d24]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                Nota Timbang & Rincian Transaksi Intake
              </h2>
              <p className="text-[11px] font-mono text-gray-500 truncate">
                No. Transaksi: {transaksi.transaksi_id} • {transaksi.no_kupon}
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
              <span>Tutup</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#17a2b8] hover:bg-[#138496] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Nota</span>
            </button>

            <button
              type="button"
              onClick={handlePrintNota}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Receipt */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 print:bg-white print:p-0 flex justify-center">
          
          <div 
            ref={receiptRef}
            id="printable-nota-timbang"
            className="w-full max-w-2xl bg-white border border-gray-300 p-6 shadow-sm space-y-5 text-gray-900 print:border-none print:shadow-none"
          >
            {/* Nota Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 space-y-1">
              <span className="text-[10px] font-black tracking-widest text-[#b81d24] uppercase block">
                PR. SEKAR ANOM • PUSAT PAMEKASAN MADURA
              </span>
              <h3 className="text-base font-black tracking-tight text-gray-900 uppercase">
                SURAT BUKTI TIMBANG & KUPON INTAKE
              </h3>
              <p className="text-[10px] text-gray-600 font-medium">
                Jl. Raya Tlanakan No. 45, Pamekasan, Madura - Jawa Timur | Telp: (0324) 321888
              </p>
            </div>

            {/* Transaction Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-3">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">No. Transaksi:</span>
                  <span className="font-mono font-bold text-gray-900">{transaksi.transaksi_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Kupon Antrian:</span>
                  <span className="font-mono font-bold text-[#b81d24]">{transaksi.no_kupon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Waktu Timbang:</span>
                  <span className="font-mono text-gray-800">{transaksi.tanggal_transaksi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Petugas Loket:</span>
                  <span className="font-semibold text-gray-800">{transaksi.operator_nama}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Nama Petani:</span>
                  <span className="font-bold text-gray-900">{transaksi.nama_petani}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ID Petani / Kartu:</span>
                  <span className="font-mono font-bold text-gray-900">{transaksi.nomor_kartu || transaksi.petani_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Alamat / Asal:</span>
                  <span className="text-gray-800">{transaksi.desa_kecamatan || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Lokasi Gudang:</span>
                  <span className="font-medium text-gray-800">{transaksi.lokasi_gudang}</span>
                </div>
              </div>
            </div>

            {/* Detail Timbangan Table */}
            <div className="border border-gray-300 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-gray-300 font-bold text-gray-700">
                    <th className="py-2 px-2.5 text-center border-r border-gray-300 w-10">No</th>
                    <th className="py-2 px-3 border-r border-gray-300">No. Bal</th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center">Grade</th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center">Berat (Kg)</th>
                    <th className="py-2 px-3 border-r border-gray-300 text-right">Tarif / Kg</th>
                    <th className="py-2 px-3 border-r border-gray-300 text-right">Total Kotor</th>
                    <th className="py-2 px-3 border-r border-gray-300 text-right">Potongan</th>
                    <th className="py-2 px-3 text-right">Subtotal Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-2.5 text-center border-r border-gray-200 font-mono text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 font-mono font-bold text-gray-900">
                        {item.no_bal}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-bold text-gray-800">
                        Grade {item.kode_grade}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-mono font-bold text-gray-900">
                        {item.berat_kg} kg
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right font-mono text-gray-700">
                        {formatRupiah(item.harga_per_kg)}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right font-mono text-gray-800">
                        {formatRupiah(item.total_kotor)}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right font-mono text-red-600 font-medium">
                        -{formatRupiah(item.potongan)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#b81d24]">
                        {formatRupiah(item.subtotal_bersih)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Rows */}
                  <tr className="bg-[#f8f9fa] font-bold border-t border-gray-300">
                    <td colSpan={3} className="py-2 px-3 border-r border-gray-300 text-right uppercase text-[11px]">
                      TOTAL KESELURUHAN ({items.length} BAL):
                    </td>
                    <td className="py-2 px-3 border-r border-gray-300 text-center font-mono font-bold text-gray-900">
                      {transaksi.berat_kg} kg
                    </td>
                    <td className="py-2 px-3 border-r border-gray-300 text-right font-mono text-gray-500">-</td>
                    <td className="py-2 px-3 border-r border-gray-300 text-right font-mono text-gray-900">
                      {formatRupiah(transaksi.total_kotor || transaksi.total_harga_beli)}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-300 text-right font-mono text-red-600">
                      -{formatRupiah(transaksi.total_potongan)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                      {formatRupiah(transaksi.harga_final)}
                    </td>
                  </tr>

                  <tr className="bg-[#fcf0f0] font-bold text-gray-900">
                    <td colSpan={7} className="py-2.5 px-3 border-r border-gray-300 text-right uppercase text-[11px] text-gray-800">
                      TOTAL BERSIH DIBAYARKAN KE PETANI (NETTO):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-base text-[#b81d24]">
                      {formatRupiah(transaksi.harga_final)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Catatan jika ada */}
            {transaksi.catatan && (
              <div className="p-2.5 bg-gray-50 border border-gray-200 text-xs text-gray-700">
                <span className="font-bold block text-gray-800">Catatan Penerimaan:</span>
                <p className="mt-0.5">{transaksi.catatan}</p>
              </div>
            )}

            {/* Barcode & Signature Section */}
            <div className="pt-3 flex items-end justify-between gap-4">
              
              {/* Barcode ID Transaksi */}
              <div className="flex flex-col items-center p-2 bg-gray-50 border border-gray-200">
                <div className="flex justify-center items-end space-x-0.5 h-7 w-32 overflow-hidden">
                  {barcodeBars.map((bar, i) => (
                    <div
                      key={i}
                      className={`bg-gray-900 ${bar.width === 2 ? 'w-1' : 'w-0.5'}`}
                      style={{ height: `${bar.height}%` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono font-bold text-gray-800 mt-1">
                  {transaksi.transaksi_id}
                </span>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 text-center text-[10.5px]">
                <div className="space-y-12">
                  <span className="text-gray-600 block">Penyetor (Petani)</span>
                  <div className="border-t border-gray-400 font-semibold pt-1 text-gray-900 min-w-[100px]">
                    ( {transaksi.nama_petani} )
                  </div>
                </div>

                <div className="space-y-12">
                  <span className="text-gray-600 block">Operator Timbang</span>
                  <div className="border-t border-gray-400 font-semibold pt-1 text-gray-900 min-w-[100px]">
                    ( {transaksi.operator_nama} )
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Note */}
            <div className="border-t border-dashed border-gray-300 pt-2 text-[10px] text-gray-500 text-center">
              Simpan bukti timbang ini sebagai rujukan pencairan kas dan bukti setoran tembakau resmi.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
