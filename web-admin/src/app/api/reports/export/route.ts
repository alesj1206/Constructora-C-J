import ExcelJS from 'exceljs';
import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { GetCostReport } from '@/features/inventory/domain/usecases/report-usecases';

export const instant = false;

/**
 * HU-07: one-click Excel export of consumptions by project and period,
 * for the accountant to use in SIIGO.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const project = url.searchParams.get('project') ?? '';
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  const result = await new GetCostReport(provideInventoryRepository()).execute(project, from, to);
  if (!result.ok) {
    return new Response(result.error.message, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Consumos');
  sheet.columns = [
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Material', key: 'description', width: 40 },
    { header: 'Unidad', key: 'unit', width: 12 },
    { header: 'Consumo', key: 'consumedQty', width: 14 },
    { header: 'Costo total', key: 'totalCost', width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const row of result.value) {
    sheet.addRow({
      code: row.code,
      description: row.description,
      unit: row.unit,
      consumedQty: row.consumedQty,
      totalCost: row.totalCost,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `consumos_${from}_${to}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
