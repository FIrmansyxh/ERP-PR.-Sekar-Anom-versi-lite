// Utility functions for ERP Gudang Tembakau

export function formatRupiah(amount?: number | null): string {
  if (amount === undefined || amount === null) return 'Rp 0';
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(isoString?: string | null): string {
  if (!isoString) return 'Belum Pernah';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Belum Pernah';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Belum Pernah';
  }
}

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function generatePetaniId(existingList: { petani_id?: string }[], targetYear?: number): string {
  const currentYear = targetYear || new Date().getFullYear();
  const prefix = `PTN-${currentYear}-`;
  
  // Find all existing sequence numbers for this year
  const seqs = existingList
    .map(p => (p.petani_id || '').trim().toUpperCase())
    .filter(id => id.startsWith(prefix))
    .map(id => {
      const numPart = id.replace(prefix, '');
      const parsed = parseInt(numPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

  const nextSeq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  const pad = String(nextSeq).padStart(3, '0');
  let id = `${prefix}${pad}`;
  
  let attempt = 1;
  while (existingList.some(p => (p.petani_id || '').toUpperCase() === id.toUpperCase())) {
    id = `${prefix}${String(nextSeq + attempt).padStart(3, '0')}`;
    attempt++;
  }
  return id;
}

export function validateGradeCode(code: string): { isValid: boolean; message?: string } {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: 'Kode grade wajib diisi.' };
  }
  const trimmed = code.trim();
  if (trimmed.length > 3) {
    return { isValid: false, message: 'Kode grade maksimal 3 karakter (contoh: A, A1, A+, AB).' };
  }
  const firstChar = trimmed.charAt(0);
  if (!/^[A-Za-z]/.test(firstChar)) {
    return { isValid: false, message: 'Karakter pertama harus berupa huruf alfabet (A-Z).' };
  }
  return { isValid: true };
}

// Format Date as DDMMYY (e.g. 140826 for 14 Agustus 2026)
export function formatDateDDMMYY(inputDate?: Date | string | null): string {
  let d: Date;
  if (!inputDate) {
    d = new Date();
  } else if (typeof inputDate === 'string') {
    d = new Date(inputDate);
    if (isNaN(d.getTime())) {
      // try parsing YYYY-MM-DD or DD/MM/YYYY
      if (inputDate.includes('/')) {
        const parts = inputDate.split('/');
        if (parts.length === 3) {
          const dd = parts[0].padStart(2, '0');
          const mm = parts[1].padStart(2, '0');
          const yy = parts[2].slice(-2);
          return `${dd}${mm}${yy}`;
        }
      }
      d = new Date();
    }
  } else {
    d = inputDate;
  }

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

// Generate Standard Tobacco Bal ID / Barcode: [Grade]-[DDMMYY]-[Urutan 001-999]
// Example: A-140826-001, E-140826-034
export function generateBalId(grade: string, date?: Date | string | null, sequenceNumber: number = 1): string {
  const cleanGrade = (grade || 'A').toUpperCase().trim();
  const dateCode = formatDateDDMMYY(date);
  const seqCode = String(sequenceNumber).padStart(3, '0');
  return `${cleanGrade}-${dateCode}-${seqCode}`;
}

// Generate Simple No Bal (e.g. E0034 or A0001)
export function generateNoBalSimple(grade: string, sequenceNumber: number = 1): string {
  const cleanGrade = (grade || 'A').toUpperCase().trim();
  return `${cleanGrade}${String(sequenceNumber).padStart(4, '0')}`;
}

// Generate Next Unique No Bal checking against existing warehouse inventory & current form batch
export function generateNextUniqueNoBal(
  grade: string,
  existingList: { no_bal?: string; barang_id?: string; barcode?: string }[] = [],
  currentBatch: { noBal: string }[] = []
): string {
  const cleanGrade = (grade || 'A').toUpperCase().trim();
  let maxSeq = 0;
  const regex = new RegExp(`^${cleanGrade}(\\d+)$`, 'i');

  existingList.forEach((item) => {
    const match = (item.no_bal || '').match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  currentBatch.forEach((item) => {
    const match = (item.noBal || '').match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  let nextSeq = maxSeq > 0 ? maxSeq + 1 : 1;
  let candidate = `${cleanGrade}${String(nextSeq).padStart(4, '0')}`;

  const isTaken = (val: string) => {
    const v = val.toLowerCase().trim();
    return (
      existingList.some((e) => (e.no_bal || '').toLowerCase().trim() === v || (e.barang_id || '').toLowerCase().trim() === v) ||
      currentBatch.some((c) => (c.noBal || '').toLowerCase().trim() === v)
    );
  };

  while (isTaken(candidate)) {
    nextSeq++;
    candidate = `${cleanGrade}${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}

// Generate Delivery Order / No. Surat Jalan (e.g. SJ-2026-08-0012)
export function generateNoSuratJalanSimple(sequenceNumber: number = 1, date?: Date | string | null): string {
  const now = date ? new Date(date) : new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `SJ-${yr}-${mo}-${seq}`;
}

// Generate Sample ID: SMP-[Grade]-[DDMMYY]-[Urutan 001-999]
export function generateSampleId(grade: string, date?: Date | string | null, sequenceNumber: number = 1): string {
  const cleanGrade = (grade || 'A').toUpperCase().trim();
  const dateCode = formatDateDDMMYY(date);
  const seqCode = String(sequenceNumber).padStart(3, '0');
  return `SMP-${cleanGrade}-${dateCode}-${seqCode}`;
}

export function generateSuggestedCardNumber(regionCode: string = 'TMG'): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `KRT-${regionCode.toUpperCase()}-${randomNum}`;
}

// Generate simple visual barcode pattern based on string hash for high-fidelity ID card rendering
export function generateBarcodeBars(code: string): { width: number; height: number }[] {
  const bars: { width: number; height: number }[] = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed << 5) - seed + code.charCodeAt(i);
    seed |= 0;
  }
  const absSeed = Math.abs(seed);
  // standard guard bars
  bars.push({ width: 2, height: 100 }, { width: 1, height: 100 }, { width: 2, height: 100 });
  for (let i = 0; i < 28; i++) {
    const bit = (absSeed >> (i % 24)) & (i % 3 === 0 ? 3 : 1);
    const width = bit === 0 ? 1 : bit === 1 ? 2 : 2;
    const height = 70 + ((i * 13 + absSeed) % 30);
    bars.push({ width, height });
    bars.push({ width: 1, height: 60 }); // space/shorter
  }
  bars.push({ width: 2, height: 100 }, { width: 1, height: 100 }, { width: 2, height: 100 });
  return bars;
}

// Simple pseudo QR Matrix renderer for printable ID card
export function generateSimpleQrMatrix(data: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Finder patterns at (0,0), (0, 14), (14, 0)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(14, 0);
  drawFinder(0, 14);

  // Fill in timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Generate data based on hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= 13;
      const inFinder3 = r >= 13 && c < 8;
      if (!inFinder1 && !inFinder2 && !inFinder3 && r !== 6 && c !== 6) {
        matrix[r][c] = ((posHash ^ (r * 17 + c * 31)) % 3) === 0;
      }
    }
  }
  return matrix;
}
