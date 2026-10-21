import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SolarResults, SystemParams, BatterySpec, PanelSpec, Appliance, formatNumber } from './solar';

export function generateSolarPDF(
  appliances: Appliance[],
  params: SystemParams,
  battery: BatterySpec,
  panel: PanelSpec,
  results: SolarResults
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Paleta de colores profesionales
  const primaryColor: [number, number, number] = [4, 120, 87];   // #047857 Emerald Dark
  const secondaryColor: [number, number, number] = [240, 253, 244]; // #F0FDF4 Emerald Soft
  const darkText: [number, number, number] = [31, 41, 55];       // #1F2937 Gray 800
  const mutedText: [number, number, number] = [107, 114, 128];   // #6B7280 Gray 500
  const borderColor: [number, number, number] = [229, 231, 235]; // #E5E7EB Gray 200

  // --- ENCABEZADO PRINCIPAL ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('NODO HÁBITAT', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ingeniería e Instalaciones Fotovoltaicas Autónomas', 14, 21);

  doc.setFontSize(8.5);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 196, 14, { align: 'right' });
  doc.text('Ref: MEM-SOL-2026', 196, 21, { align: 'right' });

  let currentY = 36;

  // --- SUBTÍTULO Y RESUMEN TÉCNICO ---
  doc.setTextColor(...darkText);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMORIA DE CÁLCULO Y DIMENSIONAMIENTO OFF-GRID', 14, currentY);

  currentY += 6;

  // --- SECCIÓN 1: PARAMETROS DE DISEÑO DEL SISTEMA ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('1. PARÁMETROS Y CONSTANTES DE DISEÑO', 14, currentY);

  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Parámetro de Diseño', 'Símbolo / Valor', 'Criterio / Norma']],
    body: [
      ['Rendimiento Global del Sistema', `${(params.rendimiento * 100).toFixed(0)}%`, 'Pérdidas acumuladas en cableado e inversor'],
      ['Días de Autonomía Requeridos', `${params.diasAutonomia} día(s)`, 'Días consecutivos de cobertura sin irradiación'],
      ['Profundidad de Descarga Máxima (DoD)', `${(params.profundidadDescarga * 100).toFixed(0)}%`, 'Límite de conservación del banco de baterías'],
      ['Factor por Temperatura (F_T)', `${params.factorTemperatura}`, 'Corrección por temperatura ambiente operativa'],
      ['Tensión Nominal del Banco', `${params.voltajeBanco} V CC`, 'Tensión principal del bus en corriente directa'],
      ['Horas Sol Pico (HSP)', `${params.hsp} h/día`, 'Irradiación solar equivalente del sitio'],
      ['Factor Pérdidas de Cableado (K_c)', `${(params.kc * 100).toFixed(0)}%`, 'Caída de tensión máxima admisible (RETIE 3%)'],
['Rendimiento del Regulador (Eficiencia)', `${(params.nRegulador * 100).toFixed(0)}%`, 'Eficiencia de conversión MPPT'],
      ['Rendimiento del Panel', `${(params.nPanel * 100).toFixed(0)}%`, 'Factor de degradación y suciedad del módulo'],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkText },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECCIÓN 2: INVENTARIO DE CARGAS ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('2. INVENTARIO Y BALANCE DE CARGAS (120V CA / 60Hz)', 14, currentY);

  currentY += 3;

  const tableData = appliances.map((app) => [
    app.name,
    `${app.watts} W`,
    `${app.hours} h/día`,
    app.quantity.toString(),
    `${formatNumber(app.watts * app.hours * app.quantity, 0)} Wh/día`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Equipo / Carga Electromecánica', 'Potencia (W)', 'Uso Diario', 'Cant.', 'Consumo Diario (Wh)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.2, textColor: darkText },
    foot: [
      [
        'TOTAL CONSUMO DIARIO DIRECTO (E_CA)',
        '',
        '',
        '',
        `${formatNumber(results.eCA, 0)} Wh/día`,
      ],
      [
        'ENERGÍA DIARIA REAL REQUERIDA (E)',
        '',
        '',
        '',
        `${formatNumber(results.e, 0)} Wh/día`,
      ],
    ],
    footStyles: { fillColor: secondaryColor, textColor: primaryColor, fontStyle: 'bold', fontSize: 8.5 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECCIÓN 3: ARREGLOS Y EQUIPAMIENTO PRINCIPAL ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('3. DIMENSIONAMIENTO DEL EQUIPAMIENTO FOTOVOLTAICO', 14, currentY);

  currentY += 3;

  // Tarjeta izquierda: Paneles
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 110 },
    head: [['Campo Solar (Generación)', 'Resultado']],
    body: [
      ['Panel Seleccionado', `${panel.potenciaPico}W (Vmp: ${panel.vmp}V)`],
      ['Corriente Nominal (Imp)', `${panel.imp} A`],
      ['Corriente Cortocircuito (Isc)', `${panel.isc} A`],
      ['Módulos en Serie (M_S)', `${results.mS} unidad(es)`],
      ['Ramas en Paralelo (M_P)', `${results.mP} rama(s)`],
      ['Total de Paneles (M_T)', `${results.mT} unidad(es)`],
      ['Potencia Pico Instalada (P_NI)', `${formatNumber(results.pNI, 0)} Wp`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: darkText },
  });

  // Tarjeta derecha: Baterías
  autoTable(doc, {
    startY: currentY,
    margin: { left: 110, right: 14 },
    head: [['Banco de Baterías (Almacenamiento)', 'Resultado']],
    body: [
      ['Batería Seleccionada', `${battery.voltajeNominal}V - ${battery.capacidadNominal}Ah`],
      ['Tensión del Banco', `${params.voltajeBanco} V CC`],
      ['Baterías en Serie (A_S)', `${results.aS} unidad(es)`],
      ['Ramas en Paralelo (A_P)', `${results.aP} rama(s)`],
      ['Total de Baterías (A_T)', `${results.aT} unidad(es)`],
      ['Capacidad Útil Requerida (C_U)', `${formatNumber(results.cU, 0)} Ah`],
      ['Capacidad Nominal Banco', `${formatNumber(results.c, 0)} Ah`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: darkText },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECCIÓN 4: CONTROL E INVERSIÓN ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('4. ESPECIFICACIÓN DE INVERSOR Y MPPT', 14, currentY);

  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Componente / Equipo', 'Especificación Mínima', 'Criterio Normativo de Dimensionamiento']],
    body: [
      [
        'Inversor Onda Senoidal Pura',
        `${formatNumber(results.inversorMin, 0)} W`,
        'Capacidad nominal calculada con sumatoria de picos + 25% de margen de seguridad.',
      ],
      [
        'Regulador de Carga (MPPT)',
        `${formatNumber(results.corrienteRegulador, 1)} A`,
        'Soportado a partir de la corriente Isc del arreglo × M_P × 1.25 (RETIE / NTC 2050).',
      ],
      [
        'Generación Diaria Estimada (E_G)',
        `${formatNumber(results.eG, 0)} Wh/día`,
        'Energía bruta a producir por el campo fotovoltaico para suplir consumo y pérdidas.',
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: darkText },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // --- NOTA LEGAL Y DE PIE DE PÁGINA ---
  doc.setLineWidth(0.4);
  doc.setDrawColor(...borderColor);
  doc.line(14, currentY, 196, currentY);

  currentY += 5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('CUMPLIMIENTO NORMATIVO Y NOTA TÉCNICA:', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text(
    'Este cálculo ha sido dimensionado bajo los lineamientos del Reglamento Técnico de Instalaciones Eléctricas (RETIE Resolución 40284 de 2026) y el Código Eléctrico Colombiano NTC 2050. Los diámetros de conductores, protecciones térmicas y sobretensiones (DPS) deberán ser verificados en sitio por un profesional matriculado.',
    14,
    currentY + 4,
    { maxWidth: 182 }
  );

  // NUMERACIÓN DE PÁGINAS
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    doc.text(`Nodo Hábitat · Memoria de Cálculo Off-Grid · Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
  }

  // Descargar archivo PDF
  doc.save(`NodoHabitat_Memoria_Calculo_${params.voltajeBanco}V.pdf`);
}