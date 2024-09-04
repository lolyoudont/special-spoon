import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { OpenPositionDto } from './dto/openPosition.dto';
import { ClosePositionDto } from './dto/closePosition.dto';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { TransactionEntity } from './entities/transaction.entity';
import { ExchangeService } from './exchange.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionResponse } from './response/position.response';

@Controller('exchange')
export class ExchangeController {
  constructor(
    private readonly exchangeService: ExchangeService,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  @Post('open')
  @ApiResponse({ type: TransactionEntity })
  @ApiBadRequestResponse()
  @ApiInternalServerErrorResponse()
  openPosition(@Body() dto: OpenPositionDto) {
    return this.exchangeService.openLongPosition(dto);
  }

  @Post('close')
  @ApiResponse({ type: TransactionEntity })
  @ApiBadRequestResponse()
  @ApiInternalServerErrorResponse()
  closePosition(@Body() dto: ClosePositionDto) {
    return this.exchangeService.closeLongPosition(dto);
  }

  @Get('tx/:id')
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    type: String,
    format: 'uuid',
    example: '4f400834-51fd-4e08-9b50-068ec9508ebd',
  })
  @ApiResponse({ type: TransactionEntity })
  @ApiBadRequestResponse()
  @ApiInternalServerErrorResponse()
  getTransactionById(@Param('id', new ParseUUIDPipe()) transaction_id: string) {
    return this.transactionRepo.findOneByOrFail({ transaction_id });
  }

  @Get('position/long/:clientId/:assetId')
  @ApiParam({
    name: 'clientId',
    description: 'Client ID',
    type: String,
    format: 'uuid',
    example: '4f400834-51fd-4e08-9b50-068ec9508ebd',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Asset ID',
    type: String,
    format: 'uuid',
    example: '4f400834-51fd-4e08-9b50-068ec9508ebd',
  })
  @ApiResponse({ type: PositionResponse })
  @ApiBadRequestResponse()
  @ApiInternalServerErrorResponse()
  getLongPosition(
    @Param('clientId', new ParseUUIDPipe()) client_id: string,
    @Param('assetId', new ParseUUIDPipe()) asset_id: string,
  ) {
    return this.exchangeService.getOpenPosition(
      undefined,
      asset_id,
      client_id,
      'long',
    );
  }
}
