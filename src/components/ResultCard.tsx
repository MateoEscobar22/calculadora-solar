import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ResultCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accent?: 'amber' | 'green' | 'blue' | 'red' | 'neutral';
  description?: string;
  className?: string;
}

const accentClasses: Record<string, { icon: string; border: string; glow: string }> = {
  amber: {
    icon: 'text-solar bg-solar/10',
    border: 'border-solar/20',
    glow: 'solar-glow',
  },
  green: {
    icon: 'text-solar-green bg-solar-green/10',
    border: 'border-solar-green/20',
    glow: 'solar-glow-green',
  },
  blue: {
    icon: 'text-sky-400 bg-sky-400/10',
    border: 'border-sky-400/20',
    glow: '',
  },
  red: {
    icon: 'text-red-400 bg-red-400/10',
    border: 'border-red-400/20',
    glow: '',
  },
  neutral: {
    icon: 'text-muted-foreground bg-muted',
    border: 'border-border',
    glow: '',
  },
};

export function ResultCard({
  label,
  value,
  unit,
  icon,
  accent = 'neutral',
  description,
  className,
}: ResultCardProps) {
  const styles = accentClasses[accent];
  return (
    <Card
      className={cn(
        'relative overflow-hidden border bg-card/80 backdrop-blur-sm transition-all hover:scale-[1.02] hover:-translate-y-0.5',
        styles.border,
        styles.glow,
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-foreground tabular-nums">
                {value}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              styles.icon
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
