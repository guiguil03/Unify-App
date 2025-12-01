// DTO : Data Transfer Object pour la validation de code

import { IsString, IsUUID, Length } from 'class-validator';

export class ValidateCodeDto {
  @IsString()
  @Length(8, 8)
  code: string;

  @IsUUID()
  userId: string;
}
