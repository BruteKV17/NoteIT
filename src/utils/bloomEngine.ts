/**
 * Bloom's Taxonomy Learning Strategy Engine
 * Internal adaptive intelligence for mapping student mastery across Bloom's 6 cognitive levels.
 */

export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';

export interface BloomProfile {
  rememberScore: number;   // 0 - 100
  understandScore: number; // 0 - 100
  applyScore: number;      // 0 - 100
  analyzeScore: number;    // 0 - 100
  evaluateScore: number;   // 0 - 100
  createScore: number;     // 0 - 100
  dominantWeakness: BloomLevel;
  recommendedFocus: BloomLevel[];
  summaryInsight: string;
}

/**
 * Calculates adaptive Bloom profile from student history and quiz/practice scores
 */
export function calculateBloomProfile(scores?: {
  easy?: number;
  medium?: number;
  hard?: number;
  remember?: number;
  understand?: number;
  apply?: number;
  analyze?: number;
}): BloomProfile {
  const rememberScore = scores?.remember ?? Math.min(100, Math.max(50, (scores?.easy ?? 75) + 15));
  const understandScore = scores?.understand ?? Math.min(100, Math.max(45, (scores?.easy ?? 70) + 10));
  const applyScore = scores?.apply ?? Math.min(100, Math.max(35, (scores?.medium ?? 60)));
  const analyzeScore = scores?.analyze ?? Math.min(100, Math.max(25, (scores?.hard ?? 45)));
  const evaluateScore = Math.min(100, Math.max(20, Math.round((applyScore + analyzeScore) / 2) - 5));
  const createScore = Math.min(100, Math.max(15, Math.round(analyzeScore * 0.85)));

  const levels: { level: BloomLevel; score: number }[] = [
    { level: 'Remember', score: rememberScore },
    { level: 'Understand', score: understandScore },
    { level: 'Apply', score: applyScore },
    { level: 'Analyze', score: analyzeScore },
    { level: 'Evaluate', score: evaluateScore },
    { level: 'Create', score: createScore }
  ];

  levels.sort((a, b) => a.score - b.score);
  const dominantWeakness = levels[0].level;
  const recommendedFocus = levels.slice(0, 2).map(l => l.level);

  let summaryInsight = '';
  if (rememberScore >= 80 && applyScore < 65) {
    summaryInsight = 'Your theoretical recall is strong, but application and analysis need targeted practice.';
  } else if (applyScore >= 75 && analyzeScore < 60) {
    summaryInsight = 'Good practical problem-solving capability. Focus on deep debugging and analytical trade-offs.';
  } else if (rememberScore < 60) {
    summaryInsight = 'Strengthen foundational definitions, key formulas, and core concepts first.';
  } else {
    summaryInsight = 'Balanced mastery across fundamental levels. Ready for high-order analytical & design challenges.';
  }

  return {
    rememberScore,
    understandScore,
    applyScore,
    analyzeScore,
    evaluateScore,
    createScore,
    dominantWeakness,
    recommendedFocus,
    summaryInsight
  };
}

/**
 * Maps Bloom levels to user-facing badges and learning actions
 */
export function getBloomLevelMetadata(level: BloomLevel) {
  switch (level) {
    case 'Remember':
      return { label: 'Remember', color: '#3B82F6', icon: '🧠', description: 'Definitions, formulas & facts' };
    case 'Understand':
      return { label: 'Understand', color: '#10B981', icon: '💡', description: 'Explanations & core concepts' };
    case 'Apply':
      return { label: 'Apply', color: '#F59E0B', icon: '⚙️', description: 'Numerical & scenario problems' };
    case 'Analyze':
      return { label: 'Analyze', color: '#EF4444', icon: '🔍', description: 'Debugging & mistake identification' };
    case 'Evaluate':
      return { label: 'Evaluate', color: '#8B5CF6', icon: '⚖️', description: 'Trade-off comparison & choices' };
    case 'Create':
      return { label: 'Create', color: '#EC4899', icon: '🚀', description: 'System design & synthesis' };
  }
}
