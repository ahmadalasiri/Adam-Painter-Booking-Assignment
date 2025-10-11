import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DB_CONNECTION = 'DB_CONNECTION';

const databaseProvider = {
  provide: DB_CONNECTION,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL')!;
    const client = postgres(connectionString);
    return drizzle(client, { schema });
  },
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: [DB_CONNECTION],
})
export class DbModule {}
