import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import pptxgen from 'pptxgenjs';
import { supabase } from '@/lib/supabase/client';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import type {
  DbPatient,
  DbTmbCalculation,
  DbFormulaSession,
  DbMealDistribution,
  DbFoodEquivalency,
  DbPlanTemplateSlide,
} from '@/lib/supabase/types';

// ─── Template layout (A4 landscape — matches Canva template) ─

const PAGE_W = 11.69;
const PAGE_H = 8.27;

const NAVY = '22385C'; // dark navy used across the template
const GRAY = '8C8C8C'; // nutritionist name gray

const FONT_HEADING = 'Kage'; // template heading font (Canva)
const FONT_BODY = 'Cardo'; // template body font (Canva)
const FONT_TABLE = 'Aparajita'; // template table font (Canva)

const TEMPLATE_PAGES_DIR = path.join(
  process.cwd(),
  'public',
  'template-pages',
);
const TEMPLATE_ASSETS_DIR = path.join(
  process.cwd(),
  'public',
  'template-assets',
);

// Static template pages (0-indexed PDF page numbers), in template order:
// 3-5 tips, 6-10 desayunos, 11-16 almuerzos, 17 snack, 18-23 cenas,
// 24 reglas, 25 alimentos altos en calorías
const STATIC_PAGES = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25,
];

// ─── Helpers ─────────────────────────────────────────────────

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normalidad';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidad I';
  if (bmi < 40) return 'Obesidad II';
  return 'Obesidad III';
}

function computeSummaryTotals(
  exchanges: { subgroupId: string; exchanges: number }[],
): Record<string, number> {
  const exchangeMap: Record<string, number> = {};
  for (const entry of exchanges) {
    exchangeMap[entry.subgroupId] =
      (exchangeMap[entry.subgroupId] || 0) + entry.exchanges;
  }
  const totals: Record<string, number> = {};
  for (const group of EXCHANGE_SUMMARY_GROUPS) {
    totals[group.id] = 0;
    for (const subId of group.subgroupIds) {
      totals[group.id] += exchangeMap[subId] || 0;
    }
  }
  return totals;
}

type WeightGoal = { date: string; targetWeight: number };

// ─── Slide helpers ───────────────────────────────────────────

function addStaticPage(pres: pptxgen, pageNum: number): void {
  const slide = pres.addSlide();
  slide.addImage({
    path: path.join(TEMPLATE_PAGES_DIR, `page-${pageNum}.jpg`),
    x: 0,
    y: 0,
    w: PAGE_W,
    h: PAGE_H,
  });
}

function addNutritionistName(
  slide: pptxgen.Slide,
  nutritionistName: string,
): void {
  if (!nutritionistName) return;
  slide.addText(nutritionistName, {
    x: PAGE_W - 5.4,
    y: PAGE_H - 0.62,
    w: 5.0,
    h: 0.4,
    fontSize: 12,
    fontFace: FONT_TABLE,
    color: GRAY,
    align: 'right',
    valign: 'middle',
    bold: true,
  });
}

// ─── Cover slide (dynamic: patient name) ─────────────────────

function generateCoverSlide(
  pres: pptxgen,
  patient: DbPatient,
  nutritionistName: string,
): void {
  const slide = pres.addSlide();
  slide.addImage({
    path: path.join(TEMPLATE_ASSETS_DIR, 'cover-bg.jpg'),
    x: 0,
    y: 0,
    w: PAGE_W,
    h: PAGE_H,
  });

  slide.addText('¡PUEDES LOGRARLO!', {
    x: 0,
    y: 2.55,
    w: '100%',
    h: 0.4,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: NAVY,
    align: 'center',
    valign: 'middle',
    charSpacing: 3,
  });

  slide.addText('PLAN', {
    x: 0,
    y: 3.0,
    w: '100%',
    h: 1.05,
    fontSize: 54,
    fontFace: FONT_HEADING,
    color: NAVY,
    align: 'center',
    valign: 'middle',
    charSpacing: 10,
  });

  slide.addText('NUTRICIONAL', {
    x: 0,
    y: 4.2,
    w: '100%',
    h: 1.05,
    fontSize: 54,
    fontFace: FONT_HEADING,
    color: NAVY,
    align: 'center',
    valign: 'middle',
    charSpacing: 10,
  });

  slide.addText((patient.full_name || '').toUpperCase(), {
    x: 0,
    y: 5.45,
    w: '100%',
    h: 0.45,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: NAVY,
    align: 'center',
    valign: 'middle',
    charSpacing: 3,
  });

  addNutritionistName(slide, nutritionistName);
}

// ─── Objectives slide (dynamic: objectives, BMI, calories, macros, goals) ──

function generateObjectivesSlide(
  pres: pptxgen,
  patient: DbPatient,
  tmbCalc: DbTmbCalculation | null,
  formulaSession: DbFormulaSession,
  objectiveText: string,
  weightGoals: WeightGoal[] | undefined,
  nutritionistName: string,
): void {
  const slide = pres.addSlide();
  slide.addImage({
    path: path.join(TEMPLATE_ASSETS_DIR, 'objectives-bg.jpg'),
    x: 0,
    y: 0,
    w: PAGE_W,
    h: PAGE_H,
    transparency: 78,
  });

  // Section: objectives
  slide.addText('OBJETIVOS DEL PLAN DE ALIMENTACION:', {
    x: 0.95,
    y: 0.3,
    w: 9.0,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_HEADING,
    color: NAVY,
    align: 'left',
    valign: 'middle',
  });

  const objLines = (objectiveText || '').split('\n').filter((l) => l.trim());
  if (objLines.length > 0) {
    const bulletTexts: pptxgen.TextProps[] = objLines.map((line) => ({
      text: line,
      options: {
        bullet: { code: '2022', indent: 10 },
        fontSize: 10.5,
        fontFace: FONT_BODY,
        color: NAVY,
        breakLine: true,
      },
    }));

    slide.addText(bulletTexts, {
      x: 0.95,
      y: 0.95,
      w: 6.15,
      h: 2.85,
      fontSize: 10.5,
      fontFace: FONT_BODY,
      color: NAVY,
      align: 'left',
      valign: 'top',
      paraSpaceAfter: 8,
      lineSpacingMultiple: 1.2,
    });
  }

  // Weight goals table (top right)
  if (weightGoals && weightGoals.length > 0) {
    const headerCell = (text: string): pptxgen.TableCell => ({
      text,
      options: {
        bold: true,
        color: NAVY,
        fill: { color: 'FFFFFF' },
        fontSize: 8,
        fontFace: FONT_TABLE,
        align: 'center',
        valign: 'middle',
      },
    });

    const headerRow: pptxgen.TableRow = [
      headerCell('FECHA'),
      headerCell('PESO META KG'),
      headerCell(''),
    ];

    const dataRows: pptxgen.TableRow[] = weightGoals.map((goal) => [
      {
        text: goal.date,
        options: {
          fontSize: 10,
          fontFace: FONT_BODY,
          color: NAVY,
          fill: { color: 'FFFFFF' },
          align: 'center',
          valign: 'middle',
        },
      },
      {
        text: `${goal.targetWeight}kg`,
        options: {
          fontSize: 10,
          fontFace: FONT_BODY,
          color: NAVY,
          fill: { color: 'FFFFFF' },
          align: 'center',
          valign: 'middle',
        },
      },
      {
        text: '',
        options: {
          fontSize: 10,
          fontFace: FONT_BODY,
          color: NAVY,
          fill: { color: 'FFFFFF' },
          align: 'center',
          valign: 'middle',
        },
      },
    ]);

    slide.addTable([headerRow, ...dataRows], {
      x: 7.35,
      y: 1.42,
      w: 3.5,
      rowH: 0.42,
      colW: [1.15, 1.2, 1.15],
      border: { pt: 0.75, color: NAVY },
      autoPage: false,
    });
  }

  // Section: BMI
  if (tmbCalc) {
    slide.addText('INDICE DE MASA CORPORAL', {
      x: 0.95,
      y: 3.95,
      w: 6.0,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT_HEADING,
      color: NAVY,
      align: 'left',
      valign: 'middle',
    });

    const heightM = (patient.height / 100).toFixed(2);
    const clinicalLines = [
      `${tmbCalc.age} años`,
      `${patient.weight} kg/ ${heightM} m`,
      `${tmbCalc.current_bmi.toFixed(1)} kg/m2`,
      getBmiCategory(tmbCalc.current_bmi),
    ];

    slide.addText(clinicalLines.join('\n'), {
      x: 1.55,
      y: 4.45,
      w: 2.6,
      h: 1.6,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: NAVY,
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.4,
    });

    // IMC reference table (static image from template)
    slide.addImage({
      path: path.join(TEMPLATE_ASSETS_DIR, 'img-007.png'),
      x: 4.35,
      y: 4.5,
      w: 2.17,
      h: 1.55,
    });

    // Waist reference table (static image from template)
    slide.addImage({
      path: path.join(TEMPLATE_ASSETS_DIR, 'img-006.png'),
      x: 6.75,
      y: 4.35,
      w: 4.3,
      h: 3.14,
    });

    // Section: caloric requirement
    slide.addText('REQUERIMIENTO CALORICO:', {
      x: 0.95,
      y: 6.1,
      w: 6.0,
      h: 0.45,
      fontSize: 16,
      fontFace: FONT_HEADING,
      color: NAVY,
      align: 'left',
      valign: 'middle',
    });

    const restrictionText =
      tmbCalc.caloric_restriction > 0
        ? `   restricción ${tmbCalc.caloric_restriction} calorías`
        : '';
    slide.addText(
      `${tmbCalc.target_calories} calorías${restrictionText}`,
      {
        x: 1.65,
        y: 6.55,
        w: 5.5,
        h: 0.35,
        fontSize: 11,
        fontFace: FONT_BODY,
        color: NAVY,
        align: 'left',
        valign: 'middle',
      },
    );
  }

  // Section: macro balance
  slide.addText('Balance de macronutrientes:', {
    x: 0.95,
    y: 6.95,
    w: 6.0,
    h: 0.45,
    fontSize: 16,
    fontFace: FONT_HEADING,
    color: NAVY,
    align: 'left',
    valign: 'middle',
  });

  const macroLines = [
    `Carbohidratos ${formulaSession.carbs_percent}%`,
    `Grasas ${formulaSession.fat_percent}%`,
    `Proteínas ${formulaSession.protein_percent}%`,
  ];
  slide.addText(macroLines.join('\n'), {
    x: 2.15,
    y: 7.35,
    w: 4.0,
    h: 0.85,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: NAVY,
    align: 'left',
    valign: 'top',
    lineSpacingMultiple: 1.25,
  });

  addNutritionistName(slide, nutritionistName);
}

// ─── Exchange table slide (dynamic: portions + equivalencies) ─

interface ExchangeTableRow {
  groupLabel: string;
  groupId: string;
  total: number;
  breakfast: number;
  lunch: number;
  afternoonSnack: number;
  dinner: number;
}

function buildExchangeRows(
  formulaSession: DbFormulaSession,
  mealDist: DbMealDistribution,
): ExchangeTableRow[] {
  const summaryTotals = computeSummaryTotals(formulaSession.exchanges);
  const dist = mealDist.distribution;

  return EXCHANGE_SUMMARY_GROUPS.map((group) => {
    const slot = dist[group.id] || {
      breakfast: 0,
      morningSnack: 0,
      lunch: 0,
      afternoonSnack: 0,
      dinner: 0,
    };
    return {
      groupLabel: group.label,
      groupId: group.id,
      total: summaryTotals[group.id] || 0,
      breakfast: slot.breakfast + slot.morningSnack,
      lunch: slot.lunch,
      afternoonSnack: slot.afternoonSnack,
      dinner: slot.dinner,
    };
  });
}

function groupEquivalencies(
  equivalencies: DbFoodEquivalency[],
): Record<string, DbFoodEquivalency[]> {
  const groups: Record<string, DbFoodEquivalency[]> = {};
  for (const eq of equivalencies) {
    if (!groups[eq.summary_group]) groups[eq.summary_group] = [];
    groups[eq.summary_group].push(eq);
  }
  return groups;
}

function generateExchangeTableSlide(
  pres: pptxgen,
  mealDist: DbMealDistribution,
  equivalencies: DbFoodEquivalency[],
  formulaSession: DbFormulaSession,
): void {
  const exchangeRows = buildExchangeRows(formulaSession, mealDist);
  const eqByGroup = groupEquivalencies(equivalencies);

  const slide = pres.addSlide();
  slide.addImage({
    path: path.join(TEMPLATE_ASSETS_DIR, 'exchange-bg.jpg'),
    x: 0,
    y: 0,
    w: PAGE_W,
    h: PAGE_H,
    transparency: 85,
  });

  const headerCell = (text: string): pptxgen.TableCell => ({
    text,
    options: {
      bold: true,
      color: NAVY,
      fill: { color: 'FFFFFF' },
      fontSize: 7.5,
      fontFace: FONT_TABLE,
      align: 'center',
      valign: 'middle',
    },
  });

  const headerRow: pptxgen.TableRow = [
    headerCell('GRUPO\nDE ALIMENTOS'),
    headerCell('NO.\nDE PORCIONES'),
    headerCell('DESAYUNO'),
    headerCell('ALMUERZO'),
    headerCell('MEDIA TARDE'),
    headerCell('CENA'),
    headerCell('EJEMPLOS DE ALIMENTOS, CON LA CANTIDAD QUE EQUIVALE A 1 PORCIÓN'),
  ];

  const numCell = (value: number): pptxgen.TableCell => ({
    text: value > 0 ? String(value) : '',
    options: {
      fontSize: 10,
      fontFace: FONT_TABLE,
      color: NAVY,
      fill: { color: 'FFFFFF' },
      align: 'center',
      valign: 'middle',
    },
  });

  // Build data rows and estimate heights from examples text length
  const dataRows: pptxgen.TableRow[] = [];
  const rowHeights: number[] = [0.45]; // header

  for (const row of exchangeRows) {
    const group = EXCHANGE_SUMMARY_GROUPS.find((g) => g.id === row.groupId);
    const calRange = group?.calorieRange || '';

    const groupCellLines: pptxgen.TextProps[] = [
      {
        text: row.groupLabel,
        options: {
          bold: true,
          fontSize: 9,
          fontFace: FONT_TABLE,
          color: NAVY,
          breakLine: true,
        },
      },
    ];
    if (calRange) {
      groupCellLines.push({
        text: calRange,
        options: {
          fontSize: 8,
          fontFace: FONT_TABLE,
          color: NAVY,
          breakLine: row.groupId === 'verduras',
        },
      });
    }
    if (row.groupId === 'verduras') {
      groupCellLines.push({
        text: 'ILIMITADAS',
        options: {
          bold: true,
          fontSize: 8,
          fontFace: FONT_TABLE,
          color: NAVY,
        },
      });
    }

    const eqs = (eqByGroup[row.groupId] || [])
      .map((eq) =>
        eq.portion_desc ? `${eq.food_name} ${eq.portion_desc}` : eq.food_name,
      )
      .join(' | ');

    dataRows.push([
      {
        text: groupCellLines,
        options: {
          fill: { color: 'FFFFFF' },
          align: 'center',
          valign: 'middle',
        },
      } as pptxgen.TableCell,
      {
        text: row.total > 0 ? String(row.total) : '',
        options: {
          fontSize: 11,
          fontFace: FONT_TABLE,
          color: NAVY,
          fill: { color: 'FFFFFF' },
          align: 'center',
          valign: 'middle',
        },
      },
      numCell(row.breakfast),
      numCell(row.lunch),
      numCell(row.afternoonSnack),
      numCell(row.dinner),
      {
        text: eqs,
        options: {
          fontSize: 7,
          fontFace: FONT_TABLE,
          color: NAVY,
          fill: { color: 'FFFFFF' },
          align: 'left',
          valign: 'middle',
        },
      },
    ]);

    // Estimate row height: ~130 chars per line at 7pt in a 5.05in column
    const estimatedLines = Math.max(2, Math.ceil(eqs.length / 130));
    rowHeights.push(Math.min(Math.max(estimatedLines * 0.13 + 0.12, 0.6), 1.7));
  }

  // Scale rows to fit available height (y 0.55 → 7.9)
  const totalH = rowHeights.reduce((a, b) => a + b, 0);
  const maxH = 7.35;
  const scale = totalH > maxH ? maxH / totalH : 1;

  slide.addTable([headerRow, ...dataRows], {
    x: 0.45,
    y: 0.55,
    w: 10.8,
    rowH: rowHeights.map((h) => h * scale),
    colW: [1.5, 0.85, 0.9, 0.9, 1.0, 0.9, 4.75],
    border: { pt: 0.5, color: NAVY },
    autoPage: false,
  });
}

// ─── Template DB slide generator (educational slides) ────────

function generateTemplateSlide(
  pres: pptxgen,
  template: DbPlanTemplateSlide,
): void {
  const slide = pres.addSlide();
  slide.background = { fill: 'FFFFFF' };

  const contentX = 1.2;
  const contentW = PAGE_W - 2.4;

  slide.addText(template.content.heading, {
    x: contentX,
    y: 0.8,
    w: contentW,
    h: 1.0,
    fontSize: 22,
    fontFace: FONT_HEADING,
    color: NAVY,
    align: 'center',
    valign: 'middle',
  });

  slide.addShape(pres.ShapeType.rect, {
    x: contentX,
    y: 1.85,
    w: contentW,
    h: 0.025,
    fill: { color: NAVY },
  });

  if (template.content.body) {
    slide.addText(template.content.body, {
      x: contentX,
      y: 2.2,
      w: contentW,
      h: 4.5,
      fontSize: 14,
      fontFace: FONT_BODY,
      color: NAVY,
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.4,
    });
  }

  if (template.content.bullets && template.content.bullets.length > 0) {
    const bulletStartY = template.content.body ? 5.2 : 2.2;
    const bulletTexts: pptxgen.TextProps[] = template.content.bullets.map(
      (b) => ({
        text: b,
        options: {
          bullet: true,
          fontSize: 14,
          fontFace: FONT_BODY,
          color: NAVY,
        },
      }),
    );

    slide.addText(bulletTexts, {
      x: contentX,
      y: bulletStartY,
      w: contentW,
      h: PAGE_H - bulletStartY - 0.5,
      fontSize: 14,
      fontFace: FONT_BODY,
      color: NAVY,
      align: 'left',
      valign: 'top',
      paraSpaceAfter: 6,
    });
  }
}

// ─── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      formulaSessionId,
      mealDistributionId,
      planTitle,
      objectiveText,
      durationMonths,
      weightLossPerMonth,
      weightGoals,
      templateSlideIds,
    } = body as {
      patientId: string;
      formulaSessionId: string;
      mealDistributionId: string;
      planTitle: string;
      objectiveText: string;
      durationMonths: number;
      weightLossPerMonth: number;
      weightGoals?: WeightGoal[];
      templateSlideIds?: string[];
    };

    const missingFields: string[] = [];
    if (!patientId) missingFields.push('patientId');
    if (!formulaSessionId) missingFields.push('formulaSessionId');
    if (!mealDistributionId) missingFields.push('mealDistributionId');
    if (!planTitle) missingFields.push('planTitle');
    if (durationMonths === undefined) missingFields.push('durationMonths');
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 },
      );
    }

    const { data: patient, error: patErr } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patErr || !patient) {
      throw new Error(patErr?.message || `Paciente no encontrado: ${patientId}`);
    }

    const { data: formulaSession, error: fsErr } = await supabase
      .from('formula_sessions')
      .select('*')
      .eq('id', formulaSessionId)
      .single();

    if (fsErr || !formulaSession) {
      throw new Error(
        fsErr?.message || `Sesión de fórmula no encontrada: ${formulaSessionId}`,
      );
    }

    let tmbCalc: DbTmbCalculation | null = null;
    if (formulaSession.tmb_calculation_id) {
      const { data: tmb, error: tmbErr } = await supabase
        .from('tmb_calculations')
        .select('*')
        .eq('id', formulaSession.tmb_calculation_id)
        .single();

      if (tmbErr) {
        console.warn(
          `TMB calculation fetch warning for ${formulaSession.tmb_calculation_id}:`,
          tmbErr.message,
        );
      } else {
        tmbCalc = tmb;
      }
    }

    const { data: mealDist, error: mdErr } = await supabase
      .from('meal_distributions')
      .select('*')
      .eq('id', mealDistributionId)
      .single();

    if (mdErr || !mealDist) {
      throw new Error(
        mdErr?.message ||
          `Distribución de comidas no encontrada: ${mealDistributionId}`,
      );
    }

    const { data: equivalencies, error: feErr } = await supabase
      .from('food_equivalencies')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (feErr) {
      console.warn('Food equivalencies fetch warning:', feErr.message);
    }

    let templates: DbPlanTemplateSlide[] = [];
    if (templateSlideIds && templateSlideIds.length > 0) {
      const { data: tmpl, error: ptErr } = await supabase
        .from('plan_template_slides')
        .select('*')
        .in('id', templateSlideIds)
        .order('sort_order', { ascending: true });

      if (ptErr) {
        console.warn('Template slides fetch warning:', ptErr.message);
      } else {
        templates = tmpl || [];
      }
    }

    const pres = new pptxgen();
    pres.defineLayout({ name: 'A4_LANDSCAPE', width: PAGE_W, height: PAGE_H });
    pres.layout = 'A4_LANDSCAPE';
    pres.author = 'Hippos';
    pres.title = planTitle;

    const nutritionistName =
      process.env.NEXT_PUBLIC_NUTRITIONIST_NAME || 'ND Lina Marcela Hurtado G.';

    // 1-3. Dynamic slides rebuilt over the original template photos
    generateCoverSlide(pres, patient, nutritionistName);
    generateObjectivesSlide(
      pres,
      patient,
      tmbCalc,
      formulaSession,
      objectiveText,
      weightGoals,
      nutritionistName,
    );
    generateExchangeTableSlide(
      pres,
      mealDist,
      equivalencies || [],
      formulaSession,
    );

    // 4-26. Static template pages as full-bleed images (pixel-perfect)
    for (const pageNum of STATIC_PAGES) {
      addStaticPage(pres, pageNum);
    }

    // Optional educational slides from DB
    for (const template of templates) {
      generateTemplateSlide(pres, template);
    }

    const { error: insertErr } = await supabase.from('generated_plans').insert({
      patient_id: patientId,
      formula_session_id: formulaSessionId,
      meal_distribution_id: mealDistributionId,
      plan_title: planTitle,
      objective_text: objectiveText,
      duration_months: durationMonths,
      weight_loss_per_month: weightLossPerMonth,
      weight_goals: weightGoals || [],
      template_slide_ids: templateSlideIds || [],
    });

    if (insertErr) {
      console.warn('Failed to record generated plan:', insertErr.message);
    }

    const pptxBuffer = await pres.write({ outputType: 'nodebuffer' });
    const safeName = patient.full_name
      ? patient.full_name.replace(/\s+/g, '_')
      : 'paciente';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Plan_Nutricional_${safeName}_${dateStr}.pptx`;

    return new NextResponse(pptxBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('PPTX generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error al generar el plan',
      },
      { status: 500 },
    );
  }
}
