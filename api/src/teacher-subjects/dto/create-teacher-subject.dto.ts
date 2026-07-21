import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherSubjectDto {
  @ApiProperty({
    description: 'ID da disciplina',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;
}

export class BulkCreateTeacherSubjectDto {
  @ApiProperty({
    description: 'Lista de IDs das disciplinas',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  subjectIds: string[];
}
