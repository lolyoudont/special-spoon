import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeModule } from './exchange/exchange.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.DB_DATABASE,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      host: process.env.DB_HOST,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      migrationsTableName: 'migrations',
      migrations: ['dist/db/migrations/*.js'],
      entities: ['dist/**/*.entity.js'],
      autoLoadEntities: true,
      migrationsRun: true,
    }),
    ExchangeModule,
  ],
})
export class AppModule {}
