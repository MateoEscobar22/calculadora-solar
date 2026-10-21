import { Settings, Sun, Battery, SunMedium, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { SystemParams, BatterySpec, PanelSpec } from '@/lib/solar';

interface SystemParametersProps {
  params: SystemParams;
  battery: BatterySpec;
  panel: PanelSpec;
  panelesSerie: number;
  sugerenciaV: number;
  onParamsChange: (p: SystemParams) => void;
  onBatteryChange: (b: BatterySpec) => void;
  onPanelChange: (p: PanelSpec) => void;
  onPanelesSerieChange: (n: number) => void;
}

function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  step?: number;
  min?: number;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {description && <span className="text-muted-foreground/60">· {description}</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ''}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-12 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}

export function SystemParameters({
  params,
  battery,
  panel,
  panelesSerie,
  sugerenciaV,
  onParamsChange,
  onBatteryChange,
  onPanelChange,
  onPanelesSerieChange,
}: SystemParametersProps) {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <SunMedium className="h-5 w-5 text-solar" />
            Parámetros del Sistema
          </CardTitle>
          <CardDescription>
            Configura las condiciones del sitio y los parámetros de diseño
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="Horas Sol Pico (HSP)"
              value={params.hsp}
              onChange={(v) => onParamsChange({ ...params, hsp: v })}
              unit="HSP"
              step={0.1}
              description="Colombia: 4-5"
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Voltaje Nominal del Sistema
              </Label>
              <Select
                value={String(params.voltajeBanco)}
                onValueChange={(v) => onParamsChange({ ...params, voltajeBanco: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12V</SelectItem>
                  <SelectItem value="24">24V</SelectItem>
                  <SelectItem value="48">48V</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 pt-0.5">
                {sugerenciaV === params.voltajeBanco ? (
                  <Badge className="bg-solar-green/15 text-solar-green hover:bg-solar-green/20">
                    Recomendado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Sugerido: {sugerenciaV}
                  </Badge>
                )}
              </div>
            </div>
            <NumberField
              label="Días de autonomía (N)"
              value={params.diasAutonomia}
              onChange={(v) => onParamsChange({ ...params, diasAutonomia: v })}
              unit="días"
              description="Litio: 2"
            />
            <NumberField
              label="Rendimiento global (R)"
              value={params.rendimiento}
              onChange={(v) => onParamsChange({ ...params, rendimiento: v })}
              unit=""
              step={0.01}
              description="Defecto: 0.82"
            />
            <NumberField
              label="Profundidad descarga (P_D)"
              value={params.profundidadDescarga}
              onChange={(v) => onParamsChange({ ...params, profundidadDescarga: v })}
              unit=""
              step={0.01}
              description="LiFePO4: 0.90"
            />
            <NumberField
              label="Factor temp. (K_T)"
              value={params.factorTemperatura}
              onChange={(v) => onParamsChange({ ...params, factorTemperatura: v })}
              unit=""
              step={0.001}
              description="ΔT=10°C: 0.9375"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Battery className="h-5 w-5 text-solar-green" />
              Especificación de Batería
            </CardTitle>
            <CardDescription>Parámetros de la batería elegida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Voltaje nominal (V_NA)
                </Label>
                <Select
                  value={String(battery.voltajeNominal)}
                  onValueChange={(v) =>
                    onBatteryChange({ ...battery, voltajeNominal: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12V</SelectItem>
                    <SelectItem value="24">24V</SelectItem>
                    <SelectItem value="48">48V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                label="Capacidad nominal (C_NA)"
                value={battery.capacidadNominal}
                onChange={(v) => onBatteryChange({ ...battery, capacidadNominal: v })}
                unit="Ah"
                step={10}
                description="Ej: 100Ah"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Sun className="h-5 w-5 text-solar" />
              Especificación de Panel Solar
            </CardTitle>
            <CardDescription>Parámetros del panel seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label="Potencia pico (P_P)"
                value={panel.potenciaPico}
                onChange={(v) => onPanelChange({ ...panel, potenciaPico: v })}
                unit="W" 
              />
              <NumberField
                label="V_mp"
                value={panel.vmp}
                onChange={(v) => onPanelChange({ ...panel, vmp: v })}
                unit="V"
                step={0.1}
              />
              <NumberField
                label="V_oc"
                value={panel.voc}
                onChange={(v) => onPanelChange({ ...panel, voc: v })}
                unit="V"
                step={0.1}
              />
              <NumberField
                label="I_mp"
                value={panel.imp}
                onChange={(v) => onPanelChange({ ...panel, imp: v })}
                unit="A"
                step={0.1}
              />
              <NumberField
                label="I_sc"
                value={panel.isc}
                onChange={(v) => onPanelChange({ ...panel, isc: v })}
                unit="A"
                step={0.1}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Paneles en serie (M_S)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={panelesSerie || ''}
                  onChange={(e) => onPanelesSerieChange(Number(e.target.value))}
                  className="tabular-nums"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-solar" />
        <p className="text-muted-foreground">
          El factor de corrección por temperatura se calcula como K_T = 1 - (T_operación - T_referencia) / 160.
          Para un ΔT de 10°C sobre 18°C de referencia, el resultado es 0.9375. El rendimiento del inversor
          considera k_c = 0.10 (10% de pérdidas por eficiencia).
        </p>
      </div>
    </div>
  );
}
