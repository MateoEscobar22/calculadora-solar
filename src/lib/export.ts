import type { SolarResults, SystemParams, BatterySpec, PanelSpec, Appliance } from './solar';
import { formatNumber } from './solar';

export function generateTextReport(
  appliances: Appliance[],
  params: SystemParams,
  battery: BatterySpec,
  panel: PanelSpec,
  results: SolarResults,
  panelesSerie: number
): string {
  const r = results;
  const lines: string[] = [];
  lines.push('========================================================');
  lines.push('  CALCULADORA SOLAR OFF-GRID COLOMBIA');
  lines.push('  Ficha Técnica de Dimensionamiento Fotovoltaico');
  lines.push('========================================================');
  lines.push('');
  lines.push(`Fecha: ${new Date().toLocaleString('es-CO')}`);
  lines.push('');

  lines.push('--- 1. PERFIL DE CONSUMO (CA) ---');
  lines.push('');
  lines.push('Electrodoméstico           Cant.  Potencia(W)  Horas/día  Consumo(Wh/día)');
  lines.push('-----------------------------------------------------------------------');
  appliances.forEach((a) => {
    lines.push(
      `${(a.name || 'Sin nombre').padEnd(26)} ${String(a.quantity).padStart(4)}  ${String(a.watts).padStart(11)}  ${String(a.hours).padStart(9)}  ${formatNumber(a.watts * a.hours * a.quantity, 0).padStart(15)}`
    );
  });
  lines.push('-----------------------------------------------------------------------');
  lines.push(`Consumo Diario Total (E_CA): ${formatNumber(r.eCA, 0)} Wh/día`);
  lines.push(`Energía con inversor (E_T):  ${formatNumber(r.eT, 0)} Wh  [k_c=${params.kc}]`);
  lines.push(`Energía a acumular (E):      ${formatNumber(r.e, 0)} Wh  [R=${params.rendimiento}]`);
  lines.push('');

  lines.push('--- 2. PARÁMETROS DEL SISTEMA ---');
  lines.push('');
  lines.push(`Horas Sol Pico (HSP):         ${params.hsp} HSP`);
  lines.push(`Voltaje del banco (V_NS):      ${params.voltajeBanco} V`);
  lines.push(`Días de autonomía (N):         ${params.diasAutonomia} días`);
  lines.push(`Profundidad descarga (P_D):    ${params.profundidadDescarga}`);
  lines.push(`Factor temperatura (K_T):      ${params.factorTemperatura}`);
  lines.push(`Rendimiento regulador (η_R):   ${params.nRegulador}`);
  lines.push(`Eficiencia paneles (η_G):      ${params.nPanel}`);
  lines.push('');

  lines.push('--- 3. BANCO DE BATERÍAS ---');
  lines.push('');
  lines.push(`Capacidad útil (C_U):         ${formatNumber(r.cU, 0)} Ah`);
  lines.push(`Capacidad total (C):          ${formatNumber(r.c, 0)} Ah`);
  lines.push(`Batería: ${battery.voltajeNominal}V · ${battery.capacidadNominal}Ah`);
  lines.push(`Baterías en serie (A_S):      ${r.aS}`);
  lines.push(`Baterías en paralelo (A_P):   ${r.aP}`);
  lines.push(`TOTAL de baterías (A_T):       ${r.aT}`);
  lines.push('');

  lines.push('--- 4. CAMPO FOTOVOLTAICO (PANELES) ---');
  lines.push('');
  lines.push(`Energía del generador (E_G):   ${formatNumber(r.eG, 0)} Wh`);
  lines.push(`Potencia nominal (P_N):        ${formatNumber(r.pN, 0)} W`);
  lines.push(`Panel: ${panel.potenciaPico}W · V_mp ${panel.vmp}V · I_mp ${panel.imp}A · I_sc ${panel.isc}A`);
  lines.push(`Paneles en serie (M_S):        ${r.mS}`);
  lines.push(`Paneles en paralelo (M_P):     ${r.mP}`);
  lines.push(`TOTAL de paneles (M_T):        ${r.mT}`);
  lines.push(`Potencia instalada (P_NI):     ${formatNumber(r.pNI, 0)} W`);
  lines.push('');

  lines.push('--- 5. EQUIPOS ---');
  lines.push('');
  lines.push(`Inversor cargador (mínimo):   ${formatNumber(r.inversorMin, 0)} W`);
  lines.push(`  Entrada: ${params.voltajeBanco}V CC → Salida: 120V CA / 60Hz`);
  lines.push(`Regulador MPPT (I_R):          ${formatNumber(r.corrienteRegulador, 1)} A`);
  lines.push('');

  lines.push('--- 6. RESUMEN ---');
  lines.push('');
  lines.push(`Estado: ${r.compatible ? 'COMPATIBLE' : 'REVISAR'}`);
  lines.push(`Paneles: ${r.mT} (${r.mS}S × ${r.mP}P) · ${formatNumber(r.pNI, 0)} W`);
  lines.push(`Baterías: ${r.aT} (${r.aS}S × ${r.aP}P) · ${formatNumber(r.aT * battery.capacidadNominal, 0)} Ah`);
  lines.push(`Inversor: ${formatNumber(r.inversorMin, 0)} W · Regulador: ${formatNumber(r.corrienteRegulador, 0)} A`);
  lines.push('');
  lines.push('========================================================');

  return lines.join('\n');
}

export function downloadTextReport(
  appliances: Appliance[],
  params: SystemParams,
  battery: BatterySpec,
  panel: PanelSpec,
  results: SolarResults,
  panelesSerie: number
) {
  const text = generateTextReport(appliances, params, battery, panel, results, panelesSerie);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ficha-tecnica-solar-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfReport(
  appliances: Appliance[],
  params: SystemParams,
  battery: BatterySpec,
  panel: PanelSpec,
  results: SolarResults,
  panelesSerie: number
) {
  const r = results;
  const margin = 40;
  const pageW = 595;
  const pageH = 842;
  const contentW = pageW - margin * 2;
  let y = 0;
  const lines: string[] = [];

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      lines.push('---PAGEBREAK---');
      y = margin;
    }
  };

  const drawText = (text: string, size = 11, bold = false, color = '#1a1a1a') => {
    lines.push(`TEXT|${y}|${size}|${bold ? 'bold' : 'normal'}|${color}|${text}`);
    y += size + 6;
  };

  const drawSection = (title: string) => {
    ensureSpace(40);
    lines.push(`RECT|${margin}|${y - 4}|${contentW}|24|#f0a020`);
    drawText(title, 13, true, '#1a1a1a');
    y += 4;
  };

  y = margin;

  // Header
  lines.push(`RECT|${margin}|${y}|${contentW}|60|#0a0f0d`);
  lines.push(`TEXT|${y + 22}|20|bold|#f0a020|Calculadora Solar Off-Grid Colombia`);
  lines.push(`TEXT|${y + 44}|11|normal|#999999|Ficha Técnica de Dimensionamiento Fotovoltaico`);
  y += 80;
  lines.push(`TEXT|${y}|10|normal|#666666|Fecha: ${new Date().toLocaleString('es-CO')}`);
  y += 24;

  // Section 1
  drawSection('1. Perfil de Consumo (CA)');
  appliances.forEach((a) => {
    ensureSpace(20);
    drawText(
      `• ${a.name || 'Sin nombre'}: ${a.quantity}× ${a.watts}W × ${a.hours}h = ${formatNumber(a.watts * a.hours * a.quantity, 0)} Wh/día`,
      10
    );
  });
  y += 4;
  ensureSpace(20);
  drawText(`Consumo Diario Total (E_CA): ${formatNumber(r.eCA, 0)} Wh/día`, 11, true, '#0a7d3c');
  drawText(`Energía con inversor (E_T): ${formatNumber(r.eT, 0)} Wh`, 10, false, '#444444');
  drawText(`Energía a acumular (E): ${formatNumber(r.e, 0)} Wh`, 10, false, '#444444');
  y += 8;

  // Section 2
  drawSection('2. Parámetros del Sistema');
  drawText(`HSP: ${params.hsp} | V_NS: ${params.voltajeBanco}V | N: ${params.diasAutonomia} días`, 10);
  drawText(`P_D: ${params.profundidadDescarga} | K_T: ${params.factorTemperatura} | R: ${params.rendimiento}`, 10);
  y += 8;

  // Section 3
  drawSection('3. Banco de Baterías');
  drawText(`Capacidad útil (C_U): ${formatNumber(r.cU, 0)} Ah`, 10);
  drawText(`Capacidad total (C): ${formatNumber(r.c, 0)} Ah`, 10);
  drawText(`Batería: ${battery.voltajeNominal}V · ${battery.capacidadNominal}Ah`, 10);
  drawText(`En serie (A_S): ${r.aS} | En paralelo (A_P): ${r.aP}`, 10);
  drawText(`TOTAL: ${r.aT} baterías`, 11, true, '#0a7d3c');
  y += 8;

  // Section 4
  drawSection('4. Campo Fotovoltaico (Paneles)');
  drawText(`Potencia nominal (P_N): ${formatNumber(r.pN, 0)} W`, 10);
  drawText(`Panel: ${panel.potenciaPico}W · V_mp ${panel.vmp}V · I_mp ${panel.imp}A`, 10);
  drawText(`En serie (M_S): ${r.mS} | En paralelo (M_P): ${r.mP}`, 10);
  drawText(`TOTAL: ${r.mT} paneles · Potencia instalada: ${formatNumber(r.pNI, 0)} W`, 11, true, '#f0a020');
  y += 8;

  // Section 5
  drawSection('5. Equipos');
  drawText(`Inversor cargador (mín): ${formatNumber(r.inversorMin, 0)} W`, 10);
  drawText(`  Entrada ${params.voltajeBanco}V CC → 120V CA / 60Hz`, 10, false, '#666666');
  drawText(`Regulador MPPT (I_R): ${formatNumber(r.corrienteRegulador, 1)} A`, 10);
  y += 8;

  // Section 6
  drawSection('6. Resumen');
  drawText(`Estado: ${r.compatible ? 'COMPATIBLE' : 'REVISAR'}`, 11, true, r.compatible ? '#0a7d3c' : '#cc3300');
  drawText(`Paneles: ${r.mT} (${r.mS}S × ${r.mP}P) = ${formatNumber(r.pNI, 0)} W`, 10);
  drawText(`Baterías: ${r.aT} (${r.aS}S × ${r.aP}P) = ${formatNumber(r.aT * battery.capacidadNominal, 0)} Ah`, 10);
  drawText(`Inversor: ${formatNumber(r.inversorMin, 0)} W | Regulador: ${formatNumber(r.corrienteRegulador, 0)} A`, 10);

  // Build PDF with a minimal PDF generator
  buildPdf(lines, pageW, pageH, margin);
}

function buildPdf(
  lines: string[],
  pageW: number,
  pageH: number,
  margin: number
) {
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentY = margin;
  let pageIdx = 0;

  for (const line of lines) {
    if (line === '---PAGEBREAK---') {
      pages.push(currentPage.join('\n'));
      currentPage = [];
      currentY = margin;
      pageIdx++;
      continue;
    }
    currentPage.push(line);
    const parts = line.split('|');
    const yPos = Number(parts[1]);
    currentY = yPos;
  }
  pages.push(currentPage.join('\n'));

  // Build minimal PDF
  const objects: string[] = [];
  let objNum = 0;

  const header = '%PDF-1.4\n';

  // Object 1: Catalog
  const catalog = () => {
    objNum++;
    return `${objNum} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  };

  // Object 2: Pages
  const pagesObj = (count: number) => {
    objNum++;
    const kids = Array.from({ length: count }, (_, i) => `${3 + i * 2} 0 R`).join(' ');
    return `${objNum} 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${count} >>\nendobj\n`;
  };

  // Font objects
  objNum++; // reserve font
  const fontRegular = () => {
    const f = objNum;
    return `${f} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  };
  objNum++;
  const fontBold = () => {
    const f = objNum;
    return `${f} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;
  };

  const hexColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  };

  const pageObjects: { num: number; content: string }[] = [];
  const pageCount = pages.length;

  // Build catalog and pages
  const catalogStr = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const pageRefs = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(' ');
  const pagesStr = `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>\nendobj\n`;

  // Font 3 = regular, Font 4 = bold
  const fontRegStr = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const fontBoldStr = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  const allObjects: string[] = [catalogStr, pagesStr, fontRegStr, fontBoldStr];
  let nextObj = 5;

  const contentStreams: string[] = [];

  pages.forEach((pageLines) => {
    const pageObjNum = nextObj;
    const contentObjNum = nextObj + 1;
    nextObj += 2;

    let stream = '';
    const linesArr = pageLines.split('\n').filter((l) => l.length > 0);

    for (const line of linesArr) {
      const parts = line.split('|');
      const type = parts[0];
      if (type === 'TEXT') {
        const yPos = Number(parts[1]);
        const size = Number(parts[2]);
        const isBold = parts[3] === 'bold';
        const color = parts[4];
        const text = parts.slice(5).join('|');
        const fontRef = isBold ? '4 0 R' : '3 0 R';
        const c = hexColor(color);
        stream += `${c} rg\nBT /F${isBold ? 2 : 1} ${size} Tf 1 0 0 1 ${margin} ${pageH - yPos} Tm (${escapePdf(text)}) Tj ET\n`;
      } else if (type === 'RECT') {
        const yPos = Number(parts[2]);
        const w = Number(parts[3]);
        const h = Number(parts[4]);
        const color = parts[5];
        const c = hexColor(color);
        stream += `${c} rg\n${margin} ${pageH - yPos - h} ${w} ${h} re f\n`;
      }
    }

    const pageObj = `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`;
    const contentObj = `${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;

    allObjects.push(pageObj);
    allObjects.push(contentObj);
    contentStreams.push(stream);
  });

  // Build final PDF
  let pdf = header;
  const offsets: number[] = [];
  let offset = header.length;

  for (let i = 0; i < allObjects.length; i++) {
    offsets.push(offset);
    pdf += allObjects[i];
    offset += allObjects[i].length;
  }

  const xrefStart = offset;
  pdf += `xref\n0 ${allObjects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ficha-tecnica-solar-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
