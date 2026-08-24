import React from 'react';
import { 
  Package, 
  Printer, 
  Edit3, 
  MapPin, 
  Calendar, 
  User, 
  Scale,
  ArrowUpRight
} from 'lucide-react';
import { Barang, StatusStokBarang } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { GRADE_COLOR_MAP } from '../../data/initialHargaData';

interface BarangTableProps {
  items?: Barang[];
  barangList?: Barang[];
  onPrintBarcode: (barang: Barang) => void;
  onEditLocation: (barang: Barang) => void;
}

export const BarangTable: React.FC<BarangTableProps> = ({
  items,
  barangList,
  onPrintBarcode,
  onEditLocation,
}) => {
  const displayItems = items || barangList || [];

  const getStatusBadge = (status: StatusStokBarang) => {
    switch (status) {
      case 'di_gudang':
        return (
          <span className="text-gray-900 font-semibold text-[11px]">
            Di Gudang
          </span>
        );
      case 'keluar':
        return (
          <span className="text-gray-500 text-[11px]">
            Keluar
          </span>
        );
      case 'terkirim_sample':
        return (
          <span className="text-gray-700 font-semibold text-[11px]">
            Sample Lab
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-200 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">No. Bal & Barcode</th>
              <th className="px-4 py-3 text-center">Grade</th>
              <th className="px-4 py-3 text-right">Berat (KG)</th>
              <th className="px-4 py-3">Status Stok</th>
              <th className="px-4 py-3">Lokasi Rak</th>
              <th className="px-4 py-3">Petani Asal</th>
              <th className="px-4 py-3">Tgl Masuk</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayItems.map((barang) => {
              const gradeColor = GRADE_COLOR_MAP[barang.kode_grade] || {
                badge: 'bg-slate-700 text-white',
              };

              return (
                <tr
                  key={barang.barang_id}
                  className="hover:bg-slate-50/80 transition group"
                >
                  {/* Barcode & No Bal */}
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {barang.no_bal}
                    </div>
                    <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                      {barang.barcode}
                    </div>
                  </td>

                  {/* Grade */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-black text-xs ${gradeColor.badge}`}>
                      {barang.kode_grade}
                    </span>
                  </td>

                  {/* Berat */}
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-xs">
                    {barang.berat_kg} kg
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(barang.status_stok)}
                    {barang.tanggal_keluar && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Keluar: {barang.tanggal_keluar}
                      </div>
                    )}
                  </td>

                  {/* Lokasi */}
                  <td className="px-4 py-3 font-medium text-slate-700">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{barang.lokasi_gudang}</span>
                    </div>
                  </td>

                  {/* Petani */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 truncate max-w-[140px]">
                      {barang.nama_petani || '-'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {barang.desa_kecamatan || '-'}
                    </div>
                  </td>

                  {/* Tgl Masuk */}
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {barang.tanggal_masuk}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onPrintBarcode(barang)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Cetak Label Thermal Barcode"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditLocation(barang)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Ubah Lokasi & Catatan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {displayItems.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  <Package className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                  Tidak ada bal tembakau yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
