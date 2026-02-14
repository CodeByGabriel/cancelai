'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

const options = [
  { value: 'system', icon: Monitor, label: 'Sistema' },
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Escuro' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[108px] rounded-lg bg-elevated" />;
  }

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-elevated" role="radiogroup" aria-label="Tema">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-md transition-colors ${
            theme === value
              ? 'bg-card text-brand shadow-sm'
              : 'text-foreground-muted hover:text-foreground-secondary'
          }`}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
