import React, { useRef } from 'react';
import { X, Printer, Download, Check, Copy, ArrowLeft } from 'lucide-react';
import { Barang } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { downloadHtmlDocument } from '../../utils/printDownload';

interface BarangBarcodeThermalModalProps {
  isOpen: boolean;
  onClose: () => void;
  barang: Barang | null;
}

export const BarangBarcodeThermalModal: React.FC<BarangBarcodeThermalModalProps> = ({
  isOpen,
  onClose,
  barang,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !barang) return null;

  const handleDownload = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    downloadHtmlDocument(
      `LABEL_THERMAL_${barang.no_bal}.html`,
      `Label Thermal Barcode - ${barang.no_bal}`,
      content,
      `
      .doc-container {
        max-width: 380px !important;
        padding: 16px !important;
      }
      #print-content {
        display: flex;
        justify-content: center;
      }
      `
    );
  };

  const handlePrint = () => {
    handleDownload();
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barang.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-gray-300 w-full max-w-lg rounded-none shadow-xl flex flex-col text-xs text-gray-800">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-[#b81d24]" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                Cetak Label Thermal Barcode Bal
              </h2>
              <p className="text-[11px] text-gray-500">Standar Fisik Karung Goni (100mm x 75mm)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#545b62] hover:bg-[#464c52] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#17a2b8] hover:bg-[#138496] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Label</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Thermal Label Preview */}
        <div className="p-4 space-y-4 bg-[#f8f9fa] max-h-[80vh] overflow-y-auto">
          
          <div className="text-center text-xs text-gray-600 font-medium">
            Pratinjau label barcode fisik yang akan ditempelkan pada bal tembakau:
          </div>

          {/* Physical Thermal Sticker Simulator */}
          <div 
            ref={printAreaRef}
            className="bg-white border-2 border-dashed border-gray-400 rounded-none p-4 shadow-xs max-w-sm mx-auto space-y-3 font-mono text-gray-900 relative print:border-solid print:m-0 print:shadow-none"
          >
            
            {/* Header Sticker */}
            <div className="flex items-center justify-between border-b border-gray-900 pb-2">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#b81d24] uppercase block">PR. SEKAR ANOM</span>
                <span className="text-xs font-black tracking-tight text-gray-900">GUDANG PUSAT TEMBAKAU</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-500 block">NO. BAL</span>
                <span className="text-xs font-black text-gray-900">{barang.no_bal}</span>
              </div>
            </div>

            {/* Core Grade & Weight Section */}
            <div className="grid grid-cols-2 gap-2 bg-[#f8f9fa] p-2 border border-gray-300">
              <div className="border-r border-gray-300 pr-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">MUTU / GRADE</span>
                <span className="text-xl font-black text-gray-900 block">
                  GRADE {barang.kode_grade}
                </span>
              </div>
              <div className="pl-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">BERAT AKTUAL</span>
                <span className="text-xl font-black text-gray-900 block">
                  {barang.berat_kg} <span className="text-xs font-bold text-gray-600">KG</span>
                </span>
              </div>
            </div>

            {/* Barcode Vector Graphic */}
            <div className="bg-white p-2 border border-gray-300 text-center flex flex-col items-center">
              <BarcodeSvg value={barang.barcode} height={48} />
            </div>

            {/* Metadata Footer */}
            <div className="space-y-1 text-[11px] border-t border-gray-300 pt-2 text-gray-700 font-sans">
              <div className="flex justify-between">
                <span className="text-gray-500">Petani Asal:</span>
                <span className="font-bold text-gray-900">{barang.nama_petani || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lokasi Simpan:</span>
                <span className="font-bold text-gray-900">{barang.lokasi_gudang}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tgl Masuk:</span>
                <span className="font-mono text-gray-800">{barang.tanggal_masuk}</span>
              </div>
            </div>

          </div>

          {/* Quick Copy String */}
          <div className="flex items-center justify-between bg-white p-2.5 border border-gray-300 text-xs">
            <span className="font-mono text-gray-700 truncate mr-2">{barang.barcode}</span>
            <button
              onClick={handleCopyBarcode}
              className="flex items-center space-x-1 text-[#b81d24] hover:underline font-semibold shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Barcode'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
