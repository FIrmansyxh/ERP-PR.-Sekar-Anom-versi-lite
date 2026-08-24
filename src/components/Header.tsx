import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  HardDrive,
  Laptop,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Users,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { User, UserRole } from '../types';
import { getLastBackupTimestamp } from '../utils/storage';
import { formatDateTimeIndo } from '../utils/formatters';
import { getRoleInfo, canUserPerform } from '../utils/rbac';

interface HeaderProps {
  totalPetani: number;
  totalAktif: number;
  totalNonaktif: number;
  onResetData: () => void;
  onOpenRoadmap: () => void;
  onOpenBackup: (tab?: 'export' | 'import' | 'history' | 'sop') => void;
  pageTitle?: string;
  pageBreadcrumb?: string;
  onToggleSidebar?: () => void;
  lastBackupTimestamp?: string | null;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenUsers?: () => void;
  onSwitchUser?: (user: User) => void;
  allUsers?: User[];
}

export const Header: React.FC<HeaderProps> = ({
  totalPetani,
  totalAktif,
  totalNonaktif,
  onResetData,
  onOpenRoadmap,
  onOpenBackup,
  pageTitle = 'Sistem Data Gudang',
  pageBreadcrumb = 'PR. SEKAR ANOM / Sistem Data Gudang',
  onToggleSidebar,
  lastBackupTimestamp,
  currentUser,
  onLogout,
  onOpenUsers,
  onSwitchUser,
  allUsers = [],
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveLastBackup = lastBackupTimestamp !== undefined ? lastBackupTimestamp : getLastBackupTimestamp();
  const isBackupUpToDate = effectiveLastBackup 
    ? (new Date().getTime() - new Date(effectiveLastBackup).getTime()) < 24 * 60 * 60 * 1000 
    : false;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsSwitchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleInfo = currentUser ? getRoleInfo(currentUser.role) : null;
  const canManageUsers = currentUser ? canUserPerform(currentUser.role, 'canManageUsers') : false;

  return (
    <header className="bg-white border-b border-gray-200 text-gray-800 sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Hamburger & App Branding */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition cursor-pointer"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center">
              <span className="font-bold text-base sm:text-lg tracking-tight text-gray-900">
                Sistem Data Gudang
              </span>
            </div>
          </div>

          {/* Right Tools & Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Status Badge: Terakhir Backup */}
            <button
              onClick={() => onOpenBackup('history')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm border text-xs transition cursor-pointer shadow-2xs ${
                isBackupUpToDate
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100/90'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
              title="Status Keamanan Data Gudang - Klik untuk Buka Halaman Cadangan"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isBackupUpToDate ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="hidden sm:inline text-gray-600 font-medium">Terakhir Backup:</span>
              <span className="font-bold text-gray-900 font-mono text-[11px] sm:text-xs">
                {effectiveLastBackup ? formatDateTimeIndo(effectiveLastBackup) : 'Belum Pernah'}
              </span>
            </button>

            {/* Quick Backup Button */}
            <button
              onClick={() => onOpenBackup('export')}
              className={`px-3 py-1.5 text-xs font-bold rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isBackupUpToDate
                  ? 'bg-[#545b62] hover:bg-[#464c52] text-white'
                  : 'bg-[#b81d24] hover:bg-[#a0181e] text-white animate-pulse'
              }`}
              title="Pusat Cadangan & Pemulihan Database"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cadangan Data</span>
              <span className="md:hidden">Backup</span>
              {!isBackupUpToDate && (
                <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
              )}
            </button>

            {/* User Profile & Role Dropdown (RBAC) */}
            {currentUser && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsSwitchOpen(false);
                  }}
                  className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-100 border border-gray-200 rounded-sm text-xs cursor-pointer transition select-none"
                  title="Informasi Akun Staf & Hak Akses"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    {currentUser.nama_lengkap.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>

                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="font-bold text-gray-900 text-xs truncate max-w-[130px]">
                      {currentUser.nama_lengkap}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {roleInfo?.label.split('(')[0].trim()}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-sm shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200">
                      <div className="font-bold text-gray-900">{currentUser.nama_lengkap}</div>
                      <div className="text-[11px] font-mono text-gray-500">@{currentUser.username}</div>
                      
                      {roleInfo && (
                        <div className="mt-1.5">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs border text-[10px] font-bold ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.badgeBorder}`}>
                            <ShieldCheck className="w-3 h-3" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1 mt-1 text-[10px] text-gray-600">
                        <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{currentUser.unit_penugasan}</span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      {canManageUsers && onOpenUsers && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onOpenUsers();
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2 cursor-pointer font-medium"
                        >
                          <Users className="w-4 h-4 text-[#b81d24]" />
                          <span>Kelola Pengguna (RBAC)</span>
                        </button>
                      )}

                      {/* Quick Switch User toggle */}
                      {onSwitchUser && allUsers.length > 1 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setIsSwitchOpen(!isSwitchOpen)}
                            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 flex items-center justify-between cursor-pointer font-medium"
                          >
                            <div className="flex items-center space-x-2">
                              <UserIcon className="w-4 h-4 text-[#b81d24]" />
                              <span>Ganti Akun Cepat</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSwitchOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isSwitchOpen && (
                            <div className="bg-gray-50 border-y border-gray-200 py-1 px-2 space-y-1 max-h-48 overflow-y-auto">
                              {allUsers.map((u) => {
                                const uRole = getRoleInfo(u.role);
                                const isCurrent = u.user_id === currentUser.user_id;
                                return (
                                  <button
                                    key={u.user_id}
                                    type="button"
                                    onClick={() => {
                                      setIsProfileOpen(false);
                                      setIsSwitchOpen(false);
                                      onSwitchUser(u);
                                    }}
                                    className={`w-full text-left p-1.5 rounded-xs flex items-center justify-between text-[11px] transition cursor-pointer ${
                                      isCurrent
                                        ? 'bg-red-50 text-[#b81d24] font-bold'
                                        : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    <div className="truncate">
                                      <div>{u.nama_lengkap}</div>
                                      <div className="text-[10px] text-gray-500 font-mono">@{u.username} • {uRole.label.split('(')[0]}</div>
                                    </div>
                                    {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#b81d24] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Logout Option */}
                    {onLogout && (
                      <div className="pt-1 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50 flex items-center space-x-2 cursor-pointer font-bold"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
