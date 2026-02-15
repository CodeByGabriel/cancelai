/**
 * Base de dados de serviços conhecidos — 350+ serviços brasileiros
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
  // STREAMING DE VÍDEO (34 serviços)
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
    aliases: ['star+', 'star plus', 'starplus', 'star streaming', 'star*', 'disney*star'],
    billingDescriptors: ['PAG*STARPLUS', 'GOOGLE*STARPLUS', 'DISNEY*STAR'],
    category: 'streaming',
    cancelUrl: 'https://www.disneyplus.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 56 },
    status: 'merged',
    mergedInto: 'disneyPlus',
    currency: 'BRL',
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
    billingDescriptors: ['GOOGLE*MUBI', 'PAG*MUBI', 'AMZN*MUBI'],
    category: 'streaming',
    cancelUrl: 'https://mubi.com/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 22, max: 35 },
    currency: 'BRL',
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
    billingDescriptors: ['PAG*LOOKE', 'LOOKE', 'AMZN*LOOKE'],
    category: 'streaming',
    cancelUrl: 'https://www.looke.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 30 },
    currency: 'BRL',
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
      'GLOBO*PREMIERE', 'GLOBOPLAY*PREMIERE',
    ],
    category: 'streaming',
    cancelUrl: 'https://globoplay.globo.com/minha-conta/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 90 },
    currency: 'BRL',
  },

  dazn: {
    canonicalName: 'DAZN',
    aliases: ['dazn', 'dazn.com', 'dazn group', 'dazn*'],
    billingDescriptors: [
      'PAG*DAZN', 'GOOGLE*DAZN', 'MERCPAGO*DAZN', 'DAZN',
    ],
    category: 'streaming',
    cancelUrl: 'https://www.dazn.com/pt-BR/account',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse dazn.com > Minha conta > Cancelar assinatura.',
    typicalPriceRange: { min: 20, max: 60 },
    isPopular: true,
    currency: 'BRL',
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
    billingDescriptors: ['PAG*OLDFLIX', 'OLDFLIX'],
    category: 'streaming',
    cancelUrl: 'https://www.oldflix.com.br/minha-conta',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 20 },
    currency: 'BRL',
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

  playPlus: {
    canonicalName: 'PlayPlus',
    aliases: ['playplus', 'play plus', 'record playplus', 'playplus*'],
    billingDescriptors: ['PLAYPLUS', 'RECORD*PLAYPLUS'],
    category: 'streaming',
    typicalPriceRange: { min: 15, max: 19 },
    currency: 'BRL',
  },

  universalPlus: {
    canonicalName: 'Universal+',
    aliases: ['universal+', 'universal plus', 'universalplus'],
    billingDescriptors: ['AMZN*UNIVERSAL', 'UNIVERSAL+'],
    category: 'streaming',
    typicalPriceRange: { min: 25, max: 30 },
    currency: 'BRL',
    platformBilled: 'amazon',
  },

  mgmPlus: {
    canonicalName: 'MGM+',
    aliases: ['mgm+', 'mgm plus', 'mgmplus'],
    billingDescriptors: ['AMZN*MGM', 'MGM+'],
    category: 'streaming',
    typicalPriceRange: { min: 15, max: 20 },
    currency: 'BRL',
    platformBilled: 'amazon',
  },

  belasArtes: {
    canonicalName: 'Belas Artes a La Carte',
    aliases: ['belas artes', 'belas artes a la carte', 'belasartes'],
    billingDescriptors: ['BELAS ARTES'],
    category: 'streaming',
    typicalPriceRange: { min: 10, max: 13 },
    currency: 'BRL',
  },

  darkflix: {
    canonicalName: 'Darkflix',
    aliases: ['darkflix', 'darkflix.com.br'],
    billingDescriptors: ['DARKFLIX'],
    category: 'streaming',
    typicalPriceRange: { min: 8, max: 10 },
    currency: 'BRL',
  },

  reservaImovision: {
    canonicalName: 'Reserva Imovision',
    aliases: ['imovision', 'reserva imovision'],
    billingDescriptors: ['IMOVISION', 'AMZN*IMOVISION'],
    category: 'streaming',
    typicalPriceRange: { min: 20, max: 25 },
    currency: 'BRL',
  },

  combate: {
    canonicalName: 'Combate',
    aliases: ['combate', 'globo combate', 'ufc combate'],
    billingDescriptors: ['GLOBO*COMBATE'],
    category: 'streaming',
    typicalPriceRange: { min: 40, max: 50 },
    currency: 'BRL',
  },

  nbaLeaguePass: {
    canonicalName: 'NBA League Pass',
    aliases: ['nba league pass', 'nba leaguepass', 'nba*'],
    billingDescriptors: ['NBA*LEAGUEPASS', 'AMZN*NBA'],
    category: 'streaming',
    typicalPriceRange: { min: 80, max: 160 },
    currency: 'USD',
    iofApplicable: true,
  },

  f1TvPro: {
    canonicalName: 'F1 TV Pro',
    aliases: ['f1 tv', 'f1tv', 'f1 tv pro', 'formula 1 tv'],
    billingDescriptors: ['F1TV', 'FORMULA1*'],
    category: 'streaming',
    typicalPriceRange: { min: 34, max: 57 },
    currency: 'USD',
    iofApplicable: true,
  },

  nsports: {
    canonicalName: 'NSports',
    aliases: ['nsports', 'nsports.com.br'],
    billingDescriptors: ['NSPORTS'],
    category: 'streaming',
    typicalPriceRange: { min: 15, max: 20 },
    currency: 'BRL',
  },

  hidive: {
    canonicalName: 'HIDIVE',
    aliases: ['hidive', 'sentai hidive', 'sentai filmworks'],
    billingDescriptors: ['HIDIVE', 'SENTAI*HIDIVE'],
    category: 'streaming',
    typicalPriceRange: { min: 28, max: 30 },
    currency: 'USD',
    iofApplicable: true,
  },

  playKids: {
    canonicalName: 'PlayKids+',
    aliases: ['playkids', 'playkids+', 'play kids'],
    billingDescriptors: ['GOOGLE*PLAYKIDS'],
    category: 'streaming',
    typicalPriceRange: { min: 25, max: 30 },
    currency: 'BRL',
    platformBilled: 'google',
  },

  luccasToon: {
    canonicalName: 'Luccas Toon',
    aliases: ['luccas toon', 'luccastoon', 'luccas neto'],
    billingDescriptors: ['GOOGLE*LUCCAS TOON', 'GOOGLE*ZeroUm'],
    category: 'streaming',
    typicalPriceRange: { min: 25, max: 35 },
    currency: 'BRL',
    platformBilled: 'google',
  },

  lingokids: {
    canonicalName: 'Lingokids',
    aliases: ['lingokids', 'lingo kids'],
    billingDescriptors: ['GOOGLE*Lingokids'],
    category: 'streaming',
    typicalPriceRange: { min: 40, max: 50 },
    currency: 'BRL',
    platformBilled: 'google',
  },

  rakutenViki: {
    canonicalName: 'Rakuten Viki',
    aliases: ['rakuten viki', 'viki', 'rakutenviki'],
    billingDescriptors: ['RAKUTEN VIKI'],
    category: 'streaming',
    typicalPriceRange: { min: 15, max: 19 },
    currency: 'BRL/USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // MÚSICA E ÁUDIO (13 serviços)
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
    billingDescriptors: ['AMZN*MUSIC', 'Amazon*Music'],
    category: 'music',
    cancelUrl: 'https://www.amazon.com.br/hz/mycd/myx',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 35 },
    currency: 'BRL',
  },

  audible: {
    canonicalName: 'Audible',
    aliases: ['audible', 'audible.com', 'audible*', 'amazon audible'],
    billingDescriptors: ['AMZN*AUDIBLE', 'AUDIBLE'],
    category: 'music',
    cancelUrl: 'https://www.audible.com/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 50 },
    currency: 'BRL',
  },

  soundcloud: {
    canonicalName: 'SoundCloud Go+',
    aliases: ['soundcloud', 'soundcloud go', 'soundcloud go+', 'soundcloud*'],
    billingDescriptors: ['GOOGLE*SOUNDCLOUD', 'PAG*SOUNDCLOUD', 'SOUNDCLOUD*'],
    category: 'music',
    cancelUrl: 'https://soundcloud.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 17, max: 35 },
    currency: 'BRL/USD',
    iofApplicable: true,
  },

  napsterClaroMusica: {
    canonicalName: 'Napster / Claro Musica',
    aliases: ['napster', 'claro musica', 'claro*musica', 'claromusica'],
    billingDescriptors: ['CLARO*MUSICA', 'NAPSTER'],
    category: 'music',
    typicalPriceRange: { min: 15, max: 17 },
    currency: 'BRL',
  },

  storytel: {
    canonicalName: 'Storytel',
    aliases: ['storytel', 'storytel ab', 'storytel.com'],
    billingDescriptors: ['STORYTEL', 'STORYTEL AB'],
    category: 'music',
    typicalPriceRange: { min: 17, max: 20 },
    currency: 'BRL',
  },

  tocalivros: {
    canonicalName: 'Tocalivros',
    aliases: ['tocalivros', 'tocalivros.com'],
    billingDescriptors: ['TOCALIVROS'],
    category: 'music',
    typicalPriceRange: { min: 17, max: 20 },
    currency: 'BRL',
  },

  skeelo: {
    canonicalName: 'Skeelo',
    aliases: ['skeelo', 'gold360', 'skeelo*'],
    billingDescriptors: ['SKEELO', 'GOLD360'],
    category: 'music',
    typicalPriceRange: { min: 20, max: 24 },
    currency: 'BRL',
  },

  ubook: {
    canonicalName: 'Ubook',
    aliases: ['ubook', 'ubook.com'],
    billingDescriptors: ['UBOOK'],
    category: 'music',
    typicalPriceRange: { min: 25, max: 30 },
    currency: 'BRL',
  },

  // ══════════════════════════════════════════════════════════════
  // GAMING (17 serviços)
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
    aliases: ['epic games', 'epic*', 'fortnite', 'epicgames', 'fortnite crew'],
    billingDescriptors: ['EPICGAMES.COM', 'EPIC GAMES*FORTNITE'],
    category: 'gaming',
    cancelUrl: 'https://www.epicgames.com/account/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 70 },
    currency: 'BRL/USD',
    iofApplicable: true,
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
      'abya', 'abya tecnologia',
    ],
    billingDescriptors: ['PAG*GEFORCENOW', 'GOOGLE*GEFORCENOW', 'ABYA', 'ABYA TECNOLOGIA'],
    category: 'gaming',
    cancelUrl: 'https://www.nvidia.com/pt-br/geforce-now/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 230 },
    currency: 'BRL',
  },

  roblox: {
    canonicalName: 'Roblox Premium',
    aliases: ['roblox', 'roblox premium', 'roblox*'],
    billingDescriptors: ['GOOGLE*ROBLOX', 'ROBLOX.COM'],
    category: 'gaming',
    cancelUrl: 'https://www.roblox.com/my/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 100 },
    currency: 'BRL',
    platformBilled: 'google',
  },

  appleArcade: {
    canonicalName: 'Apple Arcade',
    aliases: ['apple arcade', 'applearcade'],
    billingDescriptors: [],
    category: 'gaming',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 8, max: 10 },
    currency: 'BRL',
    platformBilled: 'apple',
  },

  googlePlayPass: {
    canonicalName: 'Google Play Pass',
    aliases: ['google play pass', 'play pass', 'playpass'],
    billingDescriptors: ['GOOGLE*Play Pass'],
    category: 'gaming',
    cancelMethod: 'platform',
    typicalPriceRange: { min: 8, max: 10 },
    currency: 'BRL',
    platformBilled: 'google',
  },

  worldOfWarcraft: {
    canonicalName: 'World of Warcraft',
    aliases: ['world of warcraft', 'wow', 'blizzard wow', 'warcraft'],
    billingDescriptors: ['BLIZZARD ENTERTAINMENT', 'BLIZZARD*WOW'],
    category: 'gaming',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 29 },
    currency: 'BRL',
  },

  finalFantasyXiv: {
    canonicalName: 'Final Fantasy XIV',
    aliases: ['final fantasy xiv', 'ffxiv', 'final fantasy 14', 'ff14'],
    billingDescriptors: ['SQUARE ENIX', 'SQEX*FFXIV'],
    category: 'gaming',
    cancelMethod: 'web',
    typicalPriceRange: { min: 29, max: 39 },
    currency: 'BRL/USD',
    iofApplicable: true,
  },

  minecraftRealms: {
    canonicalName: 'Minecraft Realms',
    aliases: ['minecraft realms', 'minecraft', 'mojang realms'],
    billingDescriptors: ['MICROSOFT*MINECRAFT', 'MOJANG*REALMS'],
    category: 'gaming',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 30 },
    currency: 'BRL',
  },

  runescape: {
    canonicalName: 'RuneScape',
    aliases: ['runescape', 'jagex', 'old school runescape', 'osrs'],
    billingDescriptors: ['JAGEX*RUNESCAPE'],
    category: 'gaming',
    cancelMethod: 'web',
    typicalPriceRange: { min: 60, max: 70 },
    currency: 'USD',
    iofApplicable: true,
  },

  humbleChoice: {
    canonicalName: 'Humble Choice',
    aliases: ['humble bundle', 'humble choice', 'humblebundle'],
    billingDescriptors: ['HUMBLE BUNDLE', 'HUMBLEBUNDLE.COM'],
    category: 'gaming',
    cancelMethod: 'web',
    typicalPriceRange: { min: 60, max: 70 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // SOFTWARE E PRODUTIVIDADE (79 serviços — inclui AI, dev tools, design, business, creative assets)
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
      'CANVA', 'CANVA PTY',
    ],
    category: 'software',
    cancelUrl: 'https://www.canva.com/settings/billing',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse canva.com > Configuracoes > Cobranca e planos > Cancelar assinatura.',
    typicalPriceRange: { min: 35, max: 240 },
    isPopular: true,
    currency: 'BRL',
  },

  notion: {
    canonicalName: 'Notion',
    aliases: ['notion', 'notion.so', 'notion labs', 'notion*', 'notion ai'],
    billingDescriptors: ['NOTION.SO', 'NOTION LABS', 'STRIPE*NOTION'],
    category: 'software',
    cancelUrl: 'https://www.notion.so/my-account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 85 },
    currency: 'USD',
    iofApplicable: true,
  },

  figma: {
    canonicalName: 'Figma',
    aliases: ['figma', 'figma.com', 'figma inc', 'figma*'],
    billingDescriptors: ['FIGMA.COM', 'FIGMA ANNUAL RENEWAL'],
    category: 'software',
    cancelUrl: 'https://www.figma.com/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  slack: {
    canonicalName: 'Slack',
    aliases: ['slack', 'slack.com', 'slack technologies', 'slack*'],
    billingDescriptors: ['SLACK.COM', 'SLACK TECHNOLOGIES'],
    category: 'software',
    cancelUrl: 'https://slack.com/account/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 80 },
    currency: 'USD',
    iofApplicable: true,
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
    currency: 'USD',
    iofApplicable: true,
  },

  chatgpt: {
    canonicalName: 'ChatGPT Plus',
    aliases: [
      'openai', 'chatgpt', 'chatgpt plus', 'openai.com', 'openai*', 'chat gpt',
    ],
    billingDescriptors: ['OPENAI*CHATGPT', 'OPENAI.COM', 'OPENAI', 'OPENAI *CHATGPT PLUS'],
    category: 'software',
    cancelUrl: 'https://chat.openai.com/settings/subscription',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse chat.openai.com > Configuracoes > Assinatura > Cancelar plano.',
    typicalPriceRange: { min: 100, max: 120 },
    isPopular: true,
    currency: 'BRL/USD',
    iofApplicable: true,
  },

  claude: {
    canonicalName: 'Claude Pro',
    aliases: ['anthropic', 'claude', 'claude pro', 'anthropic.com', 'claude*'],
    billingDescriptors: ['ANTHROPIC.COM', 'ANTHROPIC', 'STRIPE*ANTHROPIC'],
    category: 'software',
    cancelUrl: 'https://claude.ai/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 90, max: 120 },
    currency: 'USD',
    iofApplicable: true,
  },

  grammarly: {
    canonicalName: 'Grammarly',
    aliases: ['grammarly', 'grammarly.com', 'grammarly inc', 'grammarly*'],
    billingDescriptors: ['GRAMMARLY.COM', 'GRAMMARLY INC'],
    category: 'software',
    cancelUrl: 'https://account.grammarly.com/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  lastpass: {
    canonicalName: 'LastPass',
    aliases: ['lastpass', 'lastpass.com', 'lastpass premium', 'lastpass*'],
    billingDescriptors: ['LASTPASS.COM', 'LASTPASS', 'LOGMEIN'],
    category: 'software',
    cancelUrl: 'https://lastpass.com/account.php',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 40 },
    currency: 'USD',
    iofApplicable: true,
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
    billingDescriptors: ['PCLOUD.COM', 'PCLOUD AG'],
    category: 'software',
    cancelUrl: 'https://www.pcloud.com/settings/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 300 },
    currency: 'EUR/USD',
    iofApplicable: true,
    annualOnly: true,
  },

  jetbrains: {
    canonicalName: 'JetBrains',
    aliases: [
      'jetbrains', 'intellij', 'webstorm', 'pycharm', 'phpstorm', 'jetbrains*',
    ],
    billingDescriptors: ['JETBRAINS.COM', 'JETBRAINS S.R.O.'],
    category: 'software',
    cancelUrl: 'https://account.jetbrains.com/licenses',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 200 },
    currency: 'USD',
    iofApplicable: true,
  },

  onePassword: {
    canonicalName: '1Password',
    aliases: ['1password', 'onepassword', 'one password', '1password*'],
    billingDescriptors: ['1PASSWORD.COM', 'AGILEBITS', '1PASSWORD'],
    category: 'software',
    cancelUrl: 'https://my.1password.com/settings/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 15, max: 40 },
    currency: 'USD',
    iofApplicable: true,
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
    billingDescriptors: ['EVERNOTE.COM', 'BENDING SPOONS'],
    category: 'software',
    cancelUrl: 'https://www.evernote.com/Settings.action',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 100 },
    currency: 'USD',
    iofApplicable: true,
  },

  bitwarden: {
    canonicalName: 'Bitwarden',
    aliases: ['bitwarden', 'bitwarden.com', 'bitwarden*'],
    billingDescriptors: ['BITWARDEN.COM', 'BITWARDEN INC'],
    category: 'software',
    cancelUrl: 'https://vault.bitwarden.com/#/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 5, max: 20 },
    currency: 'USD',
    iofApplicable: true,
  },

  asana: {
    canonicalName: 'Asana',
    aliases: ['asana', 'asana.com', 'asana inc', 'asana*'],
    billingDescriptors: ['ASANA.COM'],
    category: 'software',
    cancelUrl: 'https://app.asana.com/0/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  trello: {
    canonicalName: 'Trello',
    aliases: ['trello', 'trello.com', 'atlassian trello', 'trello*'],
    billingDescriptors: ['TRELLO.COM', 'ATLASSIAN*TRELLO'],
    category: 'software',
    cancelUrl: 'https://trello.com/your/account',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  monday: {
    canonicalName: 'Monday.com',
    aliases: ['monday', 'monday.com', 'monday*'],
    billingDescriptors: ['MONDAY.COM'],
    category: 'software',
    cancelUrl: 'https://monday.com/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 100 },
    currency: 'USD',
    iofApplicable: true,
  },

  github: {
    canonicalName: 'GitHub',
    aliases: ['github', 'github.com', 'github pro', 'github*', 'github copilot'],
    billingDescriptors: ['GITHUB.COM', 'GITHUB INC', 'STRIPE*GITHUB'],
    category: 'software',
    cancelUrl: 'https://github.com/settings/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 55 },
    currency: 'USD',
    iofApplicable: true,
  },

  vercel: {
    canonicalName: 'Vercel',
    aliases: ['vercel', 'vercel.com', 'vercel inc', 'vercel*'],
    billingDescriptors: ['VERCEL.COM', 'VERCEL INC', 'STRIPE*VERCEL'],
    category: 'software',
    cancelUrl: 'https://vercel.com/account/billing',
    cancelMethod: 'web',
    typicalPriceRange: { min: 100, max: 250 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── AI & Machine Learning ──

  // ⚠️ COLLISION: 'OPENAI' shared with chatgpt — price-based disambiguation (R$40 vs R$107)
  chatgptGo: {
    canonicalName: 'ChatGPT Go (Brasil)',
    aliases: ['chatgpt go', 'chatgpt brasil', 'openai go'],
    billingDescriptors: ['OPENAI'],
    category: 'software',
    typicalPriceRange: { min: 30, max: 45 },
    currency: 'BRL',
  },

  geminiAdvanced: {
    canonicalName: 'Gemini Advanced',
    aliases: ['gemini', 'gemini advanced', 'google gemini', 'google ai premium'],
    billingDescriptors: ['GOOGLE*ONE AI'],
    category: 'software',
    typicalPriceRange: { min: 90, max: 100 },
    currency: 'BRL',
  },

  googleAiPlus: {
    canonicalName: 'Google AI Plus',
    aliases: ['google ai plus', 'google ai'],
    billingDescriptors: ['GOOGLE*AI PLUS'],
    category: 'software',
    typicalPriceRange: { min: 20, max: 30 },
    currency: 'BRL',
  },

  midjourney: {
    canonicalName: 'Midjourney',
    aliases: ['midjourney', 'midjourney inc', 'midjourney*'],
    billingDescriptors: ['MIDJOURNEY INC', 'STRIPE*MIDJOURNEY'],
    category: 'software',
    typicalPriceRange: { min: 55, max: 330 },
    currency: 'USD',
    iofApplicable: true,
  },

  runwayMl: {
    canonicalName: 'Runway ML',
    aliases: ['runway', 'runway ml', 'runwayml'],
    billingDescriptors: ['RUNWAY', 'STRIPE*RUNWAY'],
    category: 'software',
    typicalPriceRange: { min: 60, max: 80 },
    currency: 'USD',
    iofApplicable: true,
  },

  elevenLabs: {
    canonicalName: 'ElevenLabs',
    aliases: ['elevenlabs', 'eleven labs', '11labs'],
    billingDescriptors: ['ELEVENLABS', 'STRIPE*ELEVENLABS'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 140 },
    currency: 'USD',
    iofApplicable: true,
  },

  perplexityPro: {
    canonicalName: 'Perplexity Pro',
    aliases: ['perplexity', 'perplexity pro', 'perplexity ai'],
    billingDescriptors: ['PERPLEXITY AI', 'STRIPE*PERPLEXITY'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 120 },
    currency: 'USD',
    iofApplicable: true,
  },

  cursorPro: {
    canonicalName: 'Cursor Pro',
    aliases: ['cursor', 'cursor pro', 'anysphere'],
    billingDescriptors: ['CURSOR', 'ANYSPHERE', 'STRIPE*ANYSPHERE'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 120 },
    currency: 'USD',
    iofApplicable: true,
  },

  replitPro: {
    canonicalName: 'Replit Pro',
    aliases: ['replit', 'replit pro', 'repl.it'],
    billingDescriptors: ['REPLIT', 'STRIPE*REPLIT'],
    category: 'software',
    typicalPriceRange: { min: 130, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  deepLPro: {
    canonicalName: 'DeepL Pro',
    aliases: ['deepl', 'deepl pro', 'deepl translator'],
    billingDescriptors: ['DEEPL SE', 'STRIPE*DEEPL'],
    category: 'software',
    typicalPriceRange: { min: 50, max: 150 },
    currency: 'EUR/USD',
    iofApplicable: true,
  },

  microsoftCopilot: {
    canonicalName: 'Microsoft Copilot Pro',
    aliases: ['copilot', 'microsoft copilot', 'copilot pro', 'ms copilot'],
    billingDescriptors: ['MICROSOFT*COPILOT'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 120 },
    currency: 'BRL',
  },

  synthesia: {
    canonicalName: 'Synthesia',
    aliases: ['synthesia', 'synthesia.io'],
    billingDescriptors: ['SYNTHESIA', 'STRIPE*SYNTHESIA'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 250 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Dev Tools & Cloud ──

  netlifyPro: {
    canonicalName: 'Netlify',
    aliases: ['netlify', 'netlify pro', 'netlify.com'],
    billingDescriptors: ['NETLIFY', 'STRIPE*NETLIFY'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 120 },
    currency: 'USD',
    iofApplicable: true,
  },

  railway: {
    canonicalName: 'Railway',
    aliases: ['railway', 'railway.app'],
    billingDescriptors: ['RAILWAY', 'STRIPE*RAILWAY'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 100 },
    currency: 'USD',
    iofApplicable: true,
  },

  digitalOcean: {
    canonicalName: 'DigitalOcean',
    aliases: ['digitalocean', 'digital ocean', 'digitalocean.com'],
    billingDescriptors: ['DIGITALOCEAN.COM'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 500 },
    currency: 'USD',
    iofApplicable: true,
  },

  aws: {
    canonicalName: 'Amazon Web Services',
    aliases: ['aws', 'amazon web services', 'amazon aws'],
    billingDescriptors: ['AMAZON WEB SERVICES', 'AWS'],
    category: 'software',
    typicalPriceRange: { min: 5, max: 10000 },
    currency: 'USD',
    iofApplicable: true,
    isPopular: true,
  },

  azure: {
    canonicalName: 'Microsoft Azure',
    aliases: ['azure', 'microsoft azure', 'ms azure'],
    billingDescriptors: ['MICROSOFT*AZURE'],
    category: 'software',
    typicalPriceRange: { min: 5, max: 10000 },
    currency: 'BRL/USD',
    isPopular: true,
  },

  // ⚠️ NOTE: 'SALESFORCE' omitido — generico demais (Slack tambem e Salesforce)
  heroku: {
    canonicalName: 'Heroku',
    aliases: ['heroku', 'heroku.com'],
    billingDescriptors: ['HEROKU'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 500 },
    currency: 'USD',
    iofApplicable: true,
  },

  gitLab: {
    canonicalName: 'GitLab',
    aliases: ['gitlab', 'gitlab.com', 'gitlab inc'],
    billingDescriptors: ['GITLAB INC', 'STRIPE*GITLAB'],
    category: 'software',
    typicalPriceRange: { min: 150, max: 170 },
    currency: 'USD',
    iofApplicable: true,
  },

  render: {
    canonicalName: 'Render',
    aliases: ['render', 'render.com'],
    billingDescriptors: ['RENDER', 'STRIPE*RENDER'],
    category: 'software',
    typicalPriceRange: { min: 35, max: 200 },
    currency: 'USD',
    iofApplicable: true,
  },

  supabase: {
    canonicalName: 'Supabase',
    aliases: ['supabase', 'supabase.com'],
    billingDescriptors: ['SUPABASE', 'STRIPE*SUPABASE'],
    category: 'software',
    typicalPriceRange: { min: 130, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  cloudflare: {
    canonicalName: 'Cloudflare',
    aliases: ['cloudflare', 'cloudflare.com', 'cloudflare inc'],
    billingDescriptors: ['CLOUDFLARE INC'],
    category: 'software',
    typicalPriceRange: { min: 100, max: 250 },
    currency: 'USD',
    iofApplicable: true,
  },

  planetScale: {
    canonicalName: 'PlanetScale',
    aliases: ['planetscale', 'planetscale.com'],
    billingDescriptors: ['PLANETSCALE', 'STRIPE*PLANETSCALE'],
    category: 'software',
    typicalPriceRange: { min: 200, max: 230 },
    currency: 'USD',
    iofApplicable: true,
  },

  flyIo: {
    canonicalName: 'Fly.io',
    aliases: ['fly.io', 'fly io', 'flyio'],
    billingDescriptors: ['FLY.IO', 'STRIPE*FLYIO'],
    category: 'software',
    typicalPriceRange: { min: 5, max: 500 },
    currency: 'USD',
    iofApplicable: true,
  },

  firebaseBlaze: {
    canonicalName: 'Firebase Blaze',
    aliases: ['firebase', 'firebase blaze', 'google firebase'],
    billingDescriptors: ['GOOGLE*FIREBASE'],
    category: 'software',
    typicalPriceRange: { min: 5, max: 500 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Design & Colaboracao ──

  sketch: {
    canonicalName: 'Sketch',
    aliases: ['sketch', 'sketch.com', 'sketch app'],
    billingDescriptors: ['SKETCH B.V.'],
    category: 'software',
    typicalPriceRange: { min: 50, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  miro: {
    canonicalName: 'Miro',
    aliases: ['miro', 'miro.com', 'realtimeboard'],
    billingDescriptors: ['MIRO', 'REALTIMEBOARD'],
    category: 'software',
    typicalPriceRange: { min: 40, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  clickUp: {
    canonicalName: 'ClickUp',
    aliases: ['clickup', 'click up', 'clickup.com'],
    billingDescriptors: ['CLICKUP'],
    category: 'software',
    typicalPriceRange: { min: 35, max: 45 },
    currency: 'USD',
    iofApplicable: true,
  },

  linear: {
    canonicalName: 'Linear',
    aliases: ['linear', 'linear.app'],
    billingDescriptors: ['LINEAR'],
    category: 'software',
    typicalPriceRange: { min: 40, max: 50 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ⚠️ COLLISION: 'ATLASSIAN' substring conflicts with trello 'ATLASSIAN*TRELLO'
  jira: {
    canonicalName: 'Jira (Atlassian)',
    aliases: ['jira', 'atlassian', 'atlassian jira', 'jira software'],
    billingDescriptors: ['ATLASSIAN'],
    category: 'software',
    typicalPriceRange: { min: 40, max: 50 },
    currency: 'USD',
    iofApplicable: true,
  },

  discordNitro: {
    canonicalName: 'Discord Nitro',
    aliases: ['discord', 'discord nitro', 'discord inc'],
    billingDescriptors: ['DISCORD INC'],
    category: 'software',
    typicalPriceRange: { min: 40, max: 55 },
    currency: 'USD',
    iofApplicable: true,
  },

  loom: {
    canonicalName: 'Loom',
    aliases: ['loom', 'loom.com', 'loom inc'],
    billingDescriptors: ['LOOM INC'],
    category: 'software',
    typicalPriceRange: { min: 65, max: 75 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Senhas, Email & Armazenamento ──

  dashlane: {
    canonicalName: 'Dashlane',
    aliases: ['dashlane', 'dashlane.com', 'dashlane premium'],
    billingDescriptors: ['DASHLANE'],
    category: 'software',
    typicalPriceRange: { min: 15, max: 25 },
    currency: 'BRL/USD',
  },

  fastmail: {
    canonicalName: 'Fastmail',
    aliases: ['fastmail', 'fastmail.com'],
    billingDescriptors: ['FASTMAIL PTY LTD'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 35 },
    currency: 'USD',
    iofApplicable: true,
  },

  obsidianSync: {
    canonicalName: 'Obsidian Sync',
    aliases: ['obsidian', 'obsidian sync', 'obsidian publish', 'dynalist'],
    billingDescriptors: ['OBSIDIAN', 'DYNALIST'],
    category: 'software',
    typicalPriceRange: { min: 20, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  megaNz: {
    canonicalName: 'Mega.nz',
    aliases: ['mega', 'mega.nz', 'mega limited', 'mega pro'],
    billingDescriptors: ['MEGA LIMITED'],
    category: 'software',
    typicalPriceRange: { min: 25, max: 60 },
    currency: 'EUR/USD',
    iofApplicable: true,
  },

  backblaze: {
    canonicalName: 'Backblaze',
    aliases: ['backblaze', 'backblaze.com', 'backblaze b2'],
    billingDescriptors: ['BACKBLAZE INC'],
    category: 'software',
    typicalPriceRange: { min: 35, max: 45 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Business, Marketing & ERP ──

  contaAzul: {
    canonicalName: 'Conta Azul',
    aliases: ['conta azul', 'contaazul', 'contaazul.com'],
    billingDescriptors: ['CONTAAZUL SOFTWARE'],
    category: 'software',
    typicalPriceRange: { min: 80, max: 190 },
    currency: 'BRL',
    isPopular: true,
  },

  omie: {
    canonicalName: 'Omie',
    aliases: ['omie', 'omie.com.br', 'omie tecnologia'],
    billingDescriptors: ['OMIE TECNOLOGIA'],
    category: 'software',
    typicalPriceRange: { min: 90, max: 300 },
    currency: 'BRL',
    isPopular: true,
  },

  bling: {
    canonicalName: 'Bling',
    aliases: ['bling', 'bling.com.br', 'bling erp'],
    billingDescriptors: ['BLING', 'LWSA'],
    category: 'software',
    typicalPriceRange: { min: 50, max: 200 },
    currency: 'BRL',
  },

  nibo: {
    canonicalName: 'Nibo',
    aliases: ['nibo', 'nibo software', 'nibo.com.br'],
    billingDescriptors: ['NIBO SOFTWARE'],
    category: 'software',
    typicalPriceRange: { min: 45, max: 210 },
    currency: 'BRL',
  },

  tinyErp: {
    canonicalName: 'Tiny ERP',
    aliases: ['tiny', 'tiny erp', 'tiny.com.br', 'olist tiny'],
    billingDescriptors: ['TINY', 'OLIST'],
    category: 'software',
    typicalPriceRange: { min: 45, max: 210 },
    currency: 'BRL',
  },

  nfeIo: {
    canonicalName: 'NFe.io',
    aliases: ['nfe.io', 'nfeio', 'nfe io'],
    billingDescriptors: ['NFEIO'],
    category: 'software',
    typicalPriceRange: { min: 60, max: 310 },
    currency: 'BRL',
  },

  rdStation: {
    canonicalName: 'RD Station',
    aliases: ['rd station', 'rdstation', 'resultados digitais'],
    billingDescriptors: ['RD STATION', 'RESULTADOS DIGITAIS'],
    category: 'software',
    typicalPriceRange: { min: 45, max: 1410 },
    currency: 'BRL',
    isPopular: true,
  },

  mailchimp: {
    canonicalName: 'Mailchimp',
    aliases: ['mailchimp', 'mailchimp.com', 'intuit mailchimp'],
    billingDescriptors: ['MAILCHIMP', 'ROCKET SCIENCE GROUP'],
    category: 'software',
    typicalPriceRange: { min: 35, max: 100 },
    currency: 'USD',
    iofApplicable: true,
  },

  hubSpot: {
    canonicalName: 'HubSpot',
    aliases: ['hubspot', 'hubspot.com', 'hubspot inc'],
    billingDescriptors: ['HUBSPOT INC'],
    category: 'software',
    typicalPriceRange: { min: 230, max: 1000 },
    currency: 'USD',
    iofApplicable: true,
  },

  semrush: {
    canonicalName: 'Semrush',
    aliases: ['semrush', 'semrush.com', 'semrush inc'],
    billingDescriptors: ['SEMRUSH INC'],
    category: 'software',
    typicalPriceRange: { min: 650, max: 750 },
    currency: 'USD',
    iofApplicable: true,
  },

  activeCampaign: {
    canonicalName: 'ActiveCampaign',
    aliases: ['activecampaign', 'active campaign'],
    billingDescriptors: ['ACTIVECAMPAIGN'],
    category: 'software',
    typicalPriceRange: { min: 75, max: 300 },
    currency: 'USD',
    iofApplicable: true,
  },

  hotjar: {
    canonicalName: 'Hotjar',
    aliases: ['hotjar', 'hotjar.com', 'contentsquare hotjar'],
    billingDescriptors: ['HOTJAR', 'CONTENTSQUARE'],
    category: 'software',
    typicalPriceRange: { min: 170, max: 400 },
    currency: 'EUR/USD',
    iofApplicable: true,
  },

  // ── Creative Assets ──

  envatoElements: {
    canonicalName: 'Envato Elements',
    aliases: ['envato', 'envato elements'],
    billingDescriptors: ['ENVATO', 'ENVATO ELEMENTS'],
    category: 'software',
    typicalPriceRange: { min: 91, max: 182 },
    currency: 'USD',
    iofApplicable: true,
  },

  shutterstock: {
    canonicalName: 'Shutterstock',
    aliases: ['shutterstock', 'shutterstock inc'],
    billingDescriptors: ['SHUTTERSTOCK'],
    category: 'software',
    typicalPriceRange: { min: 160, max: 500 },
    currency: 'USD',
    iofApplicable: true,
  },

  epidemicSound: {
    canonicalName: 'Epidemic Sound',
    aliases: ['epidemic sound', 'epidemicsound'],
    billingDescriptors: ['EPIDEMIC SOUND'],
    category: 'software',
    typicalPriceRange: { min: 50, max: 270 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // EDUCAÇÃO (34 serviços — inclui BR, idiomas, internacional)
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
    billingDescriptors: ['COURSERA.ORG', 'COURSERA INC'],
    category: 'education',
    cancelUrl: 'https://www.coursera.org/account-settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 50, max: 200 },
    currency: 'USD',
    iofApplicable: true,
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
    billingDescriptors: ['UDEMY.COM', 'UDEMY INC'],
    category: 'education',
    cancelUrl: 'https://www.udemy.com/user/manage-subscriptions/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 100 },
    currency: 'BRL',
  },

  skillshare: {
    canonicalName: 'Skillshare',
    aliases: ['skillshare', 'skillshare.com', 'skillshare inc', 'skillshare*'],
    billingDescriptors: ['SKILLSHARE.COM', 'SKILLSHARE INC'],
    category: 'education',
    cancelUrl: 'https://www.skillshare.com/settings/payments',
    cancelMethod: 'web',
    typicalPriceRange: { min: 14, max: 80 },
    currency: 'BRL/USD',
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
    billingDescriptors: ['LINKEDIN.COM', 'LINKEDIN CORPORATION'],
    category: 'education',
    cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 60, max: 200 },
    currency: 'BRL/USD',
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
    billingDescriptors: ['PAG*HOTMART', 'MERCPAGO*HOTMART', 'HOTMART', 'HOT*'],
    category: 'education',
    cancelUrl: 'https://app.hotmart.com/club/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 200 },
    currency: 'BRL',
    platformBilled: 'hotmart',
  },

  babbel: {
    canonicalName: 'Babbel',
    aliases: ['babbel', 'babbel.com', 'babbel*'],
    billingDescriptors: ['GOOGLE*BABBEL', 'BABBEL.COM', 'LESSON NINE GMBH'],
    category: 'education',
    cancelUrl: 'https://my.babbel.com/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 70 },
    currency: 'USD',
    iofApplicable: true,
  },

  masterclass: {
    canonicalName: 'MasterClass',
    aliases: ['masterclass', 'master class', 'masterclass.com', 'masterclass*'],
    billingDescriptors: ['MASTERCLASS.COM', 'YANKA INDUSTRIES'],
    category: 'education',
    cancelUrl: 'https://www.masterclass.com/settings/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 120 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Educacao Brasil ──

  granCursos: {
    canonicalName: 'Gran Cursos',
    aliases: ['gran cursos', 'gran', 'gran tecnologia', 'gran online'],
    billingDescriptors: ['GRAN CURSOS', 'GRAN TECNOLOGIA'],
    category: 'education',
    typicalPriceRange: { min: 45, max: 200 },
    currency: 'BRL',
  },

  qConcursos: {
    canonicalName: 'QConcursos',
    aliases: ['qconcursos', 'qc concursos', 'qc tecnologia'],
    billingDescriptors: ['QCONCURSOS', 'QC TECNOLOGIA'],
    category: 'education',
    typicalPriceRange: { min: 25, max: 65 },
    currency: 'BRL',
  },

  aprovaConcursos: {
    canonicalName: 'Aprova Concursos',
    aliases: ['aprova concursos', 'aprova', 'aprovaconcursos'],
    billingDescriptors: ['APROVA CONCURSOS'],
    category: 'education',
    typicalPriceRange: { min: 25, max: 95 },
    currency: 'BRL',
  },

  stoodi: {
    canonicalName: 'Stoodi',
    aliases: ['stoodi', 'stoodi.com.br', 'stoodi ensino'],
    billingDescriptors: ['STOODI', 'STOODI ENSINO'],
    category: 'education',
    typicalPriceRange: { min: 20, max: 55 },
    currency: 'BRL',
  },

  meSalva: {
    canonicalName: 'Me Salva!',
    aliases: ['me salva', 'mesalva', 'mesalva.com'],
    billingDescriptors: ['ME SALVA', 'MESALVA EDUC'],
    category: 'education',
    typicalPriceRange: { min: 35, max: 95 },
    currency: 'BRL',
  },

  passeiDireto: {
    canonicalName: 'Passei Direto',
    aliases: ['passei direto', 'passeidireto'],
    billingDescriptors: ['PASSEI DIRETO'],
    category: 'education',
    typicalPriceRange: { min: 15, max: 45 },
    currency: 'BRL',
  },

  casaDoSaber: {
    canonicalName: 'Casa do Saber',
    aliases: ['casa do saber', 'casadosaber'],
    billingDescriptors: ['CASA DO SABER', 'CASADOSABER'],
    category: 'education',
    typicalPriceRange: { min: 45, max: 55 },
    currency: 'BRL',
  },

  cifraClubPro: {
    canonicalName: 'Cifra Club Pro',
    aliases: ['cifra club', 'cifraclub', 'cifra club pro', 'studiosol'],
    billingDescriptors: ['CIFRA CLUB', 'STUDIOSOL'],
    category: 'education',
    typicalPriceRange: { min: 8, max: 25 },
    currency: 'BRL',
  },

  // ── Idiomas ──

  busuu: {
    canonicalName: 'Busuu',
    aliases: ['busuu', 'busuu.com', 'busuu premium'],
    billingDescriptors: ['BUSUU'],
    category: 'education',
    typicalPriceRange: { min: 30, max: 75 },
    currency: 'BRL/USD',
  },

  rosettaStone: {
    canonicalName: 'Rosetta Stone',
    aliases: ['rosetta stone', 'rosettastone', 'ixl learning rosetta'],
    billingDescriptors: ['ROSETTASTONE', 'IXL LEARNING'],
    category: 'education',
    typicalPriceRange: { min: 65, max: 80 },
    currency: 'USD',
    iofApplicable: true,
  },

  cambly: {
    canonicalName: 'Cambly',
    aliases: ['cambly', 'cambly.com', 'cambly inc'],
    billingDescriptors: ['CAMBLY INC'],
    category: 'education',
    typicalPriceRange: { min: 55, max: 300 },
    currency: 'BRL',
  },

  openEnglish: {
    canonicalName: 'Open English',
    aliases: ['open english', 'openenglish', 'oe brasil'],
    billingDescriptors: ['OPEN ENGLISH', 'OE BRASIL'],
    category: 'education',
    typicalPriceRange: { min: 150, max: 500 },
    currency: 'BRL',
  },

  wizardOnline: {
    canonicalName: 'Wizard Online',
    aliases: ['wizard', 'wizard online', 'pearson wizard'],
    billingDescriptors: ['WIZARD', 'PEARSON EDUCACAO'],
    category: 'education',
    typicalPriceRange: { min: 400, max: 500 },
    currency: 'BRL',
  },

  cnaGo: {
    canonicalName: 'CNA Go',
    aliases: ['cna', 'cna go', 'cna idiomas'],
    billingDescriptors: ['CNA', 'CNA IDIOMAS'],
    category: 'education',
    typicalPriceRange: { min: 110, max: 130 },
    currency: 'BRL',
  },

  memrise: {
    canonicalName: 'Memrise',
    aliases: ['memrise', 'memrise.com', 'memrise pro'],
    billingDescriptors: ['MEMRISE'],
    category: 'education',
    typicalPriceRange: { min: 40, max: 55 },
    currency: 'USD',
    iofApplicable: true,
  },

  preply: {
    canonicalName: 'Preply',
    aliases: ['preply', 'preply.com', 'preply inc'],
    billingDescriptors: ['PREPLY INC'],
    category: 'education',
    typicalPriceRange: { min: 50, max: 300 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Educacao Internacional ──

  pluralsight: {
    canonicalName: 'Pluralsight',
    aliases: ['pluralsight', 'pluralsight.com'],
    billingDescriptors: ['PLURALSIGHT'],
    category: 'education',
    typicalPriceRange: { min: 150, max: 260 },
    currency: 'USD',
    iofApplicable: true,
  },

  dataCamp: {
    canonicalName: 'DataCamp',
    aliases: ['datacamp', 'datacamp.com'],
    billingDescriptors: ['DATACAMP'],
    category: 'education',
    typicalPriceRange: { min: 130, max: 225 },
    currency: 'USD',
    iofApplicable: true,
  },

  codecademy: {
    canonicalName: 'Codecademy',
    aliases: ['codecademy', 'codecademy.com', 'codeacademy'],
    billingDescriptors: ['CODECADEMY', 'SKILLSOFT'],
    category: 'education',
    typicalPriceRange: { min: 95, max: 230 },
    currency: 'USD',
    iofApplicable: true,
  },

  brilliantOrg: {
    canonicalName: 'Brilliant.org',
    aliases: ['brilliant', 'brilliant.org'],
    billingDescriptors: ['BRILLIANT.ORG'],
    category: 'education',
    typicalPriceRange: { min: 130, max: 150 },
    currency: 'USD',
    iofApplicable: true,
  },

  fenderPlay: {
    canonicalName: 'Fender Play',
    aliases: ['fender play', 'fender digital'],
    billingDescriptors: ['FENDER DIGITAL', 'FENDER PLAY'],
    category: 'education',
    typicalPriceRange: { min: 50, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // FITNESS E BEM-ESTAR (11 serviços)
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
  // SAÚDE E PLANOS (15 serviços)
  // ══════════════════════════════════════════════════════════════

  // ── Planos de Saúde ──

  unimed: {
    canonicalName: 'Unimed',
    aliases: ['unimed', 'unimed nacional', 'unimed seguros'],
    billingDescriptors: ['UNIMED'],
    category: 'health',
    typicalPriceRange: { min: 300, max: 2000 },
    isPopular: true,
  },

  amil: {
    canonicalName: 'Amil',
    aliases: ['amil', 'amil assistencia', 'amil saude', 'amil one'],
    billingDescriptors: ['AMIL ASSISTENCIA MEDICA', 'AMIL'],
    category: 'health',
    typicalPriceRange: { min: 400, max: 2500 },
    isPopular: true,
  },

  bradescoSaude: {
    canonicalName: 'Bradesco Saúde',
    aliases: ['bradesco saude', 'bradesco saude empresarial'],
    billingDescriptors: ['BRADESCO SAUDE'],
    category: 'health',
    typicalPriceRange: { min: 500, max: 3000 },
    isPopular: true,
  },

  sulamericaSaude: {
    canonicalName: 'SulAmérica Saúde',
    aliases: ['sulamerica saude', 'sulamerica', 'sul america saude'],
    billingDescriptors: ['SULAMERICA SAUDE'],
    category: 'health',
    typicalPriceRange: { min: 500, max: 3000 },
    isPopular: true,
  },

  hapvida: {
    canonicalName: 'Hapvida',
    aliases: ['hapvida', 'hapvida saude', 'hapvida ndi'],
    billingDescriptors: ['HAPVIDA'],
    category: 'health',
    typicalPriceRange: { min: 200, max: 800 },
    isPopular: true,
  },

  notreDame: {
    canonicalName: 'NotreDame Intermédica',
    aliases: ['notre dame', 'notredame', 'intermedica', 'gndi', 'ndi'],
    billingDescriptors: ['GNDI', 'NDI', 'INTERMEDICA'],
    category: 'health',
    typicalPriceRange: { min: 300, max: 1500 },
  },

  qualicorp: {
    canonicalName: 'Qualicorp',
    aliases: ['qualicorp', 'qualicorp administradora'],
    billingDescriptors: ['QUALICORP'],
    category: 'health',
    typicalPriceRange: { min: 200, max: 2000 },
  },

  aliceSaude: {
    canonicalName: 'Alice Saúde',
    aliases: ['alice saude', 'alice', 'alice gestora'],
    billingDescriptors: ['ALICE SAUDE', 'ALICE GESTORA'],
    category: 'health',
    typicalPriceRange: { min: 550, max: 979 },
  },

  samiSaude: {
    canonicalName: 'Sami Saúde',
    aliases: ['sami saude', 'sami'],
    billingDescriptors: ['SAMI SAUDE'],
    category: 'health',
    typicalPriceRange: { min: 400, max: 800 },
  },

  // ── Planos Dentais ──

  odontoPrev: {
    canonicalName: 'OdontoPrev',
    aliases: ['odontoprev', 'odonto prev'],
    billingDescriptors: ['ODONTOPREV'],
    category: 'health',
    typicalPriceRange: { min: 25, max: 72 },
    isPopular: true,
  },

  bradescoDental: {
    canonicalName: 'Bradesco Dental',
    aliases: ['bradesco dental', 'bradesco odonto'],
    billingDescriptors: ['BRADESCO DENTAL'],
    category: 'health',
    typicalPriceRange: { min: 25, max: 80 },
  },

  metlifeDental: {
    canonicalName: 'MetLife Dental',
    aliases: ['metlife dental', 'metlife odonto', 'metlife'],
    billingDescriptors: ['METLIFE DENTAL'],
    category: 'health',
    typicalPriceRange: { min: 30, max: 70 },
  },

  sulamericaOdonto: {
    canonicalName: 'SulAmérica Odonto',
    aliases: ['sulamerica odonto', 'sulamerica dental'],
    billingDescriptors: ['SULAMERICA ODONTO'],
    category: 'health',
    typicalPriceRange: { min: 25, max: 60 },
  },

  amilDental: {
    canonicalName: 'Amil Dental',
    aliases: ['amil dental', 'amil odonto'],
    billingDescriptors: ['AMIL DENTAL'],
    category: 'health',
    typicalPriceRange: { min: 20, max: 60 },
  },

  uniodonto: {
    canonicalName: 'Uniodonto',
    aliases: ['uniodonto', 'uniodonto brasil'],
    billingDescriptors: ['UNIODONTO'],
    category: 'health',
    typicalPriceRange: { min: 30, max: 80 },
  },

  // ══════════════════════════════════════════════════════════════
  // SEGUROS (9 serviços)
  // ══════════════════════════════════════════════════════════════

  portoSeguro: {
    canonicalName: 'Porto Seguro',
    aliases: ['porto seguro', 'portoseg', 'porto seguro auto', 'porto seguro residencial'],
    billingDescriptors: ['PORTO SEGURO', 'PORTOSEG'],
    category: 'insurance',
    typicalPriceRange: { min: 100, max: 600 },
    isPopular: true,
  },

  sulamericaAuto: {
    canonicalName: 'SulAmérica Seguros',
    aliases: ['sulamerica seguros', 'sulamerica auto', 'sulamerica seg'],
    billingDescriptors: ['SULAMERICA SEG'],
    category: 'insurance',
    typicalPriceRange: { min: 150, max: 500 },
  },

  azulSeguros: {
    canonicalName: 'Azul Seguros',
    aliases: ['azul seguros', 'azul seg'],
    billingDescriptors: ['AZUL SEGUROS', 'AZUL SEG ASSINATURA'],
    category: 'insurance',
    typicalPriceRange: { min: 99, max: 300 },
  },

  youse: {
    canonicalName: 'Youse',
    aliases: ['youse', 'youse seguros'],
    billingDescriptors: ['YOUSE SEGUROS'],
    category: 'insurance',
    typicalPriceRange: { min: 40, max: 300 },
  },

  pier: {
    canonicalName: 'Pier',
    aliases: ['pier', 'pier seguradora', 'pier seguro'],
    billingDescriptors: ['PIER SEGURADORA'],
    category: 'insurance',
    typicalPriceRange: { min: 80, max: 250 },
  },

  // ⚠️ NOTE: Youse (YOUSE SEGUROS) é da Caixa Seguradora, mas usa descriptor separado
  caixaSeguradora: {
    canonicalName: 'Caixa Seguradora / Yelum',
    aliases: ['caixa seguradora', 'yelum', 'ylm seguros'],
    billingDescriptors: ['CAIXA SEGURADORA', 'YLM SEGUROS'],
    category: 'insurance',
    typicalPriceRange: { min: 50, max: 300 },
  },

  mapfre: {
    canonicalName: 'Mapfre Seguros',
    aliases: ['mapfre', 'mapfre seguros'],
    billingDescriptors: ['MAPFRE SEGUROS'],
    category: 'insurance',
    typicalPriceRange: { min: 100, max: 400 },
  },

  liberty: {
    canonicalName: 'Liberty Seguros',
    aliases: ['liberty', 'liberty seguros'],
    billingDescriptors: ['LIBERTY SEGUROS'],
    category: 'insurance',
    typicalPriceRange: { min: 100, max: 400 },
  },

  portoSeguroPet: {
    canonicalName: 'Porto Seguro Pet',
    aliases: ['porto seguro pet', 'portoseg pet'],
    billingDescriptors: ['PORTO SEGURO PET'],
    category: 'insurance',
    typicalPriceRange: { min: 40, max: 100 },
  },

  // ══════════════════════════════════════════════════════════════
  // WELLNESS E TERAPIA (6 serviços — category: health)
  // ══════════════════════════════════════════════════════════════

  zenklub: {
    canonicalName: 'Zenklub',
    aliases: ['zenklub', 'zen klub'],
    billingDescriptors: ['ZENKLUB'],
    category: 'health',
    cancelUrl: 'https://zenklub.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 290, max: 430 },
  },

  vittude: {
    canonicalName: 'Vittude',
    aliases: ['vittude'],
    billingDescriptors: ['VITTUDE'],
    category: 'health',
    typicalPriceRange: { min: 50, max: 200 },
  },

  psicologiaViva: {
    canonicalName: 'Psicologia Viva',
    aliases: ['psicologia viva'],
    billingDescriptors: ['PSICOLOGIA VIVA'],
    category: 'health',
    typicalPriceRange: { min: 60, max: 200 },
  },

  cingulo: {
    canonicalName: 'Cíngulo',
    aliases: ['cingulo', 'cingulo app'],
    billingDescriptors: ['CINGULO'],
    category: 'health',
    typicalPriceRange: { min: 25, max: 35 },
  },

  zenApp: {
    canonicalName: 'Zen App',
    aliases: ['zen app', 'zen meditacao'],
    billingDescriptors: ['ZEN APP'],
    category: 'health',
    typicalPriceRange: { min: 20, max: 30 },
  },

  lojong: {
    canonicalName: 'Lojong',
    aliases: ['lojong', 'lojong meditacao'],
    billingDescriptors: ['LOJONG'],
    category: 'health',
    typicalPriceRange: { min: 20, max: 30 },
  },

  // ══════════════════════════════════════════════════════════════
  // DELIVERY E FOOD (14 serviços)
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

  // ── Clubes de Assinatura (Bebidas e Alimentos) ──

  wine: {
    canonicalName: 'Wine.com.br',
    aliases: ['wine', 'wine.com.br', 'w2w ecommerce', 'wine clube'],
    // ⚠️ NOTE: aparece como 'W2W ECOMMERCE' — descriptor não-óbvio
    billingDescriptors: ['W2W ECOMMERCE', 'WINE.COM.BR'],
    category: 'food',
    cancelUrl: 'https://www.wine.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 89, max: 229 },
  },

  evinoClub: {
    canonicalName: 'Evino Club',
    aliases: ['evino', 'evino clube', 'evino club'],
    billingDescriptors: ['EVINO', 'EVINO CLUBE'],
    category: 'food',
    typicalPriceRange: { min: 70, max: 200 },
  },

  grandCru: {
    canonicalName: 'Grand Cru',
    aliases: ['grand cru', 'grandcru'],
    billingDescriptors: ['GRAND CRU'],
    category: 'food',
    typicalPriceRange: { min: 80, max: 300 },
  },

  clubeDoMalte: {
    canonicalName: 'Clube do Malte',
    aliases: ['clube do malte', 'clubedomalte'],
    billingDescriptors: ['CLUBE DO MALTE'],
    category: 'food',
    typicalPriceRange: { min: 90, max: 200 },
  },

  nespresso: {
    canonicalName: 'Nespresso Assinatura',
    aliases: ['nespresso', 'nespresso assinatura', 'nestle nespresso'],
    billingDescriptors: ['NESPRESSO', 'NESTLE NESPRESSO'],
    category: 'food',
    typicalPriceRange: { min: 55, max: 350 },
  },

  coffeeAndJoy: {
    canonicalName: 'Coffee & Joy',
    aliases: ['coffee and joy', 'coffeeandjoy', 'coffee joy'],
    billingDescriptors: ['COFFEE AND JOY'],
    category: 'food',
    typicalPriceRange: { min: 50, max: 80 },
  },

  mokaClube: {
    canonicalName: 'Moka Clube',
    aliases: ['moka clube', 'moka', 'mokaclube'],
    billingDescriptors: ['MOKA CLUBE'],
    category: 'food',
    typicalPriceRange: { min: 55, max: 85 },
  },

  sociedadeDaCarne: {
    canonicalName: 'Sociedade da Carne',
    aliases: ['sociedade da carne'],
    billingDescriptors: ['SOCIEDADE DA CARNE'],
    category: 'food',
    typicalPriceRange: { min: 199, max: 500 },
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSPORTE E MOBILIDADE (14 serviços)
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

  // ── Assinatura de Veículos ──

  localizaMeoo: {
    canonicalName: 'Localiza Meoo',
    aliases: ['localiza meoo', 'localiza', 'localiza assinatura'],
    billingDescriptors: ['LOCALIZA MEOO', 'LOCALIZA'],
    category: 'transport',
    typicalPriceRange: { min: 1500, max: 5000 },
  },

  movidaAssinatura: {
    canonicalName: 'Movida Assinatura',
    aliases: ['movida', 'movida assinatura'],
    billingDescriptors: ['MOVIDA'],
    category: 'transport',
    typicalPriceRange: { min: 1500, max: 4500 },
  },

  kovi: {
    canonicalName: 'Kovi',
    aliases: ['kovi', 'kovi tecnologia'],
    billingDescriptors: ['KOVI TECNOLOGIA'],
    category: 'transport',
    typicalPriceRange: { min: 800, max: 1800 },
  },

  // ── Tags de Pedágio ──

  c6Tag: {
    canonicalName: 'C6 Tag',
    aliases: ['c6 tag', 'c6tag'],
    billingDescriptors: ['C6 TAG'],
    category: 'transport',
    typicalPriceRange: { min: 4, max: 5 },
  },

  interTag: {
    canonicalName: 'Inter Tag',
    aliases: ['inter tag', 'intertag'],
    billingDescriptors: ['INTER TAG'],
    category: 'transport',
    typicalPriceRange: { min: 5, max: 5 },
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
  // NOTÍCIAS E MÍDIA (29 serviços — inclui jornais, revistas, plataformas de conteúdo)
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
    billingDescriptors: ['INFOGLOBO', 'EDITORA GLOBO', 'PAG*OGLOBO'],
    category: 'news',
    cancelUrl: 'https://assinatura.oglobo.com.br/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 60 },
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
    billingDescriptors: ['MEDIUM.COM', 'STRIPE*MEDIUM'],
    category: 'news',
    cancelUrl: 'https://medium.com/me/settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 20, max: 30 },
    currency: 'USD',
    iofApplicable: true,
  },

  exame: {
    canonicalName: 'Exame',
    aliases: ['exame', 'exame.com', 'abril exame', 'exame*'],
    billingDescriptors: ['PAG*EXAME', 'EXAME'],
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
    billingDescriptors: ['ABRIL*VEJA', 'PAG*VEJA', 'ASSINEABRIL'],
    category: 'news',
    cancelUrl: 'https://www.abril.com.br/assinatura/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 4, max: 50 },
  },

  nytimes: {
    canonicalName: 'The New York Times',
    aliases: ['nytimes', 'new york times', 'nyt', 'nytimes.com', 'nytimes*'],
    billingDescriptors: ['NYTIMES.COM', 'THE NEW YORK TIMES'],
    category: 'news',
    cancelUrl: 'https://myaccount.nytimes.com/seg/subscription',
    cancelMethod: 'web',
    typicalPriceRange: { min: 22, max: 95 },
    currency: 'USD',
    iofApplicable: true,
  },

  economist: {
    canonicalName: 'The Economist',
    aliases: ['economist', 'the economist', 'economist.com', 'economist*'],
    billingDescriptors: ['ECONOMIST.COM', 'THE ECONOMIST'],
    category: 'news',
    cancelUrl: 'https://myaccount.economist.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 40, max: 170 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Jornais Regionais ──

  correioBraziliense: {
    canonicalName: 'Correio Braziliense',
    aliases: ['correio braziliense', 'diarios associados'],
    billingDescriptors: ['CORREIO BRAZILIENSE', 'DIARIOS ASSOCIADOS'],
    category: 'news',
    typicalPriceRange: { min: 10, max: 20 },
  },

  zeroHora: {
    canonicalName: 'Zero Hora (GZH)',
    aliases: ['zero hora', 'gzh', 'grupo rbs', 'zerohora'],
    billingDescriptors: ['GRUPO RBS', 'ZERO HORA'],
    category: 'news',
    typicalPriceRange: { min: 5, max: 33 },
  },

  gazetaDoPovo: {
    canonicalName: 'Gazeta do Povo',
    aliases: ['gazeta do povo', 'gazetadopovo'],
    billingDescriptors: ['GAZETA DO POVO', 'EDITORA GAZETA DO POVO'],
    category: 'news',
    typicalPriceRange: { min: 2, max: 28 },
  },

  // ── Revistas ──

  superinteressante: {
    canonicalName: 'Superinteressante',
    aliases: ['superinteressante', 'super interessante', 'super abril'],
    billingDescriptors: [],
    category: 'news',
    typicalPriceRange: { min: 10, max: 20 },
  },

  quatroRodas: {
    canonicalName: 'Quatro Rodas',
    aliases: ['quatro rodas', '4 rodas', 'quatro rodas abril'],
    billingDescriptors: [],
    category: 'news',
    typicalPriceRange: { min: 10, max: 20 },
  },

  istoE: {
    canonicalName: 'IstoÉ',
    aliases: ['istoe', 'isto e', 'editora tres'],
    billingDescriptors: ['EDITORA TRES', 'ISTOE'],
    category: 'news',
    typicalPriceRange: { min: 15, max: 20 },
  },

  crusoe: {
    canonicalName: 'Crusoé',
    aliases: ['crusoe', 'revista crusoe', 'o antagonista'],
    billingDescriptors: ['CRUSOE', 'O ANTAGONISTA'],
    category: 'news',
    typicalPriceRange: { min: 10, max: 20 },
  },

  revistaOeste: {
    canonicalName: 'Revista Oeste',
    aliases: ['revista oeste', 'oeste'],
    billingDescriptors: ['REVISTA OESTE'],
    category: 'news',
    typicalPriceRange: { min: 30, max: 45 },
  },

  // ── Jornais Internacionais ──

  washingtonPost: {
    canonicalName: 'Washington Post',
    aliases: ['washington post', 'washingtonpost', 'wapo', 'wp company'],
    billingDescriptors: ['WASHINGTONPOST', 'WP COMPANY'],
    category: 'news',
    typicalPriceRange: { min: 22, max: 84 },
    currency: 'USD',
    iofApplicable: true,
  },

  financialTimes: {
    canonicalName: 'Financial Times',
    aliases: ['financial times', 'ft', 'ft.com'],
    billingDescriptors: ['FT.COM', 'FINANCIAL TIMES'],
    category: 'news',
    typicalPriceRange: { min: 220, max: 420 },
    currency: 'USD',
    iofApplicable: true,
  },

  wallStreetJournal: {
    canonicalName: 'Wall Street Journal',
    aliases: ['wall street journal', 'wsj', 'dow jones'],
    billingDescriptors: ['DOWJONES', 'DOW JONES', 'WSJ'],
    category: 'news',
    typicalPriceRange: { min: 22, max: 215 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ── Plataformas de Conteúdo e Criadores ──

  substack: {
    canonicalName: 'Substack',
    aliases: ['substack', 'substack newsletter'],
    billingDescriptors: ['STRIPE*SUBSTACK', 'SUBSTACK*'],
    category: 'news',
    typicalPriceRange: { min: 28, max: 84 },
    currency: 'USD',
    iofApplicable: true,
  },

  patreon: {
    canonicalName: 'Patreon',
    aliases: ['patreon', 'patreon membership'],
    billingDescriptors: ['PATREON*', 'PAYPAL *PATREON'],
    category: 'news',
    typicalPriceRange: { min: 6, max: 280 },
    currency: 'USD',
    iofApplicable: true,
  },

  catarse: {
    canonicalName: 'Catarse',
    aliases: ['catarse', 'catarse.me'],
    billingDescriptors: ['CATARSE', 'CATARSE.ME'],
    category: 'news',
    typicalPriceRange: { min: 1, max: 100 },
  },

  apoiaSe: {
    canonicalName: 'Apoia.se',
    aliases: ['apoia.se', 'apoiase', 'apoia se'],
    billingDescriptors: ['APOIA.SE'],
    category: 'news',
    typicalPriceRange: { min: 1, max: 100 },
  },

  scribd: {
    canonicalName: 'Scribd / Everand',
    aliases: ['scribd', 'everand', 'scribd inc'],
    billingDescriptors: ['SCRIBD', 'EVERAND', 'STRIPE*SCRIBD'],
    category: 'news',
    cancelUrl: 'https://www.scribd.com/account-settings',
    cancelMethod: 'web',
    typicalPriceRange: { min: 25, max: 35 },
  },

  socialComics: {
    canonicalName: 'Social Comics',
    aliases: ['social comics', 'eleven dragons'],
    billingDescriptors: ['SOCIAL COMICS', 'ELEVEN DRAGONS'],
    category: 'news',
    typicalPriceRange: { min: 11, max: 15 },
  },

  marvelUnlimited: {
    canonicalName: 'Marvel Unlimited',
    aliases: ['marvel unlimited', 'marvel'],
    billingDescriptors: ['MARVEL'],
    category: 'news',
    typicalPriceRange: { min: 50, max: 60 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // SEGURANÇA / VPN (17 serviços — inclui email criptografado)
  // ══════════════════════════════════════════════════════════════
  nordvpn: {
    canonicalName: 'NordVPN',
    aliases: ['nordvpn', 'nord vpn', 'nordsec', 'nordvpn*', 'nord security'],
    billingDescriptors: [
      'NORDVPN.COM', 'PAG*NORDVPN', 'GOOGLE*NORDVPN', 'MERCPAGO*NORDVPN',
      'SL.NORD*VPNCOM',
    ],
    category: 'security',
    cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/',
    cancelMethod: 'web',
    cancelInstructions: 'Acesse my.nordaccount.com > Dashboard > NordVPN > Cancelar renovacao automatica.',
    typicalPriceRange: { min: 15, max: 60 },
    isPopular: true,
    currency: 'BRL/USD',
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
    billingDescriptors: ['EXPRESSVPN.COM', 'EXPRESSVPN'],
    category: 'security',
    cancelUrl: 'https://www.expressvpn.com/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 30, max: 70 },
    currency: 'USD',
    iofApplicable: true,
  },

  avast: {
    canonicalName: 'Avast',
    aliases: ['avast', 'avast premium', 'avast antivirus', 'avast*'],
    billingDescriptors: ['AVAST.COM', 'AVAST SOFTWARE', 'GEN DIGITAL'],
    category: 'security',
    cancelUrl: 'https://my.avast.com/subscriptions',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 100 },
    currency: 'BRL/USD',
  },

  bitdefender: {
    canonicalName: 'Bitdefender',
    aliases: ['bitdefender', 'bitdefender total', 'bitdefender*'],
    billingDescriptors: ['BITDEFENDER.COM', 'BITDEFENDER', '2CHECKOUT*'],
    category: 'security',
    cancelUrl: 'https://central.bitdefender.com/',
    cancelMethod: 'web',
    typicalPriceRange: { min: 10, max: 120 },
    currency: 'BRL/USD',
  },

  cyberGhost: {
    canonicalName: 'CyberGhost',
    aliases: ['cyberghost', 'cyber ghost', 'kape cyberghost'],
    billingDescriptors: ['CYBERGHOST', 'KAPE'],
    category: 'security',
    typicalPriceRange: { min: 12, max: 80 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ⚠️ COLLISION: 'PROTON AG' shared with protonVpn — price-based disambiguation
  protonMail: {
    canonicalName: 'Proton Mail',
    aliases: ['protonmail', 'proton mail', 'proton', 'proton ag'],
    billingDescriptors: ['PROTON AG'],
    category: 'security',
    typicalPriceRange: { min: 18, max: 30 },
    currency: 'EUR/USD',
    iofApplicable: true,
  },

  tutanota: {
    canonicalName: 'Tuta (ex-Tutanota)',
    aliases: ['tutanota', 'tuta', 'tuta mail', 'tutao'],
    billingDescriptors: ['TUTAO GMBH'],
    category: 'security',
    typicalPriceRange: { min: 14, max: 25 },
    currency: 'EUR',
    iofApplicable: true,
  },

  // ⚠️ COLLISION: 'PROTON AG' shared with protonMail — price-based disambiguation
  protonVpn: {
    canonicalName: 'Proton VPN',
    aliases: ['protonvpn', 'proton vpn'],
    billingDescriptors: ['PROTON AG'],
    category: 'security',
    typicalPriceRange: { min: 25, max: 60 },
    currency: 'EUR/USD',
    iofApplicable: true,
  },

  pia: {
    canonicalName: 'Private Internet Access',
    aliases: ['pia', 'private internet access', 'pia vpn'],
    billingDescriptors: ['PRIVATE INTERNET ACCESS'],
    category: 'security',
    typicalPriceRange: { min: 10, max: 65 },
    currency: 'USD',
    iofApplicable: true,
  },

  mullvad: {
    canonicalName: 'Mullvad VPN',
    aliases: ['mullvad', 'mullvad vpn'],
    billingDescriptors: ['MULLVAD VPN AB'],
    category: 'security',
    typicalPriceRange: { min: 28, max: 35 },
    currency: 'EUR',
    iofApplicable: true,
  },

  eset: {
    canonicalName: 'ESET',
    aliases: ['eset', 'eset nod32', 'eset smart security'],
    billingDescriptors: ['ESET', 'DIGITAL RIVER'],
    category: 'security',
    typicalPriceRange: { min: 6, max: 20 },
    currency: 'BRL/USD',
  },

  trendMicro: {
    canonicalName: 'Trend Micro',
    aliases: ['trend micro', 'trendmicro', 'trend micro maximum'],
    billingDescriptors: ['TREND MICRO'],
    category: 'security',
    typicalPriceRange: { min: 4, max: 25 },
    currency: 'BRL/USD',
  },

  malwarebytes: {
    canonicalName: 'Malwarebytes',
    aliases: ['malwarebytes', 'malwarebytes premium'],
    billingDescriptors: ['MALWAREBYTES CORP'],
    category: 'security',
    typicalPriceRange: { min: 18, max: 30 },
    currency: 'USD',
    iofApplicable: true,
  },

  // ══════════════════════════════════════════════════════════════
  // DATING (7 serviços)
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
  // FINANÇAS (24 serviços — inclui gestao, credito, banking premium)
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

  // ── Gestao Financeira ──

  mobills: {
    canonicalName: 'Mobills Premium',
    aliases: ['mobills', 'mobills premium'],
    billingDescriptors: ['MOBILLS'],
    category: 'finance',
    typicalPriceRange: { min: 12, max: 20 },
    currency: 'BRL',
  },

  organizze: {
    canonicalName: 'Organizze',
    aliases: ['organizze', 'organizze.com.br'],
    billingDescriptors: ['ORGANIZZE'],
    category: 'finance',
    typicalPriceRange: { min: 10, max: 15 },
    currency: 'BRL',
  },

  ynab: {
    canonicalName: 'YNAB',
    aliases: ['ynab', 'you need a budget'],
    billingDescriptors: ['YOU NEED A BUDGET', 'YNAB'],
    category: 'finance',
    typicalPriceRange: { min: 75, max: 90 },
    currency: 'USD',
    iofApplicable: true,
  },

  kinvo: {
    canonicalName: 'Kinvo',
    aliases: ['kinvo', 'kinvo.com.br'],
    billingDescriptors: ['KINVO'],
    category: 'finance',
    typicalPriceRange: { min: 35, max: 45 },
    currency: 'BRL',
  },

  tradeMap: {
    canonicalName: 'TradeMap',
    aliases: ['trademap', 'trade map'],
    billingDescriptors: ['TRADEMAP'],
    category: 'finance',
    typicalPriceRange: { min: 35, max: 45 },
    currency: 'BRL',
  },

  statusInvest: {
    canonicalName: 'Status Invest',
    aliases: ['status invest', 'statusinvest'],
    billingDescriptors: ['STATUS INVEST'],
    category: 'finance',
    typicalPriceRange: { min: 25, max: 35 },
    currency: 'BRL',
  },

  tradingView: {
    canonicalName: 'TradingView',
    aliases: ['tradingview', 'trading view'],
    billingDescriptors: ['TRADINGVIEW INC'],
    category: 'finance',
    typicalPriceRange: { min: 65, max: 1150 },
    currency: 'USD',
    iofApplicable: true,
  },

  profitChart: {
    canonicalName: 'ProfitChart',
    aliases: ['profitchart', 'profit chart', 'nelogica', 'profit pro'],
    billingDescriptors: ['NELOGICA', 'PROFIT'],
    category: 'finance',
    typicalPriceRange: { min: 65, max: 260 },
    currency: 'BRL',
  },

  // ── Consulta de Credito ──

  boaVistaScpc: {
    canonicalName: 'Boa Vista SCPC',
    aliases: ['boa vista', 'scpc', 'boavista scpc', 'boa vista scpc'],
    billingDescriptors: ['BOA VISTA', 'BOAVISTA SCPC'],
    category: 'finance',
    typicalPriceRange: { min: 20, max: 45 },
    currency: 'BRL',
  },

  quod: {
    canonicalName: 'Quod',
    aliases: ['quod', 'quod.com.br'],
    billingDescriptors: ['QUOD'],
    category: 'finance',
    typicalPriceRange: { min: 15, max: 35 },
    currency: 'BRL',
  },

  spcBrasil: {
    canonicalName: 'SPC Brasil',
    aliases: ['spc brasil', 'spc', 'cndl spc'],
    billingDescriptors: ['SPC BRASIL', 'CNDL'],
    category: 'finance',
    typicalPriceRange: { min: 15, max: 45 },
    currency: 'BRL',
  },

  // ── Bancos Premium ──

  nubankUltravioleta: {
    canonicalName: 'Nubank Ultravioleta',
    aliases: ['nubank ultravioleta', 'ultravioleta'],
    billingDescriptors: ['NUBANK ULTRAVIOLETA'],
    category: 'finance',
    typicalPriceRange: { min: 49, max: 89 },
  },

  c6Carbon: {
    canonicalName: 'C6 Carbon',
    aliases: ['c6 carbon', 'c6carbon'],
    billingDescriptors: ['C6 CARBON'],
    category: 'finance',
    typicalPriceRange: { min: 85, max: 85 },
  },

  itauPersonnalite: {
    canonicalName: 'Itaú Personnalité',
    aliases: ['itau personnalite', 'personnalite'],
    billingDescriptors: ['ITAU PERSONNALITE'],
    category: 'finance',
    typicalPriceRange: { min: 30, max: 85 },
  },

  bradescoPrime: {
    canonicalName: 'Bradesco Prime',
    aliases: ['bradesco prime'],
    billingDescriptors: ['BRADESCO PRIME'],
    category: 'finance',
    typicalPriceRange: { min: 50, max: 50 },
  },

  santanderSelect: {
    canonicalName: 'Santander Select',
    aliases: ['santander select'],
    billingDescriptors: ['SANTANDER SELECT'],
    category: 'finance',
    typicalPriceRange: { min: 50, max: 85 },
  },

  // ══════════════════════════════════════════════════════════════
  // E-COMMERCE E OUTROS (17 serviços)
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

  // ── Pet ──

  petloveClub: {
    canonicalName: 'Petlove Club',
    aliases: ['petlove', 'petlove club', 'pet love'],
    billingDescriptors: ['PETLOVE', 'PET LOVE COMERCIO'],
    category: 'other',
    typicalPriceRange: { min: 13, max: 40 },
  },

  petloveSaude: {
    canonicalName: 'Petlove Saúde',
    aliases: ['petlove saude', 'pet love saude'],
    billingDescriptors: ['PETLOVE SAUDE'],
    category: 'health',
    typicalPriceRange: { min: 15, max: 100 },
  },

  petiko: {
    canonicalName: 'BOX.Petiko',
    aliases: ['petiko', 'box petiko'],
    billingDescriptors: ['PETIKO'],
    category: 'other',
    typicalPriceRange: { min: 70, max: 130 },
  },

  // ── Boxes e Clubes ──

  glambox: {
    canonicalName: 'Glambox',
    aliases: ['glambox', 'glam box', 'glam editora'],
    billingDescriptors: ['GLAMBOX', 'GLAM EDITORA'],
    category: 'other',
    typicalPriceRange: { min: 60, max: 80 },
  },

  tagLivros: {
    canonicalName: 'TAG Livros',
    aliases: ['tag livros', 'tag experiencias', 'tag editora'],
    billingDescriptors: ['TAG EXPERIENCIAS', 'TAG LIVROS'],
    category: 'other',
    typicalPriceRange: { min: 60, max: 80 },
  },

  leiturinha: {
    canonicalName: 'Leiturinha',
    aliases: ['leiturinha', 'clube leiturinha'],
    billingDescriptors: ['LEITURINHA'],
    category: 'other',
    typicalPriceRange: { min: 40, max: 100 },
  },

  cartaoDeTodos: {
    canonicalName: 'Cartão de TODOS',
    aliases: ['cartao de todos', 'cdt saude'],
    billingDescriptors: ['CARTAO DE TODOS'],
    category: 'health',
    typicalPriceRange: { min: 25, max: 35 },
  },

  // ── Coworking ──

  wework: {
    canonicalName: 'WeWork',
    aliases: ['wework', 'we work'],
    billingDescriptors: ['WEWORK'],
    category: 'other',
    typicalPriceRange: { min: 800, max: 3000 },
  },

  beerOrCoffee: {
    canonicalName: 'BeerOrCoffee',
    aliases: ['beerorcoffee', 'beer or coffee', 'boc'],
    billingDescriptors: ['BEERORCOFFEE', 'BOC'],
    category: 'other',
    typicalPriceRange: { min: 199, max: 599 },
  },

  iwgRegus: {
    canonicalName: 'IWG / Regus',
    aliases: ['iwg', 'regus', 'iwg regus'],
    billingDescriptors: ['IWG', 'REGUS'],
    category: 'other',
    typicalPriceRange: { min: 500, max: 2500 },
  },

  // ══════════════════════════════════════════════════════════════
  // DESCONTINUADOS / MIGRADOS (4 serviços)
  // ══════════════════════════════════════════════════════════════
  funimation: {
    canonicalName: 'Funimation',
    aliases: ['funimation', 'funimation.com', 'sony funimation'],
    billingDescriptors: ['FUNIMATION', 'SONY*FUNIMATION'],
    category: 'streaming',
    status: 'merged',
    mergedInto: 'crunchyroll',
    typicalPriceRange: { min: 15, max: 30 },
  },

  ufcFightPass: {
    canonicalName: 'UFC Fight Pass',
    aliases: ['ufc fight pass', 'ufc fightpass', 'zuffa'],
    billingDescriptors: ['UFC FIGHT PASS', 'UFC*FIGHTPASS', 'ZUFFA'],
    category: 'streaming',
    status: 'discontinued',
    typicalPriceRange: { min: 30, max: 50 },
    currency: 'USD',
    iofApplicable: true,
  },

  guiaBolso: {
    canonicalName: 'GuiaBolso',
    aliases: ['guiabolso', 'guia bolso'],
    billingDescriptors: ['GUIABOLSO'],
    category: 'finance',
    status: 'merged',
    mergedInto: 'picpay',
    typicalPriceRange: { min: 0, max: 20 },
  },

  animeOnegai: {
    canonicalName: 'Anime Onegai',
    aliases: ['anime onegai', 'animeonegai'],
    billingDescriptors: ['ANIME ONEGAI'],
    category: 'streaming',
    status: 'discontinued',
    typicalPriceRange: { min: 10, max: 20 },
    currency: 'BRL',
  },
} as const;
