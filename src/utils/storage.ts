import { 
  Petani, 
  Barang, 
  MasterBarang,
  StockOpnameSession,
  TabelHarga, 
  TransaksiPembelian, 
  PengirimanSample, 
  PengirimanBarang,
  Gudang,
  User,
  ERPBackupPackage,
  BackupSnapshotInfo 
} from '../types';

import { INITIAL_PETANI_DATA } from '../data/initialPetaniData';
import { INITIAL_BARANG_DATA } from '../data/initialBarangData';
import { INITIAL_MASTER_BARANG_DATA } from '../data/initialMasterBarangData';
import { INITIAL_HARGA_DATA } from '../data/initialHargaData';
import { INITIAL_TRANSAKSI_DATA } from '../data/initialTransaksiData';
import { INITIAL_SAMPLE_DATA } from '../data/initialSampleData';
import { INITIAL_PENGIRIMAN_DATA } from '../data/initialPengirimanData';
import { INITIAL_GUDANG_DATA } from '../data/initialGudangData';
import { INITIAL_USER_DATA } from '../data/initialUserData';

const KEY_PETANI = 'erp_tembakau_petani_v5';
const KEY_BARANG = 'erp_tembakau_barang_v5';
const KEY_MASTER_BARANG = 'erp_tembakau_master_barang_v5';
const KEY_STOCK_OPNAME = 'erp_tembakau_stock_opname_v5';
const KEY_HARGA = 'erp_tembakau_harga_v5';
const KEY_TRANSAKSI = 'erp_tembakau_transaksi_v5';
const KEY_SAMPLE = 'erp_tembakau_sample_v5';
const KEY_PENGIRIMAN = 'erp_tembakau_pengiriman_v5';
const KEY_GUDANG = 'erp_tembakau_gudang_v5';
const KEY_USERS = 'erp_tembakau_users_v5';
const KEY_CURRENT_USER = 'erp_tembakau_current_user_v5';

// Clean up old version demo caches
(function purgeLegacyDemoCaches() {
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('erp_tembakau_') && !k.endsWith('_v5') && !k.endsWith('_date') && !k.endsWith('_snapshots_v1'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    // Ignore in non-browser env
  }
})();

// --- USER MANAGEMENT & AUTH (RBAC) ---
export function loadUserData(): User[] {
  try {
    const saved = localStorage.getItem(KEY_USERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load user data:', err);
  }
  saveUserData(INITIAL_USER_DATA);
  return INITIAL_USER_DATA;
}

export function saveUserData(data: User[]): void {
  try {
    localStorage.setItem(KEY_USERS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save user data:', err);
  }
}

export function loadCurrentUser(): User | null {
  try {
    const saved = localStorage.getItem(KEY_CURRENT_USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.user_id) {
        // Verify user still exists and is active in latest user list
        const allUsers = loadUserData();
        const found = allUsers.find((u) => u.user_id === parsed.user_id && u.status_aktif);
        if (found) return found;
      }
    }
  } catch (err) {
    console.error('Failed to load current user:', err);
  }
  // Default to null so user lands on Login screen
  return null;
}

export function saveCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEY_CURRENT_USER);
    }
  } catch (err) {
    console.error('Failed to save current user:', err);
  }
}

export function authenticateUser(usernameInput: string, passwordInput: string): { success: boolean; user?: User; message: string } {
  const users = loadUserData();
  const cleanUsername = usernameInput.trim().toLowerCase();
  const found = users.find(
    (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
  );

  if (!found) {
    return { success: false, message: 'Username atau email tidak terdaftar dalam sistem.' };
  }

  if (!found.status_aktif) {
    return { success: false, message: 'Akun ini telah dinonaktifkan oleh Administrator. Hubungi IT Gudang.' };
  }

  // Check password
  if (found.password && found.password !== passwordInput) {
    return { success: false, message: 'Kata sandi (password) yang Anda masukkan salah.' };
  }

  // Update last login
  const nowIso = new Date().toISOString();
  const updatedUsers = users.map((u) => u.user_id === found.user_id ? { ...u, terakhir_login: nowIso } : u);
  saveUserData(updatedUsers);

  const updatedCurrent = { ...found, terakhir_login: nowIso };
  saveCurrentUser(updatedCurrent);

  return { success: true, user: updatedCurrent, message: 'Login berhasil.' };
}


// --- MASTER BARANG ---
export function loadMasterBarangData(): MasterBarang[] {
  try {
    const saved = localStorage.getItem(KEY_MASTER_BARANG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load master barang data:', err);
  }
  saveMasterBarangData(INITIAL_MASTER_BARANG_DATA);
  return INITIAL_MASTER_BARANG_DATA;
}

export function saveMasterBarangData(data: MasterBarang[]): void {
  try {
    localStorage.setItem(KEY_MASTER_BARANG, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save master barang data:', err);
  }
}

// --- STOCK OPNAME SESSIONS ---
export function loadStockOpnameData(): StockOpnameSession[] {
  try {
    const saved = localStorage.getItem(KEY_STOCK_OPNAME);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load stock opname data:', err);
  }
  return [];
}

export function saveStockOpnameData(data: StockOpnameSession[]): void {
  try {
    localStorage.setItem(KEY_STOCK_OPNAME, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save stock opname data:', err);
  }
}

// --- PETANI ---
export function loadPetaniData(): Petani[] {
  try {
    const saved = localStorage.getItem(KEY_PETANI);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load petani data:', err);
  }
  savePetaniData(INITIAL_PETANI_DATA);
  return INITIAL_PETANI_DATA;
}

export function savePetaniData(data: Petani[]): void {
  try {
    localStorage.setItem(KEY_PETANI, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save petani data:', err);
  }
}

// IDs to be purged permanently per user request
const PURGED_TX_IDS = ['OJ/2026/VIII/0263', 'OJ/2026/VIII/0293'];
const PURGED_BAL_PREFIXES = ['A-250826-2630', 'A-250826-2930', 'A-250826-2931', 'A-250826-2932'];

// --- BARANG ---
export function loadBarangData(): Barang[] {
  try {
    const saved = localStorage.getItem(KEY_BARANG);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Clean out items associated with deleted transactions
        const cleaned = parsed.filter((b) => {
          if (!b) return false;
          if (b.transaksi_id && PURGED_TX_IDS.includes(b.transaksi_id)) return false;
          if (b.barang_id && PURGED_BAL_PREFIXES.some((p) => b.barang_id.includes(p))) return false;
          return true;
        });
        if (cleaned.length !== parsed.length) {
          saveBarangData(cleaned);
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed to load barang data:', err);
  }
  saveBarangData(INITIAL_BARANG_DATA);
  return INITIAL_BARANG_DATA;
}

export function saveBarangData(data: Barang[]): void {
  try {
    localStorage.setItem(KEY_BARANG, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save barang data:', err);
  }
}

// --- TABEL HARGA ---
export function loadHargaData(): TabelHarga[] {
  try {
    const saved = localStorage.getItem(KEY_HARGA);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load harga data:', err);
  }
  saveHargaData(INITIAL_HARGA_DATA);
  return INITIAL_HARGA_DATA;
}

export function saveHargaData(data: TabelHarga[]): void {
  try {
    localStorage.setItem(KEY_HARGA, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save harga data:', err);
  }
}

// --- TRANSAKSI PEMBELIAN ---
export function loadTransaksiData(): TransaksiPembelian[] {
  try {
    const saved = localStorage.getItem(KEY_TRANSAKSI);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Clean out transactions requested to be deleted
        const cleaned = parsed.filter((t) => {
          if (!t) return false;
          if (t.transaksi_id && PURGED_TX_IDS.includes(t.transaksi_id)) return false;
          return true;
        });
        if (cleaned.length !== parsed.length) {
          saveTransaksiData(cleaned);
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed to load transaksi data:', err);
  }
  saveTransaksiData(INITIAL_TRANSAKSI_DATA);
  return INITIAL_TRANSAKSI_DATA;
}

export function saveTransaksiData(data: TransaksiPembelian[]): void {
  try {
    localStorage.setItem(KEY_TRANSAKSI, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save transaksi data:', err);
  }
}

// --- PENGIRIMAN SAMPLE ---
export function loadSampleData(): PengirimanSample[] {
  try {
    const saved = localStorage.getItem(KEY_SAMPLE);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load sample data:', err);
  }
  saveSampleData(INITIAL_SAMPLE_DATA);
  return INITIAL_SAMPLE_DATA;
}

export function saveSampleData(data: PengirimanSample[]): void {
  try {
    localStorage.setItem(KEY_SAMPLE, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save sample data:', err);
  }
}

// --- PENGIRIMAN BARANG ---
export function loadPengirimanData(): PengirimanBarang[] {
  try {
    const saved = localStorage.getItem(KEY_PENGIRIMAN);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load pengiriman data:', err);
  }
  savePengirimanData(INITIAL_PENGIRIMAN_DATA);
  return INITIAL_PENGIRIMAN_DATA;
}

export function savePengirimanData(data: PengirimanBarang[]): void {
  try {
    localStorage.setItem(KEY_PENGIRIMAN, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save pengiriman data:', err);
  }
}

// --- MASTER GUDANG ---
export function loadGudangData(): Gudang[] {
  try {
    const saved = localStorage.getItem(KEY_GUDANG);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load gudang data:', err);
  }
  saveGudangData(INITIAL_GUDANG_DATA);
  return INITIAL_GUDANG_DATA;
}

export function saveGudangData(data: Gudang[]): void {
  try {
    localStorage.setItem(KEY_GUDANG, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save gudang data:', err);
  }
}

// --- DESKTOP BACKUP & DISASTER RECOVERY ENGINE ---
const KEY_LAST_BACKUP = 'erp_tembakau_last_backup_date';
const KEY_AUTO_SNAPSHOTS = 'erp_tembakau_auto_snapshots_v1';

export function getLastBackupTimestamp(): string | null {
  return localStorage.getItem(KEY_LAST_BACKUP);
}

export function setLastBackupTimestamp(isoString: string): void {
  localStorage.setItem(KEY_LAST_BACKUP, isoString);
}

export function generateERPBackupPackage(): ERPBackupPackage {
  const petani = loadPetaniData();
  const barang = loadBarangData();
  const masterBarang = loadMasterBarangData();
  const stockOpname = loadStockOpnameData();
  const harga = loadHargaData();
  const transaksi = loadTransaksiData();
  const sample = loadSampleData();
  const pengiriman = loadPengirimanData();
  const gudang = loadGudangData();
  const users = loadUserData();

  return {
    app_name: 'Prajekta ERP Gudang Tembakau Desktop',
    version: '2.4.0-standalone',
    exported_at: new Date().toISOString(),
    device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop-Client',
    data: {
      petani,
      barang,
      master_barang: masterBarang,
      stock_opname: stockOpname,
      harga,
      transaksi,
      sample,
      pengiriman,
      gudang,
      users,
    },
    meta: {
      total_petani: petani.length,
      total_barang: barang.length,
      total_master_barang: masterBarang.length,
      total_stock_opname: stockOpname.length,
      total_harga: harga.length,
      total_transaksi: transaksi.length,
      total_sample: sample.length,
      total_pengiriman: pengiriman.length,
      total_gudang: gudang.length,
      total_users: users.length,
    },
  };
}

export function downloadERPBackupFile(): { filename: string; timestamp: string } {
  const backupPkg = generateERPBackupPackage();
  const jsonStr = JSON.stringify(backupPkg, null, 2);
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const filename = `BACKUP_GUDANG_TEMBAKAU_${yyyy}${mm}${dd}_${hh}${min}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const timestamp = now.toISOString();
  setLastBackupTimestamp(timestamp);
  recordAutoSnapshot('Manual 1-Klik Unduh Cadangan');

  return { filename, timestamp };
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: ERPBackupPackage['data'];
  summary?: {
    totalPetani: number;
    totalBarang: number;
    totalHarga: number;
    totalTransaksi: number;
    totalSample: number;
    totalPengiriman: number;
    totalGudang: number;
  };
}

export function validateERPDataSchema(raw: any): SchemaValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      errors: ['Format berkas tidak valid: Berkas bukan format JSON yang benar atau kosong.'],
    };
  }

  // Handle case where raw is full ERPBackupPackage or raw.data
  const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Format berkas tidak valid: Objek data utama tidak ditemukan di dalam berkas cadangan.'],
    };
  }

  // Validate Petani (Mandatory table)
  if (!Array.isArray(data.petani)) {
    errors.push("Tabel 'petani' tidak ditemukan atau bukan daftar data array yang valid.");
  } else {
    data.petani.forEach((p: any, idx: number) => {
      if (idx > 50) return; // Limit check to first 50 items for speed
      if (!p || typeof p !== 'object') {
        errors.push(`Master Petani (baris #${idx + 1}): Struktur entri data rusak.`);
      } else if (!p.petani_id || typeof p.petani_id !== 'string') {
        errors.push(`Master Petani (baris #${idx + 1}): Kolom 'petani_id' wajib diisi.`);
      } else if (!p.nomor_kartu || typeof p.nomor_kartu !== 'string') {
        errors.push(`Master Petani (baris #${idx + 1}): Kolom 'nomor_kartu' wajib diisi.`);
      } else if (!p.nama_petani || typeof p.nama_petani !== 'string') {
        errors.push(`Master Petani (baris #${idx + 1}): Kolom 'nama_petani' wajib diisi.`);
      }
    });
  }

  // Validate Barang
  if (data.barang !== undefined) {
    if (!Array.isArray(data.barang)) {
      errors.push("Tabel 'barang' stok gudang bukan berupa daftar data yang valid.");
    } else {
      data.barang.forEach((b: any, idx: number) => {
        if (idx > 50) return;
        if (!b || typeof b !== 'object') {
          errors.push(`Stok Barang (bal #${idx + 1}): Struktur entri rusak.`);
        } else if (!b.barang_id || !b.no_bal) {
          errors.push(`Stok Barang (bal #${idx + 1}): Field 'barang_id' atau 'no_bal' tidak ditemukan.`);
        }
      });
    }
  }

  // Validate Harga
  if (data.harga !== undefined) {
    if (!Array.isArray(data.harga)) {
      errors.push("Tabel 'harga' bukan berupa daftar data yang valid.");
    } else {
      data.harga.forEach((h: any, idx: number) => {
        if (idx > 20) return;
        if (!h || typeof h !== 'object' || !h.harga_id || !h.kode_grade) {
          errors.push(`Tabel Tarif Harga (baris #${idx + 1}): Format data harga tidak valid.`);
        }
      });
    }
  }

  // Validate Transaksi
  if (data.transaksi !== undefined) {
    if (!Array.isArray(data.transaksi)) {
      errors.push("Tabel 'transaksi' bukan berupa daftar data yang valid.");
    } else {
      data.transaksi.forEach((t: any, idx: number) => {
        if (idx > 50) return;
        if (!t || typeof t !== 'object' || !t.transaksi_id) {
          errors.push(`Transaksi Pembelian (baris #${idx + 1}): Data ID transaksi tidak valid.`);
        }
      });
    }
  }

  // Validate Sample
  if (data.sample !== undefined && !Array.isArray(data.sample)) {
    errors.push("Tabel 'sample' QC bukan array data yang valid.");
  }

  // Validate Pengiriman
  if (data.pengiriman !== undefined && !Array.isArray(data.pengiriman)) {
    errors.push("Tabel 'pengiriman' DO bukan array data yang valid.");
  }

  // Validate Gudang
  if (data.gudang !== undefined && !Array.isArray(data.gudang)) {
    errors.push("Tabel 'gudang' bukan array data yang valid.");
  }

  // Validate Users
  if (data.users !== undefined && !Array.isArray(data.users)) {
    errors.push("Tabel 'users' bukan array data yang valid.");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  const sanitized: ERPBackupPackage['data'] = {
    petani: Array.isArray(data.petani) ? data.petani : [],
    barang: Array.isArray(data.barang) ? data.barang : [],
    master_barang: Array.isArray(data.master_barang) ? data.master_barang : INITIAL_MASTER_BARANG_DATA,
    stock_opname: Array.isArray(data.stock_opname) ? data.stock_opname : [],
    harga: Array.isArray(data.harga) ? data.harga : [],
    transaksi: Array.isArray(data.transaksi) ? data.transaksi : [],
    sample: Array.isArray(data.sample) ? data.sample : [],
    pengiriman: Array.isArray(data.pengiriman) ? data.pengiriman : [],
    gudang: Array.isArray(data.gudang) ? data.gudang : [],
    users: Array.isArray(data.users) && data.users.length > 0 ? data.users : INITIAL_USER_DATA,
  };

  return {
    isValid: true,
    errors: [],
    sanitizedData: sanitized,
    summary: {
      totalPetani: sanitized.petani.length,
      totalBarang: sanitized.barang.length,
      totalHarga: sanitized.harga.length,
      totalTransaksi: sanitized.transaksi.length,
      totalSample: sanitized.sample.length,
      totalPengiriman: sanitized.pengiriman.length,
      totalGudang: sanitized.gudang.length,
    },
  };
}

export function restoreERPFromPackage(backup: ERPBackupPackage): {
  success: boolean;
  message: string;
  data?: ERPBackupPackage['data'];
  errors?: string[];
} {
  try {
    const validation = validateERPDataSchema(backup);
    if (!validation.isValid || !validation.sanitizedData) {
      return {
        success: false,
        message: validation.errors[0] || 'Format skema berkas cadangan rusak atau tidak sesuai standar.',
        errors: validation.errors,
      };
    }

    const { petani, barang, master_barang, stock_opname, harga, transaksi, sample, pengiriman, gudang, users } = validation.sanitizedData;

    savePetaniData(petani);
    saveBarangData(barang);
    if (master_barang) saveMasterBarangData(master_barang);
    if (stock_opname) saveStockOpnameData(stock_opname);
    saveHargaData(harga);
    saveTransaksiData(transaksi);
    saveSampleData(sample);
    savePengirimanData(pengiriman);
    saveGudangData(gudang);
    if (users && users.length > 0) saveUserData(users);

    const nowIso = new Date().toISOString();
    setLastBackupTimestamp(nowIso);
    recordAutoSnapshot(`Dipulihkan dari File Backup (${backup.exported_at ? backup.exported_at.split('T')[0] : 'Eksternal'})`);

    return {
      success: true,
      message: `Berhasil memulihkan ${petani.length} Petani, ${barang.length} Bal Stok, dan ${transaksi.length} Transaksi.`,
      data: {
        petani: loadPetaniData(),
        barang: loadBarangData(),
        master_barang: loadMasterBarangData(),
        stock_opname: loadStockOpnameData(),
        harga: loadHargaData(),
        transaksi: loadTransaksiData(),
        sample: loadSampleData(),
        pengiriman: loadPengirimanData(),
        gudang: loadGudangData(),
        users: loadUserData(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal memulihkan database: ${err?.message || 'Format berkas rusak'}`,
      errors: [err?.message || 'Kesalahan parsing internal'],
    };
  }
}

export function loadAutoSnapshots(): BackupSnapshotInfo[] {
  try {
    const raw = localStorage.getItem(KEY_AUTO_SNAPSHOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load snapshots:', e);
  }
  return [];
}

export function recordAutoSnapshot(reason: string = 'Auto Snapshot Sistem'): void {
  try {
    const snapshots = loadAutoSnapshots();
    const pkg = generateERPBackupPackage();
    const totalRecords =
      pkg.meta.total_petani +
      pkg.meta.total_barang +
      pkg.meta.total_transaksi +
      pkg.meta.total_pengiriman;

    const newSnapshot: BackupSnapshotInfo = {
      id: `SNP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason,
      total_records: totalRecords,
      dataPackage: pkg,
    };

    // Keep max 5 recent snapshots to prevent LocalStorage quota overflow
    const updated = [newSnapshot, ...snapshots.slice(0, 4)];
    localStorage.setItem(KEY_AUTO_SNAPSHOTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Snapshot storage limit warning:', e);
  }
}

// --- RESET ALL ---
export function resetToDemoData(): Petani[] {
  resetAllERPData();
  return INITIAL_PETANI_DATA;
}

export function resetAllERPData() {
  savePetaniData(INITIAL_PETANI_DATA);
  saveBarangData(INITIAL_BARANG_DATA);
  saveMasterBarangData(INITIAL_MASTER_BARANG_DATA);
  saveStockOpnameData([]);
  saveHargaData(INITIAL_HARGA_DATA);
  saveTransaksiData(INITIAL_TRANSAKSI_DATA);
  saveSampleData(INITIAL_SAMPLE_DATA);
  savePengirimanData(INITIAL_PENGIRIMAN_DATA);
  saveGudangData(INITIAL_GUDANG_DATA);
  saveUserData(INITIAL_USER_DATA);
  recordAutoSnapshot('Reset ke Dataset Demo Bawaan');
  return {
    petani: INITIAL_PETANI_DATA,
    barang: INITIAL_BARANG_DATA,
    master_barang: INITIAL_MASTER_BARANG_DATA,
    stock_opname: [],
    harga: INITIAL_HARGA_DATA,
    transaksi: INITIAL_TRANSAKSI_DATA,
    sample: INITIAL_SAMPLE_DATA,
    pengiriman: INITIAL_PENGIRIMAN_DATA,
    gudang: INITIAL_GUDANG_DATA,
    users: INITIAL_USER_DATA,
  };
}
