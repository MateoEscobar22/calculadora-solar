import { useState, useMemo, useCallback } from 'react';
import { Sun, ListChecks, Settings2, LayoutDashboard, FileDown, FileText, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadTable } from '@/components/LoadTable';
import { SystemParameters } from '@/components/SystemParameters';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import {
  defaultParams,
  defaultBatterySpec,
  defaultPanelSpec,
  presetAppliances,
  calculate,
  suggestVoltage,
  formatNumber,
  type Appliance,
  type SystemParams,
  type BatterySpec,
  type PanelSpec,
} from '@/lib/solar';
import { downloadPdfReport, downloadTextReport } from '@/lib/export';
import './App.css';

function App() {
  const [appliances, setAppliances] = useState<Appliance[]>(presetAppliances);
  const [params, setParams] = useState<SystemParams>(defaultParams);
  const [battery, setBattery] = useState<BatterySpec>(defaultBatterySpec);
  const [panel, setPanel] = useState<PanelSpec>(defaultPanelSpec);
  const [panelesSerie, setPanelesSerie] = useState<number>(1);

  const results = useMemo(
    () => calculate(appliances, params, battery, panel),
    [appliances, params, battery, panel, panelesSerie]
  );

  const sugerenciaV = useMemo(
    () => suggestVoltage(results.eCA),
    [results.eCA]
  );

  const handleExportPdf = useCallback(() => {
    downloadPdfReport(appliances, params, battery, panel, results, panelesSerie);
  }, [appliances, params, battery, panel, results, panelesSerie]);

  const handleExportTxt = useCallback(() => {
    downloadTextReport(appliances, params, battery, panel, results, panelesSerie);
  }, [appliances, params, battery, panel, results, panelesSerie]);

  return (
    <div className="min-h-screen bg-grid bg-background">
      {/* Hero / Header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-solar/10 via-transparent to-solar-green/10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-solar/10 blur-3xl animate-pulse-glow" />
        <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-solar-green/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-solar to-amber-600 shadow-lg shadow-solar/20">
                  <Sun className="h-7 w-7 text-solar-deep" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    Calculadora Solar Off-Grid
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Dimensionamiento de instalaciones fotovoltaicas autónomas · Colombia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick stats bar */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm sm:px-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-4 w-4 text-solar" />
            Consumo: <strong className="text-foreground">{formatNumber(results.eCA, 0)} Wh/día</strong>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Sun className="h-4 w-4 text-solar" />
            Paneles: <strong className="text-foreground">{results.mT} ({formatNumber(results.pNI, 0)}W)</strong>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-solar-green" />
            Baterías: <strong className="text-foreground">{results.aT} ({formatNumber(results.aT * battery.capacidadNominal, 0)}Ah)</strong>
          </span>
          <Badge
            className={
              results.compatible
                ? 'border-solar-green/30 bg-solar-green/10 text-solar-green'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }
          >
            {results.compatible ? 'Sistema Compatible' : 'Revisar Configuración'}
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Tabs defaultValue="step1" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1.5">
            <TabsTrigger
              value="step1"
              className="flex h-auto flex-col items-center gap-1 py-3 text-xs sm:flex-row sm:text-sm"
            >
              <ListChecks className="h-4 w-4" />
              <span>Paso 1 · Cargas</span>
            </TabsTrigger>
            <TabsTrigger
              value="step2"
              className="flex h-auto flex-col items-center gap-1 py-3 text-xs sm:flex-row sm:text-sm"
            >
              <Settings2 className="h-4 w-4" />
              <span>Paso 2 · Parámetros</span>
            </TabsTrigger>
            <TabsTrigger
              value="step3"
              className="flex h-auto flex-col items-center gap-1 py-3 text-xs sm:flex-row sm:text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Paso 3 · Resumen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="mt-0 animate-float-in">
            <LoadTable appliances={appliances} onChange={setAppliances} />
          </TabsContent>

          <TabsContent value="step2" className="mt-0 animate-float-in">
            <SystemParameters
              params={params}
              battery={battery}
              panel={panel}
              panelesSerie={panelesSerie}
              sugerenciaV={sugerenciaV}
              onParamsChange={setParams}
              onBatteryChange={setBattery}
              onPanelChange={setPanel}
              onPanelesSerieChange={setPanelesSerie}
            />
          </TabsContent>

          <TabsContent value="step3" className="mt-0 animate-float-in">
            <ResultsDashboard
            appliances={appliances}
              results={results}
              params={params}
              battery={battery}
              panel={panel}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
          <p>
            Cálculos basados en metodología de dimensionamiento fotovoltaico off-grid para
            baterías de Litio LiFePO4 · Salida 120V CA / 60Hz
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
