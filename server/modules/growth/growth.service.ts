import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, eq, desc, count } from 'drizzle-orm';

import { growthRecord } from '@server/database/schema';
import type { GrowthRecord, GrowthListResponse } from '@shared/api.interface';
import type { CreateGrowthDto } from './dto/create-growth.dto';

@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toRecord(row: typeof growthRecord.$inferSelect): GrowthRecord {
    return {
      id: row.id,
      babyId: row.babyId,
      height: parseFloat(String(row.height)),
      weight: parseFloat(String(row.weight)),
      measureDate: row.measureDate,
      note: row.note ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findAll(babyId?: string): Promise<GrowthListResponse> {
    const conditions = [];
    if (babyId) conditions.push(eq(growthRecord.babyId, babyId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = whereClause
      ? this.db.select().from(growthRecord).where(whereClause)
      : this.db.select().from(growthRecord);

    const rows = await baseQuery.orderBy(desc(growthRecord.measureDate));

    const countResult = whereClause
      ? await this.db.select({ count: count() }).from(growthRecord).where(whereClause)
      : await this.db.select({ count: count() }).from(growthRecord);

    const items: GrowthRecord[] = rows.map((row: typeof growthRecord.$inferSelect) => this.toRecord(row));
    return { items, total: countResult[0].count };
  }

  async findLatest(babyId?: string): Promise<GrowthRecord | null> {
    const conditions = [];
    if (babyId) conditions.push(eq(growthRecord.babyId, babyId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const query = whereClause
      ? this.db.select().from(growthRecord).where(whereClause)
      : this.db.select().from(growthRecord);

    const rows = await query
      .orderBy(desc(growthRecord.measureDate))
      .limit(1);

    if (rows.length === 0) return null;
    return this.toRecord(rows[0]);
  }

  async findOne(id: string): Promise<GrowthRecord> {
    const rows = await this.db
      .select()
      .from(growthRecord)
      .where(eq(growthRecord.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('生长记录不存在');
    }
    return this.toRecord(rows[0]);
  }

  async create(dto: CreateGrowthDto): Promise<GrowthRecord> {
    const rows = await this.db
      .insert(growthRecord)
      .values({
        babyId: dto.babyId,
        height: String(dto.height),
        weight: String(dto.weight),
        measureDate: dto.measureDate,
        note: dto.note,
      })
      .returning();

    this.logger.log(`创建生长记录: ${rows[0].id}`);
    return this.toRecord(rows[0]);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db
      .delete(growthRecord)
      .where(eq(growthRecord.id, id))
      .returning({ id: growthRecord.id });

    if (deleted.length === 0) {
      throw new NotFoundException('生长记录不存在');
    }
    this.logger.log(`删除生长记录: ${id}`);
  }
}
