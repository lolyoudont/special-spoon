import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsUUID } from 'class-validator';

export class OpenPositionDto {
  @ApiProperty({
    type: 'string',
    description: 'Amount of tokens to be purchased',
    example: '100.24',
  })
  @IsNumberString()
  amount_token: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '8af47efe-bb6b-41c0-8fa4-f6fc655cd558',
    description: 'Asset ID',
  })
  @IsUUID('4')
  asset_id: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    example: '8af47efe-bb6b-41c0-8fa4-f6fc655cd558',
    description: 'Client ID',
  })
  client_id: string;
}
