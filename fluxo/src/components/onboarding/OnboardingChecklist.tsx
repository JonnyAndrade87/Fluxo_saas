'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingStatus } from '@/actions/onboarding';

interface Props {
  status: OnboardingStatus;
}

export default function OnboardingChecklist({ status }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Do not render if user dismissed or all steps complete
  if (dismissed || status.isComplete) return null;

  const pct = Math.round((status.completedCount / status.steps.length) * 100);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-obsidian">Primeiros passos no Fluxo</h3>
            <p className="text-xs text-muted-foreground">
              {status.completedCount} de {status.steps.length} etapas concluídas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="rounded-full p-1.5 hover:bg-indigo-100 text-muted-foreground hover:text-indigo-600 transition-colors"
            aria-label={expanded ? 'Recolher' : 'Expandir'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-full p-1.5 hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors"
            aria-label="Dispensar onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-indigo-500 font-semibold mt-1">{pct}% concluído</p>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="border-t border-indigo-100 divide-y divide-indigo-50">
          {status.steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                step.completed ? 'opacity-50' : 'hover:bg-indigo-50/60'
              }`}
            >
              {/* Step number / check */}
              <div className="shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <div className="relative">
                    <Circle className="w-5 h-5 text-indigo-200" />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-400">
                      {idx + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${step.completed ? 'text-muted-foreground line-through' : 'text-obsidian'}`}>
                  {step.label}
                </p>
                {!step.completed && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>

              {/* CTA */}
              {!step.completed && (
                <Link href={step.href}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 text-[11px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-semibold gap-1"
                  >
                    Ir <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
