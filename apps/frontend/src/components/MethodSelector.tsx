'use client';

import { useState } from 'react';
import { m } from 'motion/react';
import { Upload, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

type Method = 'upload' | 'open-finance';

interface MethodSelectorProps {
  onMethodChange: (method: Method) => void;
}

export function MethodSelector({ onMethodChange }: MethodSelectorProps) {
  const [selected, setSelected] = useState<Method>('upload');

  const handleSelect = (method: Method) => {
    setSelected(method);
    onMethodChange(method);
  };

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-elevated rounded-xl p-1.5 gap-1 relative">
        <button
          onClick={() => handleSelect('upload')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            selected === 'upload'
              ? 'text-foreground'
              : 'text-foreground-muted hover:text-foreground-secondary'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload de extrato
        </button>
        <button
          onClick={() => handleSelect('open-finance')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            selected === 'open-finance'
              ? 'text-foreground'
              : 'text-foreground-muted hover:text-foreground-secondary'
          )}
        >
          <Landmark className="w-4 h-4" />
          Conectar banco
        </button>

        {/* Animated indicator */}
        <m.div
          className="absolute top-1.5 bottom-1.5 bg-card rounded-lg shadow-sm"
          layoutId="method-indicator"
          style={{
            left: selected === 'upload' ? '6px' : '50%',
            right: selected === 'upload' ? '50%' : '6px',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>
    </div>
  );
}
