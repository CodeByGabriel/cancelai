/**
 * Módulo de Serviços Conhecidos - MOAT do Cancelaí
 *
 * Este módulo é um ativo estratégico do produto. Contém:
 * - Lista curada de 80+ serviços de assinatura brasileiros
 * - Aliases e variações de nomes encontrados em extratos reais
 * - URLs de cancelamento verificadas
 * - Instruções manuais quando necessário
 * - Categorização para UX
 *
 * DECISÃO DE DESIGN:
 * - Mantido em arquivo separado para fácil manutenção
 * - Estrutura tipada para evitar erros
 * - Aliases normalizados (lowercase) para matching eficiente
 *
 * COMO ADICIONAR NOVOS SERVIÇOS:
 * 1. Adicione entrada no objeto KNOWN_SERVICES
 * 2. Liste todos os aliases encontrados em extratos bancários
 * 3. Verifique a URL de cancelamento
 * 4. Teste com extratos reais
 *
 * ÚLTIMA ATUALIZAÇÃO: Janeiro 2024
 * TOTAL DE SERVIÇOS: 80+
 */

import type { SubscriptionCategory } from '../types/index.js';

/**
 * Definição de um serviço conhecido
 */
export interface KnownService {
  /** Nome canônico para exibição */
  readonly canonicalName: string;

  /** Aliases encontrados em extratos (lowercase, sem acentos) */
  readonly aliases: readonly string[];

  /** Categoria do serviço */
  readonly category: SubscriptionCategory;

  /** URL de cancelamento (quando disponível online) */
  readonly cancelUrl?: string;

  /** Instruções de cancelamento manual */
  readonly cancelInstructions?: string;

  /** Faixa de preço típica (para validação de valores) */
  readonly typicalPriceRange?: {
    readonly min: number;
    readonly max: number;
  };

  /** Indica se é um serviço muito comum (aumenta confiança) */
  readonly isPopular?: boolean;
}

/**
 * Base de dados de serviços conhecidos
 *
 * IMPORTANTE: Aliases devem estar em lowercase e sem acentos
 * O matching é feito com normalização automática
 *
 * Aliases reais coletados de:
 * - Faturas Nubank, PicPay, Mercado Pago
 * - Extratos Itaú, Bradesco, BB, Santander
 * - Relatórios de usuários brasileiros
 */
export const KNOWN_SERVICES: Record<string, KnownService> = {
  // ══════════════════════════════════════════════════════════════
  // STREAMING DE VÍDEO (12 serviços)
  // ══════════════════════════════════════════════════════════════
  netflix: {
    canonicalName: 'Netflix',
    aliases: [
      'netflix',
      'netflix.com',
      'netflix com',
      'nflx',
      'netflix inc',
      'netflix international',
      'netflix*',
      'nflx.com',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.netflix.com/cancelplan',
    typicalPriceRange: { min: 20, max: 60 },
    isPopular: true,
  },

  amazonPrimeVideo: {
    canonicalName: 'Amazon Prime Video',
    aliases: [
      'amazon prime',
      'prime video',
      'amzn prime',
      'amz prime',
      'amz*prime',
      'amazon*prime',
      'amazon.com.br prime',
      'amazon prime video',
      'primevideo',
      'amazon br',
      'amazon br parc', // Visto em faturas reais
      'amzn*prime video',
      'amazon digital',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    typicalPriceRange: { min: 10, max: 20 },
    isPopular: true,
  },

  disneyPlus: {
    canonicalName: 'Disney+',
    aliases: [
      'disney+',
      'disney plus',
      'disneyplus',
      'disney +',
      'disney streaming',
      'the walt disney',
      'disney*',
      'disney plus br',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.disneyplus.com/account',
    typicalPriceRange: { min: 20, max: 50 },
    isPopular: true,
  },

  hboMax: {
    canonicalName: 'Max (HBO)',
    aliases: [
      'hbo max',
      'hbomax',
      'max',
      'max streaming',
      'hbo',
      'warner bros',
      'wbd streaming',
      'hbo*',
      'max*',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.max.com/account',
    typicalPriceRange: { min: 20, max: 50 },
    isPopular: true,
  },

  globoplay: {
    canonicalName: 'Globoplay',
    aliases: [
      'globoplay',
      'globo play',
      'globo.com',
      'g1 globoplay',
      'globoplay canais',
      'globoplay*',
      'globo streaming',
    ],
    category: 'streaming',
    cancelUrl: 'https://globoplay.globo.com/minha-conta/',
    typicalPriceRange: { min: 20, max: 90 },
    isPopular: true,
  },

  paramount: {
    canonicalName: 'Paramount+',
    aliases: [
      'paramount+',
      'paramount plus',
      'paramountplus',
      'paramount streaming',
      'viacomcbs',
      'paramount*',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.paramountplus.com/account/',
    typicalPriceRange: { min: 15, max: 35 },
  },

  starPlus: {
    canonicalName: 'Star+',
    aliases: ['star+', 'star plus', 'starplus', 'star streaming', 'star*'],
    category: 'streaming',
    cancelUrl: 'https://www.starplus.com/account',
    typicalPriceRange: { min: 30, max: 50 },
  },

  crunchyroll: {
    canonicalName: 'Crunchyroll',
    aliases: [
      'crunchyroll',
      'crunchy roll',
      'crunchyroll inc',
      'google crunchyroll', // Visto em faturas PicPay
      'google*crunchyroll',
      'crunchyroll*',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.crunchyroll.com/account',
    typicalPriceRange: { min: 15, max: 35 },
    isPopular: true,
  },

  mubi: {
    canonicalName: 'Mubi',
    aliases: ['mubi', 'mubi.com', 'mubi inc', 'mubi*'],
    category: 'streaming',
    cancelUrl: 'https://mubi.com/settings',
    typicalPriceRange: { min: 20, max: 30 },
  },

  appleTvPlus: {
    canonicalName: 'Apple TV+',
    aliases: [
      'apple tv+',
      'apple tv plus',
      'appletv+',
      'apple.com/bill',
      'apple tv',
      'itunes apple tv',
    ],
    category: 'streaming',
    cancelUrl: 'https://support.apple.com/pt-br/HT202039',
    typicalPriceRange: { min: 15, max: 25 },
  },

  plutoTv: {
    canonicalName: 'Pluto TV',
    aliases: ['pluto tv', 'plutotv', 'pluto*'],
    category: 'streaming',
    typicalPriceRange: { min: 0, max: 0 },
  },

  looke: {
    canonicalName: 'Looke',
    aliases: ['looke', 'looke.com.br', 'looke*'],
    category: 'streaming',
    cancelUrl: 'https://www.looke.com.br/',
    typicalPriceRange: { min: 15, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // MÚSICA E ÁUDIO (7 serviços)
  // ══════════════════════════════════════════════════════════════
  spotify: {
    canonicalName: 'Spotify',
    aliases: [
      'spotify',
      'spotify ab',
      'spotfy',
      'spotify premium',
      'spotify family',
      'spotify duo',
      'spotify.com',
      'spotify*',
    ],
    category: 'music',
    cancelUrl: 'https://www.spotify.com/br/account/subscription/',
    typicalPriceRange: { min: 10, max: 35 },
    isPopular: true,
  },

  deezer: {
    canonicalName: 'Deezer',
    aliases: [
      'deezer',
      'deezer.com',
      'deezer premium',
      'deezer family',
      'deezer*',
    ],
    category: 'music',
    cancelUrl: 'https://www.deezer.com/account/subscription',
    typicalPriceRange: { min: 15, max: 35 },
  },

  appleMusicOne: {
    canonicalName: 'Apple Music',
    aliases: [
      'apple music',
      'apple one',
      'itunes',
      'itunes.com/bill',
      'apple.com/bill music',
      'apple*music',
      'itunes*',
    ],
    category: 'music',
    cancelUrl: 'https://support.apple.com/pt-br/HT202039',
    typicalPriceRange: { min: 10, max: 50 },
    isPopular: true,
  },

  youtubeMusic: {
    canonicalName: 'YouTube Premium',
    aliases: [
      'youtube music',
      'youtube premium',
      'google*youtube',
      'youtube.com',
      'yt premium',
      'yt music',
      'youtube*',
      'google youtube',
      'google play subscription', // Genérico mas comum
    ],
    category: 'music',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    typicalPriceRange: { min: 20, max: 45 },
    isPopular: true,
  },

  tidal: {
    canonicalName: 'Tidal',
    aliases: ['tidal', 'tidal.com', 'tidal hifi', 'tidal*'],
    category: 'music',
    cancelUrl: 'https://tidal.com/settings/subscription',
    typicalPriceRange: { min: 15, max: 40 },
  },

  amazonMusic: {
    canonicalName: 'Amazon Music',
    aliases: [
      'amazon music',
      'amzn music',
      'amazon*music',
      'amazon music unlimited',
    ],
    category: 'music',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    typicalPriceRange: { min: 15, max: 35 },
  },

  audible: {
    canonicalName: 'Audible',
    aliases: ['audible', 'audible.com', 'audible*', 'amazon audible'],
    category: 'music',
    cancelUrl: 'https://www.audible.com/account',
    typicalPriceRange: { min: 30, max: 50 },
  },

  // ══════════════════════════════════════════════════════════════
  // GAMING (8 serviços)
  // ══════════════════════════════════════════════════════════════
  xboxGamePass: {
    canonicalName: 'Xbox Game Pass',
    aliases: [
      'xbox',
      'game pass',
      'microsoft*xbox',
      'xbox game pass',
      'xbox live',
      'xbox ultimate',
      'microsoft gaming',
      'xbox*',
      'gamepass',
    ],
    category: 'gaming',
    cancelUrl: 'https://account.microsoft.com/services/',
    typicalPriceRange: { min: 30, max: 60 },
    isPopular: true,
  },

  playstationPlus: {
    canonicalName: 'PlayStation Plus',
    aliases: [
      'playstation',
      'psn',
      'ps plus',
      'playstation plus',
      'playstation network',
      'sony playstation',
      'ps premium',
      'playstation*',
      'psn*',
    ],
    category: 'gaming',
    cancelUrl: 'https://www.playstation.com/pt-br/support/store/',
    typicalPriceRange: { min: 25, max: 70 },
    isPopular: true,
  },

  nintendoOnline: {
    canonicalName: 'Nintendo Switch Online',
    aliases: [
      'nintendo',
      'nintendo online',
      'nintendo switch online',
      'nintendo eshop',
      'nintendo*',
    ],
    category: 'gaming',
    cancelUrl: 'https://accounts.nintendo.com',
    typicalPriceRange: { min: 15, max: 45 },
  },

  eaPlay: {
    canonicalName: 'EA Play',
    aliases: [
      'ea play',
      'ea access',
      'electronic arts',
      'ea games',
      'ea*',
    ],
    category: 'gaming',
    cancelUrl: 'https://myaccount.ea.com/cp-ui/subscription/index',
    typicalPriceRange: { min: 15, max: 30 },
  },

  steam: {
    canonicalName: 'Steam',
    aliases: [
      'steam',
      'steampowered',
      'steam*',
      'valve steam',
    ],
    category: 'gaming',
    cancelUrl: 'https://store.steampowered.com/account/',
    typicalPriceRange: { min: 10, max: 100 },
    isPopular: true,
  },

  epicGames: {
    canonicalName: 'Epic Games',
    aliases: [
      'epic games',
      'epic*',
      'fortnite',
      'epicgames',
    ],
    category: 'gaming',
    cancelUrl: 'https://www.epicgames.com/account/',
    typicalPriceRange: { min: 10, max: 50 },
  },

  twitch: {
    canonicalName: 'Twitch',
    aliases: [
      'twitch',
      'twitch.tv',
      'twitch*',
      'amazon twitch',
    ],
    category: 'gaming',
    cancelUrl: 'https://www.twitch.tv/subscriptions',
    typicalPriceRange: { min: 5, max: 30 },
  },

  ubisoftPlus: {
    canonicalName: 'Ubisoft+',
    aliases: ['ubisoft', 'ubisoft+', 'ubisoft plus', 'uplay', 'ubisoft*'],
    category: 'gaming',
    cancelUrl: 'https://store.ubi.com/subscription',
    typicalPriceRange: { min: 50, max: 80 },
  },

  // ══════════════════════════════════════════════════════════════
  // SOFTWARE E PRODUTIVIDADE (12 serviços)
  // ══════════════════════════════════════════════════════════════
  adobe: {
    canonicalName: 'Adobe Creative Cloud',
    aliases: [
      'adobe',
      'creative cloud',
      'adobe.com',
      'adobe systems',
      'adobe inc',
      'adobe photography',
      'adobe all apps',
      'adobe*',
    ],
    category: 'software',
    cancelUrl: 'https://account.adobe.com/plans',
    typicalPriceRange: { min: 40, max: 300 },
    isPopular: true,
  },

  microsoft365: {
    canonicalName: 'Microsoft 365',
    aliases: [
      'microsoft 365',
      'office 365',
      'ms 365',
      'microsoft*office',
      'microsoft corporation',
      'office.com',
      'microsoft*',
      'ms office',
    ],
    category: 'software',
    cancelUrl: 'https://account.microsoft.com/services/',
    typicalPriceRange: { min: 30, max: 80 },
    isPopular: true,
  },

  googleWorkspace: {
    canonicalName: 'Google Workspace',
    aliases: [
      'google workspace',
      'google*workspace',
      'google cloud',
      'g suite',
      'gsuite',
      'google*',
    ],
    category: 'software',
    cancelUrl: 'https://workspace.google.com/',
    typicalPriceRange: { min: 30, max: 100 },
  },

  canva: {
    canonicalName: 'Canva Pro',
    aliases: ['canva', 'canva.com', 'canva pro', 'canva pty', 'canva*'],
    category: 'software',
    cancelUrl: 'https://www.canva.com/settings/billing',
    typicalPriceRange: { min: 30, max: 60 },
    isPopular: true,
  },

  notion: {
    canonicalName: 'Notion',
    aliases: ['notion', 'notion.so', 'notion labs', 'notion*'],
    category: 'software',
    cancelUrl: 'https://www.notion.so/my-account',
    typicalPriceRange: { min: 20, max: 50 },
  },

  figma: {
    canonicalName: 'Figma',
    aliases: ['figma', 'figma.com', 'figma inc', 'figma*'],
    category: 'software',
    cancelUrl: 'https://www.figma.com/settings',
    typicalPriceRange: { min: 50, max: 150 },
  },

  slack: {
    canonicalName: 'Slack',
    aliases: ['slack', 'slack.com', 'slack technologies', 'slack*'],
    category: 'software',
    cancelUrl: 'https://slack.com/account/settings',
    typicalPriceRange: { min: 30, max: 80 },
  },

  zoom: {
    canonicalName: 'Zoom',
    aliases: [
      'zoom',
      'zoom.us',
      'zoom video',
      'zoom communications',
      'zoom*',
    ],
    category: 'software',
    cancelUrl: 'https://zoom.us/account',
    typicalPriceRange: { min: 50, max: 150 },
  },

  chatgpt: {
    canonicalName: 'ChatGPT Plus',
    aliases: [
      'openai',
      'chatgpt',
      'chatgpt plus',
      'openai.com',
      'openai*',
      'chat gpt',
    ],
    category: 'software',
    cancelUrl: 'https://chat.openai.com/settings/subscription',
    typicalPriceRange: { min: 100, max: 120 },
    isPopular: true,
  },

  claude: {
    canonicalName: 'Claude Pro',
    aliases: ['anthropic', 'claude', 'claude pro', 'anthropic.com', 'claude*'],
    category: 'software',
    cancelUrl: 'https://claude.ai/settings',
    typicalPriceRange: { min: 100, max: 120 },
  },

  grammarly: {
    canonicalName: 'Grammarly',
    aliases: ['grammarly', 'grammarly.com', 'grammarly inc', 'grammarly*'],
    category: 'software',
    cancelUrl: 'https://account.grammarly.com/subscription',
    typicalPriceRange: { min: 50, max: 150 },
  },

  lastpass: {
    canonicalName: 'LastPass',
    aliases: ['lastpass', 'lastpass.com', 'lastpass premium', 'lastpass*'],
    category: 'software',
    cancelUrl: 'https://lastpass.com/account.php',
    typicalPriceRange: { min: 15, max: 40 },
  },

  // ══════════════════════════════════════════════════════════════
  // CLOUD E ARMAZENAMENTO (5 serviços)
  // ══════════════════════════════════════════════════════════════
  dropbox: {
    canonicalName: 'Dropbox',
    aliases: [
      'dropbox',
      'dropbox.com',
      'dropbox inc',
      'dropbox plus',
      'dropbox*',
    ],
    category: 'cloud',
    cancelUrl: 'https://www.dropbox.com/account/plan',
    typicalPriceRange: { min: 40, max: 100 },
  },

  googleOne: {
    canonicalName: 'Google One',
    aliases: [
      'google one',
      'google storage',
      'google*one',
      'google.com/one',
      'google llc',
    ],
    category: 'cloud',
    cancelUrl: 'https://one.google.com/settings',
    typicalPriceRange: { min: 7, max: 50 },
    isPopular: true,
  },

  icloud: {
    canonicalName: 'iCloud+',
    aliases: [
      'icloud',
      'apple*icloud',
      'icloud+',
      'apple.com/bill icloud',
      'apple storage',
    ],
    category: 'cloud',
    cancelUrl: 'https://support.apple.com/pt-br/HT207594',
    typicalPriceRange: { min: 4, max: 40 },
    isPopular: true,
  },

  onedrive: {
    canonicalName: 'OneDrive',
    aliases: ['onedrive', 'one drive', 'microsoft onedrive', 'onedrive*'],
    category: 'cloud',
    cancelUrl: 'https://account.microsoft.com/services/',
    typicalPriceRange: { min: 10, max: 50 },
  },

  pcloud: {
    canonicalName: 'pCloud',
    aliases: ['pcloud', 'pcloud.com', 'pcloud*'],
    category: 'cloud',
    cancelUrl: 'https://www.pcloud.com/settings/',
    typicalPriceRange: { min: 30, max: 100 },
  },

  // ══════════════════════════════════════════════════════════════
  // NOTÍCIAS E MÍDIA (6 serviços)
  // ══════════════════════════════════════════════════════════════
  uol: {
    canonicalName: 'UOL',
    aliases: [
      'uol',
      'folha',
      'uol*',
      'uol assinatura',
      'folha de sao paulo',
      'folha uol',
    ],
    category: 'news',
    cancelUrl: 'https://conta.uol.com.br/',
    typicalPriceRange: { min: 10, max: 50 },
  },

  estadao: {
    canonicalName: 'Estadão',
    aliases: [
      'estadao',
      'estadão',
      'o estado de sao paulo',
      'estado sao paulo',
      'estadao*',
    ],
    category: 'news',
    cancelUrl: 'https://assinatura.estadao.com.br/',
    typicalPriceRange: { min: 15, max: 60 },
  },

  oglobo: {
    canonicalName: 'O Globo',
    aliases: ['o globo', 'oglobo', 'globo.com', 'infoglobo', 'oglobo*'],
    category: 'news',
    cancelUrl: 'https://assinatura.oglobo.com.br/',
    typicalPriceRange: { min: 15, max: 60 },
  },

  valor: {
    canonicalName: 'Valor Econômico',
    aliases: ['valor', 'valor economico', 'valor econômico', 'valor*'],
    category: 'news',
    cancelUrl: 'https://www.valor.com.br/assine',
    typicalPriceRange: { min: 20, max: 80 },
  },

  medium: {
    canonicalName: 'Medium',
    aliases: ['medium', 'medium.com', 'medium inc', 'medium*'],
    category: 'news',
    cancelUrl: 'https://medium.com/me/settings',
    typicalPriceRange: { min: 20, max: 30 },
  },

  exame: {
    canonicalName: 'Exame',
    aliases: ['exame', 'exame.com', 'abril exame', 'exame*'],
    category: 'news',
    cancelUrl: 'https://exame.com/assine/',
    typicalPriceRange: { min: 15, max: 50 },
  },

  // ══════════════════════════════════════════════════════════════
  // FITNESS E ACADEMIA (6 serviços)
  // ══════════════════════════════════════════════════════════════
  smartFit: {
    canonicalName: 'Smart Fit',
    aliases: [
      'smart fit',
      'smartfit',
      'smartfit mensalidade',
      'smart fit brasil',
      'academia smart',
    ],
    category: 'fitness',
    cancelInstructions:
      'Compareça presencialmente à unidade mais próxima com documento de identidade',
    typicalPriceRange: { min: 80, max: 150 },
    isPopular: true,
  },

  gympass: {
    canonicalName: 'Wellhub (ex-Gympass)',
    aliases: [
      'gympass',
      'wellhub',
      'gym pass',
      'wellhub.com',
      'wellhub*',
      'gympass*',
    ],
    category: 'fitness',
    cancelUrl: 'https://wellhub.com/pt-br/',
    typicalPriceRange: { min: 50, max: 300 },
    isPopular: true,
  },

  totalpass: {
    canonicalName: 'TotalPass',
    aliases: ['totalpass', 'total pass', 'totalpass.com.br', 'totalpass*'],
    category: 'fitness',
    cancelUrl: 'https://www.totalpass.com.br/',
    typicalPriceRange: { min: 80, max: 200 },
  },

  bluefit: {
    canonicalName: 'Bluefit',
    aliases: ['bluefit', 'blue fit', 'academia bluefit', 'bluefit*'],
    category: 'fitness',
    cancelInstructions:
      'Compareça presencialmente à unidade ou ligue para central',
    typicalPriceRange: { min: 60, max: 120 },
  },

  bodytech: {
    canonicalName: 'Bodytech',
    aliases: ['bodytech', 'body tech', 'bodytech company', 'bodytech*'],
    category: 'fitness',
    cancelInstructions: 'Compareça presencialmente à unidade',
    typicalPriceRange: { min: 150, max: 400 },
  },

  selfit: {
    canonicalName: 'Selfit',
    aliases: ['selfit', 'self fit', 'selfit academia', 'selfit*'],
    category: 'fitness',
    cancelInstructions: 'Compareça presencialmente à unidade',
    typicalPriceRange: { min: 70, max: 130 },
  },

  // ══════════════════════════════════════════════════════════════
  // DELIVERY E FOOD (5 serviços)
  // ══════════════════════════════════════════════════════════════
  ifood: {
    canonicalName: 'iFood Clube',
    aliases: [
      'ifood',
      'ifood*club',
      'ifood clube',
      'ifood.com.br',
      'movile*ifood',
      'if *', // Visto em extratos
      'ifood*',
    ],
    category: 'food',
    cancelUrl: 'https://www.ifood.com.br/clube',
    cancelInstructions:
      'Cancele pelo app: Menu > Clube iFood > Cancelar assinatura',
    typicalPriceRange: { min: 10, max: 30 },
    isPopular: true,
  },

  rappi: {
    canonicalName: 'Rappi Prime',
    aliases: ['rappi', 'rappi*', 'rappi prime', 'rappi.com.br'],
    category: 'food',
    cancelInstructions: 'Cancele pelo app: Perfil > Rappi Prime > Cancelar',
    typicalPriceRange: { min: 10, max: 30 },
  },

  uberEats: {
    canonicalName: 'Uber Eats',
    aliases: ['uber eats', 'ubereats', 'uber*eats'],
    category: 'food',
    cancelUrl: 'https://help.uber.com/',
    typicalPriceRange: { min: 15, max: 35 },
  },

  zeDaDelivery: {
    canonicalName: 'Zé Delivery',
    aliases: ['ze delivery', 'zedelivery', 'ambev ze', 'zé delivery'],
    category: 'food',
    typicalPriceRange: { min: 10, max: 30 },
  },

  james: {
    canonicalName: 'James Delivery',
    aliases: ['james', 'james delivery', 'james*'],
    category: 'food',
    typicalPriceRange: { min: 10, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSPORTE E MOBILIDADE (4 serviços)
  // ══════════════════════════════════════════════════════════════
  uber: {
    canonicalName: 'Uber',
    aliases: [
      'uber',
      'uber*',
      'uber do brasil',
      'uber trip',
      'uber pass',
      'uberpass',
    ],
    category: 'transport',
    cancelUrl: 'https://help.uber.com/',
    typicalPriceRange: { min: 20, max: 50 },
    isPopular: true,
  },

  app99: {
    canonicalName: '99',
    aliases: ['99', '99app', '99*', '99 tecnologia', '99 pop', '99 taxi'],
    category: 'transport',
    cancelInstructions: 'Cancele pelo app 99',
    typicalPriceRange: { min: 15, max: 40 },
  },

  waze: {
    canonicalName: 'Waze Carpool',
    aliases: ['waze', 'waze carpool', 'waze*'],
    category: 'transport',
    typicalPriceRange: { min: 10, max: 30 },
  },

  yellowBike: {
    canonicalName: 'Yellow/Grow',
    aliases: ['yellow', 'grow', 'yellow bike', 'grow mobility'],
    category: 'transport',
    typicalPriceRange: { min: 10, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // EDUCAÇÃO (8 serviços)
  // ══════════════════════════════════════════════════════════════
  duolingo: {
    canonicalName: 'Duolingo Plus',
    aliases: ['duolingo', 'duolingo plus', 'duolingo.com', 'duolingo*'],
    category: 'education',
    cancelUrl: 'https://www.duolingo.com/settings/subscription',
    typicalPriceRange: { min: 30, max: 60 },
    isPopular: true,
  },

  coursera: {
    canonicalName: 'Coursera Plus',
    aliases: ['coursera', 'coursera.org', 'coursera inc', 'coursera*'],
    category: 'education',
    cancelUrl: 'https://www.coursera.org/account-settings',
    typicalPriceRange: { min: 50, max: 200 },
  },

  alura: {
    canonicalName: 'Alura',
    aliases: ['alura', 'alura.com.br', 'caelum alura', 'alura*'],
    category: 'education',
    cancelUrl: 'https://www.alura.com.br/minha-conta',
    typicalPriceRange: { min: 60, max: 150 },
    isPopular: true,
  },

  udemy: {
    canonicalName: 'Udemy',
    aliases: ['udemy', 'udemy.com', 'udemy inc', 'udemy*'],
    category: 'education',
    cancelUrl: 'https://www.udemy.com/user/manage-subscriptions/',
    typicalPriceRange: { min: 30, max: 100 },
  },

  skillshare: {
    canonicalName: 'Skillshare',
    aliases: ['skillshare', 'skillshare.com', 'skillshare inc', 'skillshare*'],
    category: 'education',
    cancelUrl: 'https://www.skillshare.com/settings/payments',
    typicalPriceRange: { min: 40, max: 80 },
  },

  descomplica: {
    canonicalName: 'Descomplica',
    aliases: ['descomplica', 'descomplica.com.br', 'descomplica*'],
    category: 'education',
    cancelUrl: 'https://descomplica.com.br/perfil',
    typicalPriceRange: { min: 30, max: 120 },
  },

  rocketseat: {
    canonicalName: 'Rocketseat',
    aliases: ['rocketseat', 'rocket seat', 'rocketseat.com.br'],
    category: 'education',
    cancelUrl: 'https://app.rocketseat.com.br/',
    typicalPriceRange: { min: 50, max: 150 },
  },

  linkedin: {
    canonicalName: 'LinkedIn Learning',
    aliases: [
      'linkedin',
      'lnkd',
      'linkedin premium',
      'linkedin.com',
      'linkedin corporation',
      'linkedin learning',
    ],
    category: 'education',
    cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription',
    typicalPriceRange: { min: 60, max: 200 },
  },

  // ══════════════════════════════════════════════════════════════
  // INTERNET / TV / TELEFONIA (8 serviços)
  // ══════════════════════════════════════════════════════════════
  claro: {
    canonicalName: 'Claro',
    aliases: [
      'claro',
      'net',
      'claro net',
      'clarotv',
      'claro*',
      'net servicos',
      'claro s.a',
    ],
    category: 'other',
    cancelUrl: 'https://www.claro.com.br/',
    typicalPriceRange: { min: 80, max: 400 },
    isPopular: true,
  },

  vivo: {
    canonicalName: 'Vivo',
    aliases: [
      'vivo',
      'telefonica vivo',
      'vivo*',
      'vivo fibra',
      'vivo tv',
      'telefonica',
    ],
    category: 'other',
    cancelUrl: 'https://www.vivo.com.br/',
    typicalPriceRange: { min: 80, max: 400 },
    isPopular: true,
  },

  tim: {
    canonicalName: 'TIM',
    aliases: ['tim', 'tim*', 'tim brasil', 'tim sa', 'tim celular'],
    category: 'other',
    cancelUrl: 'https://www.tim.com.br/',
    typicalPriceRange: { min: 50, max: 200 },
  },

  oi: {
    canonicalName: 'Oi',
    aliases: ['oi', 'oi*', 'oi fibra', 'oi velox', 'telemar'],
    category: 'other',
    cancelUrl: 'https://www.oi.com.br/',
    typicalPriceRange: { min: 80, max: 300 },
  },

  nioFibra: {
    canonicalName: 'NIO Fibra',
    aliases: [
      'nio fibra',
      'nio',
      'pg *nio fibra', // Visto em faturas PicPay
      'nio*',
      'niofibra',
    ],
    category: 'other',
    typicalPriceRange: { min: 70, max: 200 },
  },

  brisanet: {
    canonicalName: 'Brisanet',
    aliases: ['brisanet', 'brisa net', 'brisanet*'],
    category: 'other',
    typicalPriceRange: { min: 60, max: 150 },
  },

  algar: {
    canonicalName: 'Algar Telecom',
    aliases: ['algar', 'algar telecom', 'ctbc', 'algar*'],
    category: 'other',
    typicalPriceRange: { min: 80, max: 250 },
  },

  desktop: {
    canonicalName: 'Desktop (ISP)',
    aliases: ['desktop', 'desktop internet', 'desktop*'],
    category: 'other',
    typicalPriceRange: { min: 60, max: 150 },
  },

  // ══════════════════════════════════════════════════════════════
  // FINTECH E PAGAMENTOS (6 serviços)
  // ══════════════════════════════════════════════════════════════
  picpay: {
    canonicalName: 'PicPay',
    aliases: [
      'picpay',
      'picpay card',
      'pic pay',
      'picpay*',
      'pg *picpay', // Prefixo comum em faturas
    ],
    category: 'finance',
    cancelUrl: 'https://www.picpay.com/',
    typicalPriceRange: { min: 5, max: 50 },
    isPopular: true,
  },

  mercadoPago: {
    canonicalName: 'Mercado Pago',
    aliases: [
      'mercado pago',
      'mercadopago',
      'mercado*',
      'mp *',
      'mercado livre',
      'meli',
    ],
    category: 'finance',
    cancelUrl: 'https://www.mercadopago.com.br/',
    typicalPriceRange: { min: 5, max: 100 },
    isPopular: true,
  },

  nubank: {
    canonicalName: 'Nubank',
    aliases: ['nubank', 'nu pagamentos', 'nubank*', 'nu *'],
    category: 'finance',
    cancelUrl: 'https://www.nubank.com.br/',
    typicalPriceRange: { min: 0, max: 50 },
    isPopular: true,
  },

  pagbank: {
    canonicalName: 'PagBank',
    aliases: [
      'pagbank',
      'pagseguro',
      'pag seguro',
      'pagbank*',
      'pagseguro*',
      'pag *',
    ],
    category: 'finance',
    cancelUrl: 'https://www.pagbank.com.br/',
    typicalPriceRange: { min: 5, max: 50 },
  },

  ame: {
    canonicalName: 'Ame Digital',
    aliases: ['ame', 'ame digital', 'americanas ame', 'ame*'],
    category: 'finance',
    typicalPriceRange: { min: 5, max: 30 },
  },

  recargaPay: {
    canonicalName: 'RecargaPay',
    aliases: ['recargapay', 'recarga pay', 'recargapay*'],
    category: 'finance',
    typicalPriceRange: { min: 5, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // E-COMMERCE ASSINATURAS (4 serviços)
  // ══════════════════════════════════════════════════════════════
  amazon: {
    canonicalName: 'Amazon',
    aliases: [
      'amazon',
      'amzn',
      'amazon.com.br',
      'amazon*',
      'amz *',
    ],
    category: 'other',
    cancelUrl: 'https://www.amazon.com.br/',
    typicalPriceRange: { min: 10, max: 200 },
    isPopular: true,
  },

  shopee: {
    canonicalName: 'Shopee',
    aliases: ['shopee', 'shopee*', 'shopee brasil'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 50 },
  },

  aliexpress: {
    canonicalName: 'AliExpress',
    aliases: ['aliexpress', 'ali express', 'aliexpress*', 'alibaba'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 100 },
  },

  magalu: {
    canonicalName: 'Magazine Luiza',
    aliases: ['magalu', 'magazine luiza', 'magalu*', 'luiza'],
    category: 'other',
    typicalPriceRange: { min: 10, max: 100 },
  },
} as const;

// ══════════════════════════════════════════════════════════════
// HEURÍSTICAS PARA MATCHING INTELIGENTE
// ══════════════════════════════════════════════════════════════

/**
 * Prefixos comuns em faturas que indicam cobrança via gateway
 * Ex: "GOOGLE CRUNCHYROLL" -> Crunchyroll cobrado via Google Play
 */
const GATEWAY_PREFIXES = [
  'google',
  'apple',
  'pg *',       // PicPay gateway
  'mp *',       // Mercado Pago
  'pag *',      // PagSeguro
  'paypal',
  'stripe',
] as const;

/**
 * Sufixos que indicam parcelamento (não necessariamente assinatura)
 */
const INSTALLMENT_PATTERNS = [
  /parc\s*\d+\/\d+/i,      // PARC 01/12
  /parcela\s*\d+/i,        // PARCELA 1
  /\d+\/\d+$/,             // 01/12 no final
  /parcel/i,              // "parcelado"
];

/**
 * Normaliza uma string para matching
 */
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove prefixos de gateway da descrição
 * Ex: "GOOGLE CRUNCHYROLL" -> "CRUNCHYROLL"
 */
function removeGatewayPrefix(description: string): string {
  const normalized = normalizeForMatching(description);

  for (const prefix of GATEWAY_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return normalized.substring(prefix.length).trim();
    }
  }

  return normalized;
}

/**
 * Verifica se a descrição indica parcelamento
 */
export function isInstallmentPayment(description: string): boolean {
  return INSTALLMENT_PATTERNS.some((pattern) => pattern.test(description));
}

/**
 * Encontra um serviço conhecido pela descrição
 *
 * Usa heurísticas inteligentes:
 * 1. Primeiro tenta match direto
 * 2. Depois tenta remover prefixo de gateway (GOOGLE X -> X)
 * 3. Usa matching parcial para aliases longos
 *
 * @param description - Descrição da transação
 * @returns Serviço encontrado ou null
 */
export function findKnownService(description: string): KnownService | null {
  const normalized = normalizeForMatching(description);

  // 1. Tenta match direto primeiro
  for (const service of Object.values(KNOWN_SERVICES)) {
    for (const alias of service.aliases) {
      const normalizedAlias = normalizeForMatching(alias);

      // Match exato
      if (normalized === normalizedAlias) {
        return service;
      }

      // Descrição contém o alias (alias com pelo menos 4 chars)
      if (normalizedAlias.length >= 4 && normalized.includes(normalizedAlias)) {
        return service;
      }
    }
  }

  // 2. Tenta remover prefixo de gateway e buscar novamente
  // Ex: "GOOGLE CRUNCHYROLL" -> busca "CRUNCHYROLL"
  const withoutGateway = removeGatewayPrefix(description);
  if (withoutGateway !== normalized) {
    for (const service of Object.values(KNOWN_SERVICES)) {
      for (const alias of service.aliases) {
        const normalizedAlias = normalizeForMatching(alias);

        if (
          withoutGateway === normalizedAlias ||
          (normalizedAlias.length >= 4 && withoutGateway.includes(normalizedAlias))
        ) {
          return service;
        }
      }
    }
  }

  return null;
}

/**
 * Verifica se um valor está na faixa típica de um serviço
 */
export function isValueInTypicalRange(
  service: KnownService,
  value: number
): boolean {
  if (!service.typicalPriceRange) {
    return true; // Se não tem faixa definida, aceita qualquer valor
  }

  const { min, max } = service.typicalPriceRange;
  const tolerance = 0.2; // 20% de tolerância

  return value >= min * (1 - tolerance) && value <= max * (1 + tolerance);
}

/**
 * Retorna instruções de cancelamento formatadas
 */
export function getCancelInstructions(service: KnownService): string {
  if (service.cancelUrl) {
    return service.cancelUrl;
  }
  if (service.cancelInstructions) {
    return service.cancelInstructions;
  }
  return 'Entre em contato com o serviço para cancelar';
}

/**
 * Lista todos os serviços conhecidos
 */
export function getAllKnownServices(): KnownService[] {
  return Object.values(KNOWN_SERVICES);
}

/**
 * Retorna estatísticas do banco de serviços
 */
export function getServiceStats(): {
  total: number;
  byCategory: Record<string, number>;
  popular: number;
  totalAliases: number;
} {
  const services = getAllKnownServices();
  const byCategory: Record<string, number> = {};
  let totalAliases = 0;

  for (const service of services) {
    byCategory[service.category] = (byCategory[service.category] ?? 0) + 1;
    totalAliases += service.aliases.length;
  }

  return {
    total: services.length,
    byCategory,
    popular: services.filter((s) => s.isPopular).length,
    totalAliases,
  };
}

/**
 * Exporta lista simplificada para uso em APIs públicas
 */
export function getPublicServiceList(): Array<{
  name: string;
  category: string;
  hasOnlineCancellation: boolean;
}> {
  return getAllKnownServices().map((service) => ({
    name: service.canonicalName,
    category: service.category,
    hasOnlineCancellation: !!service.cancelUrl,
  }));
}
