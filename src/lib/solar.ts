import { Panel } from "react-resizable-panels";

export interface Appliance {
  id: string;
  name: string;
  watts: number;
  hours: number;
  quantity: number;
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
  voc:number;
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
  { id: '1', name: 'Nevera', watts: 150, hours: 24, quantity: 1 },
  { id: '2', name: 'Luces LED', watts: 40, hours: 6, quantity: 1 },
  { id: '3', name: 'Televisor', watts: 120, hours: 5, quantity: 1 },
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
  const eCA = appliances.reduce(
    (sum, a) => sum + a.watts * a.hours * a.quantity,
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

// 3. Cálculo del Inversor según la guía metodológica:
  // Encontrar el artefacto que se usa más horas al día
  const maxHorasApp = appliances.reduce(
    (prev, current) => (current.hours > prev.hours ? current : prev),
    appliances[0] || { watts: 0, quantity: 1, hours: 0 }
  );

  // Encontrar el aparato con mayor potencia individual
  const maxPotenciaApp = appliances.reduce(
    (prev, current) =>
      current.watts * current.quantity > prev.watts * prev.quantity
        ? current
        : prev,
    appliances[0] || { watts: 0, quantity: 1, hours: 0 }
  );

  const maxPotenciaIndividual = maxPotenciaApp ? maxPotenciaApp.watts * maxPotenciaApp.quantity : 0;
  
  // Consumo del artefacto que opera más horas (actuando como la carga base/permanente principal)
  const potenciaUsoProlongado = maxHorasApp ? maxHorasApp.watts * maxHorasApp.quantity : 0;

  // Potencia simultánea (Ps): El equipo pico más exigente + la carga de mayor uso prolongado (evitando duplicar si es el mismo aparato)
  const potenciaSimultanea =
    maxPotenciaApp.id === maxHorasApp.id
      ? maxPotenciaIndividual
      : maxPotenciaIndividual + potenciaUsoProlongado;

  const eficienciaInversor = 0.9;
  const inversorMin = potenciaSimultanea / eficienciaInversor;
  const inversorRecomendado = selectComercialInverter(inversorMin);
  const corrienteRegulador = panel.imp * mP * 1.25;
  const voltajeRegulador = (panel.voc*1.50);

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