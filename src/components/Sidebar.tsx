import React, { useState } from 'react';
import { 
  Home, 
  Database, 
  Tag, 
  ShoppingCart, 
  Package, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  FlaskConical, 
  Truck, 
  BarChart3, 
  Scale,
  Warehouse,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole } from '../types';
import { hasModuleAccess } from '../utils/rbac';

interface SidebarProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  petaniCount: number;
  barangCount?: number;
  transaksiCount?: number;
  sampleCount?: number;
  pengirimanCount?: number;
  gudangCount?: number;
  userCount?: number;
  isCollapsed?: boolean;
  userRole?: UserRole;
}

export const MODULES_CONFIG = [
  {
    id: 'modul-home',
    title: 'Home',
    subtitle: 'Dasbor Menu Utama',
    icon: 'Home',
    moduleKey: 'home',
  },
  {
    id: 'modul-6-dashboard-analytic',
    title: 'Dashboard Laporan & Analytic ERP',
    subtitle: 'Executive Summary & Audit',
    icon: 'BarChart3',
    moduleKey: 'dashboard-analytic',
  },
  {
    id: 'modul-6-laporan-pembelian',
    title: 'Laporan Pembelian Barang',
    subtitle: 'Filter Dinamis & Cetak Rekap',
    icon: 'FileSpreadsheet',
    moduleKey: 'laporan-pembelian',
  },
  {
    id: 'modul-6-laporan-gudang',
    title: 'Laporan Okupansi & Stok Gudang',
    subtitle: 'Kapasitas & Inventaris Tembakau',
    icon: 'Warehouse',
    moduleKey: 'laporan-gudang',
  },
  {
    id: 'modul-1-petani',
    title: 'Master Petani',
    subtitle: 'Registrasi & Kartu Petani',
    icon: 'Users',
    moduleKey: 'petani',
  },
  {
    id: 'modul-3-harga',
    title: 'Master Kualitas & Harga',
    subtitle: 'Tarif Acuan Grade A-F',
    icon: 'Tag',
    moduleKey: 'harga',
  },
  {
    id: 'modul-7-gudang',
    title: 'Master Data Gudang',
    subtitle: 'Lokasi Simpan & Kapasitas',
    icon: 'Warehouse',
    moduleKey: 'gudang',
  },
  {
    id: 'modul-2-barang',
    title: 'Inventaris Bal Gudang',
    subtitle: 'Stok Fisik & Label Thermal',
    icon: 'Package',
    moduleKey: 'barang',
  },
  {
    id: 'modul-0-transaksi',
    title: 'Transaksi Pembelian',
    subtitle: 'Timbang Bal & Kupon',
    icon: 'Scale',
    moduleKey: 'transaksi',
  },
  {
    id: 'modul-5-pengiriman',
    title: 'Pengiriman Reguler (DO)',
    subtitle: 'Surat Jalan ke Pabrik',
    icon: 'Truck',
    moduleKey: 'pengiriman',
  },
  {
    id: 'modul-4-sample',
    title: 'Pengiriman Sample QC',
    subtitle: 'Uji Mutu Laboratorium',
    icon: 'FlaskConical',
    moduleKey: 'sample',
  },
  {
    id: 'modul-users',
    title: 'Manajemen Pengguna',
    subtitle: 'Hak Akses & Otorisasi RBAC',
    icon: 'UserCheck',
    moduleKey: 'users',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModuleId,
  onSelectModule,
  petaniCount = 0,
  barangCount = 0,
  transaksiCount = 0,
  sampleCount = 0,
  pengirimanCount = 0,
  gudangCount = 0,
  userCount = 0,
  isCollapsed = false,
  userRole = 'superadmin',
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    'report': true,
    'master-data': true,
    'pembelian': true,
    'pengiriman': true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const checkAccess = (modId: string) => hasModuleAccess(userRole, modId);

  const canSeeReport = checkAccess('modul-6-dashboard-analytic') || checkAccess('modul-6-laporan-pembelian') || checkAccess('modul-6-laporan-gudang');
  const canSeeMaster = checkAccess('modul-1-petani') || checkAccess('modul-3-harga') || checkAccess('modul-7-gudang') || checkAccess('modul-2-barang');
  const canSeePembelian = checkAccess('modul-0-transaksi');
  const canSeePengiriman = checkAccess('modul-5-pengiriman') || checkAccess('modul-4-sample');
  const canSeeUsers = checkAccess('modul-users');

  const isReportActive = activeModuleId === 'modul-6-dashboard-analytic' || activeModuleId === 'modul-6-laporan-pembelian' || activeModuleId === 'modul-6-laporan-gudang';
  const isMasterActive = ['modul-1-petani', 'modul-3-harga', 'modul-7-gudang', 'modul-2-barang'].includes(activeModuleId);
  const isPembelianActive = activeModuleId === 'modul-0-transaksi';
  const isPengirimanActive = ['modul-5-pengiriman', 'modul-4-sample'].includes(activeModuleId);
  const isUsersActive = activeModuleId === 'modul-users';
  const isHomeActive = activeModuleId === 'modul-home';

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-60 sm:w-64'} bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none transition-all duration-200`}>
      
      {/* Top Logo Brand */}
      <div className="h-16 border-b border-gray-200 flex items-center px-4 space-x-3 bg-white">
        <div className="w-8 h-8 rounded-sm bg-[#b81d24] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 tracking-wider">
          <span>SA</span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold tracking-tight text-gray-900 leading-tight">
              PR. SEKAR ANOM
            </h2>
            <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
              Sistem Data Gudang Tembakau
            </p>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        
        {/* 1. Home */}
        {checkAccess('modul-home') && (
          <button
            onClick={() => onSelectModule('modul-home')}
            className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
              isHomeActive
                ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Home className={`w-4 h-4 shrink-0 ${isHomeActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
              {!isCollapsed && <span>Home</span>}
            </div>
          </button>
        )}

        {/* 2. Report & Analitik */}
        {canSeeReport && (
          <div className="space-y-0.5">
            <button
              onClick={() => toggleSection('report')}
              className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
                isReportActive
                  ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <BarChart3 className={`w-4 h-4 shrink-0 ${isReportActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
                {!isCollapsed && <span>Report & Analitik</span>}
              </div>
              {!isCollapsed && (
                openSections['report'] ? (
                  <ChevronDown className={`w-3.5 h-3.5 ${isReportActive ? 'text-[#b81d24]' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )
              )}
            </button>

            {!isCollapsed && openSections['report'] && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                {checkAccess('modul-6-dashboard-analytic') && (
                  <button
                    onClick={() => onSelectModule('modul-6-dashboard-analytic')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-6-dashboard-analytic'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Dashboard Analytic</span>
                  </button>
                )}

                {checkAccess('modul-6-laporan-pembelian') && (
                  <button
                    onClick={() => onSelectModule('modul-6-laporan-pembelian')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-6-laporan-pembelian'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Laporan Pembelian</span>
                  </button>
                )}

                {checkAccess('modul-6-laporan-gudang') && (
                  <button
                    onClick={() => onSelectModule('modul-6-laporan-gudang')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-6-laporan-gudang'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Laporan Gudang</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Master Data */}
        {canSeeMaster && (
          <div className="space-y-0.5">
            <button
              onClick={() => toggleSection('master-data')}
              className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
                isMasterActive
                  ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Database className={`w-4 h-4 shrink-0 ${isMasterActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
                {!isCollapsed && <span>Master Data</span>}
              </div>
              {!isCollapsed && (
                openSections['master-data'] ? (
                  <ChevronDown className={`w-3.5 h-3.5 ${isMasterActive ? 'text-[#b81d24]' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )
              )}
            </button>

            {!isCollapsed && openSections['master-data'] && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                {checkAccess('modul-1-petani') && (
                  <button
                    onClick={() => onSelectModule('modul-1-petani')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-1-petani'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Master Petani</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      {petaniCount}
                    </span>
                  </button>
                )}

                {checkAccess('modul-3-harga') && (
                  <button
                    onClick={() => onSelectModule('modul-3-harga')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-3-harga'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Master Kualitas & Harga</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      6 Grade
                    </span>
                  </button>
                )}

                {checkAccess('modul-7-gudang') && (
                  <button
                    onClick={() => onSelectModule('modul-7-gudang')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-7-gudang'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Master Data Gudang</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      {gudangCount}
                    </span>
                  </button>
                )}

                {checkAccess('modul-2-barang') && (
                  <button
                    onClick={() => onSelectModule('modul-2-barang')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-2-barang'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Inventaris Bal Gudang</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      {barangCount} Bal
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Pembelian / Timbang */}
        {canSeePembelian && (
          <div className="space-y-0.5">
            <button
              onClick={() => toggleSection('pembelian')}
              className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
                isPembelianActive
                  ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <ShoppingCart className={`w-4 h-4 shrink-0 ${isPembelianActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
                {!isCollapsed && <span>Pembelian / Timbang</span>}
              </div>
              {!isCollapsed && (
                openSections['pembelian'] ? (
                  <ChevronDown className={`w-3.5 h-3.5 ${isPembelianActive ? 'text-[#b81d24]' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )
              )}
            </button>

            {!isCollapsed && openSections['pembelian'] && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                <button
                  onClick={() => onSelectModule('modul-0-transaksi')}
                  className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                    activeModuleId === 'modul-0-transaksi'
                      ? 'text-[#b81d24] font-semibold bg-red-50/60'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Transaksi Timbang Petani</span>
                  <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                    {transaksiCount}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Pengiriman Barang */}
        {canSeePengiriman && (
          <div className="space-y-0.5">
            <button
              onClick={() => toggleSection('pengiriman')}
              className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
                isPengirimanActive
                  ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Truck className={`w-4 h-4 shrink-0 ${isPengirimanActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
                {!isCollapsed && <span>Pengiriman Barang</span>}
              </div>
              {!isCollapsed && (
                openSections['pengiriman'] ? (
                  <ChevronDown className={`w-3.5 h-3.5 ${isPengirimanActive ? 'text-[#b81d24]' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )
              )}
            </button>

            {!isCollapsed && openSections['pengiriman'] && (
              <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                {checkAccess('modul-5-pengiriman') && (
                  <button
                    onClick={() => onSelectModule('modul-5-pengiriman')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-5-pengiriman'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Pengiriman Reguler (DO)</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      {pengirimanCount}
                    </span>
                  </button>
                )}

                {checkAccess('modul-4-sample') && (
                  <button
                    onClick={() => onSelectModule('modul-4-sample')}
                    className={`w-full text-left py-1.5 px-2 rounded-xs flex items-center justify-between cursor-pointer ${
                      activeModuleId === 'modul-4-sample'
                        ? 'text-[#b81d24] font-semibold bg-red-50/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Pengiriman Sample QC</span>
                    <span className="text-[10px] font-mono font-medium px-1 bg-gray-100 text-gray-600 rounded">
                      {sampleCount}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. User Management & RBAC */}
        {canSeeUsers && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => onSelectModule('modul-users')}
              className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between text-xs transition cursor-pointer ${
                isUsersActive
                  ? 'bg-[#fcf0f0] text-[#b81d24] font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <UserCheck className={`w-4 h-4 shrink-0 ${isUsersActive ? 'text-[#b81d24]' : 'text-gray-500'}`} />
                {!isCollapsed && <span>Manajemen Pengguna</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                  isUsersActive 
                    ? 'bg-red-100 text-[#b81d24]' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {userCount || 5} User
                </span>
              )}
            </button>
          </div>
        )}

      </div>

    </aside>
  );
};
