import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import type { Baby } from '@shared/api.interface';
import { baby } from '@server/database/schema';
import type { CreateBabyDto } from './dto/create-baby.dto';
import type { UpdateBabyDto } from './dto/update-baby.dto';

type BabySelect = typeof baby.$inferSelect;

@Injectable()
export class BabyService {
  private readonly logger = new Logger(BabyService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(): Promise<Baby[]> {
    const rows: BabySelect[] = await this.db
      .select()
      .from(baby)
      .orderBy(desc(baby.createdAt));
    return rows.map((row: BabySelect) => this.toBaby(row));
  }

  async findOne(id: string): Promise<Baby> {
    const rows: BabySelect[] = await this.db
      .select()
      .from(baby)
      .where(eq(baby.id, id));
    if (rows.length === 0) {
      throw new NotFoundException('宝宝不存在');
    }
    return this.toBaby(rows[0]);
  }

  async create(dto: CreateBabyDto, userId: string): Promise<Baby> {
    const rows: BabySelect[] = await this.db
      .insert(baby)
      .values({
        name: dto.name,
        gender: dto.gender,
        birthday: dto.birthday,
        avatarUrl: dto.avatar,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    this.logger.log(`创建宝宝成功: ${rows[0].id}`);
    return this.toBaby(rows[0]);
  }

  async update(id: string, dto: UpdateBabyDto, userId: string): Promise<Baby> {
    const patch: Partial<typeof baby.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.gender !== undefined) patch.gender = dto.gender;
    if (dto.birthday !== undefined) patch.birthday = dto.birthday;
    if (dto.avatar !== undefined) patch.avatarUrl = dto.avatar;

    if (Object.keys(patch).length === 0) {
      return this.findOne(id);
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const rows: BabySelect[] = await this.db
      .update(baby)
      .set(patch)
      .where(eq(baby.id, id))
      .returning();
    if (rows.length === 0) {
      throw new NotFoundException('宝宝不存在');
    }
    this.logger.log(`更新宝宝成功: ${id}`);
    return this.toBaby(rows[0]);
  }

  async remove(id: string): Promise<void> {
    const rows: { id: string }[] = await this.db
      .delete(baby)
      .where(eq(baby.id, id))
      .returning({ id: baby.id });
    if (rows.length === 0) {
      throw new NotFoundException('宝宝不存在');
    }
    this.logger.log(`删除宝宝成功: ${id}`);
  }

  private toBaby(row: BabySelect): Baby {
    return {
      id: row.id,
      name: row.name,
      gender: row.gender as Baby['gender'],
      birthday: row.birthday,
      avatar: row.avatarUrl ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
