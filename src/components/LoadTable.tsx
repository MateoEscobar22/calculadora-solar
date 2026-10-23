import React, { useRef } from 'react';
import { Plus, Trash2, Zap, Clock, Lightbulb, Minus, X, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Appliance } from '@/lib/solar';
import { formatNumber } from '@/lib/solar';

interface LoadTableProps {
  appliances: Appliance[];
  onChange: (appliances: Appliance[]) => void;
}

export function LoadTable({ appliances, onChange }: LoadTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (id: string, field: keyof Appliance, value: string | number) => {
    onChange(
      appliances.map((a) =>
        a.id === id ? { ...a, [field]: field === 'name' || field === 'frequency' ? value : Number(value) } : a
      )
    );
  };

  const adjustQty = (id: string, delta: number) => {
    onChange(
      appliances.map((a) =>
        a.id === id ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a
      )
    );
  };

  const addRow = () => {
    onChange([
      ...appliances,
      { id: Date.now().toString(), name: '', watts: 0, hours: 0, quantity: 1, frequency: 'day' },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(appliances.filter((a) => a.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        const newAppliances: Appliance[] = [];

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.length === 0) continue;

          const name = r[0] !== undefined && r[0] !== null ? String(r[0]).trim() : `Carga ${i}`;
          const quantity = Number(r[1]) > 0 ? Number(r[1]) : 1;
          const watts = Number(r[2]) >= 0 ? Number(r[2]) : 0;
          const hours = Number(r[3]) >= 0 ? Number(r[3]) : 0;

          const rawFreq = r[4] !== undefined && r[4] !== null ? String(r[4]).toLowerCase().trim() : 'day';
          const frequency: 'day' | 'week' = rawFreq.includes('sem') || rawFreq.includes('week') || rawFreq === 'semana' ? 'week' : 'day';

          if (name && watts > 0) {
            newAppliances.push({
              id: `${Date.now()}-${i}`,
              name,
              quantity,
              watts,
              hours,
              frequency,
            });
          }
        }

        if (newAppliances.length > 0) {
          onChange([...appliances, ...newAppliances]);
        }
      } catch (error) {
        console.error('Error al procesar el archivo Excel:', error);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      { Carga: 'Lampara1', Cantidad: 12, Potencia_W: 12, Horas: 4, Frecuencia: 'day' },
      { Carga: 'Nevera', Cantidad: 2, Potencia_W: 150, Horas: 12, Frecuencia: 'day' },
      { Carga: 'Lavadora', Cantidad: 1, Potencia_W: 1000, Horas: 6, Frecuencia: 'week' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Cargas');
    XLSX.writeFile(wb, 'Plantilla_Cargas_Solares.xlsx');
  };

  const getEffectiveHours = (a: Appliance) => {
    const rawHours = a.hours || 0;
    return a.frequency === 'week' ? rawHours / 7 : rawHours;
  };

  const totalDiario = appliances.reduce(
    (sum, a) => sum + a.watts * getEffectiveHours(a) * a.quantity,
    0
  );
  const totalPotencia = appliances.reduce(
    (sum, a) => sum + a.watts * a.quantity,
    0
  );
  const totalUnidades = appliances.reduce((sum, a) => sum + a.quantity, 0);

  const labelConCantidad = (a: Appliance) =>
    a.quantity > 1 ? `${a.quantity} × ${a.name || 'Sin nombre'}` : a.name || 'Sin nombre';

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Lightbulb className="h-5 w-5 text-solar" />
              Cargas de la Vivienda (CA)
            </CardTitle>
            <CardDescription className="mt-1">
              Agrega manualmente o importa desde un archivo Excel los electrodomésticos en corriente alterna (120V/60Hz).
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
            >
              <Upload className="mr-1.5 h-4 w-4 text-cyan-400" />
              Cargar Excel
            </Button>

            <Button onClick={addRow} className="bg-solar text-solar-deep hover:bg-solar/90">
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar carga
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {appliances.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No hay cargas. Agrega un electrodoméstico o importa una lista en Excel.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={addRow} variant="outline" className="border-solar/40 text-solar hover:bg-solar/10">
                <Plus className="mr-1.5 h-4 w-4" />
                Agregar primera carga
              </Button>
              <Button
                variant="ghost"
                onClick={downloadTemplate}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                Descargar plantilla Excel de ejemplo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop: Tabla */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[24%]">Electrodoméstico</TableHead>
                    <TableHead className="w-[14%] text-center">Cantidad</TableHead>
                    <TableHead className="w-[14%]">Potencia (W)</TableHead>
                    <TableHead className="w-[22%]">Tiempo de uso</TableHead>
                    <TableHead className="w-[18%] text-right">Subtotal (Wh/día)</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appliances.map((a) => {
                    const freq = a.frequency || 'day';
                    const effectiveHours = getEffectiveHours(a);
                    const subtotalW = a.watts * a.quantity;
                    const subtotalWh = a.watts * effectiveHours * a.quantity;

                    return (
                      <TableRow
                        key={a.id}
                        className="border-border transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="align-top pt-3">
                          <Input
                            value={a.name}
                            onChange={(e) => update(a.id, 'name', e.target.value)}
                            placeholder="Ej. Nevera"
                            className="h-8 border-transparent bg-transparent focus-visible:border-input"
                          />
                          {a.quantity > 1 && a.name && (
                            <p className="mt-1 text-xs text-solar">
                              {labelConCantidad(a)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 border-border"
                              onClick={() => adjustQty(a.id, -1)}
                              disabled={a.quantity <= 1}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={a.quantity}
                              onChange={(e) => update(a.id, 'quantity', e.target.value)}
                              className="h-8 w-16 text-center tabular-nums"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 border-border"
                              onClick={() => adjustQty(a.id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          <Input
                            type="number"
                            min={0}
                            value={a.watts || ''}
                            onChange={(e) => update(a.id, 'watts', e.target.value)}
                            placeholder="0"
                            className="h-8 tabular-nums"
                          />
                          {a.quantity > 1 && a.watts > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {a.quantity} × {a.watts}W = {formatNumber(subtotalW, 0)}W
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              value={a.hours || ''}
                              onChange={(e) => update(a.id, 'hours', e.target.value)}
                              placeholder="0"
                              className="h-8 w-20 tabular-nums"
                            />
                            <select
                              value={freq}
                              onChange={(e) => update(a.id, 'frequency', e.target.value)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="day">horas/día</option>
                              <option value="week">horas/sem</option>
                            </select>
                          </div>
                          {freq === 'week' && a.hours > 0 && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Equiv: {formatNumber(effectiveHours, 1)} h/día (÷ 7)
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top pt-4 text-right font-medium tabular-nums">
                          <span className={subtotalWh > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                            {formatNumber(subtotalWh, 0)} Wh
                          </span>
                        </TableCell>
                        <TableCell className="align-top pt-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-muted/40">
                  <TableRow className="border-border">
                    <TableCell colSpan={2} className="font-medium">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-solar" />
                          Potencia pico:
                          <Badge variant="secondary" className="ml-0.5">
                            {formatNumber(totalPotencia, 0)} W
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium" colSpan={2}>
                      <div className="flex items-center justify-end gap-2">
                        <Clock className="h-4 w-4 text-solar-green" />
                        Consumo diario total:
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-display text-lg font-bold text-solar tabular-nums">
                        {formatNumber(totalDiario, 0)} Wh
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile: Tarjetas */}
            <div className="space-y-3 md:hidden">
              {appliances.map((a) => {
                const freq = a.frequency || 'day';
                const effectiveHours = getEffectiveHours(a);
                const subtotalWh = a.watts * effectiveHours * a.quantity;

                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        value={a.name}
                        onChange={(e) => update(a.id, 'name', e.target.value)}
                        placeholder="Ej. Lavadora"
                        className="h-9 border-transparent bg-transparent font-medium focus-visible:border-input"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRow(a.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {a.quantity > 1 && a.name && (
                      <p className="mb-3 mt-0.5 text-sm font-medium text-solar">
                        {labelConCantidad(a)}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Cantidad</label>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-7 shrink-0 border-border"
                            onClick={() => adjustQty(a.id, -1)}
                            disabled={a.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={a.quantity}
                            onChange={(e) => update(a.id, 'quantity', e.target.value)}
                            className="h-8 min-w-0 flex-1 px-0 text-center text-xs tabular-nums"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-7 shrink-0 border-border"
                            onClick={() => adjustQty(a.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Potencia (W)</label>
                        <Input
                          type="number"
                          min={0}
                          value={a.watts || ''}
                          onChange={(e) => update(a.id, 'watts', e.target.value)}
                          placeholder="0"
                          className="h-8 tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <label className="text-xs text-muted-foreground">Tiempo de uso</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={a.hours || ''}
                          onChange={(e) => update(a.id, 'hours', e.target.value)}
                          placeholder="0"
                          className="h-8 flex-1 tabular-nums"
                        />
                        <select
                          value={freq}
                          onChange={(e) => update(a.id, 'frequency', e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="day">Horas / día</option>
                          <option value="week">Horas / semana</option>
                        </select>
                      </div>
                      {freq === 'week' && a.hours > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Equivale a {formatNumber(effectiveHours, 1)} h/día (dividido entre 7)
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        Subtotal normalizado
                      </span>
                      <span className="font-display text-sm font-bold text-solar tabular-nums">
                        {formatNumber(subtotalWh, 0)} Wh/día
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Totales móvil */}
              <div className="rounded-lg border border-solar/20 bg-solar/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-solar" />
                    Potencia pico
                  </div>
                  <Badge variant="secondary">{formatNumber(totalPotencia, 0)} W</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-solar-green" />
                    Consumo diario total
                  </div>
                  <span className="font-display text-lg font-bold text-solar tabular-nums">
                    {formatNumber(totalDiario, 0)} Wh
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'} en total
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}