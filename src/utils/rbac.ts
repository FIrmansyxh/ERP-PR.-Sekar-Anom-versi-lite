import { UserRole, RolePermissionInfo } from '../types';

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissionInfo> = {
  superadmin: {
    role: 'superadmin',
    label: 'Super Admin',
    deskripsi: 'Akses penuh ke seluruh sistem: User management, master data, semua transaksi, laporan & dashboard analitik, konfigurasi sistem.',
    badgeBg: 'bg-red-50',
    badgeText: 'text-[#b81d24]',
    badgeBorder: 'border-red-300',
    allowedModules: [
      'modul-home',
      'modul-6-dashboard-analytic',
      'modul-6-laporan-pembelian',
      'modul-1-petani',
      'modul-3-harga',
      'modul-7-gudang',
      'modul-2-barang',
      'modul-0-transaksi',
      'modul-5-pengiriman',
      'modul-4-sample',
      'modul-users',
    ],
    capabilities: {
      canManageUsers: true,
      canManageMasterData: true,
      canCreatePetani: true,
      canInputTransaksi: true,
      canManageStok: true,
      canManageQC: true,
      canManagePengiriman: true,
      canViewAnalytics: true,
    },
  },
  kepala_gudang: {
    role: 'kepala_gudang',
    label: 'Kepala Gudang',
    deskripsi: 'Pimpinan operasional: Approve/monitor transaksi timbang, kelola master data kualitas, harga & lokasi gudang, lihat semua laporan & dashboard analitik.',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    allowedModules: [
      'modul-home',
      'modul-6-dashboard-analytic',
      'modul-6-laporan-pembelian',
      'modul-1-petani',
      'modul-3-harga',
      'modul-7-gudang',
      'modul-2-barang',
      'modul-0-transaksi',
      'modul-5-pengiriman',
      'modul-4-sample',
      'modul-users', // View only in User Management
    ],
    capabilities: {
      canManageUsers: false,
      canManageMasterData: true,
      canCreatePetani: true,
      canInputTransaksi: true,
      canManageStok: true,
      canManageQC: true,
      canManagePengiriman: true,
      canViewAnalytics: true,
    },
  },
  operator_loket: {
    role: 'operator_loket',
    label: 'Operator Loket Timbang',
    deskripsi: 'Petugas loket timbang: Input data petani, cetak kupon antrian, input berat bruto/netto, input kualitas, pilih lokasi simpan, input no. bal, lihat laporan pembelian.',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    allowedModules: [
      'modul-home',
      'modul-0-transaksi',
      'modul-6-laporan-pembelian',
      'modul-1-petani',
      'modul-3-harga',
      'modul-7-gudang',
    ],
    capabilities: {
      canManageUsers: false,
      canManageMasterData: false, // Create/View petani, view harga & gudang
      canCreatePetani: true,
      canInputTransaksi: true,
      canManageStok: false,
      canManageQC: false,
      canManagePengiriman: false,
      canViewAnalytics: false,
    },
  },
  logistik_pengiriman: {
    role: 'logistik_pengiriman',
    label: 'Logistik & Pengiriman',
    deskripsi: 'Petugas pengiriman barang: Buat form pengiriman reguler & sample, pilih bal yang dikirim (lihat lokasi asal bal), cetak surat jalan.',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    allowedModules: [
      'modul-home',
      'modul-5-pengiriman',
      'modul-4-sample',
      'modul-2-barang',
      'modul-1-petani',
      'modul-3-harga',
      'modul-7-gudang',
    ],
    capabilities: {
      canManageUsers: false,
      canManageMasterData: false,
      canCreatePetani: false,
      canInputTransaksi: false,
      canManageStok: false,
      canManageQC: false,
      canManagePengiriman: true,
      canViewAnalytics: false,
    },
  },
  qc_mutu: {
    role: 'qc_mutu',
    label: 'QC & Mutu',
    deskripsi: 'Penilai kualitas tembakau: Input/validasi grade kualitas pada saat timbang, lihat histori grading, lihat laporan QC sample & dashboard analitik QC.',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    allowedModules: [
      'modul-home',
      'modul-4-sample',
      'modul-0-transaksi',
      'modul-6-dashboard-analytic',
      'modul-1-petani',
      'modul-3-harga',
      'modul-7-gudang',
      'modul-2-barang',
    ],
    capabilities: {
      canManageUsers: false,
      canManageMasterData: false,
      canCreatePetani: false,
      canInputTransaksi: false,
      canManageStok: false,
      canManageQC: true,
      canManagePengiriman: false,
      canViewAnalytics: true, // Limited to QC in dashboard
    },
  },
};

export function getRoleInfo(role?: UserRole | string): RolePermissionInfo {
  if (!role) return ROLE_DEFINITIONS.superadmin;
  return ROLE_DEFINITIONS[role as UserRole] || ROLE_DEFINITIONS.kepala_gudang;
}

export function hasModuleAccess(role?: UserRole | string, moduleId?: string): boolean {
  if (!moduleId) return false;
  const roleInfo = getRoleInfo(role);
  if (!roleInfo) return false;
  return roleInfo.allowedModules.includes(moduleId);
}

export function canUserPerform(
  role?: UserRole | string,
  capability?: keyof RolePermissionInfo['capabilities']
): boolean {
  if (!capability) return false;
  const roleInfo = getRoleInfo(role);
  return Boolean(roleInfo?.capabilities[capability]);
}

export const ALL_ROLES: UserRole[] = [
  'superadmin',
  'kepala_gudang',
  'operator_loket',
  'logistik_pengiriman',
  'qc_mutu',
];

