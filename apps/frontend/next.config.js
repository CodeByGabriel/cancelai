/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Otimizações para produção
  poweredByHeader: false,
  // Configuração de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
