/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import { DoubtItem, ClassLearningAlert } from '../../types';
import { generateClassLearningAlerts } from '../../services/teacherDoubtService';

interface FacultyTeachingInsightsProps {
  doubts: DoubtItem[];
}

export default function FacultyTeachingInsights({ doubts }: FacultyTeachingInsightsProps) {
  const [alerts, setAlerts] = useState<ClassLearningAlert[]>([]);

  useEffect(() => {
    setAlerts(generateClassLearningAlerts(doubts));
  }, [doubts]);

  return (
    <div className="space-y-6">
      
      <div className="border-b border-[var(--app-border)] pb-4">
        <div className="flex items-center gap-2 text-[var(--app-brand)] font-bold text-xs font-mono uppercase tracking-wider">
          <Sparkles size={16} />
          <span>COGNITIVE TEACHING INSIGHT LAYER</span>
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-[var(--app-text)] mt-1">Smart Education & Class Learning Alerts</h1>
        <p className="text-xs font-mono text-[var(--app-muted)]">
          AI-synthesized insights generated dynamically from student doubts and quiz retention metrics
        </p>
      </div>

      {/* CLASS LEARNING ALERTS SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-heading font-extrabold text-[var(--app-text)] flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          <span>Class Learning Alerts ({alerts.length})</span>
        </h2>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--app-surface)] border border-dashed border-[var(--app-border)] text-center text-xs font-mono text-[var(--app-muted)]">
            No critical learning bottlenecks detected. Students are progressing smoothly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-5 rounded-2xl bg-[var(--app-surface)] border-2 border-amber-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--app-brand)] uppercase">{alert.subject}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-[10px]">
                    {alert.doubtCount} Student Doubts Logged
                  </span>
                </div>

                <h3 className="text-lg font-heading font-extrabold text-[var(--app-text)]">{alert.topic}</h3>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-[var(--app-text)] space-y-1">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lightbulb size={14} />
                    <span>AI Recommendation for Next Lecture:</span>
                  </div>
                  <p className="leading-relaxed">{alert.recommendation}</p>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-[var(--app-muted)] pt-2 border-t border-[var(--app-border)]">
                  <span>Class Quiz Accuracy: <strong className="text-amber-500">{alert.quizAccuracy}%</strong></span>
                  <span className="text-xs font-bold text-[var(--app-brand)]">Priority: {alert.severity.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYNTHESIZED TEACHING RECOMMENDATIONS */}
      <div className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-4 shadow-sm">
        <h2 className="text-lg font-heading font-extrabold text-[var(--app-text)]">Curriculum Optimization Recommendations</h2>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--app-text)]">1. Revisit Circular Wait Condition in Lecture 12</span>
              <span className="text-emerald-500 font-bold">Recommended</span>
            </div>
            <p className="text-[var(--app-muted)] leading-relaxed">
              14 students asked questions regarding why circular wait occurs even when process resource requirements differ. Adding a 5-minute visual diagram recap in the next class will resolve 80% of pending doubts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--app-text)]">2. High Mastery in Process Synchronization</span>
              <span className="text-emerald-500 font-bold">Validated</span>
            </div>
            <p className="text-[var(--app-muted)] leading-relaxed">
              89% accuracy recorded across 58 quiz submissions for Semaphores and Mutexes. Students are ready to proceed to Advanced Inter-Process Communication.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
