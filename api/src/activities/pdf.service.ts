import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

export interface ActivityPdfData {
  title: string;
  description?: string;
  headerText?: string;
  footerText?: string;
  // Novos campos estruturados para o cabeçalho
  municipalityName?: string;
  institutionName: string;
  evaluationPeriod?: string;
  className: string;
  classShift?: string;
  subjectName: string;
  teacherName: string;
  activityDate: string;
  totalPoints: number;
  hasInstructions: boolean;
  instructions?: string;
  questions: Array<{
    number: number;
    statement: string;
    typeName: string;
    points: number;
    isMultipleChoice: boolean;
    isTrueFalse: boolean;
    isShortAnswer: boolean;
    isEssay: boolean;
    isFillInBlank: boolean;
    images?: string[]; // Array de URLs de imagens
    hasMultipleImages?: boolean; // Flag para verificar se há mais de uma imagem
    options?: Array<{
      letter: string;
      text: string;
    }>;
    answerLines?: number[];
  }>;
}

@Injectable()
export class PdfService {
  private template: HandlebarsTemplateDelegate;

  constructor() {
    this.loadTemplate();
  }

  private loadTemplate(): void {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'worksheet.hbs',
    );
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.template = Handlebars.compile(templateContent);
  }

  async generateActivityPdf(data: ActivityPdfData): Promise<Buffer> {
    // Renderizar HTML com dados
    const html = this.template(data);

    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  // Renderiza apenas o HTML sem gerar PDF (para preview)
  generateActivityHtml(data: ActivityPdfData): string {
    return this.template(data);
  }
}
