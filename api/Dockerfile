FROM node:22-alpine AS dependencies

ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build \
  && npm prune --omit=dev

FROM node:22-alpine AS runner

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true

# O Railway pode sobrescrever o CMD com `npm run start:prod`. Mantemos o npm,
# mas substituimos a versao da imagem-base pela arvore corrigida e auditada.
RUN apk upgrade --no-cache \
  && apk add --no-cache \
      chromium \
      dumb-init \
      ca-certificates \
      font-noto \
      font-noto-cjk \
      font-noto-emoji \
  && npm install --global npm@12.0.2 \
  && mkdir -p /tmp/npm-security \
  && npm install --prefix /tmp/npm-security --omit=dev --no-save \
      brace-expansion@5.0.9 \
      ip-address@10.5.0 \
      tar@7.5.21 \
  && rm -rf \
      /usr/local/lib/node_modules/npm/node_modules/brace-expansion \
      /usr/local/lib/node_modules/npm/node_modules/ip-address \
      /usr/local/lib/node_modules/npm/node_modules/tar \
  && cp -R /tmp/npm-security/node_modules/brace-expansion \
      /usr/local/lib/node_modules/npm/node_modules/brace-expansion \
  && cp -R /tmp/npm-security/node_modules/ip-address \
      /usr/local/lib/node_modules/npm/node_modules/ip-address \
  && cp -R /tmp/npm-security/node_modules/tar \
      /usr/local/lib/node_modules/npm/node_modules/tar \
  && npm cache clean --force \
  && rm -rf /root/.npm /tmp/*

WORKDIR /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/public ./public
COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Corepack, Yarn e pnpm nao sao usados em producao. O npm atualizado permanece
# disponivel para comandos de inicializacao configurados pela plataforma.
RUN chmod 0555 /usr/local/bin/docker-entrypoint.sh \
  && rm -rf \
      /usr/local/lib/node_modules/corepack \
  && rm -f \
      /usr/local/bin/corepack \
      /usr/local/bin/pnpm \
      /usr/local/bin/pnpx \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg

USER node
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
