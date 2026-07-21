import { ApiProperty } from '@nestjs/swagger';

export class SubjectInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  code?: string;

  @ApiProperty({ required: false })
  color?: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class TeacherSubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: SubjectInfoDto })
  subject: SubjectInfoDto;
}
