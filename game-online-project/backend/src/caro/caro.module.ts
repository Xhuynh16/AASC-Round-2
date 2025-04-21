import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaroController } from './caro.controller';
import { CaroService } from './caro.service';
import { CaroGateway } from './caro.gateway';
import { CaroGame } from './entities/caro-game.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaroGame]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [CaroController],
  providers: [CaroService, CaroGateway],
  exports: [CaroService],
})
export class CaroModule {}
