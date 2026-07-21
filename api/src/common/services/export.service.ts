import { Injectable } from '@nestjs/common';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

@Injectable()
export class ExportService {
  /**
   * Gera CSV a partir de dados
   */
  generateCSV<T>(data: T[], columns: ExportColumn[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Header
    const header = columns.map((col) => this.escapeCSV(col.label)).join(',');

    // Rows
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          const value = this.getNestedValue(item, col.key);
          const formatted = col.format ? col.format(value) : value;
          return this.escapeCSV(String(formatted ?? ''));
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Gera Excel (CSV com BOM para UTF-8)
   */
  generateExcel<T>(data: T[], columns: ExportColumn[]): Buffer {
    const csv = this.generateCSV(data, columns);
    // Adicionar BOM para UTF-8
    const bom = '\uFEFF';
    return Buffer.from(bom + csv, 'utf-8');
  }

  /**
   * Escapa valores para CSV
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Obtém valor aninhado de objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Formata data para pt-BR
   */
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  /**
   * Formata data e hora para pt-BR
   */
  formatDateTime(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  }

  /**
   * Formata número decimal
   */
  formatNumber(value: number, decimals = 2): string {
    if (value === null || value === undefined) return '';
    return value.toFixed(decimals).replace('.', ',');
  }

  /**
   * Formata percentual
   */
  formatPercent(value: number, decimals = 1): string {
    if (value === null || value === undefined) return '';
    return `${(value * 100).toFixed(decimals).replace('.', ',')}%`;
  }
}
