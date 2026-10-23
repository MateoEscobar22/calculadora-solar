import React from 'react';
import { Sun, Battery } from 'lucide-react';

interface ArrayWiringDiagramProps {
  series: number;
  parallel: number;
  type: 'panel' | 'battery';
  unitSpec: string; // Ej: "550W" o "12V 100Ah"
}

export const ArrayWiringDiagram: React.FC<ArrayWiringDiagramProps> = ({
  series,
  parallel,
  type,
  unitSpec,
}) => {
  // Limitamos la representación gráfica a máximo 4x4 para garantizar legibilidad en pantalla
  const displayS = Math.min(series, 4);
  const displayP = Math.min(parallel, 4);

  const isPanel = type === 'panel';
  const mainColor = isPanel ? '#f59e0b' : '#10b981'; // Ámbar para paneles, Esmeralda para baterías
  const accentBadge = isPanel ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  // Dimensiones del lienzo esquemático
  const colWidth = 140;
  const rowHeight = 70;
  const svgWidth = displayP * colWidth + 60;
  const svgHeight = displayS * rowHeight + 90;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      {/* Cabecera del Diagrama */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          {isPanel ? <Sun className="w-5 h-5 text-amber-400" /> : <Battery className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold text-slate-200">
            Esquema Real de Cableado ({series}S × {parallel}P)
          </span>
        </div>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${accentBadge}`}>
          Topología: {series} en Serie / {parallel} en Paralelo
        </span>
      </div>

      {/* Área del Plano SVG */}
      <div className="overflow-x-auto flex justify-center py-2">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="font-mono text-[10px]"
          style={{ minWidth: `${Math.min(svgWidth, 320)}px` }}
        >
          {/* 1. LÍNEAS DE BUSES COLECTORES PARALELO (Superior = Positivo Red, Inferior = Negativo Gray) */}
          {/* Bus Positivo (+) */}
          <line
            x1={30}
            y1={20}
            x2={svgWidth - 30}
            y2={20}
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="none"
          />
          <text x={10} y={23} fill="#ef4444" fontWeight="bold" fontSize="11">BUS (+)</text>

          {/* Bus Negativo (-) */}
          <line
            x1={30}
            y1={svgHeight - 20}
            x2={svgWidth - 30}
            y2={svgHeight - 20}
            stroke="#64748b"
            strokeWidth="3"
          />
          <text x={10} y={svgHeight - 17} fill="#64748b" fontWeight="bold" fontSize="11">BUS (-)</text>

          {/* 2. RENDERIZADO DE STRINGS / RAMAS */}
          {Array.from({ length: displayP }).map((_, pIdx) => {
            const xCenter = 50 + pIdx * colWidth + 40;

            return (
              <g key={`string-${pIdx}`}>
                {/* Cable Positivo desde el Bus Top al primer equipo (+ Terminal) */}
                <line
                  x1={xCenter - 25}
                  y1={20}
                  x2={xCenter - 25}
                  y2={50}
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <circle cx={xCenter - 25} cy={20} r={3} fill="#ef4444" />

                {/* Cable Negativo desde el último equipo (- Terminal) al Bus Bottom */}
                <line
                  x1={xCenter + 25}
                  y1={50 + (displayS - 1) * rowHeight + 35}
                  x2={xCenter + 25}
                  y2={svgHeight - 20}
                  stroke="#64748b"
                  strokeWidth="2"
                />
                <circle cx={xCenter + 25} cy={svgHeight - 20} r={3} fill="#64748b" />

                {/* Cajas de Equipos y Puentes en Serie */}
                {Array.from({ length: displayS }).map((_, sIdx) => {
                  const yTop = 50 + sIdx * rowHeight;

                  return (
                    <g key={`unit-${pIdx}-${sIdx}`}>
                      {/* Cuerpo de la Caja (Panel o Batería) */}
                      <rect
                        x={xCenter - 45}
                        y={yTop}
                        width={90}
                        height={35}
                        rx={6}
                        fill="#0f172a"
                        stroke={mainColor}
                        strokeWidth="1.5"
                      />

                      {/* Texto con Nombre y Especificación */}
                      <text
                        x={xCenter}
                        y={yTop + 16}
                        fill="#f8fafc"
                        textAnchor="middle"
                        fontWeight="bold"
                        fontSize="10"
                      >
                        {isPanel ? `Panel ${sIdx + 1}` : `Bat ${sIdx + 1}`}
                      </text>
                      <text
                        x={xCenter}
                        y={yTop + 27}
                        fill="#94a3b8"
                        textAnchor="middle"
                        fontSize="8"
                      >
                        {unitSpec}
                      </text>

                      {/* Terminal Positivo (+) en Rojo */}
                      <circle cx={xCenter - 25} cy={yTop} r={3.5} fill="#ef4444" />
                      <text x={xCenter - 25} y={yTop - 5} fill="#ef4444" textAnchor="middle" fontSize="8" fontWeight="bold">+</text>

                      {/* Terminal Negativo (-) en Gris */}
                      <circle cx={xCenter + 25} cy={yTop + 35} r={3.5} fill="#64748b" />
                      <text x={xCenter + 25} y={yTop + 44} fill="#64748b" textAnchor="middle" fontSize="8" fontWeight="bold">-</text>

                      {/* Cable de Puente Serie (Conecta el (-) de este equipo con el (+) del siguiente) */}
                      {sIdx < displayS - 1 && (
                        <path
                          d={`M ${xCenter + 25} ${yTop + 35} C ${xCenter + 25} ${yTop + 50}, ${xCenter - 25} ${yTop + 35}, ${xCenter - 25} ${yTop + 70}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda Técnica Infográfica */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap justify-around text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Conductor Positivo (+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Conductor Negativo (-)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 border-b-2 border-dashed border-emerald-500"></span> Puente Serie
        </span>
      </div>
    </div>
  );
};