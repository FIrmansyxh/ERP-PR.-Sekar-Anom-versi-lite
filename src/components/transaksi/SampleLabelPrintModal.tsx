import React, { useRef, useState } from 'react';
import { Printer, Download, ArrowLeft, Tag, CheckCircle2, Box, Layers } from 'lucide-react';
import { downloadElementAsPdf, printHtmlElementDirectly } from '../../utils/printDownload';

export interface SampleLabelData {
  no_bal: string;
  barcode?: string;
  kode_grade: string;
  nama_petani: string;
  nomor_kartu: string;
  tanggal_transaksi: string; // YYYY-MM-DD
  no_kupon: string;
  lokasi_sample_box?: string;
  catatan?: string;
}

interface SampleLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: SampleLabelData[];
  onConfirmStored?: () => void;
}

export const SampleLabelPrintModal: React.FC<SampleLabelPrintModalProps> = ({
  isOpen,
  onClose,
  samples = [],
  onConfirmStored,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isStoredConfirmed, setIsStoredConfirmed] = useState(false);

  if (!isOpen || samples.length === 0) return null;

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await downloadElementAsPdf(
        printAreaRef.current,
        `LABEL_SAMPLE_${samples[0].no_bal}_BATCH.pdf`,
        { orientation: 'portrait' }
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    printHtmlElementDirectly(
      printAreaRef.current,
      `Label Sample Tembakau QC - PR Sekar Maju Sejahtera`
    );
  };

  const handleFinish = () => {
    if (onConfirmStored) {
      onConfirmStored();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-white border border-gray-300 w-full max-w-3xl rounded-none shadow-2xl flex flex-col text-xs text-gray-800 max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-sm bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 font-bold text-[10px] rounded-none uppercase">
                  Label Sampel QC
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {samples.length} Sampel Tembakau
                </span>
              </div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                Cetak Label Sampel Tembakau QC
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 disabled:opacity-50 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Unduh Lembar Label Format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Membuat...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label</span>
            </button>
          </div>
        </div>

        {/* Info Instruction Banner */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center space-x-2 text-[11px] text-gray-700">
          <Box className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          <div>
            Tempelkan label ini pada wadah sampel tembakau dari meja sortir untuk pengujian mutu di ruang QC.
          </div>
        </div>

        {/* Printable Label Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 flex justify-center">
          <div 
            ref={printAreaRef}
            id="printable-sample-labels"
            className="w-full max-w-2xl bg-white border border-gray-300 p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {samples.map((sample, idx) => (
                <div 
                  key={idx}
                  className="border-2 border-dashed border-gray-400 p-3.5 rounded-none bg-white flex flex-col justify-between space-y-2 page-break-inside-avoid"
                >
                  {/* Top Label Header */}
                  <div className="flex items-center justify-between border-b border-gray-300 pb-1.5">
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 tracking-wider uppercase block">
                        PR. SEKAR MAJU SEJAHTERA • LAB QC
                      </span>
                      <span className="text-[10px] font-bold text-gray-800">
                        SAMPLE TEMBAKAU SORTIR
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-gray-900 text-white font-bold text-xs rounded-none">
                        GRADE {sample.kode_grade}
                      </span>
                    </div>
                  </div>

                  {/* Highlight No Bal */}
                  <div className="py-2.5 flex flex-col items-center justify-center bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                      Nomor Bal Tembakau
                    </span>
                    <span className="font-mono font-bold text-lg text-gray-900 tracking-wider mt-0.5">
                      {sample.no_bal}
                    </span>
                  </div>

                  {/* Sample Details */}
                  <div className="text-[10px] space-y-0.5 text-gray-700 bg-white pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kupon Intake:</span>
                      <span className="font-mono font-bold text-gray-900">{sample.no_kupon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Petani:</span>
                      <span className="font-bold text-gray-900 truncate max-w-[140px]">
                        {sample.nama_petani}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tanggal:</span>
                      <span className="font-mono text-gray-800">
                        {sample.tanggal_transaksi ? sample.tanggal_transaksi.split(' ')[0].split('T')[0] : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Footer Tag */}
                  <div className="pt-1 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-500 font-mono">
                    <span>QC SAMPLE ROOM</span>
                    <span>TAG #{idx + 1} OF {samples.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Confirmation Action */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={isStoredConfirmed}
              onChange={(e) => setIsStoredConfirmed(e.target.checked)}
              className="w-4 h-4 text-gray-900 rounded-none border-gray-300 focus:ring-gray-800"
            />
            <span className="font-medium">
              Saya konfirmasi seluruh sampel tembakau telah diberi label dan dikumpulkan ke bagian QC/Sample Room
            </span>
          </label>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-sm transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai Labeling Sample & Lanjut Timbang</span>
          </button>
        </div>

      </div>
    </div>
  );
};
