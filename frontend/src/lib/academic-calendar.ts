import { AcademicPeriodType } from '@/types/academic.types';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type PeriodPresetOption = SelectOption & {
  name: string;
  orderNumber: number;
};

const monthLabels = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export const monthOptions: SelectOption[] = monthLabels.map((label, index) => ({
  value: String(index + 1),
  label,
}));

export function getDayOptions(year: number, month?: string | number): SelectOption[] {
  const numericMonth = Number(month);

  if (!year || !numericMonth || numericMonth < 1 || numericMonth > 12) {
    return [];
  }

  const daysInMonth = new Date(year, numericMonth, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      value: String(day),
      label: pad(day),
    };
  });
}

export function buildIsoDate(
  year: number,
  month?: string | number,
  day?: string | number,
): string {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (!numericYear || !numericMonth || !numericDay) {
    return '';
  }

  const candidate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  if (
    candidate.getUTCFullYear() !== numericYear ||
    candidate.getUTCMonth() !== numericMonth - 1 ||
    candidate.getUTCDate() !== numericDay
  ) {
    return '';
  }

  return `${numericYear}-${pad(numericMonth)}-${pad(numericDay)}`;
}

export function getPeriodPresetOptions(
  type?: AcademicPeriodType,
): PeriodPresetOption[] {
  if (!type) {
    return [];
  }

  switch (type) {
    case AcademicPeriodType.SEMESTER:
      return [1, 2].map((orderNumber) => ({
        value: String(orderNumber),
        label: `${orderNumber}º Semestre`,
        name: `${orderNumber}º Semestre`,
        orderNumber,
      }));
    case AcademicPeriodType.TRIMESTER:
      return [1, 2, 3].map((orderNumber) => ({
        value: String(orderNumber),
        label: `${orderNumber}º Trimestre`,
        name: `${orderNumber}º Trimestre`,
        orderNumber,
      }));
    case AcademicPeriodType.QUARTER:
      return [1, 2, 3, 4].map((orderNumber) => ({
        value: String(orderNumber),
        label: `${orderNumber}º Quarter`,
        name: `${orderNumber}º Quarter`,
        orderNumber,
      }));
    case AcademicPeriodType.BIMESTER:
      return [1, 2, 3, 4].map((orderNumber) => ({
        value: String(orderNumber),
        label: `${orderNumber}º Bimestre`,
        name: `${orderNumber}º Bimestre`,
        orderNumber,
      }));
    case AcademicPeriodType.ANNUAL:
      return [
        {
          value: '1',
          label: 'Período Anual',
          name: 'Período Anual',
          orderNumber: 1,
        },
      ];
    default:
      return [];
  }
}
