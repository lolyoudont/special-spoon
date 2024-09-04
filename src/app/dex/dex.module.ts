import { Module } from '@nestjs/common';
import { RaydiumService } from './raydium.service';

export const RAYDIUM_SERVICE = Symbol();

@Module({
  providers: [
    {
      provide: RAYDIUM_SERVICE,
      useClass: RaydiumService,
    },
  ],
  exports: [RAYDIUM_SERVICE],
})
export class DexModule {}
