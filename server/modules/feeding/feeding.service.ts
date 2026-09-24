import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { feedingRecord } from '@server/database/schema';
import type { FeedingRecord, FeedingListResponse, FeedingStats, FeedingType } from '@shared/api.interface';
import type { CreateFeedingDto } from './dto/create-feeding.dto';

@Injectable()
export class FeedingService {
  private readonly logger = new Logger(FeedingService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private toFeedingRecord(row: {
    id: string;
    babyId: string;
    type: string;
    amount: string;
    feedingTime: Date;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FeedingRecord {
    return {
      id: row.id,
      babyId: row.babyId,
      type: row.type as FeedingType,
      amount: parseFloat(row.amount),
      feedingTime: row.feedingTime.toISOString(),
      note: row.note ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getList(babyId?: string, type?: string, limit: number = 50): Promise<FeedingListResponse> {
    try {
      const conditions = [];
      if (babyId) conditions.push(eq(feedingRecord.babyId, babyId));
      if (type) conditions.push(eq(feedingRecord.type, type));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult, rows] = await Promise.all([
        this.db
          .select({ count: count() })
          .from(feedingRecord)
          .where(whereClause),
        this.db
          .select()
          .from(feedingRecord)
          .where(whereClause)
          .orderBy(desc(feedingRecord.feedingTime))
          .limit(limit),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const items: FeedingRecord[] = rows.map((row) => this.toFeedingRecord(row));

      return { items, total };
    } catch (error) {
      this.logger.error(`获取喂养记录列表失败: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getById(id: string): Promise<FeedingRecord> {
    try {
      const rows = await this.db
        .select()
        .from(feedingRecord)
        .where(eq(feedingRecord.id, id))
        .limit(1);

      if (rows.length === 0) {
        throw new NotFoundException('喂养记录不存在');
      }

      return this.toFeedingRecord(rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`获取喂养记录失败: ${id}, ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getTodayStats(babyId?: string): Promise<FeedingStats> {
    try {
      const conditions = [
        gte(feedingRecord.feedingTime, sql`CURRENT_DATE`),
        lt(feedingRecord.feedingTime, sql`CURRENT_DATE + INTERVAL '1 day'`),
      ];
      if (babyId) conditions.push(eq(feedingRecord.babyId, babyId));

      const result = await this.db
        .select({
          count: count(),
          totalAmount: sql<string>`COALESCE(SUM(${feedingRecord.amount}), 0)`,
        })
        .from(feedingRecord)
        .where(and(...conditions));

      const row = result[0];
      return {
        count: row?.count ?? 0,
        totalAmount: parseFloat(row?.totalAmount ?? '0'),
      };
    } catch (error) {
      this.logger.error(`获取今日喂养统计失败: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async create(dto: CreateFeedingDto): Promise<FeedingRecord> {
    try {
      const rows = await this.db
        .insert(feedingRecord)
        .values({
          babyId: dto.babyId,
          type: dto.type,
          amount: String(dto.amount),
          feedingTime: new Date(dto.feedingTime),
          note: dto.note,
        })
        .returning();

      return this.toFeedingRecord(rows[0]);
    } catch (error) {
      this.logger.error(`创建喂养记录失败: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deleted = await this.db
        .delete(feedingRecord)
        .where(eq(feedingRecord.id, id))
        .returning({ id: feedingRecord.id });

      if (deleted.length === 0) {
        throw new NotFoundException('喂养记录不存在');
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`删除喂养记录失败: ${id}, ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
