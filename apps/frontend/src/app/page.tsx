/**
 * Pagina Inicial do Cancelai
 *
 * ARQUITETURA - HYDRATION:
 * Esta pagina e um Server Component que renderiza o HomeContent (Client Component).
 * Essa separacao evita erros de hydration porque:
 *
 * 1. O Server Component (esta pagina) renderiza de forma consistente
 * 2. O Client Component (HomeContent) gerencia seu proprio estado de montagem
 * 3. O HomeContent renderiza um placeholder durante SSR que tem a mesma estrutura
 *
 * IMPORTANTE:
 * - NAO adicione 'use client' neste arquivo
 * - Toda logica interativa deve ficar no HomeContent
 * - Este arquivo deve permanecer como Server Component
 */

import { HomeContent } from '@/components';

export default function Home() {
  return <HomeContent />;
}
