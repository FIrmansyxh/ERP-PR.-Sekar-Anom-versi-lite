import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Scale, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Warehouse, 
  User, 
  Tag, 
  Clock, 
  FileText,
  RotateCcw,
  Sparkles,
  Printer
} from 'lucide-react';
import { TransaksiPembelian, Petani, TabelHarga, Barang, Gudang, TransaksiItemBal, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface TimbanganPageViewProps {
  transaksiList: TransaksiPembelian[];
  petaniList: Petani[];
  hargaList: TabelHarga[];
  barangList: Barang[];
  gudangList?: Gudang[];
  userRole: UserRole;
  initialKuponNo?: string;
  initialTxId?: string;
  initialBalNo?: string;
  onSaveTransaksi: (newTx: TransaksiPembelian, generatedBarang: Barang | Barang[]) => void;
  onNavigateToKasir: (kuponNo?: string, txId?: string) => void;
  onNavigateToSortir: () => void;
}

export const TimbanganPageView: React.FC<TimbanganPageViewProps> = ({
  transaksiList = [],
  petaniList = [],
  hargaList = [],
  barangList = [],
  gudangList = [],
  userRole,
  initialKuponNo,
  initialTxId,
  initialBalNo,
  onSaveTransaksi,
  onNavigateToKasir,
  onNavigateToSortir,
}) => {
  // Pending or all transactions
  const pendingOrRecentTxList = useMemo(() => {
    return transaksiList.filter((t) => (t.items || []).length > 0);
  }, [transaksiList]);

  // Initial lookup if initialBalNo is provided
  const initialBalMatch = useMemo(() => {
    if (!initialBalNo) return null;
    const cleanQ = initialBalNo.trim().toLowerCase();
    for (const tx of transaksiList) {
      const match = (tx.items || []).find((it) => {
        const bCode = (it.barcode || '').toLowerCase();
        const nBal = (it.no_bal || '').toLowerCase();
        return bCode === cleanQ || nBal === cleanQ;
      });
      if (match) return { tx, item: match };
    }
    return null;
  }, [initialBalNo, transaksiList]);

  // Selected Transaction ID
  const [selectedTxId, setSelectedTxId] = useState<string>(() => {
    if (initialBalMatch) return initialBalMatch.tx.transaksi_id;
    if (initialTxId) return initialTxId;
    if (initialKuponNo) {
      const found = transaksiList.find((t) => t.no_kupon === initialKuponNo);
      if (found) return found.transaksi_id;
    }
    // Default to first pending tx or first tx
    const firstPending = transaksiList.find((t) => (t.items || []).some((it) => (it.berat_kg || 0) <= 0));
    return firstPending?.transaksi_id || transaksiList[0]?.transaksi_id || '';
  });

  // Current Transaction object
  const currentTx = useMemo(() => {
    return transaksiList.find((t) => t.transaksi_id === selectedTxId);
  }, [transaksiList, selectedTxId]);

  // Working copy of items for current selected transaction
  const [workingItems, setWorkingItems] = useState<TransaksiItemBal[]>([]);
  const [activeItemId, setActiveItemId] = useState<string>(() => {
    if (initialBalMatch) return initialBalMatch.item.item_id;
    return '';
  });

  // Weighing inputs
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [beratBrutoInput, setBeratBrutoInput] = useState<number | string>('');
  const [lokasiBlok, setLokasiBlok] = useState('Blok A (Utara)');
  const [petugasTimbangNama, setPetugasTimbangNama] = useState('Operator Timbang Digital');

  const [scanFeedback, setScanFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const barcodeScannerRef = useRef<HTMLInputElement>(null);
  const beratBrutoInputRef = useRef<HTMLInputElement>(null);

  // Sync working items when selected transaction changes
  useEffect(() => {
    if (currentTx && currentTx.items && currentTx.items.length > 0) {
      setWorkingItems(currentTx.items);
      
      // 1. If activeItemId is already a valid item of this currentTx, keep it and update inputs
      const existingActive = currentTx.items.find((it) => it.item_id === activeItemId);
      if (existingActive) {
        setBeratBrutoInput(existingActive.berat_bruto_kg && existingActive.berat_bruto_kg > 0 ? existingActive.berat_bruto_kg : '');
        setLokasiBlok(existingActive.lokasi_simpan || 'Blok A (Utara)');
        return;
      }

      // 2. Otherwise pick first unweighed or first item
      const unweighed = currentTx.items.find((it) => (it.berat_kg || 0) <= 0);
      const targetItem = unweighed || currentTx.items[0];
      if (targetItem) {
        setActiveItemId(targetItem.item_id);
        setBeratBrutoInput(targetItem.berat_bruto_kg && targetItem.berat_bruto_kg > 0 ? targetItem.berat_bruto_kg : '');
        setLokasiBlok(targetItem.lokasi_simpan || 'Blok A (Utara)');
      }
    } else {
      setWorkingItems([]);
      setActiveItemId('');
    }
  }, [currentTx]);

  // Lookup Bal by code across ALL kupons and open that exact bal immediately
  const lookupBal = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;

    const cleanQ = q.toLowerCase();
    const cleanQNormalized = q.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 1. Search across all transactions for the best matching bal item
    let foundTx: TransaksiPembelian | undefined;
    let foundItem: TransaksiItemBal | undefined;

    // Check currently selected transaction first
    if (currentTx && currentTx.items) {
      const currentMatch = currentTx.items.find((it) => {
        const bCode = (it.barcode || '').toLowerCase();
        const nBal = (it.no_bal || '').toLowerCase();
        const nBalNorm = (it.no_bal || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return bCode === cleanQ || nBal === cleanQ || nBalNorm === cleanQNormalized || nBal.includes(cleanQ);
      });
      if (currentMatch) {
        foundTx = currentTx;
        foundItem = currentMatch;
      }
    }

    // If not found in current transaction, search across ALL transactions (lintas kupon)
    if (!foundTx || !foundItem) {
      // Step A: Exact / normalized match across all kupons
      for (const tx of transaksiList) {
        const match = (tx.items || []).find((it) => {
          const bCode = (it.barcode || '').toLowerCase();
          const nBal = (it.no_bal || '').toLowerCase();
          const nBalNorm = (it.no_bal || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return bCode === cleanQ || nBal === cleanQ || nBalNorm === cleanQNormalized;
        });
        if (match) {
          foundTx = tx;
          foundItem = match;
          break;
        }
      }

      // Step B: Partial match across all kupons
      if (!foundTx || !foundItem) {
        for (const tx of transaksiList) {
          const match = (tx.items || []).find((it) => {
            const bCode = (it.barcode || '').toLowerCase();
            const nBal = (it.no_bal || '').toLowerCase();
            return bCode.includes(cleanQ) || nBal.includes(cleanQ);
          });
          if (match) {
            foundTx = tx;
            foundItem = match;
            break;
          }
        }
      }
    }

    if (foundTx && foundItem) {
      setSelectedTxId(foundTx.transaksi_id);
      setWorkingItems(foundTx.items || []);
      setActiveItemId(foundItem.item_id);
      setBeratBrutoInput(foundItem.berat_bruto_kg && foundItem.berat_bruto_kg > 0 ? foundItem.berat_bruto_kg : '');
      setLokasiBlok(foundItem.lokasi_simpan || 'Blok A (Utara)');
      
      const isAlreadyWeighed = (foundItem.berat_kg || 0) > 0;
      setScanFeedback({
        text: `✓ Bal "${foundItem.no_bal}" (Grade ${foundItem.kode_grade}) langsung terbuka! Berada di Kupon "${foundTx.no_kupon}" (${foundTx.nama_petani})${isAlreadyWeighed ? ` • [Timbang Netto: ${foundItem.berat_kg} Kg]` : ' • [Siap Timbang]'}`,
        isError: false,
      });

      setTimeout(() => {
        if (beratBrutoInputRef.current) {
          beratBrutoInputRef.current.focus();
          beratBrutoInputRef.current.select();
        }
      }, 100);
    } else {
      setScanFeedback({
        text: `No. Bal "${q}" tidak ditemukan pada kupon manapun. Pastikan sudah diinput pada Meja Sortir!`,
        isError: true,
      });
    }

    setScannedBarcode('');
  }, [currentTx, transaksiList]);

  // Focus scanner or weight input on mount & Global Scanner listener
  useEffect(() => {
    barcodeScannerRef.current?.focus();

    let scanBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // If user is currently typing in beratBrutoInput
      if (target && target === beratBrutoInputRef.current) {
        return;
      }
      if (target && target !== barcodeScannerRef.current && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        scanBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (scanBuffer.trim().length >= 2) {
          e.preventDefault();
          lookupBal(scanBuffer.trim());
          scanBuffer = '';
        }
      } else if (e.key.length === 1) {
        scanBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [lookupBal]);

  const activeBalItem = useMemo(() => {
    return workingItems.find((it) => it.item_id === activeItemId);
  }, [workingItems, activeItemId]);

  // Switch active bal item
  const handleSelectBalItem = (item: TransaksiItemBal) => {
    setActiveItemId(item.item_id);
    setBeratBrutoInput(item.berat_bruto_kg && item.berat_bruto_kg > 0 ? item.berat_bruto_kg : '');
    setLokasiBlok(item.lokasi_simpan || 'Blok A (Utara)');
    setScanFeedback({ text: `Memilih Bal "${item.no_bal}" (Grade ${item.kode_grade})`, isError: false });
    setTimeout(() => {
      beratBrutoInputRef.current?.focus();
    }, 100);
  };

  // Toggle Ganti Tikar for active bal
  const handleToggleGantiTikar = (itemId: string) => {
    setWorkingItems((prev) =>
      prev.map((it) => {
        if (it.item_id === itemId) {
          const nextGanti = !it.ganti_tikar;
          const tara = nextGanti ? 2 : 3;
          const potTikar = nextGanti ? 75000 : 0;
          const bBruto = typeof beratBrutoInput === 'number' ? beratBrutoInput : (parseFloat(String(beratBrutoInput)) || it.berat_bruto_kg || 0);
          const netto = bBruto > 0 ? Math.max(0, Number((bBruto - tara).toFixed(1))) : 0;
          const kotor = Math.round(netto * it.harga_per_kg);
          const potTotal = (it.potongan_kuli || 7000) + (it.potongan_tali || 3000) + potTikar;
          const bersih = Math.max(0, kotor - potTotal);
          return {
            ...it,
            ganti_tikar: nextGanti,
            potongan_tara_kg: tara,
            potongan_tikar: potTikar,
            berat_kg: netto,
            total_kotor: kotor,
            potongan: potTotal,
            subtotal_bersih: bersih,
          };
        }
        return it;
      })
    );
  };

  // Matching bals across all transactions for quick autocomplete
  const balSuggestions = useMemo(() => {
    const q = scannedBarcode.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const cleanQNormalized = q.replace(/[^a-zA-Z0-9]/g, '');
    const results: Array<{
      tx: TransaksiPembelian;
      item: TransaksiItemBal;
    }> = [];

    for (const tx of transaksiList) {
      for (const it of tx.items || []) {
        const bCode = (it.barcode || '').toLowerCase();
        const nBal = (it.no_bal || '').toLowerCase();
        const nBalNorm = (it.no_bal || '').replace(/[^a-zA-Z0-9]/g, '');
        if (
          bCode.includes(q) ||
          nBal.includes(q) ||
          (cleanQNormalized && nBalNorm.includes(cleanQNormalized))
        ) {
          results.push({ tx, item: it });
        }
        if (results.length >= 6) break;
      }
      if (results.length >= 6) break;
    }
    return results;
  }, [scannedBarcode, transaksiList]);

  // Form Submit Handler
  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    lookupBal(scannedBarcode);
  };

  // Calculate live numbers for active item
  const liveBruto = typeof beratBrutoInput === 'number' ? beratBrutoInput : (parseFloat(String(beratBrutoInput)) || 0);
  const liveTara = activeBalItem?.ganti_tikar ? 2 : 3;
  const liveNetto = liveBruto > 0 ? Math.max(0, Number((liveBruto - liveTara).toFixed(1))) : 0;
  const livePotTikar = activeBalItem?.ganti_tikar ? 75000 : 0;
  const livePotKuli = 7000;
  const livePotTali = 3000;
  const livePotTotal = livePotKuli + livePotTali + livePotTikar;
  const liveTotalKotor = Math.round(liveNetto * (activeBalItem?.harga_per_kg || 0));
  const liveSubtotalBersih = Math.max(0, liveTotalKotor - livePotTotal);

  // Save weighing for active bal
  const handleApplyWeightForActiveBal = () => {
    if (!activeBalItem || !currentTx) return;

    if (liveBruto <= 0) {
      setScanFeedback({ text: 'Masukkan berat bruto (kotor) lebih dari 0 kg!', isError: true });
      beratBrutoInputRef.current?.focus();
      return;
    }

    const updatedItems = workingItems.map((it) => {
      if (it.item_id === activeBalItem.item_id) {
        return {
          ...it,
          berat_bruto_kg: liveBruto,
          potongan_tara_kg: liveTara,
          berat_kg: liveNetto,
          potongan_kuli: livePotKuli,
          potongan_tali: livePotTali,
          potongan_tikar: livePotTikar,
          potongan: livePotTotal,
          total_kotor: liveTotalKotor,
          subtotal_bersih: liveSubtotalBersih,
          status_timbang: 'selesai_timbang' as const,
          lokasi_simpan: lokasiBlok,
        };
      }
      return it;
    });

    setWorkingItems(updatedItems);

    // Save directly to global storage state
    const allItemsWeighed = updatedItems.every((it) => (it.berat_kg || 0) > 0);
    const totalNettoKg = Number(updatedItems.reduce((acc, it) => acc + (it.berat_kg || 0), 0).toFixed(1));
    const totalBrutoKg = Number(updatedItems.reduce((acc, it) => acc + (it.berat_bruto_kg || 0), 0).toFixed(1));
    const totalKotorAll = updatedItems.reduce((acc, it) => acc + (it.total_kotor || 0), 0);
    const totalPotonganAll = updatedItems.reduce((acc, it) => acc + (it.potongan || 0), 0);
    const finalHargaTotal = updatedItems.reduce((acc, it) => acc + (it.subtotal_bersih || 0), 0);
    const weighedCount = updatedItems.filter((it) => (it.berat_kg || 0) > 0).length;

    // Generated Barang inventory records
    const updatedBarangs: Barang[] = updatedItems.map((it, idx) => ({
      barang_id: it.barang_id || `BAL-${currentTx.transaksi_id}-${String(idx + 1).padStart(2, '0')}`,
      barcode: it.barcode || it.no_bal,
      kode_grade: it.kode_grade,
      no_bal: it.no_bal,
      berat_kg: it.berat_kg,
      status_stok: 'di_gudang',
      lokasi_gudang: `${currentTx.lokasi_gudang || 'Gudang Pusat'} - ${it.lokasi_simpan || lokasiBlok}`,
      tanggal_masuk: currentTx.tanggal_transaksi?.split(' ')[0] || new Date().toISOString().split('T')[0],
      petani_id: currentTx.petani_id,
      nama_petani: currentTx.nama_petani,
      transaksi_pembelian_id: currentTx.transaksi_id,
      catatan: `Timbang Kupon: ${currentTx.no_kupon}, Bruto: ${it.berat_bruto_kg}kg, Netto: ${it.berat_kg}kg`,
    }));

    const updatedTx: TransaksiPembelian = {
      ...currentTx,
      items: updatedItems,
      total_bal: updatedItems.length,
      bal_selesai_timbang: weighedCount,
      berat_terukur_kg: totalBrutoKg,
      berat_kg: totalNettoKg,
      total_kotor: totalKotorAll,
      potongan_tara_kg: updatedItems.reduce((acc, it) => acc + (it.potongan_tara_kg || 3), 0),
      potongan_kuli: updatedItems.reduce((acc, it) => acc + (it.potongan_kuli || 7000), 0),
      potongan_tali: updatedItems.reduce((acc, it) => acc + (it.potongan_tali || 3000), 0),
      potongan_tikar: updatedItems.reduce((acc, it) => acc + (it.potongan_tikar || 0), 0),
      total_potongan: totalPotonganAll,
      total_harga_beli: totalKotorAll,
      harga_final: finalHargaTotal,
      status_transaksi: allItemsWeighed ? 'lengkap' : 'menunggu',
      status_tahap: allItemsWeighed ? 'lengkap' : 'menunggu_timbang',
      petugas_timbang: petugasTimbangNama,
    };

    onSaveTransaksi(updatedTx, updatedBarangs);
    setSaveSuccessMsg(`✓ Berat Bal "${activeBalItem.no_bal}" (${liveNetto} Kg) berhasil disimpan ke ${lokasiBlok}!`);
    setScanFeedback(null);

    // Auto-advance to next unweighed item if exists
    const nextUnweighed = updatedItems.find((it) => it.item_id !== activeBalItem.item_id && (it.berat_kg || 0) <= 0);
    if (nextUnweighed) {
      setActiveItemId(nextUnweighed.item_id);
      setBeratBrutoInput('');
      setTimeout(() => {
        beratBrutoInputRef.current?.focus();
      }, 150);
    } else {
      // All items in current kupon are weighed!
      setScanFeedback({
        text: `🎉 Semua ${updatedItems.length} bal pada Kupon "${currentTx.no_kupon}" telah tuntas ditimbang!`,
        isError: false,
      });
      barcodeScannerRef.current?.focus();
    }
  };

  const handleKeyDownWeight = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyWeightForActiveBal();
    }
  };

  const handleManualChangeKupon = (txId: string) => {
    setSelectedTxId(txId);
    const tx = transaksiList.find((t) => t.transaksi_id === txId);
    if (tx && tx.items) {
      setWorkingItems(tx.items);
      const unweighed = tx.items.find((it) => (it.berat_kg || 0) <= 0) || tx.items[0];
      if (unweighed) {
        setActiveItemId(unweighed.item_id);
        setBeratBrutoInput(unweighed.berat_bruto_kg && unweighed.berat_bruto_kg > 0 ? unweighed.berat_bruto_kg : '');
        setLokasiBlok(unweighed.lokasi_simpan || 'Blok A (Utara)');
      }
    }
  };

  const allCurrentWeighed = workingItems.length > 0 && workingItems.every((it) => (it.berat_kg || 0) > 0);
  const weighedCount = workingItems.filter((it) => (it.berat_kg || 0) > 0).length;

  return (
    <div className="space-y-4 font-sans pb-10">

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-sm flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Left is Standby & Scanner, Right is Active Weighing Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Scanner Standby & Kupon Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Scanner Box */}
          <div className="bg-white border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-800">
                <Layers className="w-4 h-4 text-[#b81d24]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  No. Bal (Lintas Kupon)
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                Auto-Buka
              </span>
            </div>

            <form onSubmit={handleScanBarcode} className="space-y-2 relative">
              <div className="relative">
                <input
                  ref={barcodeScannerRef}
                  type="text"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                  placeholder="Ketik / Scan No Bal (Contoh: A0001)..."
                  className="w-full bg-white border-2 border-red-500 rounded-sm pl-3 pr-8 py-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200 placeholder:font-sans placeholder:font-normal"
                />
                {scannedBarcode && (
                  <button
                    type="button"
                    onClick={() => setScannedBarcode('')}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List for Cross-Kupon Instant Match */}
              {balSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-300 rounded-sm shadow-lg overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                    Pilih Bal untuk Langsung Dibuka:
                  </div>
                  {balSuggestions.map(({ tx, item }) => {
                    const isWeighed = (item.berat_kg || 0) > 0;
                    return (
                      <button
                        key={`${tx.transaksi_id}-${item.item_id}`}
                        type="button"
                        onClick={() => lookupBal(item.no_bal)}
                        className="w-full px-2.5 py-2 text-left hover:bg-amber-50/80 flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-xs text-gray-900">
                              {item.no_bal}
                            </span>
                            <span className="px-1.5 py-0.2 bg-red-50 text-[#b81d24] border border-red-200 text-[10px] font-bold rounded">
                              Grade {item.kode_grade}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Kupon <strong className="text-red-700">{tx.no_kupon}</strong> • {tx.nama_petani}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {isWeighed ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ {item.berat_kg} Kg
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Belum Timbang
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-sm transition cursor-pointer"
              >
                Cari No. Bal
              </button>
            </form>

            {scanFeedback && (
              <div className={`p-2.5 rounded text-xs font-medium ${
                scanFeedback.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {scanFeedback.text}
              </div>
            )}
          </div>

          {/* Kupon Batch Selector */}
          <div className="bg-white border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-800">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Pilih Kupon Antrian
                </h3>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono font-bold">
                {pendingOrRecentTxList.length} Batch
              </span>
            </div>

            <select
              value={selectedTxId}
              onChange={(e) => handleManualChangeKupon(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#b81d24]"
            >
              {pendingOrRecentTxList.map((tx) => {
                const items = tx.items || [];
                const weighed = items.filter((i) => (i.berat_kg || 0) > 0).length;
                const isComplete = items.length > 0 && weighed === items.length;
                return (
                  <option key={tx.transaksi_id} value={tx.transaksi_id}>
                    {isComplete ? '✓ [LENGKAP]' : '⏳ [PROSES]'} Kupon {tx.no_kupon} — {tx.nama_petani} ({weighed}/{items.length} Bal)
                  </option>
                );
              })}
            </select>

            {currentTx && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xs text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Petani Penyetor:</span>
                  <strong className="text-gray-900">{currentTx.nama_petani}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Kupon:</span>
                  <span className="font-mono font-bold text-red-600">{currentTx.no_kupon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal Sortir:</span>
                  <span className="text-gray-700">{currentTx.tanggal_transaksi?.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gudang Intake:</span>
                  <span className="text-gray-700">{currentTx.lokasi_gudang}</span>
                </div>
              </div>
            )}
          </div>

          {/* List of Bals in Selected Kupon */}
          <div className="bg-white border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/80 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Daftar Bal pada Kupon ({weighedCount}/{workingItems.length})
              </h4>
              <span className="text-[10px] font-mono text-gray-500">
                Klik untuk timbang
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {workingItems.map((item, index) => {
                const isWeighed = (item.berat_kg || 0) > 0;
                const isActive = item.item_id === activeItemId;

                return (
                  <button
                    key={item.item_id || index}
                    type="button"
                    onClick={() => handleSelectBalItem(item)}
                    className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-100/80 border-l-4 border-amber-600 font-bold'
                        : isWeighed
                        ? 'bg-emerald-50/40 hover:bg-emerald-50'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-gray-400 text-[10px] w-4">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-gray-900">
                            {item.no_bal}
                          </span>
                          <span className="px-1.5 py-0.2 bg-red-50 text-[#b81d24] border border-red-200 text-[10px] font-bold rounded">
                            Grade {item.kode_grade}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {formatRupiah(item.harga_per_kg)}/kg {item.ganti_tikar && '• Ganti Tikar'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isWeighed ? (
                        <div>
                          <span className="font-mono font-bold text-emerald-800 text-xs">
                            {item.berat_kg} Kg Netto
                          </span>
                          <p className="text-[9px] text-emerald-600 font-bold">
                            ✓ SELESAI
                          </p>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                          Belum Timbang
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Active Bal Weighing Workbench (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {activeBalItem ? (
            <div className="bg-white border-2 border-amber-400 shadow-sm rounded-sm overflow-hidden">
              
              {/* Card Header matching Screenshot 2 */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-[#d89719] text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Scale className="w-5 h-5" />
                  <div>
                    <h3 className="text-sm font-bold tracking-wide uppercase">
                      Input Berat Bal: {activeBalItem.no_bal}
                    </h3>
                    <p className="text-[11px] text-amber-100">
                      Petani: {currentTx?.nama_petani} • Kupon: {currentTx?.no_kupon}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-white text-gray-900 font-mono font-bold text-xs rounded-sm shadow-2xs">
                    Grade {activeBalItem.kode_grade} ({formatRupiah(activeBalItem.harga_per_kg)}/kg)
                  </span>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-5">
                
                {/* Bal Overview Strip */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">No. Kupon</span>
                    <span className="font-mono font-bold text-red-600 text-sm">{currentTx?.no_kupon}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">No. Bal</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{activeBalItem.no_bal}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Grade Mutu</span>
                    <span className="font-bold text-[#b81d24] text-sm">Grade {activeBalItem.kode_grade}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Harga Satuan</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{formatRupiah(activeBalItem.harga_per_kg)}</span>
                  </div>
                </div>

                {/* Input Fields Grid (matching screenshot 2) */}
                <div className="space-y-4">
                  
                  {/* Berat Bruto Large Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Berat / Bruto (Kg) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Berat timbangan kotor sebelum dikurangi tara
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        ref={beratBrutoInputRef}
                        type="number"
                        step="0.1"
                        value={beratBrutoInput}
                        onChange={(e) => setBeratBrutoInput(e.target.value)}
                        onKeyDown={handleKeyDownWeight}
                        placeholder="0.0"
                        className="w-full bg-white border-2 border-amber-500 rounded-sm px-4 py-3 text-2xl font-mono font-black text-gray-900 focus:outline-none focus:ring-3 focus:ring-amber-200"
                        autoFocus
                      />
                      <span className="absolute right-4 top-3.5 text-gray-400 font-mono font-bold text-lg">
                        KG
                      </span>
                    </div>

                    {/* Quick weight buttons */}
                    <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto pb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Preset:</span>
                      {[50, 55, 60, 62.5, 65, 70, 75].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setBeratBrutoInput(val);
                            beratBrutoInputRef.current?.focus();
                          }}
                          className="px-2 py-1 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 border border-gray-300 rounded text-xs font-mono font-bold transition cursor-pointer"
                        >
                          {val} kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ganti Tikar Toggle Row */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeBalItem.ganti_tikar}
                        onChange={() => handleToggleGantiTikar(activeBalItem.item_id)}
                        className="w-4 h-4 accent-[#b81d24] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          Ganti Tikar (+Rp 75.000 / Bal)
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Jika dicentang: Tara timbangan <strong>2 Kg</strong> & Potongan Tikar Rp 75.000
                        </p>
                      </div>
                    </label>

                    <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                      activeBalItem.ganti_tikar
                        ? 'bg-amber-200 text-amber-950 border border-amber-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      Tara: {liveTara} Kg {activeBalItem.ganti_tikar ? '(Ganti Tikar)' : '(Tikar Standar)'}
                    </span>
                  </div>

                  {/* Berat Netto Result Box (Readonly display) */}
                  <div className="p-4 bg-gray-900 text-white rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Berat Bruto</span>
                      <p className="text-lg font-mono font-bold text-gray-200">{liveBruto.toFixed(1)} Kg</p>
                    </div>
                    <div className="border-x border-gray-700">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Potongan Tara</span>
                      <p className="text-lg font-mono font-bold text-amber-400">-{liveTara.toFixed(1)} Kg</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">Berat Netto Final</span>
                      <p className="text-2xl font-mono font-black text-emerald-400">{liveNetto.toFixed(1)} Kg</p>
                    </div>
                  </div>

                  {/* Realtime Potongan & Subtotal Calculation */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm text-xs space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Total Kotor ({liveNetto} kg × {formatRupiah(activeBalItem.harga_per_kg)}):</span>
                      <span className="font-mono font-bold text-gray-800">{formatRupiah(liveTotalKotor)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>
                        Total Potongan Bal (Kuli: Rp 7rb, Tali: Rp 3rb{activeBalItem.ganti_tikar ? ', Tikar: Rp 75rb' : ''}):
                      </span>
                      <span className="font-mono font-bold">-{formatRupiah(livePotTotal)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                      <span>Subtotal Bersih Bal Ini:</span>
                      <span className="font-mono text-emerald-700 font-black">{formatRupiah(liveSubtotalBersih)}</span>
                    </div>
                  </div>

                  {/* Lokasi Gudang Blok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Alokasi Blok Rak Gudang
                      </label>
                      <select
                        value={lokasiBlok}
                        onChange={(e) => setLokasiBlok(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
                      >
                        <option value="Blok A (Utara)">Blok A (Utara - Grade Super)</option>
                        <option value="Blok B (Timur)">Blok B (Timur - Grade Bagus)</option>
                        <option value="Blok C (Barat)">Blok C (Barat - Grade Sedang)</option>
                        <option value="Blok D (Selatan)">Blok D (Selatan - Grade Standar)</option>
                        <option value="Blok E (Penyangga)">Blok E (Penyangga)</option>
                        <option value="Blok F (Transit Sample)">Blok F (Transit Sample)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Petugas Timbangan
                      </label>
                      <input
                        type="text"
                        value={petugasTimbangNama}
                        onChange={(e) => setPetugasTimbangNama(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#b81d24]"
                        placeholder="Nama operator timbang..."
                      />
                    </div>
                  </div>

                </div>

                {/* Save Button matching screenshot 2 (Yellow / Amber prominent button) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyWeightForActiveBal}
                    className="w-full py-3 bg-[#d89719] hover:bg-[#c28414] text-white font-black text-sm uppercase tracking-wider rounded-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Check className="w-5 h-5 text-white" />
                    <span>Simpan Data Timbangan Bal (Enter)</span>
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-12 text-center text-gray-400 space-y-3">
              <Scale className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="text-sm font-bold text-gray-700">Tidak ada bal yang aktif dipilih</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Silakan scan barcode fisik karung atau pilih salah satu bal dari daftar di sebelah kiri untuk menginput berat.
              </p>
            </div>
          )}

          {/* Kupon Batch Completion Notification */}
          {allCurrentWeighed && (
            <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-sm shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Kupon {currentTx?.no_kupon} Telah Tuntas Ditimbang!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Total {workingItems.length} bal ({currentTx?.berat_kg} Kg Netto) siap dicairkan dan dicetak notanya di Kasir.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToKasir(currentTx?.no_kupon, currentTx?.transaksi_id)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-sm transition flex items-center space-x-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>Buka di Kasir & Cetak Nota</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
