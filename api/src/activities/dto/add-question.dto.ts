import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class AddQuestionDto {
  @ApiProperty({
    description: 'Question ID to add to the activity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description: 'Order/position of the question in the activity',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  orderNumber?: number;

  @ApiPropertyOptional({
    description: 'Custom points for this question (overrides question default)',
    example: 2.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;
}
