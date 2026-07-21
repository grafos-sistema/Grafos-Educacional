import { Module, Global } from '@nestjs/common';
import { ExportService } from './services/export.service';

@Global()
@Module({
  providers: [ExportService],
  exports: [ExportService],
})
export class CommonModule {}
