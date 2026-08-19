const REQUIRED_CORS_ORIGINS = [
  'https://grafoseducacional.com.br',
  'https://www.grafoseducacional.com.br',
];

const getCorsOrigins = () => {
  const configuredOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...REQUIRED_CORS_ORIGINS, ...configuredOrigins])];
};

export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3333', 10),
    name: process.env.APP_NAME || 'Sistema de Gestão Escolar',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    supabaseUrl: process.env.SUPABASE_URL,
  },
  storage: {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    avatarsBucket: process.env.SUPABASE_AVATARS_BUCKET || 'avatars',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  cors: {
    origins: getCorsOrigins(),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '300', 10),
  },
  swagger: {
    enabled:
      process.env.ENABLE_SWAGGER === 'true' ||
      process.env.NODE_ENV !== 'production',
  },
  observability: {
    slowRequestMs: parseInt(process.env.SLOW_REQUEST_MS || '200', 10),
    slowQueryMs: parseInt(process.env.SLOW_QUERY_MS || '200', 10),
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    dest: process.env.UPLOAD_DEST || './uploads',
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
});
