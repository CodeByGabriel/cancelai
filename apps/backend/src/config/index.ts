/**
 * Configurações centrais do Cancelaí
 *
 * SEGURANÇA: Todas as configurações sensíveis vêm de variáveis de ambiente.
 * Valores padrão são seguros e restritivos.
 */

export const config = {
  server: {
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    host: process.env['HOST'] ?? '0.0.0.0',
    // SEGURANÇA: Limite conservador para arquivos de extrato
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] ?? String(10 * 1024 * 1024), 10), // 10MB
    maxFiles: parseInt(process.env['MAX_FILES'] ?? '5', 10),
  },

  cors: {
    // SEGURANÇA: Em produção, restringir para domínios específicos
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  },

  rateLimit: {
    // SEGURANÇA: Limitar requisições para prevenir abuse
    max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '10', 10),
    timeWindow: process.env['RATE_LIMIT_WINDOW'] ?? '1 minute',
  },

  upload: {
    // SEGURANÇA: Apenas tipos de arquivo esperados
    // Lista expandida para cobrir variações de browsers e sistemas operacionais
    allowedMimeTypes: [
      'application/pdf',
      'text/csv',
      'text/plain', // Alguns CSVs vêm como text/plain
      'application/vnd.ms-excel', // CSV exportado do Excel
      'application/csv', // Variação de alguns browsers
      'application/x-csv', // Variação de alguns browsers
      'text/x-csv', // Variação Linux
      'text/comma-separated-values', // Formato antigo
      'application/octet-stream', // Fallback genérico (validamos pela extensão)
      'application/x-ofx', // OFX (Open Financial Exchange)
      'application/vnd.intu.qfx', // QFX (Quicken Financial Exchange)
    ],
    allowedExtensions: ['.pdf', '.csv', '.txt', '.ofx', '.qfx'],
  },

  detection: {
    // Configurações do algoritmo de detecção
    minOccurrences: 2, // Mínimo de ocorrências para considerar assinatura
    dateToleranceDays: 5, // Tolerância de dias para considerar "mesmo dia do mês"
    amountTolerancePercent: 0.15, // 15% de variação de valor permitida
    similarityThreshold: 0.7, // Limiar de similaridade de strings (0-1)
    confidenceThresholds: {
      high: 0.85,
      medium: 0.6,
    },
  },

  version: '1.0.0',
} as const;

/**
 * Assinaturas conhecidas para melhor detecção e categorização
 * Isso melhora a precisão e permite instruções de cancelamento
 */
export const knownSubscriptions = {
  // Streaming de Vídeo
  netflix: {
    patterns: ['netflix', 'nflx'],
    category: 'streaming',
    cancelUrl: 'https://www.netflix.com/cancelplan',
  },
  amazonPrime: {
    patterns: ['amazon prime', 'prime video', 'amzn prime', 'amz*prime'],
    category: 'streaming',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
  },
  disneyPlus: {
    patterns: ['disney+', 'disney plus', 'disneyplus'],
    category: 'streaming',
    cancelUrl: 'https://www.disneyplus.com/account',
  },
  hboMax: {
    patterns: ['hbo max', 'hbomax', 'max'],
    category: 'streaming',
    cancelUrl: 'https://www.max.com/account',
  },
  globoplay: {
    patterns: ['globoplay', 'globo play'],
    category: 'streaming',
    cancelUrl: 'https://globoplay.globo.com/minha-conta/',
  },
  paramount: {
    patterns: ['paramount+', 'paramount plus'],
    category: 'streaming',
    cancelUrl: 'https://www.paramountplus.com/account/',
  },

  // Música
  spotify: {
    patterns: ['spotify', 'spotfy'],
    category: 'music',
    cancelUrl: 'https://www.spotify.com/br/account/subscription/',
  },
  deezer: {
    patterns: ['deezer'],
    category: 'music',
    cancelUrl: 'https://www.deezer.com/account/subscription',
  },
  appleMusicOne: {
    patterns: ['apple music', 'apple one', 'itunes'],
    category: 'music',
    cancelUrl: 'https://support.apple.com/pt-br/HT202039',
  },
  youtubeMusic: {
    patterns: ['youtube music', 'youtube premium', 'google*youtube'],
    category: 'music',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
  },

  // Gaming
  xboxGamePass: {
    patterns: ['xbox', 'game pass', 'microsoft*xbox'],
    category: 'gaming',
    cancelUrl: 'https://account.microsoft.com/services/',
  },
  playstationPlus: {
    patterns: ['playstation', 'psn', 'ps plus'],
    category: 'gaming',
    cancelUrl: 'https://www.playstation.com/pt-br/support/store/',
  },
  nintendoOnline: {
    patterns: ['nintendo'],
    category: 'gaming',
    cancelUrl: 'https://accounts.nintendo.com',
  },
  steam: {
    patterns: ['steam', 'valve'],
    category: 'gaming',
    cancelUrl: 'https://store.steampowered.com/account/',
  },

  // Software
  adobe: {
    patterns: ['adobe', 'creative cloud'],
    category: 'software',
    cancelUrl: 'https://account.adobe.com/plans',
  },
  microsoft365: {
    patterns: ['microsoft 365', 'office 365', 'ms 365', 'microsoft*office'],
    category: 'software',
    cancelUrl: 'https://account.microsoft.com/services/',
  },
  dropbox: {
    patterns: ['dropbox'],
    category: 'software',
    cancelUrl: 'https://www.dropbox.com/account/plan',
  },
  googleOne: {
    patterns: ['google one', 'google storage', 'google*one'],
    category: 'software',
    cancelUrl: 'https://one.google.com/settings',
  },
  icloud: {
    patterns: ['icloud', 'apple*icloud'],
    category: 'software',
    cancelUrl: 'https://support.apple.com/pt-br/HT207594',
  },

  // Notícias
  uol: {
    patterns: ['uol', 'folha', 'uol*'],
    category: 'news',
    cancelUrl: 'https://conta.uol.com.br/',
  },
  estadao: {
    patterns: ['estadao', 'estadão'],
    category: 'news',
    cancelUrl: 'https://assinatura.estadao.com.br/',
  },
  globo: {
    patterns: ['o globo', 'oglobo'],
    category: 'news',
    cancelUrl: 'https://assinatura.oglobo.com.br/',
  },

  // Fitness
  smartFit: {
    patterns: ['smart fit', 'smartfit'],
    category: 'fitness',
    cancelUrl: 'Compareça presencialmente à unidade',
  },
  gympass: {
    patterns: ['gympass', 'wellhub'],
    category: 'fitness',
    cancelUrl: 'https://wellhub.com/pt-br/',
  },
  totalpass: {
    patterns: ['totalpass'],
    category: 'fitness',
    cancelUrl: 'https://www.totalpass.com.br/',
  },

  // Delivery e Transporte
  ifood: {
    patterns: ['ifood', 'ifood*club'],
    category: 'food',
    cancelUrl: 'https://www.ifood.com.br/clube',
  },
  rappi: {
    patterns: ['rappi', 'rappi*'],
    category: 'food',
    cancelUrl: 'Cancelar pelo app Rappi',
  },
  uber: {
    patterns: ['uber', 'uber*'],
    category: 'transport',
    cancelUrl: 'https://help.uber.com/',
  },
  ninetynineNine: {
    patterns: ['99', '99app', '99*'],
    category: 'transport',
    cancelUrl: 'Cancelar pelo app 99',
  },

  // Educação
  duolingo: {
    patterns: ['duolingo'],
    category: 'education',
    cancelUrl: 'https://www.duolingo.com/settings/subscription',
  },
  coursera: {
    patterns: ['coursera'],
    category: 'education',
    cancelUrl: 'https://www.coursera.org/account-settings',
  },
  alura: {
    patterns: ['alura'],
    category: 'education',
    cancelUrl: 'https://www.alura.com.br/minha-conta',
  },

  // Outros
  linkedin: {
    patterns: ['linkedin', 'lnkd'],
    category: 'other',
    cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription',
  },
  canva: {
    patterns: ['canva'],
    category: 'software',
    cancelUrl: 'https://www.canva.com/settings/billing',
  },
} as const;

export type KnownSubscriptionKey = keyof typeof knownSubscriptions;

// ── Fase 3: Scoring & Similarity Config ──────────────────────────────

export const GATEWAY_PREFIXES = Object.freeze([
  'PAG\\*', 'MP\\*', 'MERCPAGO\\*', 'MERPAGO\\*', 'GOOGLE\\*',
  'PAYPAL\\*', 'IZ\\*', 'PICPAY\\*', 'APPLE\\.COM/', 'HTM\\*',
  'EDZ\\*', 'EBW\\+', 'APMX\\*', 'STRIPE\\*', 'SP\\s+', 'PP\\s+',
  'PG\\s+',
] as const);

export const NOISE_STOP_WORDS = Object.freeze([
  'COMPRA', 'CARTAO', 'DEBITO', 'CREDITO', 'VISA', 'MASTERCARD', 'ELO',
  'LTDA', 'SA', 'EIRELI', 'MEI', 'ME',
] as const);

export const SIMILARITY_CONFIG = Object.freeze({
  tokenJaccardPreFilter: 0.3,
  jaroWinklerPrimary: 0.88,
  diceTiebreaker: 0.65,
} as const);

export const RECURRENCE_PERIODS = Object.freeze({
  weekly:     { idealDays: 7,   tolerance: 2 },
  biweekly:   { idealDays: 14,  tolerance: 3 },
  monthly:    { idealDays: 30,  tolerance: 5 },
  bimonthly:  { idealDays: 61,  tolerance: 7 },
  quarterly:  { idealDays: 91,  tolerance: 10 },
  semiannual: { idealDays: 182, tolerance: 15 },
  annual:     { idealDays: 365, tolerance: 20 },
} as const);

export const SCORING_WEIGHTS_V2 = Object.freeze({
  stringSimilarity: 0.20,
  recurrence:       0.30,
  valueStability:   0.20,
  knownService:     0.15,
  habituality:      0.10,
  streamMaturity:   0.05,
} as const);

export const CONFIDENCE_THRESHOLDS_V2 = Object.freeze({
  high:   0.85,
  medium: 0.60,
  low:    0.40,
} as const);

export const PRICE_RANGE_TOLERANCE = 0.15;
export const NORMALIZATION_CACHE_SIZE = 10_000;
