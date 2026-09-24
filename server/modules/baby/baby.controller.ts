import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Baby } from '@shared/api.interface';
import { BabyService } from './baby.service';
import { CreateBabyDto } from './dto/create-baby.dto';
import { UpdateBabyDto } from './dto/update-baby.dto';

@Controller('api/baby')
export class BabyController {
  constructor(private readonly babyService: BabyService) {}

  @Get()
  async findAll(): Promise<Baby[]> {
    return this.babyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Baby> {
    return this.babyService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateBabyDto,
  ): Promise<Baby> {
    const { userId } = req.userContext;
    return this.babyService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateBabyDto,
  ): Promise<Baby> {
    const { userId } = req.userContext;
    return this.babyService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.babyService.remove(id);
  }
}
