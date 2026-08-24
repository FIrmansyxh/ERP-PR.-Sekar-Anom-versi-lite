export interface Petani {
  petani_id: string; // Auto generated: PTN-YYYY-XXX e.g., 'PTN-2026-001'
  nama_petani: string; // required
  no_hp: string; // numeric phone number
  alamat: string; // required address/area
  status_aktif: boolean; // default true
  nomor_kartu?: string; // fallback / alias to petani_id
  desa_kecamatan?: string; // optional area
  tanggal_daftar?: string; // YYYY-MM-DD
  catatan?: string;
  statistik?: {
    total_setoran_bal?: number;
    total_berat_kg?: number;
    kunjungan_terakhir?: string;
    grade_dominan?: string;
  };
}

export type UserRole = 
  | 'superadmin' 
  | 'kepala_gudang' 
  | 'operator_loket' 
  | 'logistik_pengiriman' 
  | 'qc_mutu';

export interface User {
  user_id: string; // e.g. "USR-001"
  username: string; // e.g. "superadmin", "operator"
  password?: string; // stored for local desktop auth
  nama_lengkap: string; // e.g. "Bambang Sutrisno, S.T."
  role: UserRole;
  email?: string;
  no_hp?: string;
  unit_penugasan: string; // e.g. "Gudang Pusat Induk - Pamekasan"
  status_aktif: boolean;
  terakhir_login?: string;
  dibuat_pada: string;
}

export interface RolePermissionInfo {
  role: UserRole;
  label: string;
  deskripsi: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  allowedModules: string[];
  capabilities: {
    canManageUsers: boolean;
    canManageMasterData: boolean;
    canCreatePetani: boolean;
    canInputTransaksi: boolean;
    canManageStok: boolean;
    canManageQC: boolean;
    canManagePengiriman: boolean;
    canViewAnalytics: boolean;
  };
}

export type StatusStokBarang = 'di_gudang' | 'siap_kirim' | 'keluar' | 'terkirim_sample';

export interface Gudang {
  gudang_id: string; // e.g. "GDG-PMK-01"
  kode_gudang: string; // e.g. "GDG-PMK-01"
  nama_gudang: string; // e.g. "Gudang Pusat Induk & Intake - Pamekasan"
  nama_lokasi?: string; // alias
  unit_cabang?: string;
  alamat: string;
  kapasitas_bal: number;
  kepala_gudang: string; // Penanggung Jawab
  kontak: string; // Nomor HP
  status_aktif: boolean;
  deskripsi?: string;
  daftar_blok_rak?: string[]; // optional backward compatibility
}

export interface Barang {
  barang_id: string; // Unique ID, e.g. BAL-20260823-001
  barcode: string; // Unique ID alias
  kode_grade: string; // A, B, C, A1, A+, etc.
  no_bal: string; // Bal number
  berat_kg: number; // Netto weight in kg
  status_stok: StatusStokBarang;
  gudang_id?: string;
  lokasi_gudang: string; // Location in warehouse
  tanggal_masuk: string; // ISO string / YYYY-MM-DD
  tanggal_keluar?: string;
  petani_id: string;
  transaksi_pembelian_id?: string;
  nama_petani?: string;
  desa_kecamatan?: string;
  catatan?: string;
}

export interface TabelHarga {
  harga_id: string;
  kode_grade: string; // e.g. A, B, C, A1, A+, AB (max 3 chars, 1st is letter)
  nama_grade: string; // e.g. "Grade A Super (Top Leaves)"
  warna_badge: string;
  harga_per_kg: number; // e.g. 140000
  rate_potongan_per_bal?: number; // Rp 2.000 / bal
  rate_potongan_per_10kg?: number; // legacy alias
  berat_standar_kg?: number;
  ketentuan?: string; // Criteria description
  tanggal_berlaku: string; // YYYY-MM-DD
  tanggal_berakhir?: string;
  status: 'aktif' | 'nonaktif';
  dibuat_oleh: string;
  deskripsi?: string;
}

export interface KuponAntrian {
  kupon_id: string;
  nomor_kupon: string; // e.g. "KUP-001" or "A-01"
  petani_id: string;
  nama_petani: string;
  waktu_kedatangan: string;
  status: 'menunggu' | 'dipanggil' | 'selesai' | 'batal';
}

export interface TransaksiItemBal {
  item_id: string;
  no_bal: string;
  kode_grade: string;
  berat_kg: number;
  harga_per_kg: number;
  total_kotor: number;
  potongan: number;
  subtotal_bersih: number;
  barang_id?: string;
  catatan?: string;
}

export interface TransaksiPembelian {
  transaksi_id: string; // e.g. TRX-20260823-001
  no_kupon: string; // No Kupon antrian (e.g. KUP-001)
  petani_id: string;
  nama_petani: string;
  nomor_kartu: string;
  no_hp?: string;
  desa_kecamatan?: string;
  no_bal: string; // summary of bal numbers or single bal
  kode_grade: string; // primary grade or 'Multi-Grade'
  total_bal?: number; // total bal count in transaction
  items?: TransaksiItemBal[]; // batch intake items
  barang_ids?: string[];
  jenis_timbang: 'bruto' | 'netto';
  berat_terukur_kg: number;
  potongan_tara_kg: number; // 2 kg for bruto, 0 for netto
  berat_kg: number; // Berat Netto Final (calculated)
  lokasi_gudang: string; // Lokasi Simpan
  harga_per_kg: number; // Snapshot harga saat transaksi
  rate_potongan_per_10kg?: number;
  total_kotor?: number;
  potongan_kuli: number; // Rp 7.000 per bal
  potongan_tikar: number; // Opsional Potongan Ganti Tikar
  total_potongan: number; // potongan_kuli + potongan_tikar
  total_harga_beli: number; // berat_kg * harga_per_kg
  harga_final: number; // Jumlah Bayar = total_harga_beli - total_potongan
  status_transaksi: 'lengkap' | 'menunggu';
  tanggal_transaksi: string;
  operator_nama: string;
  barang_id_terkait?: string;
  barcode_terkait?: string;
  catatan_qc?: string;
  catatan?: string;
}

export type StatusSample = 'dikirim' | 'diterima' | 'disetujui' | 'ditolak';

export interface PengirimanSample {
  sample_id: string;
  barang_id?: string;
  barcode_sumber?: string;
  kode_grade: string;
  sumber: string; // e.g. Gudang Utama Pamekasan
  tujuan: string; // e.g. PT Djarum Kudus - Lab QC
  berat_sample_gram: number;
  tanggal_kirim: string;
  tanggal_respon?: string;
  status: StatusSample;
  catatan?: string;
  dikirim_oleh: string;
  nama_petani?: string;
}

export type StatusPengiriman = 'dimuat' | 'dalam_perjalanan' | 'diterima' | 'dikirim';

export interface PengirimanBarang {
  pengiriman_id: string;
  no_surat_jalan: string; // e.g. SJ-20260823-001
  tujuan: string; // Pabrik Tujuan (e.g. PT Gudang Garam Tbk, Kediri)
  jenis_pengeluaran?: string;
  unit_produksi?: string;
  mandor_produksi?: string;
  driver_nama: string; // Nama Sopir
  plat_nomor: string; // Nomor Kendaraan
  tanggal_kirim: string;
  tanggal_diterima?: string;
  barang_ids: string[];
  barcode_list?: string[];
  total_bal: number;
  total_berat_kg: number;
  status: StatusPengiriman;
  sample_id_ref?: string;
  nomor_kontrak?: string;
  catatan?: string;
  petugas?: string;
  dibuat_oleh?: string;
  rincian_grade?: Record<string, { bal: number; kg: number }>;
}

export interface MasterBarang {
  master_id: string;
  kode_barang: string;
  nama_barang: string;
  kode_grade: string;
  kategori: string;
  varietas: string;
  berat_standar_kg: number;
  satuan: string;
  harga_referensi_kg: number;
  lokasi_default_gudang: string;
  keterangan?: string;
  status_aktif: boolean;
  tanggal_dibuat: string;
}

export interface StockOpnameItemDetail {
  barang_id: string;
  barcode: string;
  no_bal: string;
  kode_grade: string;
  berat_kg: number;
  lokasi_gudang: string;
  status_sistem: StatusStokBarang;
  status_fisik: 'ditemukan' | 'tidak_ditemukan' | 'tambahan_baru';
  waktu_scan?: string;
}

export interface StockOpnameSession {
  opname_id: string;
  judul_opname: string;
  tanggal_opname: string;
  petugas_opname: string;
  lokasi_gudang: string;
  target_grade: string;
  total_sistem_bal: number;
  total_fisik_bal: number;
  total_selisih_bal: number;
  total_berat_sistem_kg: number;
  total_berat_fisik_kg: number;
  status: 'draft' | 'proses' | 'selesai';
  catatan?: string;
  items_detail: StockOpnameItemDetail[];
}

export interface ERPBackupPackage {
  app_name: string;
  version: string;
  exported_at: string;
  device_info?: any;
  data: {
    petani: Petani[];
    barang: Barang[];
    harga: TabelHarga[];
    transaksi: TransaksiPembelian[];
    sample: PengirimanSample[];
    pengiriman: PengirimanBarang[];
    gudang: Gudang[];
    users?: User[];
    master_barang?: MasterBarang[];
    stock_opname?: any[];
  };
  meta: {
    total_petani: number;
    total_barang: number;
    total_harga: number;
    total_transaksi: number;
    total_sample: number;
    total_pengiriman: number;
    total_gudang: number;
    total_users?: number;
    total_master_barang?: number;
    total_stock_opname?: number;
  };
}

export interface BackupSnapshotInfo {
  id: string;
  timestamp: string;
  reason: string;
  total_records: number;
  dataPackage: ERPBackupPackage;
}

export interface ModuleNav {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  prdStatus: 'active' | 'next' | 'planned';
  icon: string;
  description: string;
}
