import { Sun, Battery, Zap, Gauge, Layers, Activity, CheckCircle2, AlertTriangle, PanelTop, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResultCard } from '@/components/ResultCard';
import type { SolarResults, SystemParams, BatterySpec, PanelSpec, Appliance } from '@/lib/solar';
import { formatNumber, presetAppliances } from '@/lib/solar';
import { generateSolarPDF } from '@/lib/generatePDF';

interface ResultsDashboardProps {
  appliances: Appliance[];
  results: SolarResults;
  params: SystemParams;
  battery: BatterySpec;
  panel: PanelSpec;
}

export function ResultsDashboard({
  appliances, // <-- Recibir appliances
  results,
  params,
  battery,
  panel,
}: ResultsDashboardProps) {
  const r = results;

  return (
    <div className="space-y-6">
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
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Potencia pico instalada (P_NI)</span>
              <span className="font-display text-xl font-bold text-solar">
                {formatNumber(r.pNI, 0)} W
              </span>
            </div>

            {/* Diagrama en bloques - Paneles */}
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <PanelTop className="h-4 w-4" /> Diagrama de arreglo
              </p>
              <div className="space-y-2">
                {Array.from({ length: Math.min(r.mP, 6) }).map((_, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2">
                    {Array.from({ length: Math.min(r.mS, 8) }).map((_, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-solar/30 bg-solar/5 text-xs font-medium text-solar">
                          <Sun className="mb-0.5 h-4 w-4" />
                          {panel.potenciaPico}W
                        </div>
                        {sIdx < Math.min(r.mS, 8) - 1 && (
                          <span className="text-xs text-muted-foreground">+</span>
                        )}
                      </div>
                    ))}
                    {r.mS > 8 && <span className="text-xs text-muted-foreground">…</span>}
                    {pIdx < Math.min(r.mP, 6) - 1 && (
                      <div className="flex h-full items-center pl-1">
                        <span className="text-xs text-muted-foreground">∥</span>
                      </div>
                    )}
                  </div>
                ))}
                {r.mP > 6 && (
                  <p className="text-center text-xs text-muted-foreground">
                    + {r.mP - 6} ramas en paralelo más…
                  </p>
                )}
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
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Capacidad total instalada</span>
              <span className="font-display text-xl font-bold text-solar-green">
                {formatNumber(r.aP * battery.capacidadNominal, 0)} Ah
              </span>
            </div>

            {/* Diagrama en bloques - Baterías */}
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Layers className="h-4 w-4" /> Diagrama de arreglo
              </p>
              <div className="space-y-2">
                {Array.from({ length: Math.min(r.aP, 6) }).map((_, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2">
                    {Array.from({ length: Math.min(r.aS, 8) }).map((_, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border border-solar-green/30 bg-solar-green/5 text-xs font-medium text-solar-green">
                          <Battery className="mb-0.5 h-4 w-4" />
                          {battery.voltajeNominal}V
                        </div>
                        {sIdx < Math.min(r.aS, 8) - 1 && (
                          <span className="text-xs text-muted-foreground">+</span>
                        )}
                      </div>
                    ))}
                    {r.aS > 8 && <span className="text-xs text-muted-foreground">…</span>}
                    {pIdx < Math.min(r.aP, 6) - 1 && (
                      <div className="flex h-full items-center pl-1">
                        <span className="text-xs text-muted-foreground">∥</span>
                      </div>
                    )}
                  </div>
                ))}
                {r.aP > 6 && (
                  <p className="text-center text-xs text-muted-foreground">
                    + {r.aP - 6} ramas en paralelo más…
                  </p>
                )}
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
          unit={`W Recomendado (${r.inversorRecomendado}w)`}
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
          description={`I_mp × M_P × 1.25 · ${r.voltajeRegulador}V CC`}
        />
      </div>

      {/* Diagrama de flujo del sistema */}
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Diagrama del Sistema Off-Grid</CardTitle>
          <CardDescription>Flujo de energía desde generación hasta consumo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <FlowNode icon={<Sun className="h-6 w-6" />} title="Paneles" subtitle={`${r.mT} × ${panel.potenciaPico}W`} color="amber" />
            <FlowArrow />
            <FlowNode icon={<Gauge className="h-6 w-6" />} title="Regulador MPPT" subtitle={`${formatNumber(r.corrienteRegulador, 0)}A`} color="blue" />
            <FlowArrow />
            <FlowNode icon={<Battery className="h-6 w-6" />} title="Banco Baterías" subtitle={`${r.aT} × ${battery.voltajeNominal}V`} color="green" />
            <FlowArrow />
            <FlowNode icon={<Zap className="h-6 w-6" />} title="Inversor" subtitle={`${formatNumber(r.inversorMin, 0)}W`} color="amber" />
            <FlowArrow />
            <FlowNode icon={<Activity className="h-6 w-6" />} title="Cargas CA" subtitle="120V/60Hz" color="neutral" />
          </div>
<div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
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
  icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: 'amber' | 'green' | 'blue' | 'neutral';
}) {
  const colors = {
    amber: 'border-solar/30 bg-solar/5 text-solar',
    green: 'border-solar-green/30 bg-solar-green/5 text-solar-green',
    blue: 'border-sky-400/30 bg-sky-400/5 text-sky-400',
    neutral: 'border-border bg-muted/30 text-muted-foreground',
  };
  return (
    <div className={`flex w-32 flex-col items-center gap-1 rounded-xl border p-4 text-center ${colors[color]}`}>
      {icon}
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs opacity-70">{subtitle}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
  );
}
