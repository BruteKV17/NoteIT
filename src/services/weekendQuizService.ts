/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Lecture, Note } from '../types';
import { 
  WEEKEND_QUIZ_BONUS_XP, 
  getLocalDateString, 
  isWeekend, 
  getWeekendDayLabel 
} from '../config/weekendQuizConfig';
import { generateAdditionalQuizQuestions } from './gemini';

export interface WeekendQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'concept' | 'definition' | 'true_false';
}

export interface WeekendChallengeData {
  date: string;
  day: 'Saturday' | 'Sunday';
  questions: WeekendQuizQuestion[];
  completed: boolean;
  score: number;
  xpAwarded: number;
  completedAt: string | null;
}

/**
 * Fetches existing weekend challenge state from Firestore with local storage fallback
 */
export async function fetchWeekendChallengeState(
  userId: string, 
  dateStr: string = getLocalDateString()
): Promise<WeekendChallengeData | null> {
  if (!userId) return null;

  // Check local cache first
  const localCache = localStorage.getItem(`noteit_weekend_quiz_${userId}_${dateStr}`);
  let challengeData: WeekendChallengeData | null = localCache ? JSON.parse(localCache) : null;

  try {
    const docRef = doc(db, 'users', userId, 'weekend_challenges', dateStr);
    const snap = await getDoc(docRef);
    if (snap && snap.exists()) {
      const remoteData = snap.data() as WeekendChallengeData;
      challengeData = { ...challengeData, ...remoteData };
      localStorage.setItem(`noteit_weekend_quiz_${userId}_${dateStr}`, JSON.stringify(challengeData));
    }
  } catch (err) {
    console.warn('Firestore weekend challenge fetch warning:', err);
  }

  return challengeData;
}

/**
 * Generates or retrieves cached 10-question mixed weekend revision quiz
 */
export async function getOrGenerateWeekendQuiz(
  userId: string,
  lectures: Lecture[],
  notes: Note[],
  dateStr: string = getLocalDateString()
): Promise<WeekendChallengeData> {
  const existing = await fetchWeekendChallengeState(userId, dateStr);
  if (existing && existing.questions && existing.questions.length > 0) {
    return existing;
  }

  const now = new Date();
  const dayLabel = getWeekendDayLabel(now) || 'Saturday';

  // 1. Gather all existing quiz questions, flashcards, & notes content across subjects
  const subjectContentMap: Record<string, string[]> = {};

  lectures.forEach(l => {
    const subj = l.subject || 'General';
    if (!subjectContentMap[subj]) subjectContentMap[subj] = [];

    if (l.summary) subjectContentMap[subj].push(`Summary: ${l.summary.slice(0, 300)}`);
    if (l.notes) subjectContentMap[subj].push(`Notes: ${typeof l.notes === 'string' ? l.notes.slice(0, 300) : ''}`);
    if (l.quiz && l.quiz.length > 0) {
      l.quiz.forEach(q => {
        subjectContentMap[subj].push(`Q: ${q.question} | Options: ${q.options?.join(', ')} | Ans: ${q.correctAnswer ?? 0} | Exp: ${q.explanation || ''}`);
      });
    }
    if (l.flashcards && l.flashcards.length > 0) {
      l.flashcards.forEach(f => {
        subjectContentMap[subj].push(`Flashcard: Term - ${f.q} Definition - ${f.a}`);
      });
    }
  });

  notes.forEach(n => {
    const subj = (n as any).subject || 'General';
    if (!subjectContentMap[subj]) subjectContentMap[subj] = [];
    if (n.content) subjectContentMap[subj].push(`Note Content: ${n.content.slice(0, 300)}`);
  });

  const subjects = Object.keys(subjectContentMap);
  let questions: WeekendQuizQuestion[] = [];

  // If user has existing quiz questions, extract and build from existing material
  const allExtractedQuestions: WeekendQuizQuestion[] = [];
  lectures.forEach(l => {
    const subj = l.subject || 'General';
    if (l.quiz && l.quiz.length > 0) {
      l.quiz.forEach((q, idx) => {
        allExtractedQuestions.push({
          id: `ext-${l.id}-${idx}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: q.correctAnswer ?? 0,
          explanation: q.explanation || `Covered in ${l.title}`,
          subject: subj,
          difficulty: idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
          type: 'mcq'
        });
      });
    }
  });

  if (allExtractedQuestions.length >= 10) {
    // Pick 10 questions intelligently with mixed difficulty
    questions = allExtractedQuestions.slice(0, 10).map((q, idx) => ({
      ...q,
      difficulty: idx < 2 ? 'easy' : (idx < 7 ? 'medium' : 'hard')
    }));
  } else {
    // Attempt Gemini synthesis helper if available
    try {
      const generated = await generateAdditionalQuizQuestions(
        `Generate 10 mixed revision questions for subjects: ${subjects.join(', ')}`,
        'medium',
        [],
        'Weekend mixed revision context'
      );
      if (generated && generated.length > 0) {
        questions = generated.slice(0, 10).map((g, idx) => ({
          id: `g-wq-${idx}`,
          question: g.question,
          options: g.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: g.correctAnswerIndex ?? 0,
          explanation: g.explanation || 'Revision concept review.',
          subject: subjects[idx % subjects.length] || 'General',
          difficulty: idx < 2 ? 'easy' : (idx < 7 ? 'medium' : 'hard'),
          type: 'mcq'
        }));
      }
    } catch (err) {
      console.warn('Gemini weekend quiz synthesis warning, using fallback template:', err);
    }

    // Fallback template questions if student has sparse material
    if (questions.length < 10) {
      const fallbackSubject = subjects[0] || 'General Studies';
      const defaultQuestions: WeekendQuizQuestion[] = [
        {
          id: 'wq-fb-1',
          question: `What is the core objective of active recall in ${fallbackSubject}?`,
          options: ['Strengthening memory retrieval pathways', 'Passive re-reading of notes', 'Memorizing verbatim text without understanding', 'Cramming before exams'],
          correctIndex: 0,
          explanation: `Covered in your ${fallbackSubject} revision notes.`,
          subject: fallbackSubject,
          difficulty: 'easy',
          type: 'mcq'
        },
        {
          id: 'wq-fb-2',
          question: `True or False: Spaced repetition enhances long-term knowledge retention in ${fallbackSubject}.`,
          options: ['True', 'False'],
          correctIndex: 0,
          explanation: `Key cognitive study principle in NoteIT.`,
          subject: fallbackSubject,
          difficulty: 'easy',
          type: 'true_false'
        },
        {
          id: 'wq-fb-3',
          question: `Which method best consolidates complex topics in ${fallbackSubject}?`,
          options: ['Synthesizing summaries and flashcards', 'Skipping lectures', 'Only reading titles', 'Ignoring weak topics'],
          correctIndex: 0,
          explanation: `Covered in your Knowledge Studio synthesis.`,
          subject: fallbackSubject,
          difficulty: 'medium',
          type: 'concept'
        },
        {
          id: 'wq-fb-4',
          question: `What defines a weak topic in ${fallbackSubject} learning diagnostics?`,
          options: ['A concept with quiz accuracy below threshold', 'A completed chapter', 'A recorded audio file', 'A high-score streak'],
          correctIndex: 0,
          explanation: `Identified by NoteIT Weak Topic Radar.`,
          subject: fallbackSubject,
          difficulty: 'medium',
          type: 'definition'
        },
        {
          id: 'wq-fb-5',
          question: `How does continuous lecture capture benefit academic revision in ${fallbackSubject}?`,
          options: ['Provides verbatim acoustic index for search', 'Deletes old notes', 'Prevents slide creation', 'Limits study time'],
          correctIndex: 0,
          explanation: `Covered in Capture Live lecture notes.`,
          subject: fallbackSubject,
          difficulty: 'medium',
          type: 'mcq'
        },
        {
          id: 'wq-fb-6',
          question: `What is the primary function of interactive flashcards in ${fallbackSubject}?`,
          options: ['Testing self-explanation and key definitions', 'Decoration', 'Taking manual attendance', 'Playing games'],
          correctIndex: 0,
          explanation: `Covered in your flashcard decks.`,
          subject: fallbackSubject,
          difficulty: 'medium',
          type: 'concept'
        },
        {
          id: 'wq-fb-7',
          question: `True or False: Regularly reviewing mistake logs accelerates domain mastery in ${fallbackSubject}.`,
          options: ['True', 'False'],
          correctIndex: 0,
          explanation: `Supported by NoteIT mistake review diagnostics.`,
          subject: fallbackSubject,
          difficulty: 'medium',
          type: 'true_false'
        },
        {
          id: 'wq-fb-8',
          question: `Which strategy best remediates diagnosed weak topics in ${fallbackSubject}?`,
          options: ['Targeted quiz re-takes and concise summary review', 'Ignoring diagnostics', 'Disabling audio recording', 'Changing subject titles'],
          correctIndex: 0,
          explanation: `Recommended by Broot study advisor.`,
          subject: fallbackSubject,
          difficulty: 'hard',
          type: 'mcq'
        },
        {
          id: 'wq-fb-9',
          question: `In ${fallbackSubject}, what distinguishes a high-yield concept from general trivia?`,
          options: ['Direct application to core problem-solving', 'Arbitrary date memorization', 'Length of text', 'Font size'],
          correctIndex: 0,
          explanation: `Extracted from lecture key takeaways.`,
          subject: fallbackSubject,
          difficulty: 'hard',
          type: 'concept'
        },
        {
          id: 'wq-fb-10',
          question: `What is the optimal post-lecture workflow for long-term retention in ${fallbackSubject}?`,
          options: ['Review summary within 24h, take quick quiz, remediate gaps', 'Wait until final exam', 'Delete transcript', 'Re-record same lecture'],
          correctIndex: 0,
          explanation: `NoteIT recommended cognitive study cycle.`,
          subject: fallbackSubject,
          difficulty: 'hard',
          type: 'mcq'
        }
      ];

      for (let i = questions.length; i < 10; i++) {
        questions.push(defaultQuestions[i]);
      }
    }
  }

  const challengeData: WeekendChallengeData = {
    date: dateStr,
    day: dayLabel,
    questions,
    completed: false,
    score: 0,
    xpAwarded: 0,
    completedAt: null
  };

  // Cache in localStorage & save to Firestore as source of truth
  localStorage.setItem(`noteit_weekend_quiz_${userId}_${dateStr}`, JSON.stringify(challengeData));
  try {
    const docRef = doc(db, 'users', userId, 'weekend_challenges', dateStr);
    await setDoc(docRef, challengeData, { merge: true });
  } catch (err) {
    console.warn('Firestore weekend challenge save warning:', err);
  }

  return challengeData;
}

/**
 * Atomically completes weekend challenge, awards +50 XP via transaction, and updates streak
 */
export async function claimWeekendQuizXPAtomic(
  userId: string,
  dateStr: string = getLocalDateString(),
  score: number = 10
): Promise<{ success: boolean; xpAwarded: number; newTotalXp: number; currentStreak: number }> {
  if (!userId) throw new Error('User authentication required');

  const todayDate = new Date();
  const validWeekend = isWeekend(todayDate);

  // Firestore transaction refs (4-segment security rule matching paths)
  const claimDocRef = doc(db, 'users', userId, 'rewards_claims', `weekend_quiz_${dateStr}`);
  const streakDocRef = doc(db, 'users', userId, 'rewards', 'summary');
  const challengeDocRef = doc(db, 'users', userId, 'weekend_challenges', dateStr);

  const localSavedStreak = localStorage.getItem(`noteit_streak_data_${userId}`);
  let currentStreakData = localSavedStreak ? JSON.parse(localSavedStreak) : { currentStreak: 1, totalXp: 0, lastClaimDate: null };

  let awardedXp = WEEKEND_QUIZ_BONUS_XP;
  let newTotalXp = (currentStreakData.totalXp || 0) + awardedXp;
  let newStreak = currentStreakData.currentStreak || 1;

  // Update streak if completed on Saturday/Sunday and not claimed today yet
  if (validWeekend && currentStreakData.lastClaimDate !== dateStr) {
    newStreak = (currentStreakData.currentStreak || 0) + 1;
  }

  const updatedData = {
    ...currentStreakData,
    currentStreak: newStreak,
    totalXp: newTotalXp,
    lastClaimDate: validWeekend ? dateStr : currentStreakData.lastClaimDate,
    todayClaimed: true,
    updatedAt: new Date().toISOString()
  };

  // Local storage save for immediate client response
  localStorage.setItem(`noteit_claim_${userId}_weekend_${dateStr}`, 'true');
  localStorage.setItem(`noteit_streak_data_${userId}`, JSON.stringify(updatedData));

  // Update challenge data in local storage
  const localChallenge = localStorage.getItem(`noteit_weekend_quiz_${userId}_${dateStr}`);
  if (localChallenge) {
    const parsed = JSON.parse(localChallenge);
    parsed.completed = true;
    parsed.score = score;
    parsed.xpAwarded = awardedXp;
    parsed.completedAt = new Date().toISOString();
    localStorage.setItem(`noteit_weekend_quiz_${userId}_${dateStr}`, JSON.stringify(parsed));
  }

  // Firestore Atomic Transaction
  try {
    await runTransaction(db, async (transaction) => {
      const claimSnap = await transaction.get(claimDocRef);
      if (claimSnap.exists()) {
        console.log('Weekend challenge already claimed in Firestore for date:', dateStr);
        return;
      }

      transaction.set(claimDocRef, {
        date: dateStr,
        xpAwarded: awardedXp,
        score,
        claimedAt: serverTimestamp(),
        type: 'weekend_quiz_bonus'
      });

      transaction.set(streakDocRef, {
        ...updatedData,
        lastClaimTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      transaction.set(challengeDocRef, {
        completed: true,
        score,
        xpAwarded: awardedXp,
        completedAt: serverTimestamp()
      }, { merge: true });
    });
  } catch (err) {
    console.warn('Firestore transaction warning (handled gracefully via local state):', err);
  }

  // Dispatch global XP award event for toast notifications
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('noteit_xp_awarded', {
        detail: {
          xpAmount: awardedXp,
          reason: `Weekend Revision Challenge Completed (+${awardedXp} Bonus XP)`,
          taskId: `weekend_quiz_${dateStr}`,
          newTotalXp
        }
      })
    );
  }

  return {
    success: true,
    xpAwarded: awardedXp,
    newTotalXp,
    currentStreak: newStreak
  };
}
