import { ApiProperty } from '@nestjs/swagger';

export class PositionResponse {
  @ApiProperty({ type: String, example: '3.22' })
  amount_token: string;

  @ApiProperty({ type: String, example: '188' })
  amount_sol: string;
}
