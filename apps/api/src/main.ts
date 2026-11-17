import 'reflect-metadata';
import { Module, Controller, Get, Post, Put, Delete, Param, Query, Body, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import dataSource from './data-source';
import { KnowledgeService } from './knowledge.service';
import { CategoryDto, CardDto, ReviewDto } from './dto';

@Controller('api')
class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}
  @Get('snapshot') snapshot(@Query('categoryId', new ParseUUIDPipe({ optional: true })) root?: string) { return this.service.snapshot(root); }
  @Post('categories') createCategory(@Body() body: CategoryDto) { return this.service.saveCategory(body); }
  @Put('categories/:id') updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() body: CategoryDto) { return this.service.saveCategory(body, id); }
  @Delete('categories/:id') deleteCategory(@Param('id', ParseUUIDPipe) id: string) { return this.service.deleteCategory(id); }
  @Post('cards') createCard(@Body() body: CardDto) { return this.service.saveCard(body); }
  @Put('cards/:id') updateCard(@Param('id', ParseUUIDPipe) id: string, @Body() body: CardDto) { return this.service.saveCard(body, id); }
  @Delete('cards/:id') deleteCard(@Param('id', ParseUUIDPipe) id: string) { return this.service.deleteCard(id); }
  @Get('cards/:id/history') history(@Param('id', ParseUUIDPipe) id: string) { return this.service.history(id); }
  @Post('cards/:id/reviews') review(@Param('id', ParseUUIDPipe) id: string, @Body() body: ReviewDto) { return this.service.review(id, body); }
}
@Module({ controllers: [KnowledgeController], providers: [
  { provide: DataSource, useFactory: () => dataSource.initialize() }, KnowledgeService,
] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3001), '127.0.0.1');
}
bootstrap().catch(error => { console.error(error); process.exit(1); });
