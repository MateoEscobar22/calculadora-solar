import { Plus, Trash2, Zap, Clock, Lightbulb, Minus, X } from 'lucide-react';
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
  const update = (id: string, field: keyof Appliance, value: string | number) => {
    onChange(
      appliances.map((a) =>
        a.id === id ? { ...a, [field]: field === 'name' ? value : Number(value) } : a
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
      { id: Date.now().toString(), name: '', watts: 0, hours: 0, quantity: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(appliances.filter((a) => a.id !== id));
  };

  const totalDiario = appliances.reduce(
    (sum, a) => sum + a.watts * a.hours * a.quantity,
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
              Agrega los electrodomésticos que usan corriente alterna (120V/60Hz). Especifica
              cuántas unidades de cada uno usas.
            </CardDescription>
          </div>
          <Button onClick={addRow} className="bg-solar text-solar-deep hover:bg-solar/90">
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar carga
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appliances.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No hay cargas. Agrega un electrodoméstico para empezar.</p>
            <Button onClick={addRow} variant="outline" className="border-solar/40 text-solar hover:bg-solar/10">
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar primera carga
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop: Tabla */}
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[26%]">Electrodoméstico</TableHead>
                    <TableHead className="w-[14%] text-center">Cantidad</TableHead>
                    <TableHead className="w-[14%]">Potencia (W)</TableHead>
                    <TableHead className="w-[14%]">Horas/día</TableHead>
                    <TableHead className="w-[16%] text-right">Subtotal (Wh/día)</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appliances.map((a) => {
                    const subtotalW = a.watts * a.quantity;
                    const subtotalWh = a.watts * a.hours * a.quantity;
                    return (
                      <TableRow
                        key={a.id}
                        className="border-border transition-colors hover:bg-muted/30"
                      >
                        <TableCell>
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
                        <TableCell>
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
                        <TableCell>
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
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={a.hours || ''}
                            onChange={(e) => update(a.id, 'hours', e.target.value)}
                            placeholder="0"
                            className="h-8 tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          <span className={subtotalWh > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                            {formatNumber(subtotalWh, 0)} Wh
                          </span>
                        </TableCell>
                        <TableCell>
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
                const subtotalW = a.watts * a.quantity;
                const subtotalWh = a.watts * a.hours * a.quantity;
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        value={a.name}
                        onChange={(e) => update(a.id, 'name', e.target.value)}
                        placeholder="Ej. Nevera"
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

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Cantidad</label>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 border-border"
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
                            className="h-8 text-center tabular-nums"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 border-border"
                            onClick={() => adjustQty(a.id, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
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
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Horas/día</label>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={a.hours || ''}
                          onChange={(e) => update(a.id, 'hours', e.target.value)}
                          placeholder="0"
                          className="h-8 tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {a.quantity > 1 && a.watts > 0
                          ? `${a.quantity} × ${a.watts}W × ${a.hours}h`
                          : `${a.watts}W × ${a.hours}h`}
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
