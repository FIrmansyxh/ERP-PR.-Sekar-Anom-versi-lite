import React from 'react';
import { 
  Users, 
  BarChart3, 
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { Petani, Barang, TransaksiPembelian, PengirimanSample, PengirimanBarang, User } from '../../types';
import { hasModuleAccess, getRoleInfo } from '../../utils/rbac';

interface HomeDashboardViewProps {
  onNavigate: (moduleId: string) => void;
  petaniList: Petani[];
  barangList: Barang[];
  transaksiList: TransaksiPembelian[];
  sampleList: PengirimanSample[];
  pengirimanList: PengirimanBarang[];
  currentUser?: User | null;
  userCount?: number;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onNavigate,
  petaniList,
  barangList,
  transaksiList,
  sampleList,
  pengirimanList,
  currentUser,
  userCount = 0,
}) => {
  const currentRole = currentUser?.role || 'superadmin';
  const roleInfo = currentUser ? getRoleInfo(currentUser.role) : null;

  const allMenus = [
    { no: 1, nama: 'Home', judul: 'Dasbor Menu Utama & Status Sistem', modId: 'modul-home' },
    { no: 2, nama: 'Dashboard Laporan & Analytic ERP', judul: 'Executive Summary, Distribusi Grade & Pusat Unduh Dokumen (PRD Bab 9)', modId: 'modul-6-dashboard-analytic' },
    { no: 3, nama: 'Laporan Pembelian Barang', judul: 'Rekapitulasi Pembelian Multi-Parameter, Potongan Kuli & Tikar (PRD Bab 8)', modId: 'modul-6-laporan-pembelian' },
    { no: 4, nama: 'Laporan Okupansi & Stok Gudang', judul: 'Monitoring Kapasitas, Okupansi Bal & Inventaris Tembakau Per Gudang', modId: 'modul-6-laporan-gudang' },
    { no: 5, nama: 'Master Petani', judul: 'Data Petani Tembakau & Kartu Scan Setoran (PRD 4.1)', modId: 'modul-1-petani' },
    { no: 6, nama: 'Master Kualitas & Harga', judul: 'Tarif Acuan Grade A-F & Ketentuan Kualitas (PRD 4.2)', modId: 'modul-3-harga' },
    { no: 7, nama: 'Master Data Gudang', judul: 'Lokasi Simpan, Blok & Kapasitas Pergudangan (PRD 4.3)', modId: 'modul-7-gudang' },
    { no: 8, nama: 'Inventaris Bal Gudang', judul: 'Stok Fisik Bal & Lokasi Simpan (PRD 5.6)', modId: 'modul-2-barang' },
    { no: 9, nama: 'Transaksi Pembelian Timbang', judul: 'Kupon Antrian, Timbang Bruto/Netto, Potongan Kuli Rp 7.000 (PRD Bab 5)', modId: 'modul-0-transaksi' },
    { no: 10, nama: 'Pengiriman Reguler (DO Luar)', judul: 'Surat Jalan Pengiriman Bal ke Buyer Pabrik Rokok (PRD 6.1)', modId: 'modul-5-pengiriman' },
    { no: 11, nama: 'Pengiriman Sample QC', judul: 'Uji Laboratorium Mutu & Approval Grade Sample (PRD 6.2)', modId: 'modul-4-sample' },
    { no: 12, nama: 'Manajemen Pengguna (RBAC)', judul: 'Otorisasi Staf & Hak Akses 5 Role Kerja (PRD Bab 3)', modId: 'modul-users' },
  ];

  // Filter menu list based on RBAC permissions
  const menuList = allMenus.filter((item) => {
    if (item.modId) {
      return hasModuleAccess(currentRole, item.modId);
    }
    return true;
  });

  return (
    <div className="space-y-3.5 font-sans text-gray-800">
      
      {/* Welcome Banner with RBAC identity */}
      {currentUser && (
        <div className="bg-white border border-gray-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
              {currentUser.nama_lengkap.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">
                  Selamat Datang, {currentUser.nama_lengkap}
                </span>
                {roleInfo && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.badgeBorder}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Unit Penugasan: <strong className="text-gray-700">{currentUser.unit_penugasan}</strong> • Akun: <code className="text-gray-600">@{currentUser.username}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {hasModuleAccess(currentRole, 'modul-users') && (
              <button
                onClick={() => onNavigate('modul-users')}
                className="px-3 py-1.5 bg-red-50 text-[#b81d24] border border-red-200 hover:bg-red-100 font-bold rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kelola {userCount || 5} Pengguna (RBAC)</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Menu Directory Table Card */}
      <div className="bg-white border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 tracking-tight">
            Menu Akses Anda ({roleInfo?.label})
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Sistem Data Gudang Tembakau - PR. SEKAR ANOM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-gray-200 text-xs font-bold text-gray-700">
                <th className="py-2.5 px-4 border-r border-gray-200 w-16 text-center">Nomor</th>
                <th className="py-2.5 px-4 border-r border-gray-200 w-64">Nama Modul</th>
                <th className="py-2.5 px-4 border-r border-gray-200">Keterangan & Cakupan Fungsi</th>
                <th className="py-2.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {menuList.map((item, idx) => (
                <tr 
                  key={item.no}
                  onClick={() => onNavigate(item.modId)}
                  className="hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 border-r border-gray-200 text-center font-mono text-gray-600">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 border-r border-gray-200 font-medium text-gray-900 flex items-center space-x-1.5">
                    {item.modId === 'modul-6-dashboard-analytic' ? (
                      <BarChart3 className="w-3.5 h-3.5 text-[#b81d24] shrink-0" />
                    ) : item.modId === 'modul-6-laporan-pembelian' ? (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    ) : item.modId === 'modul-users' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#b81d24] shrink-0" />
                    ) : null}
                    <span>{item.nama}</span>
                  </td>
                  <td className="py-2.5 px-4 border-r border-gray-200 text-gray-600">
                    {item.judul}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(item.modId);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#b81d24] hover:bg-red-50 rounded-xs flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                    >
                      <span>Buka</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#f8f9fa] border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>Menampilkan {menuList.length} modul aktif sesuai wewenang peran {roleInfo?.label}</span>
          <span className="font-semibold text-gray-700">PR. SEKAR ANOM</span>
        </div>
      </div>

    </div>
  );
};
