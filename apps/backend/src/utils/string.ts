/**
 * Utilitários de manipulação de strings para o Cancelaí
 *
 * Funções especializadas para normalização de descrições bancárias brasileiras.
 */

import stringSimilarity from 'string-similarity';

/**
 * Normaliza uma descrição de transação para comparação
 *
 * Remove caracteres especiais, normaliza espaços, converte para minúsculas.
 * Mantém apenas informações relevantes para identificação do serviço.
 */
export function normalizeDescription(description: string): string {
  return (
    description
      .toLowerCase()
      // Remove códigos de autorização comuns em extratos brasileiros
      .replace(/\b\d{6,}\b/g, '')
      // Remove datas no formato DD/MM ou DD/MM/YY
      .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')
      // Remove horários
      .replace(/\d{2}:\d{2}(:\d{2})?/g, '')
      // Remove caracteres especiais mas mantém espaços
      .replace(/[^\w\s]/g, ' ')
      // Normaliza múltiplos espaços
      .replace(/\s+/g, ' ')
      // Remove prefixos comuns de bancos
      .replace(
        /^(pag\*|pagamento|compra|deb|cred|pix|ted|doc|transf|transferencia)\s*/i,
        ''
      )
      .trim()
  );
}

/**
 * Extrai o nome provável do serviço de uma descrição
 *
 * Tenta identificar o nome comercial removendo ruídos comuns.
 */
export function extractServiceName(description: string): string {
  const normalized = normalizeDescription(description);

  // Pega as primeiras palavras significativas (geralmente o nome do serviço)
  const words = normalized.split(' ').filter((w) => w.length > 2);
  const significantWords = words.slice(0, 3);

  return significantWords.join(' ') || normalized;
}

/**
 * Calcula similaridade entre duas descrições
 *
 * Usa o algoritmo Dice's Coefficient que é eficiente para strings curtas.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeDescription(str1);
  const normalized2 = normalizeDescription(str2);

  // Strings idênticas após normalização
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Uma das strings está vazia
  if (!normalized1 || !normalized2) {
    return 0;
  }

  return stringSimilarity.compareTwoStrings(normalized1, normalized2);
}

/**
 * Agrupa strings similares
 *
 * Útil para agrupar variações de um mesmo serviço.
 */
export function groupSimilarStrings(
  strings: string[],
  threshold: number
): string[][] {
  const groups: string[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < strings.length; i++) {
    if (used.has(i)) continue;

    const group: string[] = [strings[i]!];
    used.add(i);

    for (let j = i + 1; j < strings.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(strings[i]!, strings[j]!);
      if (similarity >= threshold) {
        group.push(strings[j]!);
        used.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Remove acentos de uma string
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera um hash simples para deduplicação de transações
 *
 * SEGURANÇA: Não é criptográfico, apenas para deduplicação em memória.
 */
export function generateTransactionHash(
  date: Date,
  amount: number,
  description: string
): string {
  const dateStr = date.toISOString().split('T')[0];
  const amountStr = amount.toFixed(2);
  const descNorm = normalizeDescription(description).substring(0, 50);

  // Hash simples baseado em string
  let hash = 0;
  const combined = `${dateStr}|${amountStr}|${descNorm}`;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converte para 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Capitaliza o nome de um serviço para exibição
 */
export function capitalizeServiceName(name: string): string {
  // Serviços com capitalização específica
  const specialCases: Record<string, string> = {
    netflix: 'Netflix',
    spotify: 'Spotify',
    'amazon prime': 'Amazon Prime',
    'disney+': 'Disney+',
    'disney plus': 'Disney+',
    'hbo max': 'HBO Max',
    max: 'Max',
    globoplay: 'Globoplay',
    youtube: 'YouTube',
    'youtube music': 'YouTube Music',
    'youtube premium': 'YouTube Premium',
    xbox: 'Xbox',
    playstation: 'PlayStation',
    steam: 'Steam',
    adobe: 'Adobe',
    'microsoft 365': 'Microsoft 365',
    dropbox: 'Dropbox',
    'google one': 'Google One',
    icloud: 'iCloud',
    ifood: 'iFood',
    uber: 'Uber',
    rappi: 'Rappi',
    duolingo: 'Duolingo',
    linkedin: 'LinkedIn',
    canva: 'Canva',
    deezer: 'Deezer',
    'smart fit': 'Smart Fit',
    gympass: 'Gympass',
    wellhub: 'Wellhub',
    alura: 'Alura',
    coursera: 'Coursera',
  };

  const lower = name.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  // Capitalização padrão: primeira letra de cada palavra
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
