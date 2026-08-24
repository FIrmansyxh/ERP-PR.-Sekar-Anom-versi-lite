import React from 'react';

interface BarcodeSvgProps {
  value: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  className = '',
  height = 50,
  showText = true,
}) => {
  // Generate deterministic bar widths based on input string hash
  const generateBars = (text: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    // Start guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 1, isBlack: true });
    bars.push({ width: 2, isBlack: false });

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const b1 = (code % 3) + 1;
      const b2 = ((code >> 1) % 2) + 1;
      const b3 = ((code >> 2) % 3) + 1;
      const b4 = ((code >> 3) % 2) + 1;

      bars.push({ width: b1, isBlack: true });
      bars.push({ width: b2, isBlack: false });
      bars.push({ width: b3, isBlack: true });
      bars.push({ width: b4, isBlack: false });
    }

    // End guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    return bars;
  };

  const bars = generateBars(value);
  let currentX = 10;
  const barElements = bars.map((bar, idx) => {
    const x = currentX;
    currentX += bar.width * 2;
    if (bar.isBlack) {
      return (
        <rect
          key={idx}
          x={x}
          y={4}
          width={bar.width * 2}
          height={height}
          fill="#0f172a"
        />
      );
    }
    return null;
  });

  const totalWidth = currentX + 10;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height + 8}`}
        className="w-full max-h-16"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={totalWidth} height={height + 8} fill="#ffffff" rx={2} />
        {barElements}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-bold text-slate-800 tracking-wider mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};
