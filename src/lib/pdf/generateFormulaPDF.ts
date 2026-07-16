import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Patient } from '@/lib/types/patient';
import type { TmbCalculation, FormulaType } from '@/lib/types/tmb';
import type { FormulaSession } from '@/lib/types/formula';
import { FOOD_GROUPS } from '@/lib/constants/food-groups';
import { formatKcal, formatNumber } from '@/lib/utils/format';

// ─── Label maps ──────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentario',
  LIGHTLY_ACTIVE: 'Poco activo',
  MODERATELY_ACTIVE: 'Moderadamente activo',
  VERY_ACTIVE: 'Muy activo',
  EXTREMELY_ACTIVE: 'Extremadamente activo',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MAINTENANCE: 'Mantenimiento',
  MUSCLE_GAIN: 'Ganancia muscular',
  PREGNANCY: 'Gestación',
  OTHER: 'Otro',
};

const SEX_LABELS: Record<string, string> = { M: 'Masculino', F: 'Femenino' };

const FORMULA_LABELS: Record<FormulaType, string> = {
  mifflin: 'Mifflin-St Jeor',
  dri: 'DRI (IOM 2005)',
};

function fmt(n: number, decimals = 1): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(decimals);
}

// ─── Main generator ──────────────────────────────────────────

export interface FormulaPDFData {
  patient: Patient;
  tmbCalculation: TmbCalculation;
  session: FormulaSession;
}

export function generateFormulaPDF(data: FormulaPDFData): jsPDF {
  const { patient, tmbCalculation: tmb, session } = data;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  let y = margin;

  // ── Fonts ──────────────────────────────────────────────────
  const titleSize = 14;
  const sectionSize = 11;
  const bodySize = 9;
  const smallSize = 8;

  function section(title: string) {
    y += 6;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(sectionSize);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, margin, y);
    y += 5;
    // separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  }

  function pair(label: string, value: string, col = 0) {
    const colW = usableW / 2;
    const x = margin + col * colW;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(bodySize);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`${label}:`, x, y);
    const labelW = doc.getTextWidth(`${label}: `);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(value, x + labelW + 0.5, y);
  }

  // ── Brand Header ───────────────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(smallSize);
  doc.setTextColor(91, 140, 90); // sage green
  doc.text('Hippos — Planificación Dietaria', pageW / 2, y, { align: 'center' });
  y += 6;

  // ── Header ─────────────────────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.setTextColor(44, 40, 37); // warm brown ink
  doc.text('PLAN NUTRICIONAL PERSONALIZADO', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(smallSize);
  doc.setTextColor(107, 101, 96); // ink-secondary
  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.text(`Fecha: ${today}`, pageW / 2, y, { align: 'center' });
  y += 8;

  // ── Patient info ───────────────────────────────────────────
  section('DATOS DEL PACIENTE');
  const bmi = patient.height > 0 ? (patient.weight / ((patient.height / 100) ** 2)) : 0;
  const infoRows = [
    ['Nombre', patient.fullName],
    ['Edad', `${patient.age} años`],
    ['Sexo', SEX_LABELS[patient.sex] ?? patient.sex],
    ['Peso', `${formatNumber(patient.weight, 1)} kg`],
    ['Talla', `${patient.height} cm`],
    ['IMC', formatNumber(bmi, 1)],
    ['Objetivo', OBJECTIVE_LABELS[patient.objective] ?? patient.objective],
    ['Actividad', ACTIVITY_LABELS[patient.activityLevel] ?? patient.activityLevel],
  ];
  for (let i = 0; i < infoRows.length; i++) {
    pair(infoRows[i][0], infoRows[i][1], i % 2);
    if (i % 2 === 1) y += 5;
  }
  y += 3;

  // ── Requirements ───────────────────────────────────────────
  section('REQUERIMIENTO ENERGÉTICO');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(bodySize);
  doc.setTextColor(15, 23, 42);
  doc.text(`Calorías objetivo: ${formatKcal(tmb.targetCalories)}/día (${FORMULA_LABELS[tmb.formulaType]})`, margin, y);
  y += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(bodySize);
  doc.setTextColor(30, 41, 59);
  if (tmb.formulaType === 'dri') {
    doc.text(`Requerimiento DRI (EER): ${formatKcal(tmb.tmb)}`, margin, y);
    y += 4;
    doc.text(`PA (IOM): ×${tmb.activityFactor}`, margin, y);
    y += 4;
  } else {
    doc.text(`TMB: ${formatKcal(tmb.tmb)}`, margin, y);
    y += 4;
    doc.text(`TDEE (×${tmb.activityFactor}): ${formatKcal(tmb.tdee)}`, margin, y);
    y += 4;
  }
  if (tmb.caloricRestriction > 0) {
    doc.text(`Restricción: −${formatKcal(tmb.caloricRestriction)}`, margin, y);
    y += 4;
  }

  // ── Exchange table ─────────────────────────────────────────
  section('PLAN DE INTERCAMBIOS');
  const exchangeMap = new Map(session.exchanges.map(e => [e.subgroupId, e.exchanges]));

  interface TableRow { group: string; subgroup: string; portions: string; prot: string; fat: string; cho: string; kcal: string; isGroupHeader?: boolean }
  const tableRows: TableRow[] = [];

  for (const group of FOOD_GROUPS) {
    const active = group.subgroups.filter(s => (exchangeMap.get(s.id) ?? 0) > 0);
    if (active.length === 0) continue;
    tableRows.push({ group: group.name, subgroup: '', portions: '', prot: '', fat: '', cho: '', kcal: '', isGroupHeader: true });
    for (const sub of active) {
      const ex = exchangeMap.get(sub.id) ?? 0;
      tableRows.push({
        group: '',
        subgroup: sub.name,
        portions: fmt(ex, 1),
        prot: fmt(sub.protein * ex, 1),
        fat: fmt(sub.fat * ex, 1),
        cho: fmt(sub.carbs * ex, 1),
        kcal: fmt(sub.kcalPerExchange * ex, 1),
      });
    }
  }

  if (tableRows.length === 0) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(bodySize);
    doc.setTextColor(148, 163, 184);
    doc.text('Sin intercambios asignados', margin, y);
    y += 6;
  } else {
    // Build rows as plain arrays of strings (avoids jspdf-autotable CellInput type issues)
    const head = [['Grupo / Subgrupo', 'Porc.', 'Prot (g)', 'Grasa (g)', 'CHO (g)', 'Kcal']];
    const body: (string | number)[][] = [];
    for (const r of tableRows) {
      if (r.isGroupHeader) {
        body.push([r.group, '', '', '', '', '']);
      } else {
        body.push([`  ${r.subgroup}`, r.portions, r.prot, r.fat, r.cho, r.kcal]);
      }
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head,
      body,
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 7,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right', cellWidth: 16 },
        3: { halign: 'right', cellWidth: 16 },
        4: { halign: 'right', cellWidth: 16 },
        5: { halign: 'right', cellWidth: 16 },
      },
      didParseCell: (hookData) => {
        // Bold group header rows
        const rowData = hookData.row.raw as (string | number)[];
        if (rowData.length > 1 && rowData[1] === '' && rowData[0] !== '' && !(rowData[0] as string).startsWith('  ')) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [241, 245, 249];
        }
      },
      didDrawPage: () => { y = (doc as any).lastAutoTable?.finalY ?? y; },
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;
  }

  // ── Macro summary ──────────────────────────────────────────
  section('RESUMEN NUTRICIONAL');
  const t = session.totals;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(bodySize);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total: ${formatKcal(t.totalKcal)} (${fmt(session.adequacyPercent)}% del requerimiento)`, margin, y);
  y += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Proteína: ${fmt(t.protein)}g (${fmt(t.proteinPercent)}%) — ${formatKcal(t.proteinKcal)}`, margin, y);
  y += 4;
  doc.text(`Grasa: ${fmt(t.fat)}g (${fmt(t.fatPercent)}%) — ${formatKcal(t.fatKcal)}`, margin, y);
  y += 4;
  doc.text(`Carbohidratos: ${fmt(t.carbs)}g (${fmt(t.carbsPercent)}%) — ${formatKcal(t.carbsKcal)}`, margin, y);
  y += 4;

  // ── Notes ──────────────────────────────────────────────────
  const hasAllergies = patient.foodAllergies.length > 0;
  const hasPathologies = patient.pathologies.length > 0;
  const hasNotes = patient.notes.trim().length > 0;

  if (hasAllergies || hasPathologies || hasNotes) {
    section('OBSERVACIONES');

    // Draw amber box
    const boxY = y;
    if (hasAllergies) {
      y += 4;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(bodySize);
      doc.setTextColor(146, 64, 14);
      doc.text('Alergias alimentarias:', margin, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      doc.text(patient.foodAllergies.join(', '), margin, y + 4);
      y += 8;
    }
    if (hasPathologies) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(bodySize);
      doc.setTextColor(146, 64, 14);
      doc.text('Patologías:', margin, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      doc.text(patient.pathologies.join(', '), margin, y + 4);
      y += 8;
    }
    if (hasNotes) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(bodySize);
      doc.setTextColor(146, 64, 14);
      doc.text('Observaciones:', margin, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(120, 53, 15);
      doc.text(patient.notes, margin, y + 4);
      y += 8;
    }
    // amber border
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(margin - 2, boxY - 2, usableW + 4, y - boxY, 2, 2, 'S');
  }

  // ── Footer ─────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(smallSize);
    doc.setTextColor(148, 163, 184);

    // Line above footer
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageW - margin, footerY - 2);

    doc.setTextColor(91, 140, 90); // sage green
    doc.text(`Generado por Hippos — Planificación Dietaria`, pageW / 2, footerY, { align: 'center' });
  }

  // ── Metadata ───────────────────────────────────────────────
  doc.setProperties({
    title: `Plan Nutricional — ${patient.fullName}`,
    author: 'Hippos',
    subject: 'Plan Nutricional Personalizado',
  });

  return doc;
}

/** Utility to trigger browser download */
export function downloadPDF(doc: jsPDF, patient: Patient) {
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Plan-Nutricional-${patient.firstName}-${patient.lastName}-${dateStr}.pdf`);
}
