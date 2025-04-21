import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './shared/entities/user.entity';
import { Line98Module } from './line98/line98.module';
import { Line98Game } from './line98/entities/line98-game.entity';
import { CaroModule } from './caro/caro.module';
import { CaroGame } from './caro/entities/caro-game.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_PATH'),
        entities: [User, Line98Game, CaroGame],
        synchronize: true, // Set to false in production
      }),
    }),
    AuthModule,
    UserModule,
    Line98Module,
    CaroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
