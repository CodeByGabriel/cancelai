'use client';

/**
 * ClientOnly - Wrapper para componentes que devem renderizar apenas no cliente
 *
 * PROBLEMA RESOLVIDO:
 * O Next.js 14 com App Router pode ter hydration mismatch quando:
 * - Componentes dependem de APIs do browser (window, document, etc)
 * - Icones do lucide-react renderizam de forma diferente no server
 * - Estado inicial difere entre server e client
 *
 * SOLUCAO:
 * Este wrapper garante que o conteudo so seja renderizado apos a montagem
 * no cliente, evitando qualquer diferenca entre server e client HTML.
 *
 * USO:
 * Envolva componentes que causam hydration mismatch com este wrapper.
 * O fallback (opcional) e mostrado durante o SSR e primeira renderizacao.
 */

import { useEffect, useState, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Durante SSR e primeira renderizacao, mostra o fallback
  // Isso garante que server e client renderizem a mesma coisa inicialmente
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
