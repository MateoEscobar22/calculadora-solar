import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Battery, Zap, Gauge, Layers, Activity, CheckCircle2, AlertTriangle, PanelTop, ArrowRight, Maximize2, Minimize2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResultCard } from '@/components/ResultCard';
import type { SolarResults, SystemParams, BatterySpec, PanelSpec, Appliance } from '@/lib/solar';
import { formatNumber } from '@/lib/solar';
import { generateSolarPDF } from '@/lib/generatePDF';

interface ResultsDashboardProps {
  appliances: Appliance[];
  results: SolarResults;
  params: SystemParams;
  battery: BatterySpec;
  panel: PanelSpec;
}

export function ResultsDashboard({
  appliances,
  results,
  params,
  battery,
  panel,
}: ResultsDashboardProps) {
  const r = results;

  const [panelFullscreen, setPanelFullscreen] = useState(false);
  const [batteryFullscreen, setBatteryFullscreen] = useState(false);

  // Bloquear el scroll del fondo (body) mientras un modal esté abierto
  useEffect(() => {
    if (panelFullscreen || batteryFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [panelFullscreen, batteryFullscreen]);

  const renderSvgContent = (series: number, parallel: number, type: 'panel' | 'battery', isLarge: boolean) => {
    const displayS = Math.min(series, 6);
    const displayP = parallel;
    const isPanel = type === 'panel';
    const mainColor = isPanel ? '#f59e0b' : '#10b981';
    const unitText = isPanel ? `${panel.potenciaPico}W` : `${battery.voltajeNominal}V`;
    
    const colWidth = isLarge ? 150 : 130;
    const rowHeight = isLarge ? 75 : 65;
    const svgWidth = Math.max(displayP * colWidth + 60, isLarge ? 1000 : 350);
    const svgHeight = displayS * rowHeight + 100;

    return (
      <div className="w-full h-full overflow-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-max">
          <svg width={svgWidth} height={svgHeight} className="font-mono text-[10px] block mx-auto">
            <line x1={20} y1={20} x2={svgWidth - 20} y2={20} stroke="#ef4444" strokeWidth="3" />
            <text x={10} y={24} fill="#ef4444" fontWeight="bold" fontSize="10">BUS(+)</text>

            {!isPanel && (
              <text x={svgWidth / 2} y={15} fill="#38bdf8" textAnchor="middle" fontSize="9" fontWeight="bold">
                ⚡ [ Conexión Inversor / Regulador Principal - Cargas Cruzadas y Balanceo Activo ]
              </text>
            )}

            <line x1={20} y1={svgHeight - 20} x2={svgWidth - 20} y2={svgHeight - 20} stroke="#64748b" strokeWidth="3" />
            <text x={10} y={svgHeight - 16} fill="#64748b" fontWeight="bold" fontSize="10">BUS(-)</text>

            {Array.from({ length: displayP }).map((_, pIdx) => {
              const xCenter = 50 + pIdx * colWidth + 35;

              return (
                <g key={`string-${pIdx}`}>
                  <line x1={xCenter - 25} y1={20} x2={xCenter - 25} y2={50} stroke="#ef4444" strokeWidth="2" />
                  <circle cx={xCenter - 25} cy={20} r={3} fill="#ef4444" />

                  <line x1={xCenter + 25} y1={50 + (displayS - 1) * rowHeight + 35} x2={xCenter + 25} y2={svgHeight - 20} stroke="#64748b" strokeWidth="2" />
                  <circle cx={xCenter + 25} cy={svgHeight - 20} r={3} fill="#64748b" />

                  {Array.from({ length: displayS }).map((_, sIdx) => {
                    const yTop = 50 + sIdx * rowHeight;
                    const boxWidth = isLarge ? 100 : 80;
                    const boxHeight = isLarge ? 38 : 30;

                    return (
                      <g key={`unit-${pIdx}-${sIdx}`}>
                        <rect
                          x={xCenter - boxWidth / 2}
                          y={yTop}
                          width={boxWidth}
                          height={boxHeight}
                          rx={6}
                          fill="#0f172a"
                          stroke={mainColor}
                          strokeWidth="2"
                        />
                        <text x={xCenter} y={yTop + (isLarge ? 18 : 13)} fill="#f8fafc" textAnchor="middle" fontWeight="bold" fontSize={isLarge ? "11" : "9"}>
                          {isPanel ? `Panel ${sIdx + 1}` : `Bat ${sIdx + 1}`}
                        </text>
                        <text x={xCenter} y={yTop + (isLarge ? 30 : 23)} fill="#94a3b8" textAnchor="middle" fontSize={isLarge ? "9" : "8"}>
                          {unitText}
                        </text>

                        <circle cx={xCenter - 25} cy={yTop} r={3.5} fill="#ef4444" />
                        <text x={xCenter - 25} y={yTop - 5} fill="#ef4444" textAnchor="middle" fontSize="8" fontWeight="bold">+</text>

                        <circle cx={xCenter + 25} cy={yTop + boxHeight} r={3.5} fill="#64748b" />
                        <text x={xCenter + 25} y={yTop + boxHeight + 8} fill="#64748b" textAnchor="middle" fontSize="8" fontWeight="bold">-</text>

                        {sIdx < displayS - 1 && (
                          <line
                            x1={xCenter + 25}
                            y1={yTop + boxHeight}
                            x2={xCenter - 25}
                            y2={yTop + rowHeight}
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeDasharray="4 2"
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
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* MODAL FULLSCREEN PANELES (Renderizado vía Portal directo al body) */}
      {panelFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-400 font-display">
                  Plano Físico - Paneles Solares
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  {r.mS}S × {r.mP}P · Total: {r.mT} paneles
                </p>
              </div>
              <button
                onClick={() => setPanelFullscreen(false)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-700 transition-all shadow-sm shrink-0"
              >
                <X className="w-4 h-4 text-amber-400" /> Cerrar
              </button>
            </div>
            <div className="flex-1 bg-slate-950 overflow-hidden relative">
              {renderSvgContent(r.mS, r.mP, 'panel', true)}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL FULLSCREEN BATERÍAS (Renderizado vía Portal directo al body) */}
      {batteryFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-emerald-400 font-display">
                  Plano Físico - Banco de Baterías
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  {r.aS}S × {r.aP}P · Total: {r.aT} baterías
                </p>
              </div>
              <button
                onClick={() => setBatteryFullscreen(false)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-700 transition-all shadow-sm shrink-0"
              >
                <X className="w-4 h-4 text-emerald-400" /> Cerrar
              </button>
            </div>
            <div className="flex-1 bg-slate-950 overflow-hidden relative">
              {renderSvgContent(r.aS, r.aP, 'battery', true)}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Banner de compatibilidad */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 ${
          r.compatible
            ? 'border-solar-green/30 bg-solar-green/5'
            : 'border-destructive/30 bg-destructive/5'
        }`}
      >
        <div className="flex items-center gap-3">
          {r.compatible ? (
            <CheckCircle2 className="h-7 w-7 text-solar-green" />
          ) : (
            <AlertTriangle className="h-7 w-7 text-destructive" />
          )}
          <div>
            <h3 className="font-display text-lg font-semibold">
              {r.compatible ? 'Sistema Compatible' : 'Revisar Configuración'}
            </h3>
            <p className="text-sm text-muted-foreground">{r.compatMensaje}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            Banco: {params.voltajeBanco}V CC
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Salida: 120V CA / 60Hz
          </Badge>
          <Badge variant="secondary" className="text-xs">
            HSP: {params.hsp} h
          </Badge>
        </div>
      </div>

      {/* Tarjetas de resultados principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ResultCard
          label="Consumo Diario Total (E_CA)"
          value={formatNumber(r.eCA, 0)}
          unit="Wh/día"
          icon={<Zap className="h-5 w-5" />}
          accent="amber"
          description="Sumatoria de cargas CA"
        />
        <ResultCard
          label="Energía a Acumular (E)"
          value={formatNumber(r.e, 0)}
          unit="Wh"
          icon={<Activity className="h-5 w-5" />}
          accent="blue"
          description={`E_T = ${formatNumber(r.eT, 0)} Wh`}
        />
        <ResultCard
          label="Capacidad Total Banco (C)"
          value={formatNumber(r.c, 0)}
          unit="Ah"
          icon={<Battery className="h-5 w-5" />}
          accent="green"
          description={`Útil: ${formatNumber(r.cU, 0)} Ah`}
        />
        <ResultCard
          label="Potencia Nominal Requerida"
          value={formatNumber(r.pN, 0)}
          unit="W"
          icon={<Sun className="h-5 w-5" />}
          accent="amber"
          description={`E_G = ${formatNumber(r.eG, 0)} Wh`}
        />
      </div>

      {/* Sección de arreglos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Arreglo de Paneles */}
        <Card className="overflow-hidden border-solar/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border bg-solar/5">
            <CardTitle className="flex items-center gap-2 font-display">
              <Sun className="h-5 w-5 text-solar" />
              Arreglo de Paneles Solares
            </CardTitle>
            <CardDescription>
              Panel: {panel.potenciaPico}W · V_mp {panel.vmp}V · I_mp {panel.imp}A
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  En serie (M_S)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar tabular-nums">
                  {r.mS}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  En paralelo (M_P)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar tabular-nums">
                  {r.mP}
                </p>
              </div>
              <div className="rounded-lg border border-solar/20 bg-solar/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total (M_T)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar tabular-nums">
                  {r.mT}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-2 sm:px-4 py-3">
              <span className="text-sm text-muted-foreground">Potencia pico instalada (P_NI)</span>
              <span className="font-display text-xl font-bold text-solar">
                {formatNumber(r.pNI, 0)} W
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <PanelTop className="h-4 w-4" /> Plano de Cableado Físico
                </p>
                <button
                  onClick={() => setPanelFullscreen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Ampliar Vista
                </button>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-inner my-3 relative">
                {renderSvgContent(r.mS, r.mP, 'panel', false)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arreglo de Baterías */}
        <Card className="overflow-hidden border-solar-green/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border bg-solar-green/5">
            <CardTitle className="flex items-center gap-2 font-display">
              <Battery className="h-5 w-5 text-solar-green" />
              Arreglo de Baterías
            </CardTitle>
            <CardDescription>
              Batería: {battery.voltajeNominal}V · {battery.capacidadNominal}Ah · LiFePO4
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  En serie (A_S)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar-green tabular-nums">
                  {r.aS}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  En paralelo (A_P)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar-green tabular-nums">
                  {r.aP}
                </p>
              </div>
              <div className="rounded-lg border border-solar-green/20 bg-solar-green/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total (A_T)
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-solar-green tabular-nums">
                  {r.aT}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-2 sm:px-4 py-3">
              <span className="text-sm text-muted-foreground">Capacidad total instalada</span>
              <span className="font-display text-xl font-bold text-solar-green">
                {formatNumber(r.aP * battery.capacidadNominal, 0)} Ah
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Layers className="h-4 w-4" /> Plano de Cableado (Cargas Cruzadas)
                </p>
                <button
                  onClick={() => setBatteryFullscreen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Ampliar Vista
                </button>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-inner my-3 relative">
                {renderSvgContent(r.aS, r.aP, 'battery', false)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard
          label="Inversor (mínimo)"
          value={formatNumber(r.inversorMin, 0)}
          unit={`W Recomendado (${r.inversorRecomendado}W)`}
          icon={<Zap className="h-5 w-5" />}
          accent="amber"
          description={`Entrada ${params.voltajeBanco}V CC → 120V CA/60Hz · margen 25%`}
        />
        <ResultCard
          label="Regulador MPPT (corriente)"
          value={formatNumber(r.corrienteRegulador, 1)}
          unit="A"
          icon={<Gauge className="h-5 w-5" />}
          accent="blue"
          description={`I_mp × M_P × 1.25 · ${params.voltajeBanco}V CC`}
        />
      </div>

      {/* Diagrama de flujo usando los SVG locales desde public/img/ */}
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Diagrama del Sistema Off-Grid</CardTitle>
          <CardDescription>Flujo de energía desde generación hasta consumo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-nowrap sm:flex-wrap items-center justify-center gap-3 sm:gap-4">
            <FlowNode 
              svgPath="/img/panel.svg" 
              fallbackIcon={<Sun className="h-8 w-8 text-amber-500" />}
              title="Paneles" 
              subtitle={`${r.mT} × ${panel.potenciaPico}W`} 
              color="amber" 
            />
            <FlowArrow />
            <FlowNode 
              svgPath="/img/regulador.svg" 
              fallbackIcon={<Gauge className="h-8 w-8 text-sky-400" />}
              title="Regulador MPPT" 
              subtitle={`${formatNumber(r.corrienteRegulador, 0)}A`} 
              color="blue" 
            />
            <FlowArrow />
            <FlowNode 
              svgPath="/img/Bateria.svg" 
              fallbackIcon={<Battery className="h-8 w-8 text-emerald-500" />}
              title="Banco Baterías" 
              subtitle={`${r.aT} × ${battery.voltajeNominal}V`} 
              color="green" 
            />
            <FlowArrow />
            <FlowNode 
              svgPath="/img/inversor.svg" 
              fallbackIcon={<Zap className="h-14 w-14 text-amber-500" />}
              title="Inversor" 
              subtitle={`${r.inversorRecomendado}W`} 
              color="amber" 
            />
            <FlowArrow />
            <FlowNode 
              svgPath="/img/cargas.svg" 
              fallbackIcon={<Activity className="h-8 w-8 text-slate-400" />}
              title="Cargas CA" 
              subtitle="120V/60Hz" 
              color="neutral" 
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-6">
            <div>
              <p className="text-sm font-medium">¿Listo para presentar tu diseño?</p>
              <p className="text-xs text-muted-foreground">Exporta la memoria de cálculo completa lista para normativa.</p>
            </div>
            <button
              onClick={() => generateSolarPDF(appliances, params, battery, panel, results)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Memoria de Cálculo PDF
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FlowNode({
  svgPath,
  fallbackIcon,
  title,
  subtitle,
  color,
}: {
  svgPath: string;
  fallbackIcon: React.ReactNode;
  title: string;
  subtitle: string;
  color: 'amber' | 'green' | 'blue' | 'neutral';
}) {
  const [svgError, setSvgError] = useState(false);

  const colors = {
    amber: 'border-solar/30 bg-solar/5 text-solar',
    green: 'border-solar-green/30 bg-solar-green/5 text-solar-green',
    blue: 'border-sky-400/30 bg-sky-400/5 text-sky-400',
    neutral: 'border-border bg-muted/30 text-muted-foreground',
  };

  return (
    <div className={`flex w-[15rem] flex-col items-center gap-1.5 rounded-xl border p-4 text-center ${colors[color]}`}>
      {!svgError ? (
        <img 
          src={svgPath} 
          alt={title} 
          onError={() => setSvgError(true)}
          className="h-[8rem] w-[8rem] object-contain" 
        />
      ) : (
        fallbackIcon
      )}
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <>
      <ArrowRight className="hidden sm:block h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="block sm:hidden text-muted-foreground text-sm font-bold my-0.5">↓</div>
    </>
  );
}