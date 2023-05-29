import { Body, Controller, Post } from '@nestjs/common';
import { DocumentService } from './documents.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async prompt(@Body('request') request: string): Promise<any> {
    return this.documentService.processPrompt(request);
  }
}
