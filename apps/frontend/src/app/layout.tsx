import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cancelaí - Encontre assinaturas esquecidas',
  description:
    'Descubra assinaturas recorrentes escondidas nos seus extratos bancários. Analise seus gastos e economize dinheiro cancelando o que não usa mais.',
  keywords: [
    'assinaturas',
    'cancelar assinatura',
    'extrato bancário',
    'economia',
    'finanças pessoais',
    'Netflix',
    'Spotify',
    'gastos recorrentes',
  ],
  authors: [{ name: 'Cancelaí' }],
  openGraph: {
    title: 'Cancelaí - Encontre assinaturas esquecidas',
    description: 'Descubra quanto você gasta com assinaturas e economize',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans">
        {children}
      </body>
    </html>
  );
}
