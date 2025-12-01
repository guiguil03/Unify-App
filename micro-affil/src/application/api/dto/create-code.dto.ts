// DTO : Data Transfer Object pour la création de code

import { IsUUID } from 'class-validator';

export class CreateCodeDto {
  @IsUUID()
  userId: string;
}
