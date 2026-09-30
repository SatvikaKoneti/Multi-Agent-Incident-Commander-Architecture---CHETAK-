import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-ink-950/70 p-2 text-slate-400 transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/[0.08] hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 active:scale-95 ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 text-amber-400 transition-transform duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 text-cyan-300 transition-transform duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-300 transition-colors group-hover:text-cyan-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
