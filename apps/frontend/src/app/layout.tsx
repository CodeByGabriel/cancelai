import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cancelai.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Cancelai — Descubra assinaturas esquecidas',
    template: '%s | Cancelai',
  },
  description:
    'Envie seus extratos bancarios e descubra quanto voce gasta com assinaturas que talvez nem lembre mais. 500+ servicos reconhecidos. Gratuito e sem cadastro.',
  keywords: [
    'assinaturas',
    'cancelar assinatura',
    'extrato bancario',
    'economia',
    'financas pessoais',
    'Netflix',
    'Spotify',
    'gastos recorrentes',
    'cancelar Netflix',
    'cancelar Spotify',
  ],
  authors: [{ name: 'Cancelai' }],
  openGraph: {
    title: 'Cancelai — Descubra assinaturas esquecidas',
    description: 'Envie seus extratos bancarios e descubra quanto voce gasta com assinaturas. 500+ servicos reconhecidos. Gratuito e privado.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Cancelai',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cancelai — Descubra assinaturas esquecidas',
    description: 'Envie seus extratos bancarios e descubra quanto voce gasta com assinaturas. Gratuito e sem cadastro.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={dmSans.variable}>
      <body className="min-h-screen bg-background font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
