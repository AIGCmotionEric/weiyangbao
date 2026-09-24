import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';

import { GrowthService } from './growth.service';
import { CreateGrowthDto } from './dto/create-growth.dto';
import type { GrowthRecord, GrowthListResponse } from '@shared/api.interface';

@Controller('api/growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get('latest')
  async findLatest(@Query('babyId') babyId?: string): Promise<GrowthRecord | null> {
    return this.growthService.findLatest(babyId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<GrowthRecord> {
    return this.growthService.findOne(id);
  }

  @Get()
  async findAll(@Query('babyId') babyId?: string): Promise<GrowthListResponse> {
    return this.growthService.findAll(babyId);
  }

  @Post()
  async create(@Body() dto: CreateGrowthDto): Promise<GrowthRecord> {
    return this.growthService.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.growthService.remove(id);
  }
}
