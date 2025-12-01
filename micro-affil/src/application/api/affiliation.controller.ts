// Controller : Point d'entrée de l'API REST
// Délègue aux use cases

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { CreateAffiliationCodeUseCase } from '../../domain/usecases/create-affiliation-code.usecase';
import { ValidateAffiliationCodeUseCase } from '../../domain/usecases/validate-affiliation-code.usecase';
import { GetAffiliationCodeUseCase } from '../../domain/usecases/get-affiliation-code.usecase';
import { CreateCodeDto } from './dto/create-code.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';

@Controller('affiliation')
export class AffiliationController {
  constructor(
    private readonly createCodeUseCase: CreateAffiliationCodeUseCase,
    private readonly validateCodeUseCase: ValidateAffiliationCodeUseCase,
    private readonly getCodeUseCase: GetAffiliationCodeUseCase
  ) {}

  /**
   * POST /affiliation/create
   * Créer un code d'affiliation pour un utilisateur
   */
  @Post('create')
  async createCode(@Body(ValidationPipe) dto: CreateCodeDto) {
    try {
      const affiliation = await this.createCodeUseCase.execute(dto.userId);
      return {
        success: true,
        data: affiliation.toJSON(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        error.name === 'CreateAffiliationCodeError'
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /affiliation/validate
   * Valider et utiliser un code d'affiliation lors de l'inscription
   */
  @Post('validate')
  async validateCode(@Body(ValidationPipe) dto: ValidateCodeDto) {
    try {
      const result = await this.validateCodeUseCase.execute(dto.code, dto.userId);

      if (!result.valid) {
        throw new HttpException(
          {
            success: false,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        data: {
          affiliationId: result.affiliationId,
          affiliatorUserId: result.affiliatorUserId,
          usage: result.usage?.toJSON(),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /affiliation/:userId
   * Récupérer le code d'affiliation d'un utilisateur
   */
  @Get(':userId')
  async getCode(@Param('userId') userId: string) {
    try {
      const affiliation = await this.getCodeUseCase.execute(userId);

      if (!affiliation) {
        throw new HttpException(
          {
            success: false,
            error: 'Aucun code d\'affiliation trouvé pour cet utilisateur',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: affiliation.toJSON(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
