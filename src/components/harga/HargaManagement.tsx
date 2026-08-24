import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  RefreshCw,
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  History,
  Scale,
  DollarSign
} from 'lucide-react';
import { TabelHarga, UserRole } from '../../types';
import { GradePriceCard } from './GradePriceCard';
import { HargaFormModal } from './HargaFormModal';
import { HargaHistoryModal } from './HargaHistoryModal';

interface HargaManagementProps {
  hargaList: TabelHarga[];
  userRole: UserRole;
  onSaveNewPrice: (newPrice: TabelHarga, oldPriceIdToArchive?: string) => void;
}

export const HargaManagement: React.FC<HargaManagementProps> = ({
  hargaList = [],
  userRole,
  onSaveNewPrice,
}) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTargetGrade, setSelectedTargetGrade] = useState<string | null>(null);
  const [historyTargetGrade, setHistoryTargetGrade] = useState<string | null>(null);

  // Active prices only
  const activePrices = hargaList.filter((h) => h.status === 'aktif');

  const handleEditGrade = (harga: TabelHarga) => {
    setSelectedTargetGrade(harga.kode_grade);
    setIsFormModalOpen(true);
  };

  const handleOpenAddNewPrice = () => {
    setSelectedTargetGrade(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-4 font-sans text-gray-800">
      
      {/* Top Banner Card matching ERP style */}
      <div className="bg-white p-4 border border-gray-200 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800 tracking-tight">
            Master Tabel Tarif Harga Acuan Grade & Potongan
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar tarif acuan per kilogram tembakau yang ditarik otomatis saat loket timbang pembelian petani.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenAddNewPrice}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#b81d24] hover:bg-[#a0181e] rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Update Harga Baru</span>
          </button>
        </div>
      </div>

      {/* Grid of Active Grade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePrices.map((harga) => (
          <GradePriceCard
            key={harga.harga_id}
            harga={harga}
            onEditHarga={handleEditGrade}
            onViewHistory={(code) => setHistoryTargetGrade(code)}
          />
        ))}
      </div>

      {/* Form Modal Update Harga */}
      <HargaFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaveNewPrice={onSaveNewPrice}
        currentActivePrices={activePrices}
        targetGradeCode={selectedTargetGrade}
      />

      {/* Histori Versi Harga Modal */}
      {historyTargetGrade && (
        <HargaHistoryModal
          isOpen={Boolean(historyTargetGrade)}
          onClose={() => setHistoryTargetGrade(null)}
          gradeCode={historyTargetGrade}
          allHargaList={hargaList}
        />
      )}

    </div>
  );
};
