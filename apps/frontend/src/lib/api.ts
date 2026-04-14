/**
 * Cliente API para comunicação com o backend
 */

import type { AnalysisResult, ApiResponse } from '@/types';

// Em produção no Railway, usa URL relativa (mesmo domínio) ou NEXT_PUBLIC_API_URL
// Em desenvolvimento, usa a URL configurada ou localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:3001');

/**
 * Envia arquivos para análise
 */
export async function analyzeStatements(
  files: File[]
): Promise<ApiResponse<AnalysisResult>> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data as ApiResponse<AnalysisResult>;
  } catch (error) {
    console.error('Erro ao analisar extratos:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      },
    };
  }
}

/**
 * Inicia analise via streaming SSE
 * Retorna jobId e streamUrl para consumir eventos em tempo real
 */
export async function startStreamAnalysis(
  files: File[]
): Promise<ApiResponse<{ jobId: string; streamUrl: string }>> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  try {
    const response = await fetch(`${API_URL}/api/analyze/stream`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data as ApiResponse<{ jobId: string; streamUrl: string }>;
  } catch (error) {
    console.error('Erro ao iniciar stream:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      },
    };
  }
}

/** Base URL exportada para o SSE hook construir a URL do EventSource */
export function getApiUrl(): string {
  return API_URL as string;
}

/**
 * Verifica status da API
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// Open Finance API
// ══════════════════════════════════════════════════════════════

/**
 * Cria connect token para abrir o widget Pluggy Connect
 */
export async function createOpenFinanceLink(): Promise<ApiResponse<{ accessToken: string }>> {
  try {
    const response = await fetch(`${API_URL}/api/open-finance/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data as ApiResponse<{ accessToken: string }>;
  } catch (error) {
    console.error('Erro ao criar link Open Finance:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexao. Verifique sua internet e tente novamente.',
      },
    };
  }
}

/**
 * Lista contas de uma conexao bancaria
 */
export async function getOpenFinanceAccounts(
  itemId: string
): Promise<ApiResponse<{ accounts: Array<{ id: string; name: string; type: string; subtype: string; number: string }> }>> {
  try {
    const response = await fetch(`${API_URL}/api/open-finance/accounts/${itemId}`);
    const data = await response.json();
    return data as ApiResponse<{ accounts: Array<{ id: string; name: string; type: string; subtype: string; number: string }> }>;
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexao ao buscar contas bancarias.',
      },
    };
  }
}

/**
 * Inicia analise de transacoes via Open Finance
 */
export async function startOpenFinanceAnalysis(
  accountId: string,
  dateFrom: string,
  dateTo: string,
  bankName?: string,
): Promise<ApiResponse<{ jobId: string; streamUrl: string }>> {
  try {
    const response = await fetch(`${API_URL}/api/open-finance/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, dateFrom, dateTo, bankName }),
    });
    const data = await response.json();
    return data as ApiResponse<{ jobId: string; streamUrl: string }>;
  } catch (error) {
    console.error('Erro ao iniciar analise Open Finance:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro de conexao. Tente o upload manual de extrato.',
      },
    };
  }
}

/**
 * Revoga conexao bancaria
 */
export async function revokeOpenFinanceConnection(itemId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`${API_URL}/api/open-finance/connection/${itemId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data as ApiResponse<{ message: string }>;
  } catch (error) {
    console.error('Erro ao revogar conexao:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Erro ao revogar conexao bancaria.',
      },
    };
  }
}

/**
 * Obtém informações da API
 */
export async function getApiInfo(): Promise<{
  maxFileSize: number;
  maxFiles: number;
  allowedExtensions: string[];
} | null> {
  try {
    const response = await fetch(`${API_URL}/api/info`);
    const data = await response.json();
    if (data.success) {
      return data.data.limits;
    }
    return null;
  } catch {
    return null;
  }
}
