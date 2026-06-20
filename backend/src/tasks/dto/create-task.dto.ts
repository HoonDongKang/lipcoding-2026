import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsIn,
  Matches,
  IsUrl,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  @IsUrl()
  githubIssueUrl?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
