import { Panel } from "react-resizable-panels";

export interface Appliance {
  id: string;
  name: string;
  watts: number;
  hours: number;
  quantity: number;
  frequency?: 'day' | 'week';

}

export interface SystemParams {
  rendimiento: number;
  diasAutonomia: number;
  profundidadDescarga: number;
  factorTemperatura: number;
  voltajeBanco: number;
  hsp: number;
  kc: number;
  nRegulador: number;
  nPanel: number;
}

export interface BatterySpec {
  voltajeNominal: number;
  capacidadNominal: number;
}

export interface PanelSpec {
  potenciaPico: number;
  vmp: number;
  voc: number;
  imp: number;
  isc: number;
}

export interface SolarResults {
  eCA: number;
  eT: number;
  e: number;
  cU: number;
  c: number;
  aS: number;
  aP: number;
  aT: number;
  eG: number;
  pN: number;
  mS: number;
  mP: number;
  mT: number;
  pNI: number;
  inversorMin: number;
  inversorRecomendado: number;
  corrienteRegulador: number;
  compatible: boolean;
  compatMensaje: string;
  voltajeRegulador: number;
}

export const defaultParams: SystemParams = {
  rendimiento: 0.82,
  diasAutonomia: 2,
  profundidadDescarga: 0.9,
  factorTemperatura: 0.9375,
  voltajeBanco: 48,
  hsp: 4.5,
  kc: 0.1,
  nRegulador: 0.95,
  nPanel: 0.9,
};

export const defaultBatterySpec: BatterySpec = {
  voltajeNominal: 48,
  capacidadNominal: 100,
};

export const defaultPanelSpec: PanelSpec = {
  potenciaPico: 550,
  voc: 50,
  vmp: 42,
  imp: 13,
  isc: 14,
};

export const presetAppliances: Appliance[] = [
];

function ceil(value: number): number {
  return Math.ceil(value);
}

export function calculate(
  appliances: Appliance[],
  params: SystemParams,
  battery: BatterySpec,
  panel: PanelSpec
): SolarResults {
  const getEffectiveHours = (a: Appliance) => {
    const rawHours = a.hours || 0;
    return a.frequency === 'week' ? rawHours / 7 : rawHours;
  };

  const eCA = appliances.reduce(
    (sum, a) => sum + a.watts * getEffectiveHours(a) * a.quantity,
    0
  );

  const eT = eCA;
  const e = eT / params.rendimiento;

  // 1. Cálculo de Baterías
  const cU = (e * params.diasAutonomia) / params.voltajeBanco;
  const c = cU / (params.profundidadDescarga * params.factorTemperatura);

  const aS = Math.max(1, Math.round(params.voltajeBanco / battery.voltajeNominal));
  const aP = ceil(c / battery.capacidadNominal);
  const aT = aS * aP;

  // 2. Cálculo de Paneles (Deducción automática del voltaje nominal según el Vmp ingresado)
  // Si el Vmp ingresado es menor a 25V (ej. 20.9V), el panel es de 12V nominales.
  // Si es mayor o igual a 25V (ej. 40.98V o 42V), el panel es de 24V nominales.
  const panelVoltajeNominal = panel.vmp < 25 ? 12 : 24;

  const eG = e / params.nRegulador;
  const pN = eG / (params.hsp * params.nPanel);

  const mS = Math.max(1, Math.round(params.voltajeBanco / panelVoltajeNominal));
  const mP = ceil(pN / (mS * panel.potenciaPico));
  const mT = mS * mP;
  const pNI = mT * panel.potenciaPico;

// 1. Encontrar el artefacto que se usa más horas al día (considerando horas efectivas si es semanal)
  const maxHorasApp = appliances.reduce(
    (prev, current) => {
      const hoursPrev = prev.frequency === 'week' ? (prev.hours || 0) / 7 : (prev.hours || 0);
      const hoursCurrent = current.frequency === 'week' ? (current.hours || 0) / 7 : (current.hours || 0);
      return hoursCurrent > hoursPrev ? current : prev;
    },
    appliances[0] || { watts: 0, quantity: 1, hours: 0, frequency: 'day' }
  );

  // 2. Obtener los 3 aparatos con mayor potencia individual (watts * cantidad)
  const top3PotenciaAppliances = [...appliances]
    .sort((a, b) => (b.watts * b.quantity) - (a.watts * a.quantity))
    .slice(0, 3);

  // Potencia combinada de esos 3 aparatos principales
  const potenciaTop3Combinada = top3PotenciaAppliances.reduce(
    (sum, a) => sum + (a.watts * a.quantity),
    0
  );

  // 3. Consumo del artefacto que opera más horas (carga base o permanente principal)
  const potenciaUsoProlongado = maxHorasApp ? maxHorasApp.watts * maxHorasApp.quantity : 0;

  // 4. Potencia simultánea (Ps): La combinación de los 3 equipos más potentes + la carga de mayor uso prolongado.
  // Verificamos si el aparato de mayor uso prolongado ya está incluido dentro de los 3 más potentes para no duplicar su potencia.
  const isMaxHorasInTop3 = top3PotenciaAppliances.some(a => a.id === maxHorasApp.id);

  const potenciaSimultanea = isMaxHorasInTop3
    ? potenciaTop3Combinada
    : potenciaTop3Combinada + potenciaUsoProlongado;

  const eficienciaInversor = 0.9;
  const inversorMin = potenciaSimultanea / eficienciaInversor;
  const inversorRecomendado = selectComercialInverter(inversorMin);
  const corrienteRegulador = panel.imp * mP * 1.25;
  const voltajeRegulador = (panel.voc * 1.50);

  const compatible =
    aS >= 1 &&
    battery.voltajeNominal > 0 &&
    mS >= 1 &&
    params.voltajeBanco % battery.voltajeNominal === 0;

  let compatMensaje = 'Configuración válida y compatible';
  if (!compatible) {
    compatMensaje = 'Advertencia: El voltaje del banco no es múltiplo exacto del voltaje de la batería.';
  }

  return {
    eCA,
    eT,
    e,
    cU,
    c,
    aS,
    aP,
    aT,
    eG,
    pN,
    mS,
    mP,
    mT,
    pNI,
    inversorMin,
    inversorRecomendado,
    corrienteRegulador,
    compatible,
    compatMensaje,
    voltajeRegulador,
  };
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function suggestVoltage(eCA: number): number {
  return eCA > 2000 ? 48 : eCA > 800 ? 24 : 12;
}

// Lista de potencias comerciales estándar de inversores (en Watts)
const INVERSORES_COMERCIALES = [300, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000];

export function selectComercialInverter(calculatedWatts: number): number {
  // Si queda exactamente a ras o muy cerca de un escalón comercial (ej. > 95% del valor), pasa al siguiente para dar margen
  for (const comercial of INVERSORES_COMERCIALES) {
    if (calculatedWatts <= comercial * 0.95) {
      return comercial;
    }
  }

  // Si supera el catálogo comercial estándar, sugiere un margen del 20%
  return Math.ceil(calculatedWatts * 1.2 / 500) * 500;
}