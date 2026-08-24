import React from 'react';
import { 
  Package, 
  Tag, 
  Scale, 
  FlaskConical, 
  Truck, 
  BarChart3, 
  Layers, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Database,
  KeyRound
} from 'lucide-react';
import { ModuleNav } from '../../types';

interface UpcomingModulePlaceholderProps {
  module: ModuleNav;
  onGoToPetani: () => void;
}

export const UpcomingModulePlaceholder: React.FC<UpcomingModulePlaceholderProps> = ({
  module,
  onGoToPetani,
}) => {
  const getDetails = (id: string) => {
    switch (id) {
      case 'modul-2-barang':
        return {
          icon: <Package className="w-8 h-8 text-amber-600" />,
          badge: 'PRD 02 (Urutan Berikutnya)',
          title: 'Modul Data Barang — Master Grade & Barcode Generator',
          desc: 'Modul untuk manajemen master tembakau per grade (Grade A s/d F), auto-generate barcode fisik tiap bal saat create, auto-decrement stok saat barcode di-scan keluar gudang.',
          entities: [
            { field: 'barang_id', type: 'PK (UUID / Auto)', desc: 'Identitas unik master barang' },
            { field: 'kode_grade', type: 'string (A, B, C, D, E, F)', desc: 'Klasifikasi grade mutu tembakau' },
            { field: 'barcode', type: 'string (Unik)', desc: 'Auto-generate saat barang dibuat' },
            { field: 'berat_standar_kg', type: 'number (default 45 kg)', desc: 'Standar berat bal tembakau' },
            { field: 'status_stok', type: 'string', desc: 'di_gudang / dalam_pengiriman / keluar' },
            { field: 'lokasi_gudang', type: 'string', desc: 'Blok / Rak penyimpanan' },
          ],
          relations: 'Barcode pada modul ini akan menjadi kunci penghubung ke Pengiriman Sample dan Pengiriman Barang.',
        };
      case 'modul-3-harga':
        return {
          icon: <Tag className="w-8 h-8 text-emerald-600" />,
          badge: 'PRD 03 (Menunggu Data Barang)',
          title: 'Modul Tabel Harga — Tarif Grade & Rate Potongan',
          desc: 'Modul pengelolaan tarif harga beli per kg per grade, versioning tanggal berlaku, serta konfigurasi rate potongan per 10 kg.',
          entities: [
            { field: 'harga_id', type: 'PK', desc: 'Identitas acuan harga' },
            { field: 'barang_id', type: 'FK → Barang.kode_grade', desc: 'Relasi ke Grade Barang' },
            { field: 'harga_per_kg', type: 'currency (IDR)', desc: 'Harga dasar per kilogram' },
            { field: 'tanggal_berlaku', type: 'date', desc: 'Masa aktif harga' },
            { field: 'rate_potongan_per_10kg', type: 'number (default 2000)', desc: 'Potongan standar kadar air/tara' },
          ],
          relations: 'Bergantung pada Grade yang didefinisikan di Modul Data Barang dan dipakai saat Transaksi Pembelian.',
        };
      case 'modul-4-sample':
        return {
          icon: <FlaskConical className="w-8 h-8 text-purple-600" />,
          badge: 'PRD 04 (Logistik & Lab)',
          title: 'Modul Pengiriman Sample — Uji Mutu & Approval Lab',
          desc: 'Pencatatan pengiriman sampel tembakau ke pabrik/laboratorium buyer, status approval (Diterima / Ditolak), dan referensi grade.',
          entities: [
            { field: 'sample_id', type: 'PK', desc: 'ID Pengiriman sample' },
            { field: 'barang_id', type: 'FK', desc: 'Grade tembakau yang diuji' },
            { field: 'sumber', type: 'string', desc: 'Gudang asal / Petani sumber' },
            { field: 'tujuan', type: 'string', desc: 'Lab / Pabrik / Buyer' },
            { field: 'tanggal_kirim', type: 'date', desc: 'Waktu kirim sample' },
            { field: 'status', type: 'dikirim | disetujui | ditolak', desc: 'Approval status' },
          ],
          relations: 'Menggunakan referensi Barang (Grade) dan Petani (petani_id). Pengiriman barang fisik menunggu approval sample ini.',
        };
      case 'modul-5-pengiriman':
        return {
          icon: <Truck className="w-8 h-8 text-blue-600" />,
          badge: 'PRD 05 (Logistik Bal Fisik)',
          title: 'Modul Pengiriman Barang — Scan Barcode Outbound',
          desc: 'Pengiriman bal tembakau fisik skala penuh keluar gudang menuju pabrik rokok/mitra, validasi via scan barcode dan auto-update status stok.',
          entities: [
            { field: 'pengiriman_id', type: 'PK', desc: 'Nomor surat jalan / DO' },
            { field: 'barcode', type: 'FK → Barang.barcode', desc: 'Scan barcode bal fisik yang keluar' },
            { field: 'sumber', type: 'string', desc: 'Gudang Temanggung' },
            { field: 'tujuan', type: 'string', desc: 'Pabrik Rokok Tujuan' },
            { field: 'tanggal_kirim', type: 'date', desc: 'Waktu keberangkatan truk' },
            { field: 'referensi_sample_id', type: 'FK (opsional)', desc: 'Tautan ke approval sample' },
          ],
          relations: 'Memvalidasi barcode fisik bal dan memperbarui status stok di Data Barang.',
        };
      case 'modul-6-laporan':
        return {
          icon: <BarChart3 className="w-8 h-8 text-rose-600" />,
          badge: 'PRD 06 (Konsumen Data & Analytic)',
          title: 'Modul Laporan & Analytic — Dashboard Ranking & Volume',
          desc: 'Modul analitik agregasi: ranking grade tembakau terlaris/tersedikit, ranking petani paling aktif/setoran terbanyak, tren volume panen per wilayah.',
          entities: [
            { field: 'agregasi_petani', type: 'Ranking Metric', desc: 'Top pemasok by volume bal & kg' },
            { field: 'agregasi_grade', type: 'Distribusi Mutu', desc: 'Persentase Grade A, B, C, D, E' },
            { field: 'tren_harian', type: 'Timeseries', desc: 'Volume masuk vs volume keluar' },
            { field: 'zonasi_wilayah', type: 'Geographic Analysis', desc: 'Produktivitas Temanggung, Jember, Madura' },
          ],
          relations: 'Mengkonsumsi data gabungan dari Petani (petani_id), Transaksi Pembelian, dan Pengiriman Barang.',
        };
      case 'modul-0-transaksi':
      default:
        return {
          icon: <Scale className="w-8 h-8 text-emerald-600" />,
          badge: 'Modul Prasyarat / Loket Timbang',
          title: 'Transaksi Pembelian Tembakau',
          desc: 'Penerimaan bal langsung di loket timbang: Scan kartu petani, timbang berat gross, tentukan mutu grade, hitung potongan dan harga final.',
          entities: [
            { field: 'transaksi_id', type: 'PK', desc: 'Nomor kupon transaksi unik' },
            { field: 'petani_id', type: 'FK → Petani.petani_id', desc: 'Petani aktif penyetor' },
            { field: 'no_bal', type: 'string', desc: 'Nomor bal fisik' },
            { field: 'barang_id', type: 'FK → Grade', desc: 'Grade tembakau hasil taksir' },
            { field: 'berat_kg', type: 'number', desc: 'Berat netto setelah potongan' },
            { field: 'harga_final', type: 'currency', desc: 'Total pembayaran ke petani' },
          ],
          relations: 'Terkoneksi langsung ke Modul 1 (Tabel Petani) yang saat ini aktif.',
        };
    }
  };

  const details = getDetails(module.id);

  return (
    <div className="space-y-6">
      
      {/* Module Overview Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
              {details.icon}
            </div>
            <div>
              <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-md border border-slate-300">
                {details.badge}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {details.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onGoToPetani}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Buka Modul 1 (Tabel Petani Aktif)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {details.desc}
        </p>
      </div>

      {/* Contract & Schema Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Data Model Schema */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span>Struktur Skema Data (Master Outline)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Siap dihubungkan saat PRD diunggah
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Field Name</th>
                  <th className="py-2.5 px-3">Tipe / Key</th>
                  <th className="py-2.5 px-3">Keterangan Relasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {details.entities.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {ent.field}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700">
                      {ent.type}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">
                      {ent.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Relationship Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Kunci Integrasi PRD</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {details.relations}
            </p>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Silakan kirimkan file atau teks <strong>PRD berikutnya</strong> kapan saja untuk langsung mengimplementasikan modul ini!
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
