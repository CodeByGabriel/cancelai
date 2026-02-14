/**
 * Base de dados de serviços conhecidos — 150+ serviços brasileiros
 *
 * Aliases: variações do nome do serviço (lowercase, sem acentos, sem prefixo gateway)
 * BillingDescriptors: strings EXATAS como aparecem em faturas COM prefixo de gateway
 *
 * Aliases reais coletados de:
 * - Faturas Nubank, PicPay, Mercado Pago
 * - Extratos Itaú, Bradesco, BB, Santander
 * - Relatórios de usuários brasileiros
 *
 * COMO ADICIONAR NOVOS SERVIÇOS:
 * 1. Adicione entrada no objeto KNOWN_SERVICES_DATA
 * 2. Liste todos os aliases encontrados em extratos bancários
 * 3. Adicione billingDescriptors com prefixos de gateway reais
 * 4. Verifique a URL e método de cancelamento
 * 5. Defina typicalPriceRange (min/max em BRL)
 *
 * ÚLTIMA ATUALIZAÇÃO: Fevereiro 2026
 */

import type { KnownService } from '../services/known-services.js';

export const KNOWN_SERVICES_DATA: Record<string, KnownService> = {
  // ══════════════════════════════════════════════════════════════
  // STREAMING DE VÍDEO (19 serviços)
  // ══════════════════════════════════════════════════════════════
  netflix: {
    canonicalName: 'Netflix',
    aliases: [
      'netflix', 'netflix.com', 'netflix com', 'nflx', 'netflix inc',
      'netflix international', 'netflix*', 'nflx.com',
    ],
    billingDescriptors: [
      'PAG*NETFLIX', 'GOOGLE*NETFLIX', 'MERCPAGO*NETFLIX',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.netflix.com/cancelplan',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse netflix.com/cancelplan > Cancelar assinatura. Voce mantem acesso ate o fim do periodo pago.',
    typicalPriceRange: { min: 20, max: 60 },
    isPopular: true,
  },

  amazonPrimeVideo: {
    canonicalName: 'Amazon Prime',
    aliases: [
      'amazon prime', 'prime video', 'amzn prime', 'amz prime', 'amz*prime',
      'amazon*prime', 'amazon.com.br prime', 'amazon prime video', 'primevideo',
      'amazon br', 'amzn*prime video', 'amazon digital', 'amzn mktp br',
      'amazon mktplace', 'amzn marketplace',
    ],
    billingDescriptors: [
      'AMZN*PRIME', 'AMAZON.COM.BR PARC', 'AMAZON BR PARC',
      'PAG*AMAZONPRIME', 'MERCPAGO*AMAZON',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    cancelMethod: 'web',
    cancelInstructions: 'Amazon.com.br > Conta > Prime > Gerenciar assinatura > Cancelar. Voce mantem beneficios ate o fim do periodo.',
    typicalPriceRange: { min: 10, max: 20 },
    isPopular: true,
  },

  disneyPlus: {
    canonicalName: 'Disney+',
    aliases: [
      'disney+', 'disney plus', 'disneyplus', 'disney +', 'disney streaming',
      'the walt disney', 'disney*', 'disney plus br',
    ],
    billingDescriptors: [
      'PAG*DISNEYPLUS', 'GOOGLE*DISNEYPLUS', 'MERCPAGO*DISNEY',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.disneyplus.com/account',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse disneyplus.com/account > Assinatura > Cancelar. Se assinou via App Store/Play Store, cancele por la.',
    typicalPriceRange: { min: 28, max: 62 },
    isPopular: true,
  },

  hboMax: {
    canonicalName: 'Max (HBO)',
    aliases: [
      'hbo max', 'hbomax', 'max', 'max streaming', 'hbo', 'warner bros',
      'wbd streaming', 'hbo*', 'max*',
    ],
    billingDescriptors: [
      'PAG*MAX', 'GOOGLE*MAX', 'MERCPAGO*HBOMAX', 'PAG*HBOMAX',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.max.com/account',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse max.com/account > Assinatura > Cancelar assinatura.',
    typicalPriceRange: { min: 28, max: 56 },
    isPopular: true,
  },

  globoplay: {
    canonicalName: 'Globoplay',
    aliases: [
      'globoplay', 'globo play', 'globo.com', 'g1 globoplay', 'globoplay canais',
      'globoplay*', 'globo streaming', 'globo comunicacao', 'pg *globoplay',
      'pg *globo',
    ],
    billingDescriptors: [
      'PAG*GLOBOPLAY', 'PG *GLOBOPLAY', 'PG *GLOBO',
      'MERCPAGO*GLOBOPLAY', 'GOOGLE*GLOBOPLAY',
    ],
    category: 'streaming',
    cancelUrl: 'https://globoplay.globo.com/minha-conta/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse globoplay.globo.com/minha-conta > Assinatura > Cancelar. Para Globoplay+canais, cancele cada pacote separadamente.',
    typicalPriceRange: { min: 23, max: 90 },
    isPopular: true,
  },

  paramount: {
    canonicalName: 'Paramount+',
    aliases: [
      'paramount+', 'paramount plus', 'paramountplus', 'paramount streaming',
      'viacomcbs', 'paramount*',
    ],
    billingDescriptors: [
      'PAG*PARAMOUNT', 'GOOGLE*PARAMOUNTPLUS', 'MERCPAGO*PARAMOUNT',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.paramountplus.com/account/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse paramountplus.com/account > Cancelar assinatura.',
    typicalPriceRange: { min: 20, max: 45 },
    isPopular: true,
  },

  starPlus: {
    canonicalName: 'Star+',
    aliases: ['star+', 'star plus', 'starplus', 'star streaming', 'star*'],
    billingDescriptors: ['PAG*STARPLUS', 'GOOGLE*STARPLUS'],
    category: 'streaming',
    cancelUrl: 'https://www.starplus.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 56 },
  },

  crunchyroll: {
    canonicalName: 'Crunchyroll',
    aliases: [
      'crunchyroll', 'crunchy roll', 'crunchyroll inc', 'google crunchyroll',
      'google*crunchyroll', 'pg *crunchyroll', 'ellation crunchyroll',
      'ellation inc', 'crunchyroll*',
    ],
    billingDescriptors: [
      'GOOGLE*CRUNCHYROLL', 'PG *CRUNCHYROLL', 'PAG*CRUNCHYROLL',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.crunchyroll.com/account',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse crunchyroll.com/account > Premium > Cancelar. Se assinou via app, cancele pela loja.',
    typicalPriceRange: { min: 15, max: 40 },
    isPopular: true,
  },

  mubi: {
    canonicalName: 'Mubi',
    aliases: ['mubi', 'mubi.com', 'mubi inc', 'mubi*'],
    billingDescriptors: ['GOOGLE*MUBI', 'PAG*MUBI'],
    category: 'streaming',
    cancelUrl: 'https://mubi.com/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 22, max: 35 },
  },

  appleTvPlus: {
    canonicalName: 'Apple TV+',
    aliases: [
      'apple tv+', 'apple tv plus', 'appletv+', 'apple.com/bill',
      'apple tv', 'itunes apple tv',
    ],
    billingDescriptors: ['APPLE.COM/BILL', 'ITUNES.COM/BILL'],
    category: 'streaming',
    cancelUrl: 'https://support.apple.com/pt-br/HT202039',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 15, max: 25 },
  },

  plutoTv: {
    canonicalName: 'Pluto TV',
    aliases: ['pluto tv', 'plutotv', 'pluto*'],
    billingDescriptors: [],
    category: 'streaming',
    typicalPriceRange: { min: 0, max: 0 },
  },

  looke: {
    canonicalName: 'Looke',
    aliases: ['looke', 'looke.com.br', 'looke*'],
    billingDescriptors: ['PAG*LOOKE'],
    category: 'streaming',
    cancelUrl: 'https://www.looke.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 30 },
  },

  telecine: {
    canonicalName: 'Telecine',
    aliases: [
      'telecine', 'telecine play', 'telecineplay', 'telecine*',
      'globo telecine',
    ],
    billingDescriptors: [
      'PAG*TELECINE', 'GOOGLE*TELECINE', 'PG *TELECINE',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.telecineplay.com.br/minha-conta',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 50 },
  },

  premiereFC: {
    canonicalName: 'Premiere FC',
    aliases: [
      'premiere', 'premiere fc', 'premiere play', 'premiereplay',
      'premiere futebol', 'globo premiere', 'premiere*',
    ],
    billingDescriptors: [
      'PAG*PREMIERE', 'PG *PREMIERE', 'MERCPAGO*PREMIERE',
    ],
    category: 'streaming',
    cancelUrl: 'https://globoplay.globo.com/minha-conta/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 90 },
  },

  dazn: {
    canonicalName: 'DAZN',
    aliases: ['dazn', 'dazn.com', 'dazn group', 'dazn*'],
    billingDescriptors: [
      'PAG*DAZN', 'GOOGLE*DAZN', 'MERCPAGO*DAZN',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.dazn.com/pt-BR/account',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse dazn.com > Minha conta > Cancelar assinatura.',
    typicalPriceRange: { min: 20, max: 60 },
    isPopular: true,
  },

  discoveryPlus: {
    canonicalName: 'Discovery+',
    aliases: [
      'discovery+', 'discovery plus', 'discoveryplus', 'discovery*',
      'warner discovery',
    ],
    billingDescriptors: ['GOOGLE*DISCOVERYPLUS', 'PAG*DISCOVERY'],
    category: 'streaming',
    cancelUrl: 'https://www.discoveryplus.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 22, max: 45 },
  },

  starzplay: {
    canonicalName: 'Starzplay',
    aliases: ['starzplay', 'starz play', 'starz', 'lionsgate+', 'starzplay*'],
    billingDescriptors: ['GOOGLE*STARZPLAY', 'PAG*STARZPLAY'],
    category: 'streaming',
    cancelUrl: 'https://www.starzplay.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 30 },
  },

  oldflix: {
    canonicalName: 'Oldflix',
    aliases: ['oldflix', 'oldflix.com.br', 'oldflix*'],
    billingDescriptors: ['PAG*OLDFLIX'],
    category: 'streaming',
    cancelUrl: 'https://www.oldflix.com.br/minha-conta',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 20 },
  },

  curiosityStream: {
    canonicalName: 'CuriosityStream',
    aliases: ['curiositystream', 'curiosity stream', 'curiositystream*'],
    billingDescriptors: ['GOOGLE*CURIOSITYSTREAM'],
    category: 'streaming',
    cancelUrl: 'https://curiositystream.com/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // MÚSICA E ÁUDIO (8 serviços)
  // ══════════════════════════════════════════════════════════════
  spotify: {
    canonicalName: 'Spotify',
    aliases: [
      'spotify', 'spotify ab', 'spotfy', 'spotify premium', 'spotify family',
      'spotify duo', 'spotify.com', 'spotify*',
    ],
    billingDescriptors: [
      'PAG*SPOTIFY', 'GOOGLE*SPOTIFY', 'MERCPAGO*SPOTIFY',
    ],
    category: 'music',
    cancelUrl: 'https://www.spotify.com/br/account/subscription/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse spotify.com/account > Assinatura > Alterar plano > Cancelar Premium. Se assinou via app store, cancele por la.',
    typicalPriceRange: { min: 11, max: 42 },
    isPopular: true,
  },

  deezer: {
    canonicalName: 'Deezer',
    aliases: [
      'deezer', 'deezer.com', 'deezer premium', 'deezer family', 'deezer*',
    ],
    billingDescriptors: [
      'PAG*DEEZER', 'GOOGLE*DEEZER', 'MERCPAGO*DEEZER',
    ],
    category: 'music',
    cancelUrl: 'https://www.deezer.com/account/subscription',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse deezer.com > Minha conta > Gerenciar assinatura > Cancelar.',
    typicalPriceRange: { min: 17, max: 42 },
  },

  appleMusicOne: {
    canonicalName: 'Apple Music',
    aliases: [
      'apple music', 'apple one', 'itunes', 'itunes.com/bill',
      'apple.com/bill', 'apple.com/bill music', 'apple*music',
      'apple services', 'apple bill', 'itunes*',
    ],
    billingDescriptors: ['APPLE.COM/BILL', 'ITUNES.COM/BILL'],
    category: 'music',
    cancelUrl: 'https://support.apple.com/pt-br/HT202039',
    cancelMethod: 'platform',
    cancelInstructions: 'No iPhone: Ajustes > seu nome > Assinaturas > Apple Music > Cancelar. No Mac: App Store > Conta > Assinaturas.',
    typicalPriceRange: { min: 11, max: 50 },
    isPopular: true,
  },

  youtubeMusic: {
    canonicalName: 'YouTube Premium',
    aliases: [
      'youtube music', 'youtube premium', 'google*youtube', 'youtube.com',
      'yt premium', 'yt music', 'youtube*', 'google youtube',
    ],
    billingDescriptors: [
      'GOOGLE*YOUTUBE', 'GOOGLE*YOUTUBEPREMIUM',
    ],
    category: 'music',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse youtube.com/paid_memberships > Gerenciar assinatura > Cancelar.',
    typicalPriceRange: { min: 21, max: 45 },
    isPopular: true,
  },

  tidal: {
    canonicalName: 'Tidal',
    aliases: ['tidal', 'tidal.com', 'tidal hifi', 'tidal*'],
    billingDescriptors: ['PAG*TIDAL', 'GOOGLE*TIDAL'],
    category: 'music',
    cancelUrl: 'https://tidal.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 42 },
  },

  amazonMusic: {
    canonicalName: 'Amazon Music',
    aliases: [
      'amazon music', 'amzn music', 'amazon*music', 'amazon music unlimited',
    ],
    billingDescriptors: ['AMZN*MUSIC'],
    category: 'music',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 35 },
  },

  audible: {
    canonicalName: 'Audible',
    aliases: ['audible', 'audible.com', 'audible*', 'amazon audible'],
    billingDescriptors: ['AMZN*AUDIBLE'],
    category: 'music',
    cancelUrl: 'https://www.audible.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 50 },
  },

  soundcloud: {
    canonicalName: 'SoundCloud Go+',
    aliases: ['soundcloud', 'soundcloud go', 'soundcloud go+', 'soundcloud*'],
    billingDescriptors: ['GOOGLE*SOUNDCLOUD', 'PAG*SOUNDCLOUD'],
    category: 'music',
    cancelUrl: 'https://soundcloud.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 35 },
  },

  // ══════════════════════════════════════════════════════════════
  // GAMING (10 serviços)
  // ══════════════════════════════════════════════════════════════
  xboxGamePass: {
    canonicalName: 'Xbox Game Pass',
    aliases: [
      'xbox', 'game pass', 'microsoft*xbox', 'xbox game pass', 'xbox live',
      'xbox ultimate', 'microsoft gaming', 'xbox*', 'gamepass',
    ],
    billingDescriptors: [
      'MICROSOFT*XBOX', 'MICROSOFT*GAMEPASS',
    ],
    category: 'gaming',
    cancelUrl: 'https://account.microsoft.com/services/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse account.microsoft.com/services > Xbox Game Pass > Cancelar.',
    typicalPriceRange: { min: 30, max: 60 },
    isPopular: true,
  },

  playstationPlus: {
    canonicalName: 'PlayStation Plus',
    aliases: [
      'playstation', 'psn', 'ps plus', 'playstation plus', 'playstation network',
      'sony playstation', 'ps premium', 'playstation*', 'psn*',
    ],
    billingDescriptors: [
      'SONY*PLAYSTATION', 'PAG*PLAYSTATION', 'GOOGLE*PLAYSTATION',
    ],
    category: 'gaming',
    cancelUrl: 'https://www.playstation.com/pt-br/support/store/',
    cancelMethod: 'web',
    cancelInstructions: 'No console: Configuracoes > Gerenciamento de conta > Informacoes da conta > Assinatura PS Plus > Cancelar.',
    typicalPriceRange: { min: 25, max: 70 },
    isPopular: true,
  },

  nintendoOnline: {
    canonicalName: 'Nintendo Switch Online',
    aliases: [
      'nintendo', 'nintendo online', 'nintendo switch online',
      'nintendo eshop', 'nintendo*',
    ],
    billingDescriptors: ['NINTENDO*SWITCHONLINE'],
    category: 'gaming',
    cancelUrl: 'https://accounts.nintendo.com',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 45 },
  },

  eaPlay: {
    canonicalName: 'EA Play',
    aliases: [
      'ea play', 'ea access', 'electronic arts', 'ea games', 'ea*',
    ],
    billingDescriptors: ['EA*PLAY', 'GOOGLE*EAPLAY'],
    category: 'gaming',
    cancelUrl: 'https://myaccount.ea.com/cp-ui/subscription/index',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 30 },
  },

  steam: {
    canonicalName: 'Steam',
    aliases: ['steam', 'steampowered', 'steam*', 'valve steam'],
    billingDescriptors: ['STEAMPOWERED.COM'],
    category: 'gaming',
    cancelUrl: 'https://store.steampowered.com/account/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 100 },
    isPopular: true,
  },

  epicGames: {
    canonicalName: 'Epic Games',
    aliases: ['epic games', 'epic*', 'fortnite', 'epicgames'],
    billingDescriptors: ['EPICGAMES.COM'],
    category: 'gaming',
    cancelUrl: 'https://www.epicgames.com/account/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 50 },
  },

  twitch: {
    canonicalName: 'Twitch',
    aliases: ['twitch', 'twitch.tv', 'twitch*', 'amazon twitch'],
    billingDescriptors: ['TWITCH.TV', 'AMAZON*TWITCH'],
    category: 'gaming',
    cancelUrl: 'https://www.twitch.tv/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 5, max: 30 },
  },

  ubisoftPlus: {
    canonicalName: 'Ubisoft+',
    aliases: ['ubisoft', 'ubisoft+', 'ubisoft plus', 'uplay', 'ubisoft*'],
    billingDescriptors: ['UBISOFT*PLUS'],
    category: 'gaming',
    cancelUrl: 'https://store.ubi.com/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 80 },
  },

  geforceNow: {
    canonicalName: 'GeForce NOW',
    aliases: [
      'geforce now', 'geforcenow', 'nvidia geforce', 'nvidia*', 'geforce*',
    ],
    billingDescriptors: ['PAG*GEFORCENOW', 'GOOGLE*GEFORCENOW'],
    category: 'gaming',
    cancelUrl: 'https://www.nvidia.com/pt-br/geforce-now/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 55 },
  },

  roblox: {
    canonicalName: 'Roblox Premium',
    aliases: ['roblox', 'roblox premium', 'roblox*'],
    billingDescriptors: ['GOOGLE*ROBLOX', 'ROBLOX.COM'],
    category: 'gaming',
    cancelUrl: 'https://www.roblox.com/my/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 50 },
  },

  // ══════════════════════════════════════════════════════════════
  // SOFTWARE E PRODUTIVIDADE (22 serviços — inclui ex-cloud)
  // ══════════════════════════════════════════════════════════════
  adobe: {
    canonicalName: 'Adobe Creative Cloud',
    aliases: [
      'adobe', 'creative cloud', 'adobe.com', 'adobe systems', 'adobe inc',
      'adobe photography', 'adobe all apps', 'adobe*',
    ],
    billingDescriptors: ['ADOBE*CREATIVECLOUD', 'PAG*ADOBE'],
    category: 'software',
    cancelUrl: 'https://account.adobe.com/plans',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse account.adobe.com/plans > Gerenciar plano > Cancelar plano. Atencao: pode ter taxa de cancelamento antecipado.',
    typicalPriceRange: { min: 43, max: 300 },
    isPopular: true,
  },

  microsoft365: {
    canonicalName: 'Microsoft 365',
    aliases: [
      'microsoft 365', 'office 365', 'ms 365', 'microsoft*office',
      'microsoft corporation', 'office.com', 'microsoft*', 'ms office',
    ],
    billingDescriptors: ['MICROSOFT*365', 'MICROSOFT*OFFICE'],
    category: 'software',
    cancelUrl: 'https://account.microsoft.com/services/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 80 },
    isPopular: true,
  },

  googleWorkspace: {
    canonicalName: 'Google Workspace',
    aliases: [
      'google workspace', 'google*workspace', 'google cloud', 'g suite',
      'gsuite', 'google*',
    ],
    billingDescriptors: ['GOOGLE*WORKSPACE'],
    category: 'software',
    cancelUrl: 'https://workspace.google.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 100 },
  },

  canva: {
    canonicalName: 'Canva Pro',
    aliases: [
      'canva', 'canva.com', 'canva pro', 'canva pty', 'canva pty ltd',
      'google canva', 'google*canva', 'pg *canva', 'canva*',
    ],
    billingDescriptors: [
      'GOOGLE*CANVA', 'PG *CANVA', 'PAG*CANVA', 'MERCPAGO*CANVA',
    ],
    category: 'software',
    cancelUrl: 'https://www.canva.com/settings/billing',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse canva.com > Configuracoes > Cobranca e planos > Cancelar assinatura.',
    typicalPriceRange: { min: 35, max: 60 },
    isPopular: true,
  },

  notion: {
    canonicalName: 'Notion',
    aliases: ['notion', 'notion.so', 'notion labs', 'notion*'],
    billingDescriptors: ['NOTION.SO'],
    category: 'software',
    cancelUrl: 'https://www.notion.so/my-account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 50 },
  },

  figma: {
    canonicalName: 'Figma',
    aliases: ['figma', 'figma.com', 'figma inc', 'figma*'],
    billingDescriptors: ['FIGMA.COM'],
    category: 'software',
    cancelUrl: 'https://www.figma.com/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
  },

  slack: {
    canonicalName: 'Slack',
    aliases: ['slack', 'slack.com', 'slack technologies', 'slack*'],
    billingDescriptors: ['SLACK.COM'],
    category: 'software',
    cancelUrl: 'https://slack.com/account/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 80 },
  },

  zoom: {
    canonicalName: 'Zoom',
    aliases: [
      'zoom', 'zoom.us', 'zoom video', 'zoom communications', 'zoom*',
    ],
    billingDescriptors: ['ZOOM.US'],
    category: 'software',
    cancelUrl: 'https://zoom.us/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
  },

  chatgpt: {
    canonicalName: 'ChatGPT Plus',
    aliases: [
      'openai', 'chatgpt', 'chatgpt plus', 'openai.com', 'openai*', 'chat gpt',
    ],
    billingDescriptors: ['OPENAI*CHATGPT', 'OPENAI.COM'],
    category: 'software',
    cancelUrl: 'https://chat.openai.com/settings/subscription',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse chat.openai.com > Configuracoes > Assinatura > Cancelar plano.',
    typicalPriceRange: { min: 100, max: 120 },
    isPopular: true,
  },

  claude: {
    canonicalName: 'Claude Pro',
    aliases: ['anthropic', 'claude', 'claude pro', 'anthropic.com', 'claude*'],
    billingDescriptors: ['ANTHROPIC.COM'],
    category: 'software',
    cancelUrl: 'https://claude.ai/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 100, max: 120 },
  },

  grammarly: {
    canonicalName: 'Grammarly',
    aliases: ['grammarly', 'grammarly.com', 'grammarly inc', 'grammarly*'],
    billingDescriptors: ['GRAMMARLY.COM'],
    category: 'software',
    cancelUrl: 'https://account.grammarly.com/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
  },

  lastpass: {
    canonicalName: 'LastPass',
    aliases: ['lastpass', 'lastpass.com', 'lastpass premium', 'lastpass*'],
    billingDescriptors: ['LASTPASS.COM'],
    category: 'software',
    cancelUrl: 'https://lastpass.com/account.php',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 40 },
  },

  // Ex-cloud → software
  dropbox: {
    canonicalName: 'Dropbox',
    aliases: [
      'dropbox', 'dropbox.com', 'dropbox inc', 'dropbox plus', 'dropbox*',
    ],
    billingDescriptors: ['DROPBOX.COM'],
    category: 'software',
    cancelUrl: 'https://www.dropbox.com/account/plan',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 100 },
  },

  googleOne: {
    canonicalName: 'Google One',
    aliases: [
      'google one', 'google storage', 'google*one', 'google.com/one', 'google llc',
    ],
    billingDescriptors: ['GOOGLE*ONE'],
    category: 'software',
    cancelUrl: 'https://one.google.com/settings',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse one.google.com > Configuracoes > Cancelar assinatura.',
    typicalPriceRange: { min: 7, max: 50 },
    isPopular: true,
  },

  icloud: {
    canonicalName: 'iCloud+',
    aliases: [
      'icloud', 'apple*icloud', 'icloud+', 'apple.com/bill icloud', 'apple storage',
    ],
    billingDescriptors: ['APPLE.COM/BILL'],
    category: 'software',
    cancelUrl: 'https://support.apple.com/pt-br/HT207594',
    cancelMethod: 'platform',
    cancelInstructions: 'No iPhone: Ajustes > seu nome > iCloud > Gerenciar armazenamento > Alterar plano de armazenamento > Fazer downgrade.',
    typicalPriceRange: { min: 4, max: 40 },
    isPopular: true,
  },

  onedrive: {
    canonicalName: 'OneDrive',
    aliases: ['onedrive', 'one drive', 'microsoft onedrive', 'onedrive*'],
    billingDescriptors: ['MICROSOFT*ONEDRIVE'],
    category: 'software',
    cancelUrl: 'https://account.microsoft.com/services/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 50 },
  },

  pcloud: {
    canonicalName: 'pCloud',
    aliases: ['pcloud', 'pcloud.com', 'pcloud*'],
    billingDescriptors: ['PCLOUD.COM'],
    category: 'software',
    cancelUrl: 'https://www.pcloud.com/settings/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 100 },
  },

  jetbrains: {
    canonicalName: 'JetBrains',
    aliases: [
      'jetbrains', 'intellij', 'webstorm', 'pycharm', 'phpstorm', 'jetbrains*',
    ],
    billingDescriptors: ['JETBRAINS.COM'],
    category: 'software',
    cancelUrl: 'https://account.jetbrains.com/licenses',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 200 },
  },

  onePassword: {
    canonicalName: '1Password',
    aliases: ['1password', 'onepassword', 'one password', '1password*'],
    billingDescriptors: ['1PASSWORD.COM'],
    category: 'software',
    cancelUrl: 'https://my.1password.com/settings/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 40 },
  },

  todoist: {
    canonicalName: 'Todoist',
    aliases: ['todoist', 'todoist.com', 'doist', 'todoist*'],
    billingDescriptors: ['TODOIST.COM', 'GOOGLE*TODOIST'],
    category: 'software',
    cancelUrl: 'https://todoist.com/app/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 40 },
  },

  evernote: {
    canonicalName: 'Evernote',
    aliases: ['evernote', 'evernote.com', 'evernote*'],
    billingDescriptors: ['EVERNOTE.COM'],
    category: 'software',
    cancelUrl: 'https://www.evernote.com/Settings.action',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 70 },
  },

  bitwarden: {
    canonicalName: 'Bitwarden',
    aliases: ['bitwarden', 'bitwarden.com', 'bitwarden*'],
    billingDescriptors: ['BITWARDEN.COM'],
    category: 'software',
    cancelUrl: 'https://vault.bitwarden.com/#/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 5, max: 20 },
  },

  asana: {
    canonicalName: 'Asana',
    aliases: ['asana', 'asana.com', 'asana inc', 'asana*'],
    billingDescriptors: ['ASANA.COM'],
    category: 'software',
    cancelUrl: 'https://app.asana.com/0/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
  },

  trello: {
    canonicalName: 'Trello',
    aliases: ['trello', 'trello.com', 'atlassian trello', 'trello*'],
    billingDescriptors: ['TRELLO.COM', 'ATLASSIAN*TRELLO'],
    category: 'software',
    cancelUrl: 'https://trello.com/your/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 60 },
  },

  monday: {
    canonicalName: 'Monday.com',
    aliases: ['monday', 'monday.com', 'monday*'],
    billingDescriptors: ['MONDAY.COM'],
    category: 'software',
    cancelUrl: 'https://monday.com/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 100 },
  },

  github: {
    canonicalName: 'GitHub',
    aliases: ['github', 'github.com', 'github pro', 'github*'],
    billingDescriptors: ['GITHUB.COM'],
    category: 'software',
    cancelUrl: 'https://github.com/settings/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 50 },
  },

  vercel: {
    canonicalName: 'Vercel',
    aliases: ['vercel', 'vercel.com', 'vercel inc', 'vercel*'],
    billingDescriptors: ['VERCEL.COM'],
    category: 'software',
    cancelUrl: 'https://vercel.com/account/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 100, max: 250 },
  },

  // ══════════════════════════════════════════════════════════════
  // EDUCAÇÃO (12 serviços)
  // ══════════════════════════════════════════════════════════════
  duolingo: {
    canonicalName: 'Duolingo Plus',
    aliases: ['duolingo', 'duolingo plus', 'duolingo.com', 'duolingo*'],
    billingDescriptors: ['GOOGLE*DUOLINGO', 'PAG*DUOLINGO'],
    category: 'education',
    cancelUrl: 'https://www.duolingo.com/settings/subscription',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse duolingo.com > Configuracoes > Assinatura > Cancelar. Se assinou via app, cancele pela loja.',
    typicalPriceRange: { min: 30, max: 65 },
    isPopular: true,
  },

  coursera: {
    canonicalName: 'Coursera Plus',
    aliases: ['coursera', 'coursera.org', 'coursera inc', 'coursera*'],
    billingDescriptors: ['COURSERA.ORG'],
    category: 'education',
    cancelUrl: 'https://www.coursera.org/account-settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 200 },
  },

  alura: {
    canonicalName: 'Alura',
    aliases: ['alura', 'alura.com.br', 'caelum alura', 'alura*'],
    billingDescriptors: ['PAG*ALURA', 'MERCPAGO*ALURA'],
    category: 'education',
    cancelUrl: 'https://www.alura.com.br/minha-conta',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse alura.com.br > Minha Conta > Assinatura > Cancelar renovacao automatica.',
    typicalPriceRange: { min: 60, max: 150 },
    isPopular: true,
  },

  udemy: {
    canonicalName: 'Udemy',
    aliases: ['udemy', 'udemy.com', 'udemy inc', 'udemy*'],
    billingDescriptors: ['UDEMY.COM'],
    category: 'education',
    cancelUrl: 'https://www.udemy.com/user/manage-subscriptions/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 100 },
  },

  skillshare: {
    canonicalName: 'Skillshare',
    aliases: ['skillshare', 'skillshare.com', 'skillshare inc', 'skillshare*'],
    billingDescriptors: ['SKILLSHARE.COM'],
    category: 'education',
    cancelUrl: 'https://www.skillshare.com/settings/payments',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 80 },
  },

  descomplica: {
    canonicalName: 'Descomplica',
    aliases: ['descomplica', 'descomplica.com.br', 'descomplica*'],
    billingDescriptors: ['PAG*DESCOMPLICA', 'MERCPAGO*DESCOMPLICA'],
    category: 'education',
    cancelUrl: 'https://descomplica.com.br/perfil',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 120 },
  },

  rocketseat: {
    canonicalName: 'Rocketseat',
    aliases: ['rocketseat', 'rocket seat', 'rocketseat.com.br'],
    billingDescriptors: ['PAG*ROCKETSEAT'],
    category: 'education',
    cancelUrl: 'https://app.rocketseat.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
  },

  linkedin: {
    canonicalName: 'LinkedIn Learning',
    aliases: [
      'linkedin', 'lnkd', 'linkedin premium', 'linkedin.com',
      'linkedin corporation', 'linkedin learning',
    ],
    billingDescriptors: ['LINKEDIN.COM'],
    category: 'education',
    cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 60, max: 200 },
  },

  estrategiaConcursos: {
    canonicalName: 'Estratégia Concursos',
    aliases: [
      'estrategia', 'estrategia concursos', 'estrategiaconcursos',
      'estrategia educacional', 'estrategia*',
    ],
    billingDescriptors: ['PAG*ESTRATEGIA', 'MERCPAGO*ESTRATEGIA'],
    category: 'education',
    cancelUrl: 'https://www.estrategiaconcursos.com.br/minha-conta/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 200 },
  },

  domestika: {
    canonicalName: 'Domestika',
    aliases: ['domestika', 'domestika.org', 'domestika*'],
    billingDescriptors: ['DOMESTIKA.ORG'],
    category: 'education',
    cancelUrl: 'https://www.domestika.org/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 60 },
  },

  hotmartClub: {
    canonicalName: 'Hotmart Club',
    aliases: ['hotmart', 'hotmart club', 'hotmart.com', 'hotmart*'],
    billingDescriptors: ['PAG*HOTMART', 'MERCPAGO*HOTMART'],
    category: 'education',
    cancelUrl: 'https://app.hotmart.com/club/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 200 },
  },

  babbel: {
    canonicalName: 'Babbel',
    aliases: ['babbel', 'babbel.com', 'babbel*'],
    billingDescriptors: ['GOOGLE*BABBEL', 'BABBEL.COM'],
    category: 'education',
    cancelUrl: 'https://my.babbel.com/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 70 },
  },

  masterclass: {
    canonicalName: 'MasterClass',
    aliases: ['masterclass', 'master class', 'masterclass.com', 'masterclass*'],
    billingDescriptors: ['MASTERCLASS.COM'],
    category: 'education',
    cancelUrl: 'https://www.masterclass.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 100 },
  },

  // ══════════════════════════════════════════════════════════════
  // FITNESS E BEM-ESTAR (9 serviços)
  // ══════════════════════════════════════════════════════════════
  smartFit: {
    canonicalName: 'Smart Fit',
    aliases: [
      'smart fit', 'smartfit', 'smartfit mensalidade', 'smart fit brasil',
      'academia smart', 'pg *smart fit', 'pg *smartfit', 'smartfit gym',
    ],
    billingDescriptors: [
      'PAG*SMARTFIT', 'PG *SMARTFIT', 'PG *SMART FIT', 'MERCPAGO*SMARTFIT',
    ],
    category: 'fitness',
    cancelMethod: 'phone',
    cancelInstructions: 'Compareca presencialmente a unidade mais proxima com documento de identidade. Nao e possivel cancelar online.',
    typicalPriceRange: { min: 80, max: 170 },
    isPopular: true,
  },

  gympass: {
    canonicalName: 'Wellhub (ex-Gympass)',
    aliases: [
      'gympass', 'wellhub', 'gym pass', 'wellhub.com', 'wellhub*', 'gympass*',
    ],
    billingDescriptors: [
      'PAG*GYMPASS', 'PAG*WELLHUB', 'MERCPAGO*GYMPASS', 'MERCPAGO*WELLHUB',
    ],
    category: 'fitness',
    cancelUrl: 'https://wellhub.com/pt-br/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse wellhub.com > Minha Conta > Plano > Cancelar plano. Cancelamento fica efetivo no proximo ciclo.',
    typicalPriceRange: { min: 50, max: 300 },
    isPopular: true,
  },

  totalpass: {
    canonicalName: 'TotalPass',
    aliases: ['totalpass', 'total pass', 'totalpass.com.br', 'totalpass*'],
    billingDescriptors: ['PAG*TOTALPASS', 'MERCPAGO*TOTALPASS'],
    category: 'fitness',
    cancelUrl: 'https://www.totalpass.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 80, max: 200 },
  },

  bluefit: {
    canonicalName: 'Bluefit',
    aliases: ['bluefit', 'blue fit', 'academia bluefit', 'bluefit*'],
    billingDescriptors: ['PAG*BLUEFIT'],
    category: 'fitness',
    cancelMethod: 'phone',
    cancelInstructions: 'Compareca presencialmente a unidade ou ligue para central de atendimento.',
    typicalPriceRange: { min: 60, max: 130 },
  },

  bodytech: {
    canonicalName: 'Bodytech',
    aliases: ['bodytech', 'body tech', 'bodytech company', 'bodytech*'],
    billingDescriptors: ['PAG*BODYTECH'],
    category: 'fitness',
    cancelMethod: 'phone',
    cancelInstructions: 'Compareca presencialmente a unidade com documento de identidade.',
    typicalPriceRange: { min: 150, max: 400 },
  },

  selfit: {
    canonicalName: 'Selfit',
    aliases: ['selfit', 'self fit', 'selfit academia', 'selfit*'],
    billingDescriptors: ['PAG*SELFIT'],
    category: 'fitness',
    cancelMethod: 'phone',
    cancelInstructions: 'Compareca presencialmente a unidade.',
    typicalPriceRange: { min: 70, max: 140 },
  },

  strava: {
    canonicalName: 'Strava',
    aliases: ['strava', 'strava.com', 'strava premium', 'strava*'],
    billingDescriptors: ['GOOGLE*STRAVA', 'STRAVA.COM'],
    category: 'fitness',
    cancelUrl: 'https://www.strava.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 50 },
  },

  calm: {
    canonicalName: 'Calm',
    aliases: ['calm', 'calm.com', 'calm app', 'calm*'],
    billingDescriptors: ['GOOGLE*CALM', 'CALM.COM'],
    category: 'fitness',
    cancelUrl: 'https://www.calm.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 60 },
  },

  headspace: {
    canonicalName: 'Headspace',
    aliases: ['headspace', 'headspace.com', 'headspace*'],
    billingDescriptors: ['GOOGLE*HEADSPACE', 'HEADSPACE.COM'],
    category: 'fitness',
    cancelUrl: 'https://www.headspace.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 60 },
  },

  nikeTraining: {
    canonicalName: 'Nike Training Club',
    aliases: ['nike training', 'nike training club', 'nike+', 'nike run club', 'nike*'],
    billingDescriptors: ['GOOGLE*NIKE', 'NIKE.COM'],
    category: 'fitness',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 0, max: 30 },
  },

  peloton: {
    canonicalName: 'Peloton',
    aliases: ['peloton', 'peloton digital', 'peloton*'],
    billingDescriptors: ['PELOTON.COM', 'GOOGLE*PELOTON'],
    category: 'fitness',
    cancelUrl: 'https://members.onepeloton.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 80 },
  },

  // ══════════════════════════════════════════════════════════════
  // DELIVERY E FOOD (6 serviços)
  // ══════════════════════════════════════════════════════════════
  ifood: {
    canonicalName: 'iFood Clube',
    aliases: [
      'ifood', 'ifood*club', 'ifood clube', 'if clube', 'ifood.com.br',
      'movile*ifood', 'pg *ifood', 'ifood assinatura', 'if *', 'ifood*',
    ],
    billingDescriptors: [
      'PAG*IFOOD', 'PG *IFOOD', 'MERCPAGO*IFOOD', 'MOVILE*IFOOD',
    ],
    category: 'food',
    cancelUrl: 'https://www.ifood.com.br/clube',
    cancelMethod: 'app',
    cancelInstructions: 'No app iFood: Menu > Clube iFood > Cancelar assinatura. Voce mantem acesso ate o fim do periodo.',
    typicalPriceRange: { min: 12, max: 30 },
    isPopular: true,
  },

  rappi: {
    canonicalName: 'Rappi Prime',
    aliases: ['rappi', 'rappi*', 'rappi prime', 'rappi.com.br'],
    billingDescriptors: ['PAG*RAPPI', 'MERCPAGO*RAPPI'],
    category: 'food',
    cancelMethod: 'app',
    cancelInstructions: 'No app Rappi: Perfil > Rappi Prime > Cancelar assinatura.',
    typicalPriceRange: { min: 10, max: 30 },
  },

  uberEats: {
    canonicalName: 'Uber Eats',
    aliases: ['uber eats', 'ubereats', 'uber*eats'],
    billingDescriptors: ['UBER*EATS'],
    category: 'food',
    cancelUrl: 'https://help.uber.com/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 15, max: 35 },
  },

  zeDaDelivery: {
    canonicalName: 'Zé Delivery',
    aliases: ['ze delivery', 'zedelivery', 'ambev ze', 'ze delivery'],
    billingDescriptors: ['PAG*ZEDELIVERY'],
    category: 'food',
    typicalPriceRange: { min: 10, max: 30 },
  },

  james: {
    canonicalName: 'James Delivery',
    aliases: ['james', 'james delivery', 'james*'],
    billingDescriptors: [],
    category: 'food',
    typicalPriceRange: { min: 10, max: 30 },
  },

  aiqfome: {
    canonicalName: 'Aiqfome',
    aliases: ['aiqfome', 'aiq fome', 'aiqfome*'],
    billingDescriptors: ['PAG*AIQFOME'],
    category: 'food',
    typicalPriceRange: { min: 10, max: 25 },
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSPORTE E MOBILIDADE (9 serviços)
  // ══════════════════════════════════════════════════════════════
  uber: {
    canonicalName: 'Uber',
    aliases: [
      'uber', 'uber*', 'uber do brasil', 'uber trip', 'uber pass', 'uberpass',
    ],
    billingDescriptors: ['UBER*TRIP', 'UBER*PASS', 'UBER DO BRASIL'],
    category: 'transport',
    cancelUrl: 'https://help.uber.com/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 20, max: 50 },
    isPopular: true,
  },

  uberOne: {
    canonicalName: 'Uber One',
    aliases: ['uber one', 'uberone', 'uber one br', 'uber assinatura'],
    billingDescriptors: ['UBER*ONE', 'UBER*UBERONE'],
    category: 'transport',
    cancelMethod: 'app',
    cancelInstructions: 'No app Uber: Menu > Uber One > Gerenciar assinatura > Cancelar.',
    typicalPriceRange: { min: 20, max: 35 },
    isPopular: true,
  },

  app99: {
    canonicalName: '99',
    aliases: ['99', '99app', '99*', '99 tecnologia', '99 pop', '99 taxi'],
    billingDescriptors: ['99*APP', '99 TECNOLOGIA'],
    category: 'transport',
    cancelMethod: 'app',
    cancelInstructions: 'Cancele pelo app 99.',
    typicalPriceRange: { min: 15, max: 40 },
  },

  waze: {
    canonicalName: 'Waze Carpool',
    aliases: ['waze', 'waze carpool', 'waze*'],
    billingDescriptors: [],
    category: 'transport',
    typicalPriceRange: { min: 10, max: 30 },
  },

  yellowBike: {
    canonicalName: 'Yellow/Grow',
    aliases: ['yellow', 'grow', 'yellow bike', 'grow mobility'],
    billingDescriptors: [],
    category: 'transport',
    typicalPriceRange: { min: 10, max: 30 },
  },

  semParar: {
    canonicalName: 'Sem Parar',
    aliases: [
      'sem parar', 'semparar', 'sem parar*', 'semparar.com.br',
    ],
    billingDescriptors: [
      'SEMPARAR', 'SEM PARAR', 'PAG*SEMPARAR',
    ],
    category: 'transport',
    cancelUrl: 'https://www.semparar.com.br/',
    cancelMethod: 'phone',
    cancelInstructions: 'Ligue 4003-7667 (capitais) ou 0800-770-7667 (demais). Solicite cancelamento e devolva o dispositivo em ponto de atendimento.',
    typicalPriceRange: { min: 15, max: 40 },
    isPopular: true,
  },

  conectCar: {
    canonicalName: 'ConectCar',
    aliases: ['conectcar', 'conect car', 'conectcar*'],
    billingDescriptors: ['CONECTCAR', 'PAG*CONECTCAR'],
    category: 'transport',
    cancelUrl: 'https://www.conectcar.com/',
    cancelMethod: 'phone',
    cancelInstructions: 'Ligue 4003-0706 (capitais) ou acesse conectcar.com > Minha Conta > Cancelar.',
    typicalPriceRange: { min: 15, max: 35 },
  },

  veloe: {
    canonicalName: 'Veloe',
    aliases: ['veloe', 'veloe*', 'veloe.com.br'],
    billingDescriptors: ['VELOE', 'PAG*VELOE'],
    category: 'transport',
    cancelUrl: 'https://www.veloe.com.br/',
    cancelMethod: 'phone',
    cancelInstructions: 'Ligue 3003-3844 (capitais) ou 0800-771-3844. Solicite cancelamento.',
    typicalPriceRange: { min: 15, max: 35 },
  },

  taggy: {
    canonicalName: 'Taggy',
    aliases: ['taggy', 'taggy*', 'taggy.com.br'],
    billingDescriptors: ['TAGGY', 'PAG*TAGGY'],
    category: 'transport',
    cancelUrl: 'https://www.taggy.com.br/',
    cancelMethod: 'phone',
    typicalPriceRange: { min: 15, max: 35 },
  },

  // ══════════════════════════════════════════════════════════════
  // TELECOM (8 serviços — re-categorizados de 'other')
  // ══════════════════════════════════════════════════════════════
  claro: {
    canonicalName: 'Claro',
    aliases: [
      'claro', 'net', 'claro net', 'clarotv', 'claro*', 'net servicos', 'claro s.a',
    ],
    billingDescriptors: ['CLARO S.A', 'NET SERVICOS', 'CLARO NET'],
    category: 'telecom',
    cancelUrl: 'https://www.claro.com.br/',
    cancelMethod: 'telecom',
    cancelInstructions: 'Ligue 10621 (fixo/movel Claro) ou 106 21 (outras operadoras). Cancele via Minha Claro ou chat no site.',
    typicalPriceRange: { min: 80, max: 400 },
    isPopular: true,
  },

  vivo: {
    canonicalName: 'Vivo',
    aliases: [
      'vivo', 'telefonica vivo', 'vivo*', 'vivo fibra', 'vivo tv', 'telefonica',
    ],
    billingDescriptors: ['TELEFONICA VIVO', 'VIVO S.A'],
    category: 'telecom',
    cancelUrl: 'https://www.vivo.com.br/',
    cancelMethod: 'telecom',
    cancelInstructions: 'Ligue 10315 ou acesse Meu Vivo no app/site. Para cancelamento total, ligue e solicite.',
    typicalPriceRange: { min: 80, max: 400 },
    isPopular: true,
  },

  tim: {
    canonicalName: 'TIM',
    aliases: ['tim', 'tim*', 'tim brasil', 'tim sa', 'tim celular'],
    billingDescriptors: ['TIM S.A', 'TIM CELULAR'],
    category: 'telecom',
    cancelUrl: 'https://www.tim.com.br/',
    cancelMethod: 'telecom',
    typicalPriceRange: { min: 50, max: 200 },
  },

  oi: {
    canonicalName: 'Oi',
    aliases: ['oi', 'oi*', 'oi fibra', 'oi velox', 'telemar'],
    billingDescriptors: ['OI S.A', 'TELEMAR'],
    category: 'telecom',
    cancelUrl: 'https://www.oi.com.br/',
    cancelMethod: 'telecom',
    typicalPriceRange: { min: 80, max: 300 },
  },

  nioFibra: {
    canonicalName: 'NIO Fibra',
    aliases: [
      'nio fibra', 'nio', 'pg *nio fibra', 'pg *nio', 'pg*nio fibra',
      'nio internet', 'nio telecom', 'nio*', 'niofibra',
    ],
    billingDescriptors: ['PG *NIO FIBRA', 'PG *NIO', 'PAG*NIOFIBRA'],
    category: 'telecom',
    typicalPriceRange: { min: 70, max: 200 },
  },

  brisanet: {
    canonicalName: 'Brisanet',
    aliases: ['brisanet', 'brisa net', 'brisanet*'],
    billingDescriptors: ['BRISANET'],
    category: 'telecom',
    typicalPriceRange: { min: 60, max: 150 },
  },

  algar: {
    canonicalName: 'Algar Telecom',
    aliases: ['algar', 'algar telecom', 'ctbc', 'algar*'],
    billingDescriptors: ['ALGAR TELECOM', 'CTBC'],
    category: 'telecom',
    typicalPriceRange: { min: 80, max: 250 },
  },

  desktop: {
    canonicalName: 'Desktop (ISP)',
    aliases: ['desktop', 'desktop internet', 'desktop*'],
    billingDescriptors: ['DESKTOP INTERNET'],
    category: 'telecom',
    typicalPriceRange: { min: 60, max: 150 },
  },

  // ══════════════════════════════════════════════════════════════
  // NOTÍCIAS E MÍDIA (9 serviços)
  // ══════════════════════════════════════════════════════════════
  uol: {
    canonicalName: 'UOL',
    aliases: ['uol', 'uol*', 'uol assinatura', 'folha uol'],
    billingDescriptors: ['UOL ASSINATURA', 'UOL S.A'],
    category: 'news',
    cancelUrl: 'https://conta.uol.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 50 },
  },

  folha: {
    canonicalName: 'Folha de S.Paulo',
    aliases: [
      'folha', 'folha de sao paulo', 'folha sp', 'folha.uol', 'folhasp',
    ],
    billingDescriptors: ['FOLHA DE S.PAULO', 'PAG*FOLHA'],
    category: 'news',
    cancelUrl: 'https://login.folha.uol.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 60 },
  },

  estadao: {
    canonicalName: 'Estadão',
    aliases: [
      'estadao', 'estadao', 'o estado de sao paulo', 'estado sao paulo', 'estadao*',
    ],
    billingDescriptors: ['ESTADAO', 'PAG*ESTADAO'],
    category: 'news',
    cancelUrl: 'https://assinatura.estadao.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 60 },
  },

  oglobo: {
    canonicalName: 'O Globo',
    aliases: ['o globo', 'oglobo', 'globo.com', 'infoglobo', 'oglobo*'],
    billingDescriptors: ['INFOGLOBO', 'PAG*OGLOBO'],
    category: 'news',
    cancelUrl: 'https://assinatura.oglobo.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 60 },
  },

  valor: {
    canonicalName: 'Valor Econômico',
    aliases: ['valor', 'valor economico', 'valor economico', 'valor*'],
    billingDescriptors: ['VALOR ECONOMICO'],
    category: 'news',
    cancelUrl: 'https://www.valor.com.br/assine',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 80 },
  },

  medium: {
    canonicalName: 'Medium',
    aliases: ['medium', 'medium.com', 'medium inc', 'medium*'],
    billingDescriptors: ['MEDIUM.COM'],
    category: 'news',
    cancelUrl: 'https://medium.com/me/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 30 },
  },

  exame: {
    canonicalName: 'Exame',
    aliases: ['exame', 'exame.com', 'abril exame', 'exame*'],
    billingDescriptors: ['PAG*EXAME'],
    category: 'news',
    cancelUrl: 'https://exame.com/assine/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 50 },
  },

  kindleUnlimited: {
    canonicalName: 'Kindle Unlimited',
    aliases: [
      'kindle unlimited', 'kindle', 'kindle*', 'amzn kindle',
      'amazon kindle', 'kindle unlimited br',
    ],
    billingDescriptors: ['AMZN*KINDLE', 'AMAZON KINDLE'],
    category: 'news',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 40 },
  },

  veja: {
    canonicalName: 'Veja',
    aliases: ['veja', 'veja.abril', 'abril veja', 'veja*'],
    billingDescriptors: ['ABRIL*VEJA', 'PAG*VEJA'],
    category: 'news',
    cancelUrl: 'https://www.abril.com.br/assinatura/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 50 },
  },

  nytimes: {
    canonicalName: 'The New York Times',
    aliases: ['nytimes', 'new york times', 'nyt', 'nytimes.com', 'nytimes*'],
    billingDescriptors: ['NYTIMES.COM'],
    category: 'news',
    cancelUrl: 'https://myaccount.nytimes.com/seg/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 60 },
  },

  economist: {
    canonicalName: 'The Economist',
    aliases: ['economist', 'the economist', 'economist.com', 'economist*'],
    billingDescriptors: ['ECONOMIST.COM'],
    category: 'news',
    cancelUrl: 'https://myaccount.economist.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 100 },
  },

  // ══════════════════════════════════════════════════════════════
  // SEGURANÇA / VPN (8 serviços)
  // ══════════════════════════════════════════════════════════════
  nordvpn: {
    canonicalName: 'NordVPN',
    aliases: ['nordvpn', 'nord vpn', 'nordsec', 'nordvpn*', 'nord security'],
    billingDescriptors: [
      'NORDVPN.COM', 'PAG*NORDVPN', 'GOOGLE*NORDVPN', 'MERCPAGO*NORDVPN',
    ],
    category: 'security',
    cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse my.nordaccount.com > Dashboard > NordVPN > Cancelar renovacao automatica.',
    typicalPriceRange: { min: 15, max: 60 },
    isPopular: true,
  },

  surfshark: {
    canonicalName: 'Surfshark',
    aliases: ['surfshark', 'surfshark.com', 'surfshark*'],
    billingDescriptors: ['SURFSHARK.COM', 'PAG*SURFSHARK'],
    category: 'security',
    cancelUrl: 'https://my.surfshark.com/account/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 12, max: 50 },
  },

  norton: {
    canonicalName: 'Norton',
    aliases: [
      'norton', 'norton antivirus', 'norton 360', 'norton lifelock',
      'nortonlifelock', 'norton*',
    ],
    billingDescriptors: ['NORTON*360', 'NORTONLIFELOCK'],
    category: 'security',
    cancelUrl: 'https://my.norton.com/extspa/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 150 },
  },

  mcafee: {
    canonicalName: 'McAfee',
    aliases: ['mcafee', 'mcafee total', 'mcafee*'],
    billingDescriptors: ['MCAFEE.COM', 'MCAFEE*TOTAL'],
    category: 'security',
    cancelUrl: 'https://home.mcafee.com/root/myaccount.aspx',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 120 },
  },

  kaspersky: {
    canonicalName: 'Kaspersky',
    aliases: ['kaspersky', 'kaspersky total', 'kaspersky*'],
    billingDescriptors: ['KASPERSKY.COM'],
    category: 'security',
    cancelUrl: 'https://my.kaspersky.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 120 },
  },

  expressVpn: {
    canonicalName: 'ExpressVPN',
    aliases: ['expressvpn', 'express vpn', 'expressvpn*'],
    billingDescriptors: ['EXPRESSVPN.COM'],
    category: 'security',
    cancelUrl: 'https://www.expressvpn.com/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 70 },
  },

  avast: {
    canonicalName: 'Avast',
    aliases: ['avast', 'avast premium', 'avast antivirus', 'avast*'],
    billingDescriptors: ['AVAST.COM'],
    category: 'security',
    cancelUrl: 'https://my.avast.com/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 100 },
  },

  bitdefender: {
    canonicalName: 'Bitdefender',
    aliases: ['bitdefender', 'bitdefender total', 'bitdefender*'],
    billingDescriptors: ['BITDEFENDER.COM'],
    category: 'security',
    cancelUrl: 'https://central.bitdefender.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 120 },
  },

  // ══════════════════════════════════════════════════════════════
  // DATING (5 serviços)
  // ══════════════════════════════════════════════════════════════
  tinder: {
    canonicalName: 'Tinder',
    aliases: [
      'tinder', 'tinder gold', 'tinder plus', 'tinder platinum',
      'match group tinder', 'tinder*',
    ],
    billingDescriptors: [
      'GOOGLE*TINDER', 'PAG*TINDER', 'TINDER.COM', 'MATCH GROUP',
    ],
    category: 'dating',
    cancelMethod: 'platform',
    cancelInstructions: 'Se assinou via Google Play: Play Store > Assinaturas > Tinder > Cancelar. Via App Store: Ajustes > Assinaturas > Tinder > Cancelar.',
    typicalPriceRange: { min: 20, max: 100 },
    isPopular: true,
  },

  bumble: {
    canonicalName: 'Bumble',
    aliases: ['bumble', 'bumble premium', 'bumble boost', 'bumble*'],
    billingDescriptors: ['GOOGLE*BUMBLE', 'BUMBLE.COM'],
    category: 'dating',
    cancelMethod: 'platform',
    cancelInstructions: 'Cancele via loja de apps (Google Play ou App Store) > Assinaturas > Bumble > Cancelar.',
    typicalPriceRange: { min: 30, max: 100 },
  },

  happn: {
    canonicalName: 'Happn',
    aliases: ['happn', 'happn premium', 'happn*'],
    billingDescriptors: ['GOOGLE*HAPPN', 'HAPPN.COM'],
    category: 'dating',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 25, max: 80 },
  },

  badoo: {
    canonicalName: 'Badoo',
    aliases: ['badoo', 'badoo premium', 'badoo*'],
    billingDescriptors: ['GOOGLE*BADOO', 'BADOO.COM'],
    category: 'dating',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 15, max: 60 },
  },

  grindr: {
    canonicalName: 'Grindr',
    aliases: ['grindr', 'grindr xtra', 'grindr unlimited', 'grindr*'],
    billingDescriptors: ['GOOGLE*GRINDR', 'GRINDR.COM'],
    category: 'dating',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 20, max: 80 },
  },

  okcupid: {
    canonicalName: 'OkCupid',
    aliases: ['okcupid', 'ok cupid', 'okcupid premium', 'okcupid*'],
    billingDescriptors: ['GOOGLE*OKCUPID', 'MATCH GROUP*OKCUPID'],
    category: 'dating',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 25, max: 80 },
  },

  hinge: {
    canonicalName: 'Hinge',
    aliases: ['hinge', 'hinge preferred', 'hinge*'],
    billingDescriptors: ['GOOGLE*HINGE', 'MATCH GROUP*HINGE'],
    category: 'dating',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 25, max: 90 },
  },

  // ══════════════════════════════════════════════════════════════
  // FINANÇAS (8 serviços)
  // ══════════════════════════════════════════════════════════════
  picpay: {
    canonicalName: 'PicPay',
    aliases: [
      'picpay', 'picpay card', 'pic pay', 'picpay*', 'pg *picpay',
    ],
    billingDescriptors: ['PG *PICPAY', 'PAG*PICPAY'],
    category: 'finance',
    cancelUrl: 'https://www.picpay.com/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 5, max: 50 },
    isPopular: true,
  },

  mercadoPago: {
    canonicalName: 'Mercado Pago',
    aliases: [
      'mercado pago', 'mercadopago', 'mercado*', 'mp *', 'mercado livre', 'meli',
    ],
    billingDescriptors: ['MERCPAGO*', 'MERPAGO*', 'MP *'],
    category: 'finance',
    cancelUrl: 'https://www.mercadopago.com.br/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 5, max: 100 },
    isPopular: true,
  },

  nubank: {
    canonicalName: 'Nubank',
    aliases: ['nubank', 'nu pagamentos', 'nubank*', 'nu *'],
    billingDescriptors: ['NU PAGAMENTOS'],
    category: 'finance',
    cancelUrl: 'https://www.nubank.com.br/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 0, max: 50 },
    isPopular: true,
  },

  pagbank: {
    canonicalName: 'PagBank',
    aliases: [
      'pagbank', 'pagseguro', 'pag seguro', 'pagbank*', 'pagseguro*', 'pag *',
    ],
    billingDescriptors: ['PAGSEGURO', 'PAG*'],
    category: 'finance',
    cancelUrl: 'https://www.pagbank.com.br/',
    cancelMethod: 'app',
    typicalPriceRange: { min: 5, max: 50 },
  },

  ame: {
    canonicalName: 'Ame Digital',
    aliases: ['ame', 'ame digital', 'americanas ame', 'ame*'],
    billingDescriptors: ['AME DIGITAL'],
    category: 'finance',
    typicalPriceRange: { min: 5, max: 30 },
  },

  recargaPay: {
    canonicalName: 'RecargaPay',
    aliases: ['recargapay', 'recarga pay', 'recargapay*'],
    billingDescriptors: ['RECARGAPAY'],
    category: 'finance',
    typicalPriceRange: { min: 5, max: 30 },
  },

  serasaPremium: {
    canonicalName: 'Serasa Premium',
    aliases: [
      'serasa', 'serasa premium', 'serasa experian', 'serasa*',
    ],
    billingDescriptors: ['PAG*SERASA', 'MERCPAGO*SERASA', 'SERASA EXPERIAN'],
    category: 'finance',
    cancelUrl: 'https://www.serasa.com.br/premium/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 50 },
  },

  meliPlus: {
    canonicalName: 'Meli+ (Mercado Livre+)',
    aliases: [
      'meli+', 'meli plus', 'mercado livre+', 'mercado livre plus',
      'nivel 6 mercado livre',
    ],
    billingDescriptors: ['MERCPAGO*MELI', 'MERCPAGO*MELIPLUS'],
    category: 'finance',
    cancelUrl: 'https://www.mercadolivre.com.br/assinaturas/meli-plus',
    cancelMethod: 'web',
    typicalPriceRange: { min: 18, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // E-COMMERCE E OUTROS (5 serviços)
  // ══════════════════════════════════════════════════════════════
  amazon: {
    canonicalName: 'Amazon',
    aliases: ['amazon', 'amzn', 'amazon.com.br', 'amazon*', 'amz *'],
    billingDescriptors: ['AMZN*', 'AMAZON.COM.BR'],
    category: 'other',
    cancelUrl: 'https://www.amazon.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 200 },
    isPopular: true,
  },

  shopee: {
    canonicalName: 'Shopee',
    aliases: ['shopee', 'shopee*', 'shopee brasil'],
    billingDescriptors: ['SHOPEE BRASIL'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 50 },
  },

  aliexpress: {
    canonicalName: 'AliExpress',
    aliases: ['aliexpress', 'ali express', 'aliexpress*', 'alibaba'],
    billingDescriptors: ['ALIEXPRESS.COM', 'ALIBABA.COM'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 100 },
  },

  magalu: {
    canonicalName: 'Magazine Luiza',
    aliases: ['magalu', 'magazine luiza', 'magalu*', 'luiza'],
    billingDescriptors: ['MAGALU', 'MAGAZINE LUIZA'],
    category: 'other',
    typicalPriceRange: { min: 10, max: 100 },
  },

  shein: {
    canonicalName: 'Shein',
    aliases: ['shein', 'shein.com', 'shein*'],
    billingDescriptors: ['SHEIN.COM'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 100 },
  },

  temu: {
    canonicalName: 'Temu',
    aliases: ['temu', 'temu.com', 'temu*'],
    billingDescriptors: ['TEMU.COM'],
    category: 'other',
    typicalPriceRange: { min: 5, max: 100 },
  },

  kwai: {
    canonicalName: 'Kwai',
    aliases: ['kwai', 'kwai+', 'kwai*'],
    billingDescriptors: ['GOOGLE*KWAI'],
    category: 'other',
    typicalPriceRange: { min: 0, max: 30 },
  },
} as const;
