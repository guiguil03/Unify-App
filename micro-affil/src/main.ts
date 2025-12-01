// Point d'entrée du microservice

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config, validateConfig } from './config/env';
import { Logger } from './lib/logger';

// Charger les variables d'environnement
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Valider la configuration
    validateConfig();

    // Créer l'application NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
    });

    // Activer la validation globale
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    // Activer CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    // Préfixe global pour l'API
    app.setGlobalPrefix('api');

    // Démarrer le serveur
    await app.listen(config.port);

    logger.log(`🚀 Microservice d'affiliation démarré sur http://localhost:${config.port}`);
    logger.log(`📝 Environnement: ${config.nodeEnv}`);
    logger.log(`🔗 API disponible sur http://localhost:${config.port}/api`);
  } catch (error) {
    logger.error('Erreur lors du démarrage du microservice', error);
    process.exit(1);
  }
}

bootstrap();
