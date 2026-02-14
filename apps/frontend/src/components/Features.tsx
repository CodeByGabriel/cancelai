'use client';

import { Shield, Zap, Eye, Trash2 } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Seguro',
    description: 'Seus dados nunca são armazenados. Processamos e descartamos imediatamente.',
  },
  {
    icon: Zap,
    title: 'Rápido',
    description: 'Análise em segundos. Resultados instantâneos na sua tela.',
  },
  {
    icon: Eye,
    title: 'Transparente',
    description: 'Mostramos exatamente o que encontramos e porquê identificamos como assinatura.',
  },
  {
    icon: Trash2,
    title: 'Sem rastros',
    description: 'Não criamos conta, não pedimos email. Zero dados pessoais coletados.',
  },
];

export function Features() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
      {features.map((feature, index) => (
        <div
          key={index}
          className="text-center p-4 rounded-2xl hover:bg-card hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 bg-brand-muted rounded-xl flex items-center justify-center mx-auto mb-3">
            <feature.icon className="w-6 h-6 text-brand-text" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
          <p className="text-sm text-foreground-muted">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
