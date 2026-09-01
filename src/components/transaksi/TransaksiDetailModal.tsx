import React, { useRef, useState } from 'react';
import { 
  Download, 
  ArrowLeft, 
  Receipt,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';
import { TransaksiPembelian } from '../../types';
import { formatRupiah, generateBarcodeBars } from '../../utils/formatters';
import { downloadElementAsPdf, printHtmlElementDirectly } from '../../utils/printDownload';
import { ConfirmModal } from '../common/ConfirmModal';

interface TransaksiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: TransaksiPembelian | null;
  onPrintBarcode?: (tx: TransaksiPembelian) => void;
  onDeleteTransaksi?: (transaksiId: string) => void;
  onUpdateNotaStatus?: (transaksiId: string) => void;
  onMarkAsLunas?: (transaksiId: string) => void;
  onOpenBayarModal?: (tx: TransaksiPembelian) => void;
}

export const TransaksiDetailModal: React.FC<TransaksiDetailModalProps> = ({
  isOpen,
  onClose,
  transaksi,
  onDeleteTransaksi,
  onUpdateNotaStatus,
  onMarkAsLunas,
  onOpenBayarModal,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !transaksi) return null;

  const isLunas = transaksi.status_pembayaran === 'lunas' || transaksi.metode_pembayaran === 'cash';

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

  // Validation: Nota can ONLY be printed / downloaded when ALL items have price and weight > 0
  const isAllWeighed = items.length > 0 && items.every((it) => (it.berat_kg || 0) > 0 && (it.harga_per_kg || 0) > 0);
  const hasZeroWeightItem = items.some((it) => (it.berat_kg || 0) <= 0);

  const handleDownloadPdf = async () => {
    if (!isAllWeighed) {
      alert('Perhatian: Nota pembelian belum dapat diunduh/dicetak karena masih ada bal tembakau yang belum ditimbang (Proses 2 Timbang belum selesai).');
      return;
    }
    if (!receiptRef.current) return;
    setIsDownloadingPdf(true);
    try {
      await downloadElementAsPdf(
        receiptRef.current,
        `NOTA_TIMBANG_${transaksi.transaksi_id.replace(/\//g, '_')}.pdf`,
        { orientation: 'portrait' }
      );
      if (onUpdateNotaStatus) {
        onUpdateNotaStatus(transaksi.transaksi_id);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDirectPrint = () => {
    if (!isAllWeighed) {
      alert('Perhatian: Nota pembelian belum dapat diunduh/dicetak karena masih ada bal tembakau yang belum ditimbang (Proses 2 Timbang belum selesai).');
      return;
    }
    if (!receiptRef.current) return;
    printHtmlElementDirectly(
      receiptRef.current,
      `Nota Timbang - ${transaksi.transaksi_id}`
    );
    if (onUpdateNotaStatus) {
      onUpdateNotaStatus(transaksi.transaksi_id);
    }
  };

  const barcodeBars = generateBarcodeBars(transaksi.transaksi_id);
  const cleanDate = transaksi.tanggal_transaksi ? transaksi.tanggal_transaksi.split(' ')[0].split('T')[0] : '-';

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white border border-gray-300 w-full max-w-3xl rounded-none shadow-xl flex flex-col text-xs text-gray-800 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 text-[#b81d24]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                  Nota Timbang & Kasir Pembayaran
                </h2>
                {isLunas ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-xs flex items-center space-x-1 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>LUNAS (CASH / MASUK KAS)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-xs flex items-center space-x-1 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>KREDIT (BELUM DISERAHKAN KE KASIR)</span>
                  </span>
                )}
                {transaksi.status_nota === 'sudah_cetak' && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    (Nota Tercetak)
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
                No. Transaksi: {transaksi.transaksi_id} • <span className="font-bold text-gray-800 whitespace-nowrap font-mono">{transaksi.no_kupon}</span>
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

            {onDeleteTransaksi && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                title="Hapus Transaksi Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}

            {!isLunas && isAllWeighed && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenBayarModal) {
                    onOpenBayarModal(transaksi);
                  } else if (onMarkAsLunas) {
                    onMarkAsLunas(transaksi.transaksi_id);
                    if (onUpdateNotaStatus) onUpdateNotaStatus(transaksi.transaksi_id);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                title="Cairkan Pembayaran & Masukkan ke Kas (Cash)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bayar Cash (Masuk Kas)</span>
              </button>
            )}

            <button
              type="button"
              disabled={!isAllWeighed || isDownloadingPdf}
              onClick={handleDownloadPdf}
              className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-sm transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap ${
                isAllWeighed 
                  ? 'bg-[#17a2b8] hover:bg-[#138496] cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
              title={isAllWeighed ? 'Unduh Nota PDF' : 'Lengkapi penimbangan bal terlebih dahulu'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              disabled={!isAllWeighed}
              onClick={handleDirectPrint}
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-sm transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap ${
                isAllWeighed 
                  ? 'bg-[#b81d24] hover:bg-[#a0181e] cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed opacity-60'
              }`}
              title={isAllWeighed ? 'Cetak Nota Sekarang' : 'Lengkapi penimbangan bal terlebih dahulu'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Nota</span>
            </button>
          </div>
        </div>

        {/* Validation Warning Alert if Weighing Not Complete */}
        {hasZeroWeightItem && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center space-x-2 text-amber-900 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Nota belum dapat dicetak/diunduh karena ada bal yang belum selesai ditimbang (Proses 2). Selesaikan penimbangan untuk mengaktifkan nota resmi.
            </span>
          </div>
        )}

        {/* Modal Body / Printable Receipt */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 print:bg-white print:p-0 flex justify-center">
          
          <div 
            ref={receiptRef}
            id="printable-nota-timbang"
            className="w-full max-w-2xl bg-white border border-gray-300 p-6 shadow-sm space-y-4 text-gray-900 print:border-none print:shadow-none"
          >
            {/* Nota Header */}
            <div className="text-center border-b-2 border-gray-800 pb-3 space-y-1">
              <span className="text-[10px] font-black tracking-widest text-[#b81d24] uppercase block">
                PR. SEKAR ANOM • PUSAT PAMEKASAN MADURA
              </span>
              <h3 className="text-base font-black tracking-tight text-gray-900 uppercase">
                SURAT BUKTI TIMBANG & NOTA PEMBELIAN TEMBAKAU
              </h3>
              <p className="text-[10px] text-gray-600 font-medium">
                Jl. Raya Tlanakan No. 45, Pamekasan, Madura - Jawa Timur | Telp: (0324) 321888
              </p>
            </div>

            {/* Transaction Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">No. Transaksi:</span>
                  <span className="font-mono font-bold text-gray-900">{transaksi.transaksi_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">No. Kupon Antrian:</span>
                  <span className="font-mono font-bold text-[#b81d24] whitespace-nowrap">{transaksi.no_kupon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Tanggal Transaksi:</span>
                  <span className="font-mono text-gray-800">{cleanDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Petugas Loket/Sortir:</span>
                  <span className="font-semibold text-gray-800">{transaksi.operator_nama}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Status & Catatan Kas:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded-xs text-[10px] ${
                    isLunas ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-amber-800 bg-amber-100 border border-amber-300'
                  }`}>
                    {isLunas ? 'CASH (MASUK BUKU KAS)' : 'KREDIT (TIKET BELUM DISERAHKAN)'}
                  </span>
                </div>
                {isLunas && transaksi.no_bukti_kas && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">No. Bukti Kas (BKK):</span>
                    <span className="font-mono font-bold text-emerald-800">{transaksi.no_bukti_kas}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
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
                  <span className="text-gray-800 truncate max-w-[150px]">{transaksi.desa_kecamatan || '-'}</span>
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
                  <tr className="bg-[#f8f9fa] border-b border-gray-300 font-bold text-gray-700 text-[11px]">
                    <th className="py-2 px-2 text-center border-r border-gray-300 w-8">No</th>
                    <th className="py-2 px-2.5 border-r border-gray-300">No. Bal / Barcode</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-center">Grade</th>
                    <th className="py-2 px-2 border-r border-gray-300 text-center">Tikar</th>
                    <th className="py-2 px-2.5 border-r border-gray-300 text-center">Netto (Kg)</th>
                    <th className="py-2 px-2.5 border-r border-gray-300 text-right">Tarif / Kg</th>
                    <th className="py-2 px-2.5 border-r border-gray-300 text-right">Total Kotor</th>
                    <th className="py-2 px-2.5 border-r border-gray-300 text-right">Potongan</th>
                    <th className="py-2 px-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-2 text-center border-r border-gray-200 font-mono text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 font-mono font-bold text-gray-900">
                        {item.no_bal}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-200 text-center font-bold text-gray-800">
                        Grade {item.kode_grade}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-200 text-center text-[10px]">
                        {item.ganti_tikar ? (
                          <span className="text-amber-800 font-bold">Ganti (2kg)</span>
                        ) : (
                          <span className="text-gray-600">Standar (3kg)</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-center font-mono font-bold text-gray-900">
                        {(item.berat_kg || 0) > 0 ? `${item.berat_kg} kg` : <span className="text-amber-600">Menunggu</span>}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-right font-mono text-gray-700">
                        {formatRupiah(item.harga_per_kg)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-right font-mono text-gray-800">
                        {formatRupiah(item.total_kotor)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-gray-200 text-right font-mono text-red-600 font-medium">
                        -{formatRupiah(item.potongan)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-[#b81d24]">
                        {formatRupiah(item.subtotal_bersih)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Rows */}
                  <tr className="bg-[#f8f9fa] font-bold border-t border-gray-300">
                    <td colSpan={4} className="py-2 px-2.5 border-r border-gray-300 text-right uppercase text-[10px]">
                      TOTAL KESELURUHAN ({items.length} BAL):
                    </td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-center font-mono font-bold text-gray-900">
                      {transaksi.berat_kg} kg
                    </td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-right font-mono text-gray-500">-</td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-right font-mono text-gray-900">
                      {formatRupiah(transaksi.total_kotor || transaksi.total_harga_beli)}
                    </td>
                    <td className="py-2 px-2.5 border-r border-gray-300 text-right font-mono text-red-600">
                      -{formatRupiah(transaksi.total_potongan)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-gray-900">
                      {formatRupiah(transaksi.harga_final)}
                    </td>
                  </tr>

                  {/* Rincian Potongan Breakdown */}
                  <tr className="bg-gray-50 text-[10.5px] text-gray-700 border-t border-gray-200">
                    <td colSpan={9} className="py-1.5 px-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-gray-600 uppercase text-[10px]">Rincian Potongan Biaya:</span>
                        <span>Potongan Kuli: <strong className="font-mono text-red-600">-{formatRupiah(transaksi.potongan_kuli || (items.length * 7000))}</strong></span>
                        <span>Potongan Tali: <strong className="font-mono text-red-600">-{formatRupiah(transaksi.potongan_tali || (items.length * 3000))}</strong></span>
                        <span>Potongan Tikar: <strong className="font-mono text-red-600">-{formatRupiah(transaksi.potongan_tikar || 0)}</strong></span>
                        <span>Total Potongan: <strong className="font-mono text-red-700 font-bold">-{formatRupiah(transaksi.total_potongan)}</strong></span>
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-[#fcf0f0] font-bold text-gray-900">
                    <td colSpan={8} className="py-2.5 px-3 border-r border-gray-300 text-right uppercase text-[11px] text-gray-800">
                      TOTAL BERSIH DIBAYARKAN KE PETANI (NETTO):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#b81d24] font-black">
                      {formatRupiah(transaksi.harga_final)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Keterangan Kas & Status Pembayaran */}
            <div className={`p-2.5 border text-[11px] ${
              isLunas 
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-start space-x-2">
                {isLunas ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold">
                    {isLunas 
                      ? `STATUS: CASH (UANG TUNAI KAS KELUAR SUDAH DICAIRKAN)` 
                      : `STATUS: KREDIT (HUTANG PEMBELIAN / TIKET BELUM DISERAHKAN)`}
                  </strong>
                  <p className="mt-0.5 text-[10.5px]">
                    {isLunas 
                      ? `Transaksi ini telah dibayarkan tunai (Cash) oleh ${transaksi.dibayar_oleh || 'Kasir'} pada ${transaksi.dibayar_pada?.split('T')[0] || cleanDate} dengan No. Bukti Kas: ${transaksi.no_bukti_kas || '-'}. Dana resmi keluar dari kas pembelian.`
                      : `Petani belum menyerahkan tiket timbang ini ke loket kasir. Sebelum tiket diserahkan, transaksi tercatat sebagai Kredit (Hutang). Segera serahkan tiket ini ke kasir untuk pencairan tunai (Cash).`}
                  </p>
                </div>
              </div>
            </div>

            {/* Catatan jika ada */}
            {transaksi.catatan && (
              <div className="p-2 bg-gray-50 border border-gray-200 text-xs text-gray-700">
                <span className="font-bold block text-gray-800">Catatan Penerimaan:</span>
                <p className="mt-0.5">{transaksi.catatan}</p>
              </div>
            )}

            {/* Barcode & Signature Section */}
            <div className="pt-2 flex items-end justify-between gap-4">
              
              {/* Barcode ID Transaksi */}
              <div className="flex flex-col items-center p-2 bg-gray-50 border border-gray-200">
                <div className="flex justify-center items-end space-x-0.5 h-6 w-28 overflow-hidden">
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
                <div className="space-y-10">
                  <span className="text-gray-600 block">Penyetor (Petani)</span>
                  <div className="border-t border-gray-400 font-semibold pt-1 text-gray-900 min-w-[90px]">
                    ( {transaksi.nama_petani} )
                  </div>
                </div>

                <div className="space-y-10">
                  <span className="text-gray-600 block">Petugas Timbang & Kasir</span>
                  <div className="border-t border-gray-400 font-semibold pt-1 text-gray-900 min-w-[90px]">
                    ( {transaksi.operator_nama} )
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Note */}
            <div className="border-t border-dashed border-gray-300 pt-1.5 text-[9.5px] text-gray-500 text-center">
              Simpan bukti timbang ini sebagai rujukan pencairan kas dan bukti setoran tembakau resmi PT/PR Sekar Anom.
            </div>

          </div>

        </div>

      </div>

      {/* Konfirmasi Hapus Transaksi */}
      {isConfirmDeleteOpen && onDeleteTransaksi && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Konfirmasi Hapus Transaksi"
          message={`Apakah Anda yakin ingin menghapus transaksi "${transaksi.transaksi_id}" milik petani "${transaksi.nama_petani}" (${transaksi.berat_kg} Kg)?\n\nSemua bal tembakau inventaris gudang yang terkait transaksi ini juga akan dihapus.`}
          confirmLabel="Hapus Transaksi"
          isDestructive={true}
          onConfirm={() => {
            onDeleteTransaksi(transaksi.transaksi_id);
            setIsConfirmDeleteOpen(false);
            onClose();
          }}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}
    </div>
  );
};
