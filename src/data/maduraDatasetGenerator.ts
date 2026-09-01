import { Petani, Barang, TransaksiPembelian, TransaksiItemBal, PengirimanBarang, PengirimanSample } from '../types';

// ==========================================
// 1. DATA MASTER 45 PETANI MADURA
// ==========================================
export const MADURA_LOCATIONS = [
  { desa: 'Desa Guluk-Guluk', kec: 'Kec. Guluk-Guluk', kab: 'Kab. Sumenep' },
  { desa: 'Desa Ganding', kec: 'Kec. Ganding', kab: 'Kab. Sumenep' },
  { desa: 'Desa Prancak', kec: 'Kec. Pasongsongan', kab: 'Kab. Sumenep' },
  { desa: 'Desa Ambunten Timur', kec: 'Kec. Ambunten', kab: 'Kab. Sumenep' },
  { desa: 'Desa Rubaru', kec: 'Kec. Rubaru', kab: 'Kab. Sumenep' },
  { desa: 'Desa Bluto', kec: 'Kec. Bluto', kab: 'Kab. Sumenep' },
  { desa: 'Desa Saronggi', kec: 'Kec. Saronggi', kab: 'Kab. Sumenep' },
  { desa: 'Desa Lenteng Timur', kec: 'Kec. Lenteng', kab: 'Kab. Sumenep' },
  { desa: 'Desa Kadur', kec: 'Kec. Kadur', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Pakong', kec: 'Kec. Pakong', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Waru Barat', kec: 'Kec. Waru', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Pasean', kec: 'Kec. Pasean', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Batumarmar', kec: 'Kec. Batumarmar', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Pegantenan', kec: 'Kec. Pegantenan', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Larangan Luar', kec: 'Kec. Larangan', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Galis', kec: 'Kec. Galis', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Proppo', kec: 'Kec. Proppo', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Tlanakan', kec: 'Kec. Tlanakan', kab: 'Kab. Pamekasan' },
  { desa: 'Desa Ketapang Daya', kec: 'Kec. Ketapang', kab: 'Kab. Sampang' },
  { desa: 'Desa Banyuates', kec: 'Kec. Banyuates', kab: 'Kab. Sampang' },
  { desa: 'Desa Robatal', kec: 'Kec. Robatal', kab: 'Kab. Sampang' },
  { desa: 'Desa Kedungdung', kec: 'Kec. Kedungdung', kab: 'Kab. Sampang' },
  { desa: 'Desa Blega', kec: 'Kec. Blega', kab: 'Kab. Bangkalan' },
  { desa: 'Desa Tanah Merah Dajah', kec: 'Kec. Tanah Merah', kab: 'Kab. Bangkalan' },
  { desa: 'Desa Sepulu', kec: 'Kec. Sepulu', kab: 'Kab. Bangkalan' },
];

export const PETANI_NAMES = [
  'H. Achmad Syafi\'i',
  'Mat Rais',
  'H. Moh. Thohir',
  'Bunawi',
  'H. Syamsul Arifin',
  'Mat Nawawi',
  'Abd. Rasyid',
  'H. Fathurrosi',
  'Mat Sani',
  'H. Supandi',
  'Moch. Zainal',
  'H. Mahrus Ali',
  'Marzuki',
  'H. Abdul Karim',
  'Mat Dahlan',
  'H. Bahruddin',
  'Muksin',
  'H. Hasan Basri',
  'Mat Salim',
  'H. Munawar',
  'Mahfud',
  'H. Saiful Bahri',
  'Mat Halim',
  'H. Syakur',
  'Rusli',
  'H. Taufiqurrahman',
  'Mat Sholeh',
  'H. Holilurrahman',
  'Subhan',
  'H. Zainuddin',
  'Mat Juri',
  'H. Mas\'ud',
  'Samsuri',
  'H. Faisol',
  'Mat Latif',
  'H. Busro',
  'Suhaimi',
  'H. Imron Rosyadi',
  'Mat Bakri',
  'H. Ansori',
  'Syarifuddin',
  'H. Nurul Huda',
  'Mat Said',
  'H. Ismail',
  'Asmuni'
];

// Grade distribution weights:
// 52% Grade A, 37% Grade B, 6% Grade C, 3% Grade D, 1.5% Grade E, 0.5% Grade F
export const GRADE_PRICES: Record<string, number> = {
  'A': 140000,
  'B': 120000,
  'C': 100000,
  'D': 80000,
  'E': 60000,
  'F': 40000,
};

export const GUDANG_LIST = [
  { id: 'GDG-01', nama: 'Gudang Pusat Induk & Intake Pamekasan' },
  { id: 'GDG-02', nama: 'Gudang Penyangga & Fermentasi Sumenep' },
  { id: 'GDG-03', nama: 'Gudang Transit Pantura & QC Sampang' },
  { id: 'GDG-04', nama: 'Gudang Distribusi Gerbang Barat Bangkalan' },
];

export interface GeneratorResult {
  petaniList: Petani[];
  barangList: Barang[];
  transaksiList: TransaksiPembelian[];
  pengirimanList: PengirimanBarang[];
  sampleList: PengirimanSample[];
}

export function generateMaduraTobaccoDataset(): GeneratorResult {
  const petaniList: Petani[] = [];
  const barangList: Barang[] = [];
  const transaksiList: TransaksiPembelian[] = [];
  const pengirimanList: PengirimanBarang[] = [];
  const sampleList: PengirimanSample[] = [];

  // Bal counts per petani (range 3 - 15)
  // Designed so sum ~350 bal with exact grade breakdown: ~52% A, ~37% B, ~11% others
  const balCounts = [
    12, 8, 15, 6, 9, 14, 7, 10, 5, 11,
    13, 6, 8, 15, 7, 4, 9, 12, 6, 10,
    14, 5, 8, 11, 7, 13, 6, 9, 15, 4,
    8, 10, 12, 5, 7, 11, 14, 6, 8, 13,
    5, 9, 12, 7, 10
  ]; // 45 petani, total 401 bal

  // Target Grade Distribution:
  // 52% A = ~208 bal
  // 37% B = ~148 bal
  // 7% C  = ~28 bal
  // 3% D  = ~12 bal
  // 1% E  = ~4 bal
  // 0.25% F = ~1 bal

  let balCounter = 1;
  let trxCounter = 1;

  // Grade allocator pool to guarantee strict percentages
  const gradePool: string[] = [];
  const totalBals = balCounts.reduce((a, b) => a + b, 0); // 401
  const countA = Math.round(totalBals * 0.52); // 209
  const countB = Math.round(totalBals * 0.37); // 148
  const countC = 28;
  const countD = 11;
  const countE = 4;
  const countF = totalBals - (countA + countB + countC + countD + countE); // 1

  for (let i = 0; i < countA; i++) gradePool.push('A');
  for (let i = 0; i < countB; i++) gradePool.push('B');
  for (let i = 0; i < countC; i++) gradePool.push('C');
  for (let i = 0; i < countD; i++) gradePool.push('D');
  for (let i = 0; i < countE; i++) gradePool.push('E');
  for (let i = 0; i < countF; i++) gradePool.push('F');

  // Deterministic shuffle with fixed seed
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = gradePool.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [gradePool[i], gradePool[j]] = [gradePool[j], gradePool[i]];
  }

  let gradePoolIndex = 0;

  // Generate 45 Petani & their intake transactions
  for (let pIdx = 0; pIdx < 45; pIdx++) {
    const pNumberStr = String(pIdx + 1).padStart(3, '0');
    const petaniId = `PTN-2026-${pNumberStr}`;
    const namaPetani = PETANI_NAMES[pIdx];
    const loc = MADURA_LOCATIONS[pIdx % MADURA_LOCATIONS.length];
    const alamat = `${loc.desa}, ${loc.kec}, ${loc.kab}`;
    const noHp = `081${Math.floor(200000000 + pseudoRandom() * 700000000)}`;
    const numBalsForThisPetani = balCounts[pIdx];

    // Transaction Date: Spread across Aug 01 - Aug 14, 2026
    const dayOffset = Math.floor((pIdx / 45) * 14); // 0 to 13
    const day = String(1 + dayOffset).padStart(2, '0');
    const hour = String(7 + Math.floor(pseudoRandom() * 9)).padStart(2, '0');
    const minute = String(Math.floor(pseudoRandom() * 60)).padStart(2, '0');
    const tanggalTransaksi = `2026-08-${day}T${hour}:${minute}:00`;
    const tanggalDateOnly = `2026-08-${day}`;

    // Warehouse assignment based on regency
    let gudangObj = GUDANG_LIST[0]; // default Pamekasan
    if (loc.kab.includes('Sumenep')) gudangObj = GUDANG_LIST[1];
    else if (loc.kab.includes('Sampang')) gudangObj = GUDANG_LIST[2];
    else if (loc.kab.includes('Bangkalan')) gudangObj = GUDANG_LIST[3];

    // Create Transaksi Item Bal
    const trxItems: TransaksiItemBal[] = [];
    const trxBarangIds: string[] = [];
    let totalKotorTrx = 0;
    let totalPotonganKuliTrx = 0;
    let totalPotonganTikarTrx = 0;
    let totalBeratNettoTrx = 0;

    // Determine transaction status:
    // pIdx 42, 43, 44 (last 3): Belum ditimbang (Menunggu Timbang di Proses 2)
    // pIdx 39, 40, 41: Sudah ditimbang, ada di Kasir tapi Belum Dibayar (Belum Lunas)
    // pIdx 0 .. 38: Sudah Ditimbang dan Sudah Lunas
    const isBelumDitimbang = pIdx >= 42;
    const isBelumDibayar = pIdx >= 39 && pIdx < 42;
    const isLunas = pIdx < 39;

    for (let b = 0; b < numBalsForThisPetani; b++) {
      const balNumberStr = String(balCounter).padStart(3, '0');
      const dateCompact = `202608${day}`;
      const barangId = `BAL-${dateCompact}-${balNumberStr}`;
      const barcode = barangId;
      const noBal = `BAL-${balNumberStr}`;

      const grade = gradePool[gradePoolIndex++] || 'A';
      const hargaKg = GRADE_PRICES[grade] || 120000;

      // Realistic bal weight: 42 to 52 kg
      const baseBerat = 43 + Math.floor(pseudoRandom() * 10);
      const beratNetto = isBelumDitimbang ? 0 : baseBerat;
      const beratBruto = isBelumDitimbang ? 0 : baseBerat + 2; // tara 2kg
      const totalKotorBal = isBelumDitimbang ? 0 : beratNetto * hargaKg;
      const potonganKuliBal = isBelumDitimbang ? 0 : 7000;
      const potonganTikarBal = isBelumDitimbang ? 0 : (b % 3 === 0 ? 75000 : 0);
      const potonganBalTotal = isBelumDitimbang ? 0 : potonganKuliBal + potonganTikarBal;
      const subtotalBersih = isBelumDitimbang ? 0 : totalKotorBal - potonganBalTotal;

      const itemBal: TransaksiItemBal = {
        item_id: `ITM-${dateCompact}-${balNumberStr}`,
        no_bal: noBal,
        barcode: barcode,
        kode_grade: grade,
        harga_per_kg: hargaKg,
        ganti_tikar: b % 3 === 0,
        berat_bruto_kg: beratBruto,
        potongan_tara_kg: isBelumDitimbang ? 0 : 2,
        berat_kg: beratNetto,
        potongan_kuli: potonganKuliBal,
        potongan_tikar: potonganTikarBal,
        potongan: potonganBalTotal,
        total_kotor: totalKotorBal,
        subtotal_bersih: subtotalBersih,
        status_timbang: isBelumDitimbang ? 'menunggu_timbang' : 'selesai_timbang',
        lokasi_simpan: isBelumDitimbang ? '' : (b % 2 === 0 ? 'Blok A (Utara)' : 'Blok B (Selatan)'),
        barang_id: barangId,
        catatan: `Tembakau Madura Rajangan ${grade === 'A' ? 'Super Kemilau' : grade === 'B' ? 'Premium Harum' : 'Standar Panen'}`,
      };

      trxItems.push(itemBal);
      trxBarangIds.push(barangId);

      totalKotorTrx += totalKotorBal;
      totalPotonganKuliTrx += potonganKuliBal;
      totalPotonganTikarTrx += potonganTikarBal;
      totalBeratNettoTrx += beratNetto;

      // Only add to warehouse inventory if already weighed
      if (!isBelumDitimbang) {
        const barang: Barang = {
          barang_id: barangId,
          barcode: barcode,
          kode_grade: grade,
          no_bal: noBal,
          berat_kg: beratNetto,
          status_stok: 'di_gudang', // will update sent ones later
          gudang_id: gudangObj.id,
          lokasi_gudang: gudangObj.nama,
          tanggal_masuk: tanggalTransaksi,
          petani_id: petaniId,
          transaksi_pembelian_id: `TRX-${dateCompact}-${String(trxCounter).padStart(3, '0')}`,
          nama_petani: namaPetani,
          desa_kecamatan: `${loc.desa}, ${loc.kec}`,
          catatan: `Kadar air 14.5%, varietas Prancak Madura asli, mutu ${grade}.`,
        };

        barangList.push(barang);
      }
      balCounter++;
    }

    const totalPotonganTrx = totalPotonganKuliTrx + totalPotonganTikarTrx;
    const hargaFinalTrx = totalKotorTrx - totalPotonganTrx;
    const trxId = `TRX-202608${day}-${String(trxCounter).padStart(3, '0')}`;
    const kuponNo = `KUP-${String(trxCounter).padStart(3, '0')}`;

    // Determine primary grade of transaction
    const gradeCountsInTrx: Record<string, number> = {};
    trxItems.forEach(it => {
      gradeCountsInTrx[it.kode_grade] = (gradeCountsInTrx[it.kode_grade] || 0) + 1;
    });
    const dominantGrade = Object.keys(gradeCountsInTrx).reduce((a, b) => 
      (gradeCountsInTrx[a] || 0) >= (gradeCountsInTrx[b] || 0) ? a : b, 'A'
    );

    const singleGrade = Object.keys(gradeCountsInTrx).length === 1;

    const trx: TransaksiPembelian = {
      transaksi_id: trxId,
      no_kupon: kuponNo,
      petani_id: petaniId,
      nama_petani: namaPetani,
      nomor_kartu: `KRT-MD-${pNumberStr}`,
      no_hp: noHp,
      desa_kecamatan: `${loc.desa}, ${loc.kec}`,
      no_bal: trxItems.map(it => it.no_bal).join(', '),
      kode_grade: singleGrade ? dominantGrade : 'Multi-Grade',
      total_bal: numBalsForThisPetani,
      bal_selesai_timbang: isBelumDitimbang ? 0 : numBalsForThisPetani,
      items: trxItems,
      barang_ids: trxBarangIds,
      jenis_timbang: 'netto',
      berat_terukur_kg: totalBeratNettoTrx,
      potongan_tara_kg: isBelumDitimbang ? 0 : numBalsForThisPetani * 2,
      berat_kg: totalBeratNettoTrx,
      lokasi_gudang: isBelumDitimbang ? '' : gudangObj.nama,
      harga_per_kg: totalBeratNettoTrx > 0 ? Math.round(totalKotorTrx / totalBeratNettoTrx) : (GRADE_PRICES[dominantGrade] || 120000),
      total_kotor: totalKotorTrx,
      potongan_kuli: totalPotonganKuliTrx,
      potongan_tikar: totalPotonganTikarTrx,
      total_potongan: totalPotonganTrx,
      total_harga_beli: totalKotorTrx,
      harga_final: hargaFinalTrx,
      status_transaksi: isBelumDitimbang ? 'menunggu' : 'lengkap',
      status_tahap: isBelumDitimbang ? 'menunggu_timbang' : 'lengkap',
      status_pembayaran: isLunas ? 'lunas' : 'belum_lunas',
      metode_pembayaran: isLunas ? 'cash' : 'kredit',
      no_bukti_kas: isLunas ? `BKK-202608${day}-${String(trxCounter).padStart(3, '0')}` : undefined,
      catatan_kasir: isLunas ? 'Pembayaran tunai kasir (Cash) lunas saat penyerahan tiket.' : 'Petani belum menyerahkan tiket pembayaran ke kasir (Kredit).',
      status_nota: isLunas ? 'sudah_cetak' : 'belum_cetak',
      dibayar_pada: isLunas ? tanggalTransaksi : undefined,
      dibayar_oleh: isLunas ? 'Kasir Loket 1' : undefined,
      tanggal_transaksi: tanggalTransaksi,
      operator_nama: 'Ahmad Fauzi (Operator Loket)',
      catatan: isBelumDitimbang 
        ? `Kupon ${kuponNo} menunggu timbang (${numBalsForThisPetani} bal disortir).`
        : `Pembelian intake petani ${namaPetani} (${numBalsForThisPetani} bal).`,
    };

    transaksiList.push(trx);

    // Create Petani record
    const petani: Petani = {
      petani_id: petaniId,
      nama_petani: namaPetani,
      no_hp: noHp,
      alamat: alamat,
      status_aktif: true,
      nomor_kartu: `KRT-MD-${pNumberStr}`,
      desa_kecamatan: `${loc.desa}, ${loc.kec}`,
      tanggal_daftar: '2026-07-15',
      catatan: `Petani binaan sentra tembakau ${loc.kab}`,
      statistik: {
        total_setoran_bal: numBalsForThisPetani,
        total_berat_kg: totalBeratNettoTrx,
        kunjungan_terakhir: tanggalDateOnly,
        grade_dominan: dominantGrade,
      },
    };

    petaniList.push(petani);
    trxCounter++;
  }

  // ==========================================
  // 2. 5 PENGIRIMAN REGULER (20-30 Bal per Pengiriman)
  //    Terjadi setelah dan paralel dengan jadwal pembelian (selisih 1-4 hari)
  // ==========================================
  const factoryDestinations = [
    { pabrik: 'PT Gudang Garam Tbk - Unit Pengolahan Kediri', alamat: 'Jl. Semampir II No. 1, Kediri, Jawa Timur', driver: 'Slamet Riyadi', plat: 'M 8124 UA' },
    { pabrik: 'PT Djarum - Central Blending Plant Kudus', alamat: 'Jl. Jenderal Sudirman No. 28, Kudus, Jawa Tengah', driver: 'Joko Supriyanto', plat: 'M 9032 GB' },
    { pabrik: 'PT HM Sampoerna Tbk - Rungkut Plant Surabaya', alamat: 'Jl. Rungkut Industri Raya No. 18, Surabaya', driver: 'Bambang Wahyudi', plat: 'L 8241 XY' },
    { pabrik: 'PR Sukun - Pabrik Kretek Kudus', alamat: 'Jl. Raya Gondosari, Gebog, Kudus, Jawa Tengah', driver: 'Sugeng Hermanto', plat: 'W 9102 UP' },
    { pabrik: 'PR Wismilak - Grha Wismilak Surabaya', alamat: 'Jl. Dr. Soetomo No. 27, Tegalsari, Surabaya', driver: 'Edi Purwanto', plat: 'N 8821 AB' },
  ];

  // Dates for the 5 shipments: Aug 04, Aug 07, Aug 10, Aug 13, Aug 16
  const shipmentConfigs = [
    { date: '2026-08-04T08:30:00', balCount: 24, destIdx: 0, sjNo: 'SJ-20260804-001' },
    { date: '2026-08-07T09:15:00', balCount: 28, destIdx: 1, sjNo: 'SJ-20260807-002' },
    { date: '2026-08-10T08:00:00', balCount: 25, destIdx: 2, sjNo: 'SJ-20260810-003' },
    { date: '2026-08-13T10:00:00', balCount: 26, destIdx: 3, sjNo: 'SJ-20260813-004' },
    { date: '2026-08-16T08:45:00', balCount: 27, destIdx: 4, sjNo: 'SJ-20260816-005' },
  ];

  let shipmentBalPointer = 0;

  shipmentConfigs.forEach((cfg, sIdx) => {
    const dest = factoryDestinations[cfg.destIdx];
    const shipmentBarangIds: string[] = [];
    const shipmentBarcodes: string[] = [];
    let totalKg = 0;
    const rincianGrade: Record<string, { bal: number; kg: number }> = {};

    for (let c = 0; c < cfg.balCount; c++) {
      if (shipmentBalPointer < barangList.length) {
        const item = barangList[shipmentBalPointer];
        // Mark barang as keluar (delivered to factory)
        item.status_stok = 'keluar';
        item.tanggal_keluar = cfg.date;
        item.catatan = `${item.catatan || ''} [Terkirim ke ${dest.pabrik} via ${cfg.sjNo}]`.trim();

        shipmentBarangIds.push(item.barang_id);
        shipmentBarcodes.push(item.barcode);
        totalKg += item.berat_kg;

        if (!rincianGrade[item.kode_grade]) {
          rincianGrade[item.kode_grade] = { bal: 0, kg: 0 };
        }
        rincianGrade[item.kode_grade].bal += 1;
        rincianGrade[item.kode_grade].kg += item.berat_kg;

        shipmentBalPointer++;
      }
    }

    const pengiriman: PengirimanBarang = {
      pengiriman_id: `DO-202608-${String(sIdx + 1).padStart(3, '0')}`,
      no_surat_jalan: cfg.sjNo,
      tujuan: dest.pabrik,
      driver_nama: dest.driver,
      plat_nomor: dest.plat,
      tanggal_kirim: cfg.date,
      tanggal_diterima: cfg.date.replace('T', ' ').substring(0, 10),
      barang_ids: shipmentBarangIds,
      barcode_list: shipmentBarcodes,
      total_bal: shipmentBarangIds.length,
      total_berat_kg: totalKg,
      status: 'dikirim',
      nomor_kontrak: `KTR-SA-2026/08/${String(sIdx + 1).padStart(3, '0')}`,
      catatan: `Pengiriman resmi Bal Tembakau Madura ke ${dest.pabrik}`,
      petugas: 'Hendra Gunawan (Logistik & Ekspedisi)',
      dibuat_oleh: 'Hendra Gunawan',
      rincian_grade: rincianGrade,
    };

    pengirimanList.push(pengiriman);
  });

  // ==========================================
  // 3. 3 PENGIRIMAN SAMPLE QC (Random Bal Sample)
  // ==========================================
  // Pick 3 random remaining bal in warehouse for QC
  const availableForQC = barangList.filter(b => b.status_stok === 'di_gudang');
  const qcBal1 = availableForQC[5] || barangList[135];
  const qcBal2 = availableForQC[25] || barangList[160];
  const qcBal3 = availableForQC[45] || barangList[190];

  const sample1: PengirimanSample = {
    sample_id: 'SMP-20260805-001',
    barang_id: qcBal1.barang_id,
    barcode_sumber: qcBal1.barcode,
    kode_grade: qcBal1.kode_grade,
    sumber: qcBal1.lokasi_gudang || 'Gudang Pusat Induk & Intake Pamekasan',
    tujuan: 'PT Djarum Kudus - Laboratorium Uji Mutu & Nikotin',
    berat_sample_gram: 500,
    tanggal_kirim: '2026-08-05T10:00:00',
    tanggal_respon: '2026-08-06T15:30:00',
    status: 'disetujui',
    catatan: `Sample terverifikasi Grade ${qcBal1.kode_grade}. Kadar air 14.2%, nikotin 3.8%, pembakaran sangat harum.`,
    dikirim_oleh: 'dr. Siti Rahmawati (QC Mutu)',
    nama_petani: qcBal1.nama_petani,
  };

  const sample2: PengirimanSample = {
    sample_id: 'SMP-20260809-002',
    barang_id: qcBal2.barang_id,
    barcode_sumber: qcBal2.barcode,
    kode_grade: qcBal2.kode_grade,
    sumber: qcBal2.lokasi_gudang || 'Gudang Penyangga & Fermentasi Sumenep',
    tujuan: 'PT Gudang Garam Tbk Kediri - QC Flavor & Elastisitas Daun',
    berat_sample_gram: 600,
    tanggal_kirim: '2026-08-09T11:20:00',
    tanggal_respon: '2026-08-11T09:45:00',
    status: 'disetujui',
    catatan: `Sample lolos standarisasi Grade ${qcBal2.kode_grade} untuk blending kretek filter. Warna cerah merata.`,
    dikirim_oleh: 'dr. Siti Rahmawati (QC Mutu)',
    nama_petani: qcBal2.nama_petani,
  };

  const sample3: PengirimanSample = {
    sample_id: 'SMP-20260814-003',
    barang_id: qcBal3.barang_id,
    barcode_sumber: qcBal3.barcode,
    kode_grade: qcBal3.kode_grade,
    sumber: qcBal3.lokasi_gudang || 'Gudang Transit Pantura & QC Sampang',
    tujuan: 'Balai Pengujian Mutu Tembakau Jawa Timur - Surabaya',
    berat_sample_gram: 750,
    tanggal_kirim: '2026-08-14T14:15:00',
    tanggal_respon: '2026-08-15T16:00:00',
    status: 'disetujui',
    catatan: 'Uji sertifikasi kemurnian rajangan Tembakau Madura Prancak. Hasil uji grade valid.',
    dikirim_oleh: 'dr. Siti Rahmawati (QC Mutu)',
    nama_petani: qcBal3.nama_petani,
  };

  sampleList.push(sample1, sample2, sample3);

  return {
    petaniList,
    barangList,
    transaksiList,
    pengirimanList,
    sampleList,
  };
}
