import { Type, Transform } from 'class-transformer';
import { IsString, Length, IsOptional, IsUUID, IsArray, ArrayMaxSize, ValidateNested, IsBoolean, IsUrl, MaxLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CategoryDto {
  @Transform(trim) @IsString() @Length(1, 200) name!: string;
  @IsOptional() @IsUUID() parentId?: string | null;
}
export class SourceDto {
  @Transform(trim) @IsString() @MaxLength(200) label!: string;
  @IsUrl({ protocols: ['http', 'https', 'obsidian'], require_protocol: true, require_tld: false }) @MaxLength(4000) url!: string;
}
export class CardDto {
  @Transform(trim) @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsUUID() categoryId?: string | null;
  @IsOptional() @IsString() @MaxLength(100000) explanation?: string;
  @IsOptional() @IsString() @MaxLength(20000) criteria?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => SourceDto) sources?: SourceDto[];
}
export class ReviewDto {
  @IsBoolean() remembered!: boolean;
  @IsUUID() requestId!: string;
}
