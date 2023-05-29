import { Controller, Get } from '@nestjs/common';

@Controller('documents')
export class MessageController {
  @Get()
  async prompt(): Promise<any[]> {
    return [];
  }
}
