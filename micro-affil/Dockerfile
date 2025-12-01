# Utiliser une image Node.js LTS
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris dev pour le build)
RUN npm ci && npm cache clean --force

# Copier le reste du code
COPY . .

# Compiler le TypeScript
RUN npm run build

# Supprimer les devDependencies après le build
RUN npm prune --production

# Image de production
FROM node:20-alpine AS production

# Définir le répertoire de travail
WORKDIR /app

# Copier le package.json
COPY --from=builder /app/package*.json ./

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code compilé
COPY --from=builder /app/dist ./dist

# Exposer le port de l'application
EXPOSE 3001

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production

# Commande de démarrage
CMD ["npm", "start"]
