import { Controller, Get, Query } from '@nestjs/common';
import { DocumentService } from './documents.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async prompt(@Query('search') search: string): Promise<string> {
    return this.documentService.processPrompt(search);
  }
}
