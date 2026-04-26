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
      return 'bg-olive-100 text-olive-700 border-olive-300 dark:bg-[rgba(107,122,63,0.18)] dark:text-olive-300 dark:border-[rgba(183,194,130,0.3)]';
    case 'medium':
      return 'bg-ochre-100 text-ochre-700 border-ochre-300 dark:bg-[rgba(181,126,44,0.15)] dark:text-ochre-300 dark:border-[rgba(237,197,133,0.3)]';
    case 'low':
      return 'bg-elevated text-foreground-muted border-border-strong dark:bg-elevated dark:text-foreground-muted dark:border-border-strong';
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
  if (score >= 0.8) return 'bg-olive-600';
  if (score >= 0.6) return 'bg-ochre-500';
  return 'bg-clay-400 dark:bg-clay-600';
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
