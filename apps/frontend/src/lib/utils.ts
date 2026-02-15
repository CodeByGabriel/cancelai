/**
 * Utilitários do frontend
 */

/**
 * Formata valor em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata data no padrão brasileiro
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Retorna cor baseada na confiança
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}

/**
 * Retorna label da confiança em português
 */
export function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
  }
}

/**
 * Retorna ícone da categoria
 */
export function getCategoryIcon(category?: string): string {
  switch (category) {
    case 'streaming':
      return '🎬';
    case 'music':
      return '🎵';
    case 'gaming':
      return '🎮';
    case 'software':
      return '💻';
    case 'news':
      return '📰';
    case 'fitness':
      return '💪';
    case 'health':
      return '🏥';
    case 'insurance':
      return '🛡️';
    case 'food':
      return '🍕';
    case 'transport':
      return '🚗';
    case 'education':
      return '📚';
    case 'telecom':
      return '📱';
    case 'security':
      return '🔒';
    case 'dating':
      return '💕';
    case 'finance':
      return '💰';
    default:
      return '📦';
  }
}

/**
 * Retorna nome da categoria em português
 */
export function getCategoryLabel(category?: string): string {
  switch (category) {
    case 'streaming':
      return 'Streaming';
    case 'music':
      return 'Música';
    case 'gaming':
      return 'Jogos';
    case 'software':
      return 'Software';
    case 'news':
      return 'Notícias';
    case 'fitness':
      return 'Academia';
    case 'health':
      return 'Saúde';
    case 'insurance':
      return 'Seguros';
    case 'food':
      return 'Delivery';
    case 'transport':
      return 'Transporte';
    case 'education':
      return 'Educação';
    case 'telecom':
      return 'Telecom';
    case 'security':
      return 'Segurança';
    case 'dating':
      return 'Namoro';
    case 'finance':
      return 'Finanças';
    default:
      return 'Outros';
  }
}

/**
 * Classnames helper (simples, sem dependência)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formata score de confiança como porcentagem
 */
export function formatConfidenceScore(score?: number): string {
  if (score === undefined || score === null) return '';
  return `${Math.round(score * 100)}%`;
}

/**
 * Retorna cor da barra de progresso baseada no score
 */
export function getScoreBarColor(score: number): string {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-yellow-500';
  return 'bg-gray-400 dark:bg-gray-600';
}

/**
 * Calcula economia potencial se cancelar assinaturas de baixa confiança
 */
export function calculatePotentialSavings(
  subscriptions: { confidence: 'high' | 'medium' | 'low'; annualAmount: number }[]
): number {
  return subscriptions
    .filter((s) => s.confidence === 'low' || s.confidence === 'medium')
    .reduce((sum, s) => sum + s.annualAmount, 0);
}

/**
 * Formata valor como impacto financeiro (mais enfático)
 */
export function formatImpact(value: number): string {
  if (value >= 10000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}
