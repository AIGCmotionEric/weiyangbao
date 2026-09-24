import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import type { FeedingRecord, FeedingListResponse, FeedingStats } from '@shared/api.interface';

@Controller('api/feeding')
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  @Get('stats/today')
  async getTodayStats(@Query('babyId') babyId?: string): Promise<FeedingStats> {
    return this.feedingService.getTodayStats(babyId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<FeedingRecord> {
    return this.feedingService.getById(id);
  }

  @Get()
  async getList(
    @Query('babyId') babyId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ): Promise<FeedingListResponse> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.feedingService.getList(babyId, type, limitNum);
  }

  @Post()
  async create(@Body() dto: CreateFeedingDto): Promise<FeedingRecord> {
    return this.feedingService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.feedingService.delete(id);
  }
}
