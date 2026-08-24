import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  RefreshCw, 
  Laptop, 
  FolderSync, 
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  History,
  Check,
  AlertCircle,
  FileJson,
  ArrowRight
} from 'lucide-react';
import { ERPBackupPackage, BackupSnapshotInfo } from '../../types';
import { 
  downloadERPBackupFile, 
  generateERPBackupPackage, 
  restoreERPFromPackage, 
  loadAutoSnapshots, 
  getLastBackupTimestamp,
  validateERPDataSchema,
  SchemaValidationResult,
  recordAutoSnapshot
} from '../../utils/storage';
import { formatDateIndo } from '../../utils/formatters';

interface BackupRestoreViewProps {
  initialTab?: 'export' | 'import' | 'history' | 'sop';
  onDataRestored: (restoredData: ERPBackupPackage['data']) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  initialTab = 'export',
  onDataRestored,
}) => {
  const validTabs: ('export' | 'import' | 'history' | 'sop')[] = ['export', 'import', 'history', 'sop'];
  const normalizeTab = (t: any): 'export' | 'import' | 'history' | 'sop' => 
    typeof t === 'string' && validTabs.includes(t as any) ? (t as any) : 'export';

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'history' | 'sop'>(() => normalizeTab(initialTab));
  const [lastBackup, setLastBackup] = useState<string | null>(() => getLastBackupTimestamp());
  const [snapshots, setSnapshots] = useState<BackupSnapshotInfo[]>(() => loadAutoSnapshots());
  
  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<ERPBackupPackage | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importErrorDetails, setImportErrorDetails] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
    setLastBackup(getLastBackupTimestamp());
    setSnapshots(loadAutoSnapshots());
  }, [initialTab]);

  const currentStats = generateERPBackupPackage().meta;

  const handleDownloadBackup = () => {
    const result = downloadERPBackupFile();
    setLastBackup(result.timestamp);
    setSnapshots(loadAutoSnapshots());
    setImportSuccessMessage(`Berkas cadangan "${result.filename}" berhasil diunduh ke komputer Anda!`);
    setTimeout(() => setImportSuccessMessage(null), 5000);
  };

  const handleCreateManualSnapshot = () => {
    recordAutoSnapshot('Snapshot Manual Pengguna');
    setSnapshots(loadAutoSnapshots());
    setImportSuccessMessage('Snapshot manual titik pemulihan baru berhasil dibuat!');
    setTimeout(() => setImportSuccessMessage(null), 4000);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setImportError(null);
    setImportErrorDetails([]);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content || !content.trim()) {
          setImportError('Berkas cadangan kosong (0 bytes).');
          setImportErrorDetails(['File tidak memuat data teks JSON apapun.']);
          setParsedBackup(null);
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (jsonErr: any) {
          setImportError('Berkas rusak: Struktur bukan format JSON yang valid.');
          setImportErrorDetails([
            `Gagal membaca sintaks JSON: ${jsonErr?.message || 'Sintaks korup'}`,
            'Pastikan berkas adalah file cadangan resmi (.json) hasil ekspor sistem Gudang Tembakau.'
          ]);
          setParsedBackup(null);
          return;
        }

        const validation: SchemaValidationResult = validateERPDataSchema(parsed);
        if (!validation.isValid || !validation.sanitizedData) {
          setImportError('Validasi skema gagal: Format data berkas tidak sesuai standar sistem.');
          setImportErrorDetails(validation.errors);
          setParsedBackup(null);
          return;
        }

        const fullPackage: ERPBackupPackage = {
          app_name: parsed.app_name || 'PR. SEKAR ANOM ERP Gudang Tembakau',
          version: parsed.version || '2.4.0',
          exported_at: parsed.exported_at || new Date().toISOString(),
          device_info: parsed.device_info || 'Imported File',
          data: validation.sanitizedData,
          meta: {
            total_petani: validation.sanitizedData.petani.length,
            total_barang: validation.sanitizedData.barang.length,
            total_harga: validation.sanitizedData.harga.length,
            total_transaksi: validation.sanitizedData.transaksi.length,
            total_sample: validation.sanitizedData.sample.length,
            total_pengiriman: validation.sanitizedData.pengiriman.length,
            total_gudang: validation.sanitizedData.gudang.length,
          }
        };

        setParsedBackup(fullPackage);
      } catch (err: any) {
        setImportError(`Gagal membaca berkas: ${err?.message || 'Format tidak valid'}`);
        setImportErrorDetails([err?.message || 'Terjadi kesalahan sistem saat parsing berkas.']);
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    setIsProcessing(true);
    setImportError(null);
    setImportErrorDetails([]);

    setTimeout(() => {
      try {
        const result = restoreERPFromPackage(parsedBackup);
        setIsProcessing(false);

        if (result.success && result.data) {
          onDataRestored(result.data);
          setImportSuccessMessage(
            `SELURUH DATABASE BERHASIL DIPULIHKAN! ${result.data.petani.length} Petani, ${result.data.barang.length} Bal Stok, ${result.data.transaksi.length} Transaksi telah dimuat.`
          );
          setLastBackup(new Date().toISOString());
          setSnapshots(loadAutoSnapshots());
          setSelectedFile(null);
          setParsedBackup(null);
        } else {
          setImportError(result.message);
          if (result.errors) {
            setImportErrorDetails(result.errors);
          }
        }
      } catch (err: any) {
        setIsProcessing(false);
        setImportError(`Gagal memulihkan database: ${err?.message || 'Kesalahan sistem'}`);
      }
    }, 300);
  };

  const handleRestoreFromSnapshot = (snap: BackupSnapshotInfo) => {
    setIsProcessing(true);
    setImportError(null);
    setImportErrorDetails([]);

    setTimeout(() => {
      try {
        const result = restoreERPFromPackage(snap.dataPackage);
        setIsProcessing(false);

        if (result.success && result.data) {
          onDataRestored(result.data);
          setImportSuccessMessage(`Database berhasil dipulihkan dari snapshot "${snap.reason}"!`);
          setLastBackup(new Date().toISOString());
          setSnapshots(loadAutoSnapshots());
        } else {
          setImportError(result.message);
          if (result.errors) {
            setImportErrorDetails(result.errors);
          }
        }
      } catch (err: any) {
        setIsProcessing(false);
        setImportError(`Gagal memulihkan snapshot: ${err?.message || 'Kesalahan sistem'}`);
      }
    }, 250);
  };

  const isBackupUpToDate = lastBackup ? (new Date().getTime() - new Date(lastBackup).getTime()) < 24 * 60 * 60 * 1000 : false;

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* Top Banner Card */}
      <div className="bg-white border border-gray-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 bg-red-50 border border-red-200 flex items-center justify-center rounded-sm text-[#b81d24] shrink-0 shadow-2xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Pusat Cadangan & Mitigasi Bencana Data (Backup & Recovery)
              </h1>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-2xs text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>Mode Desktop Offline Aktif</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Solusi keamanan data offline: Ekspor berkas cadangan harian (Tutup Shift), mitigasi laptop rusak, dan pemulihan instan saat ganti komputer.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Cadangan Hari Ini</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {importSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-sm text-xs flex items-start space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{importSuccessMessage}</div>
        </div>
      )}

      {/* Main Card with Tabs */}
      <div className="bg-white border border-gray-200 shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-[#f8f9fa] px-4 pt-2.5 gap-1 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-[#b81d24] text-[#b81d24] bg-white -mb-px shadow-2xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#b81d24]" />
            <span>1. Ekspor Cadangan (Tutup Shift)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-[#b81d24] text-[#b81d24] bg-white -mb-px shadow-2xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Pulihkan Database (Laptop Baru)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-[#b81d24] text-[#b81d24] bg-white -mb-px shadow-2xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Riwayat Snapshot ({snapshots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sop')}
            className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'sop'
                ? 'border-[#b81d24] text-[#b81d24] bg-white -mb-px shadow-2xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>4. SOP Mitigasi Laptop Rusak</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 text-xs text-gray-800">
          
          {/* TAB 1: EXPORT (TUTUP SHIFT) */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Daily status banner */}
              <div className={`p-4 border rounded-sm flex items-start space-x-3 ${
                isBackupUpToDate
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}>
                {isBackupUpToDate ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="font-bold text-xs sm:text-sm block">
                    {isBackupUpToDate 
                      ? 'Status Cadangan: Database Telah Diamankan Hari Ini' 
                      : 'Perhatian: Cadangan Harian Belum Diperbarui Hari Ini'}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-gray-700">
                    {lastBackup 
                      ? `Cadangan terakhir diekspor pada: ${formatDateIndo(lastBackup)} (${lastBackup}).` 
                      : 'Belum pernah mengekspor berkas cadangan ke luar laptop.'}
                    {!isBackupUpToDate && ' Disarankan untuk mengunduh cadangan setiap sore saat proses tutup shift timbangan selesai.'}
                  </p>
                </div>
              </div>

              {/* Action Box */}
              <div className="bg-[#f8f9fa] border border-gray-300 p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center space-x-1.5 uppercase">
                    <span>UNDUH 1 BERKAS CADANGAN LENGKAP (.JSON)</span>
                  </h3>
                  <p className="text-gray-600 text-[11.5px]">
                    Mengemas seluruh 7 tabel database menjadi 1 file arsip ringan (&lt; 1 MB) yang siap dipindahkan ke Flashdisk atau Google Drive.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Cadangan Database Sekarang</span>
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                  Rincian Entitas Data yang Tercakup dalam Cadangan:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Petani</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_petani}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Stok Bal</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_barang}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Tarif Grade</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_harga}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Transaksi Intake</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_transaksi}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Sample Lab</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_sample}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Surat Jalan</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_pengiriman}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded-sm text-center">
                    <span className="text-gray-500 text-[10.5px] block font-medium">Gudang / Rak</span>
                    <span className="text-base font-black text-gray-900 font-mono">{currentStats.total_gudang}</span>
                  </div>
                </div>
              </div>

              {/* Daily Shift Checklist */}
              <div className="p-4 bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-gray-800 flex items-center space-x-1.5 text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Protokol Rutin Tutup Shift Operator:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] text-gray-700 leading-relaxed">
                  <li>Pastikan seluruh bal tembakau yang ditimbang hari ini sudah terinput dan dicetak kuponnya.</li>
                  <li>Klik tombol <b>"Unduh Cadangan Database Sekarang"</b> di atas.</li>
                  <li>Simpan file hasil unduhan ke dalam <b>Flashdisk khusus gudang</b> atau kirim berkas ke grup WhatsApp internal / Google Drive.</li>
                  <li>Dengan melakukan langkah di atas setiap hari, data timbangan 100% aman meski laptop gudang mengalami kerusakan mendadak.</li>
                </ol>
              </div>

            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE (LAPTOP BARU) */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-sm flex items-start space-x-3 text-blue-950">
                <Laptop className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs sm:text-sm block">
                    Pemulihan Sistem & Migrasi ke Laptop / Komputer Baru
                  </span>
                  <p className="text-[11.5px] text-gray-700 leading-relaxed">
                    Unggah berkas cadangan resmi (<code className="font-mono font-bold text-gray-900">.json</code>) yang diekspor dari komputer sebelumnya. Seluruh transaksi, data petani, dan stok bal akan langsung aktif di browser ini.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-[#b81d24] bg-red-50'
                    : 'border-gray-300 hover:border-gray-400 bg-[#f8f9fa]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-xs text-gray-600">
                    <Upload className="w-6 h-6 text-[#b81d24]" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-gray-900 block">
                      Klik untuk memilih berkas cadangan .json atau tarik file ke area ini
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Format yang didukung: Hanya berkas cadangan resmi (.json) hasil ekspor sistem
                    </span>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-gray-300 rounded-sm font-mono text-xs text-gray-800">
                      <FileJson className="w-3.5 h-3.5 text-[#b81d24]" />
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message with Schema Diagnostics */}
              {importError && (
                <div className="p-4 bg-red-50 border border-red-300 text-red-950 rounded-sm space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{importError}</span>
                  </div>
                  {importErrorDetails.length > 0 && (
                    <div className="bg-white/80 p-3 border border-red-200 rounded-xs space-y-1">
                      <span className="text-[10.5px] font-bold text-red-800 uppercase block">Rincian Diagnosis Berkas:</span>
                      <ul className="list-disc list-inside text-[11px] text-red-700 space-y-0.5 font-mono">
                        {importErrorDetails.map((det, i) => (
                          <li key={i}>{det}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Valid Backup Package Preview */}
              {parsedBackup && (
                <div className="border border-emerald-300 bg-emerald-50/50 p-5 rounded-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div className="flex items-center space-x-2 text-emerald-950">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="font-bold text-xs sm:text-sm block">Berkas Cadangan Sah & Lolos Validasi Skema</span>
                        <span className="text-[11px] text-gray-600 font-mono">
                          Waktu Ekspor: {formatDateIndo(parsedBackup.exported_at)} | Versi: {parsedBackup.version}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10.5px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                      SIAP DIPULIHKAN
                    </span>
                  </div>

                  {/* Summary counts from backup package */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Petani</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_petani}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Stok Bal</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_barang}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Tarif Grade</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_harga}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Transaksi</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_transaksi}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Sample</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_sample}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Surat Jalan</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_pengiriman}</span>
                    </div>
                    <div className="bg-white p-2.5 border border-emerald-200 rounded-xs">
                      <span className="text-gray-500 text-[10px] block">Gudang</span>
                      <span className="font-bold text-gray-900">{parsedBackup.meta.total_gudang}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-200">
                    <p className="text-[11px] text-gray-600 italic">
                      *Catatan: Menimpa data lokal saat ini dengan isi arsip cadangan.
                    </p>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleExecuteRestore}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 rounded-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>{isProcessing ? 'Memulihkan Data...' : 'Konfirmasi & Pulihkan Database'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SNAPSHOT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Riwayat Titik Pemulihan Otomatis & Manual (Snapshots):
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Sistem otomatis mengamankan snapshot sebelum perubahan data besar atau saat ekspor cadangan dilakukan.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateManualSnapshot}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Buat Snapshot Baru Sekarang</span>
                </button>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center bg-[#f8f9fa] border border-gray-200 text-gray-500 space-y-2">
                  <History className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="font-semibold text-xs">Belum ada snapshot tersimpan.</p>
                  <p className="text-[11px]">Snapshot dibuat secara otomatis saat Anda melakukan transaksi atau ekspor berkas cadangan.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 border border-gray-200 bg-white">
                  {snapshots.map((snap) => (
                    <div key={snap.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-xs">{snap.reason}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                            {snap.id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formatDateIndo(snap.timestamp)}</span>
                          </span>
                          <span>•</span>
                          <span>{snap.dataPackage?.meta?.total_petani || 0} Petani</span>
                          <span>•</span>
                          <span>{snap.dataPackage?.meta?.total_barang || 0} Bal Stok</span>
                          <span>•</span>
                          <span>{snap.dataPackage?.meta?.total_transaksi || 0} Transaksi</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreFromSnapshot(snap)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs font-semibold text-[#b81d24] bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm transition flex items-center space-x-1 cursor-pointer shrink-0 self-start sm:self-center"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Pulihkan Titik Ini</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SOP MITIGASI BENCANA */}
          {activeTab === 'sop' && (
            <div className="space-y-5">
              <div className="p-4 bg-orange-50/70 border border-orange-200 text-orange-950 rounded-sm space-y-1">
                <span className="font-bold text-xs sm:text-sm flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>SOP Mitigasi Ketika Laptop Gudang Mengalami Kerusakan Total</span>
                </span>
                <p className="text-[11.5px] text-gray-700 leading-relaxed">
                  Ikuti langkah-langkah praktis di bawah ini untuk mengaktifkan sistem di laptop/komputer pengganti dalam waktu kurang dari 2 menit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#f8f9fa] border border-gray-300 rounded-sm space-y-2">
                  <div className="w-6 h-6 rounded-full bg-[#b81d24] text-white font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs">Ambil Berkas Cadangan Terakhir</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Ambil flashdisk cadangan atau buka file .json yang diekspor pada penutupan shift terakhir dari WhatsApp / Google Drive.
                  </p>
                </div>

                <div className="p-4 bg-[#f8f9fa] border border-gray-300 rounded-sm space-y-2">
                  <div className="w-6 h-6 rounded-full bg-[#b81d24] text-white font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs">Buka Sistem di Komputer Baru</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Buka browser Google Chrome / Edge pada komputer baru, lalu buka tautan sistem ERP Gudang Tembakau.
                  </p>
                </div>

                <div className="p-4 bg-[#f8f9fa] border border-gray-300 rounded-sm space-y-2">
                  <div className="w-6 h-6 rounded-full bg-[#b81d24] text-white font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs">Pulihkan Database (.json)</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Masuk ke menu <b>Cadangan & Restore &gt; Pulihkan Database</b>, pilih berkas .json, dan klik <b>Pulihkan Database</b>. Sistem langsung siap dipakai.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm space-y-2">
                <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">Pusat Bantuan & Dukungan Teknis:</span>
                <p className="text-[11.5px] text-gray-600 leading-relaxed">
                  Jika operator menemukan kendala pemulihan atau format berkas rusak, hubungi IT Administrator PR. SEKAR ANOM untuk bantuan diagnosis data cadangan darurat.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
