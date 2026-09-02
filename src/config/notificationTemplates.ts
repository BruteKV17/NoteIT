/**
 * Manually Controlled Notification Library for NoteIT AI
 * Defines message templates, categories, prioritization, and delivery constraints.
 */

export interface NotificationTemplate {
  id: string;
  category: string;
  title: string;
  body: string;
  enabled: boolean;
  priority: 'normal' | 'high';
  route: string;
  fallbackTitle?: string;
  requiresCondition?: 'unclaimedDailyXp' | 'activeStreakUnclaimed' | 'hasLearningKit' | 'hasLecturesToRevise' | 'untouchedChallenge';
}

export const SCHEDULER_CONFIG = {
  MAX_NORMAL_NOTIFICATIONS_PER_DAY: 2,
  MIN_NOTIFICATION_COOLDOWN_MS: 4 * 60 * 60 * 1000, // 4 hours
  STREAK_WARNING_HOUR: 20, // 8 PM local time
  DEFAULT_VAPID_KEY: "BDN_noteit_web_push_vapid_key_placeholder"
};

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ==================================================
  // CATEGORY 1 — YOU MISSED SOMETHING (MISSED_SOMETHING)
  // ==================================================
  {
    id: "missed_01",
    category: "MISSED_SOMETHING",
    title: "we found something you missed 👀",
    body: "want to know what?",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_02",
    category: "MISSED_SOMETHING",
    title: "there’s a tiny detail in yesterday’s lecture…",
    body: "and it might actually matter.",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_03",
    category: "MISSED_SOMETHING",
    title: "your professor said something important.",
    body: "we saved it. did you?",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_04",
    category: "MISSED_SOMETHING",
    title: "you remember that confusing part?",
    body: "yeah… we found it. 👀",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_05",
    category: "MISSED_SOMETHING",
    title: "something in your lecture stood out.",
    body: "we're not spoiling it. 😌",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_06",
    category: "MISSED_SOMETHING",
    title: "we found the important bit.",
    body: "you should probably see it.",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "missed_07",
    category: "MISSED_SOMETHING",
    title: "🚨 lecture investigation complete",
    body: "we found 3 things worth revising.",
    enabled: true,
    priority: "normal",
    route: "/academic-library",
    requiresCondition: "hasLecturesToRevise"
  },

  // ==================================================
  // CATEGORY 2 — DO YOU ACTUALLY REMEMBER? (MEMORY_CHECK)
  // ==================================================
  {
    id: "remember_01",
    category: "MEMORY_CHECK",
    title: "be honest…",
    body: "could you explain yesterday's lecture right now? 👀",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_02",
    category: "MEMORY_CHECK",
    title: "you understood it yesterday.",
    body: "let's see if your brain still agrees. 🧠",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_03",
    category: "MEMORY_CHECK",
    title: "we have a question.",
    body: "and your memory is about to answer it. 💀",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_04",
    category: "MEMORY_CHECK",
    title: "your brain says ‘easy.’",
    body: "okay. prove it.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_05",
    category: "MEMORY_CHECK",
    title: "you said ‘haan haan samajh gaya.’",
    body: "we made a quiz. 😭",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_06",
    category: "MEMORY_CHECK",
    title: "quick memory check?",
    body: "5 questions. zero professor judgement.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "remember_07",
    category: "MEMORY_CHECK",
    title: "don't worry, it's easy.",
    body: "(famous last words) 💀",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },

  // ==================================================
  // CATEGORY 3 — FUTURE YOU (FUTURE_YOU)
  // ==================================================
  {
    id: "future_01",
    category: "FUTURE_YOU",
    title: "future you just sent a message.",
    body: "PLEASE revise this. 😭",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "future_02",
    category: "FUTURE_YOU",
    title: "tomorrow's you has a problem.",
    body: "today's you can fix it.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "future_03",
    category: "FUTURE_YOU",
    title: "future you is going to ask…",
    body: "why didn't I revise this? 💀",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "future_04",
    category: "FUTURE_YOU",
    title: "exam-you would like a word.",
    body: "apparently current-you has some explaining to do.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "future_05",
    category: "FUTURE_YOU",
    title: "you have two options:",
    body: "revise now or meet this topic again at 2 AM. 👀",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "future_06",
    category: "FUTURE_YOU",
    title: "future-you is watching.",
    body: "make them proud. 🫡",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 4 — YOUR PROGRESS IS WAITING (PROGRESS_WAITING)
  // ==================================================
  {
    id: "progress_01",
    category: "PROGRESS_WAITING",
    title: "your +10 XP is literally waiting for you.",
    body: "don't leave it on read. 😭",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "progress_02",
    category: "PROGRESS_WAITING",
    title: "10+ XP available.",
    body: "zero studying required. just show up.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "progress_03",
    category: "PROGRESS_WAITING",
    title: "you’re one login away from today's XP.",
    body: "that’s it. that's the notification.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "progress_04",
    category: "PROGRESS_WAITING",
    title: "your daily XP hasn't been claimed.",
    body: "we're just saying. 👀",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "progress_05",
    category: "PROGRESS_WAITING",
    title: "FREE XP?",
    body: "yes. this time we're serious.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "progress_06",
    category: "PROGRESS_WAITING",
    title: "your XP bar is waiting.",
    body: "open NoteIT and see what's next. 👀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 5 — WE KNOW SOMETHING YOU DON'T (CURIOSITY)
  // ==================================================
  {
    id: "curiosity_01",
    category: "CURIOSITY",
    title: "we noticed something about your lectures…",
    body: "you might want to see this. 👀",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "curiosity_02",
    category: "CURIOSITY",
    title: "we checked your latest lecture.",
    body: "interesting. very interesting.",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "curiosity_03",
    category: "CURIOSITY",
    title: "your lecture has a secret.",
    body: "okay, not literally. but open it. 😭",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "curiosity_04",
    category: "CURIOSITY",
    title: "we found a pattern in your notes.",
    body: "want to see it?",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "curiosity_05",
    category: "CURIOSITY",
    title: "we have some information.",
    body: "you have 7 seconds to open this. 👀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "curiosity_06",
    category: "CURIOSITY",
    title: "we could tell you…",
    body: "but where's the fun in that?",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 6 — YOU'VE ALREADY DONE THE HARD PART (HARD_PART_DONE)
  // ==================================================
  {
    id: "hard_01",
    category: "HARD_PART_DONE",
    title: "you already attended the lecture.",
    body: "now let us do the boring part. 😌",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "hard_02",
    category: "HARD_PART_DONE",
    title: "you listened for 50 minutes.",
    body: "give us 30 seconds.",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "hard_03",
    category: "HARD_PART_DONE",
    title: "lecture = done ✅",
    body: "revision = waiting 👀",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "hard_04",
    category: "HARD_PART_DONE",
    title: "you did the hard part.",
    body: "your learning kit is ready.",
    enabled: true,
    priority: "normal",
    route: "/academic-library",
    requiresCondition: "hasLearningKit"
  },
  {
    id: "hard_05",
    category: "HARD_PART_DONE",
    title: "no notes to write.",
    body: "we already made them. 😌",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "hard_06",
    category: "HARD_PART_DONE",
    title: "you don't need to remember everything.",
    body: "that's literally our job.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 7 — PERSONAL CHALLENGE (PERSONAL_CHALLENGE)
  // ==================================================
  {
    id: "personal_01",
    category: "PERSONAL_CHALLENGE",
    title: "okay [name]…",
    body: "let's see what you actually remember. 👀",
    fallbackTitle: "okay scholar…",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "personal_02",
    category: "PERSONAL_CHALLENGE",
    title: "[name], we have a challenge.",
    body: "5 questions. that's all.",
    fallbackTitle: "hey scholar, we have a challenge.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "personal_03",
    category: "PERSONAL_CHALLENGE",
    title: "hey [name] 👋",
    body: "your brain has unfinished business.",
    fallbackTitle: "hey scholar 👋",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "personal_04",
    category: "PERSONAL_CHALLENGE",
    title: "[name] vs. yesterday's lecture.",
    body: "round 1 starts now. 🥊",
    fallbackTitle: "you vs. yesterday's lecture.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "personal_05",
    category: "PERSONAL_CHALLENGE",
    title: "[name]…",
    body: "your +10 XP is getting impatient. 😭",
    fallbackTitle: "hey scholar…",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },

  // ==================================================
  // CATEGORY 8 — FRIENDLY ROAST CATEGORY (FRIENDLY_ROAST)
  // ==================================================
  {
    id: "roast_01",
    category: "FRIENDLY_ROAST",
    title: "you opened Instagram.",
    body: "NoteIT saw that. 👁️👄👁️",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_02",
    category: "FRIENDLY_ROAST",
    title: "you remembered that meme from 2019.",
    body: "but not yesterday's lecture? 😭",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "roast_03",
    category: "FRIENDLY_ROAST",
    title: "your screen time is impressive.",
    body: "your revision time could use some competition.",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_04",
    category: "FRIENDLY_ROAST",
    title: "you said ‘bas 5 min reels.’",
    body: "we've been waiting. 💀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "roast_05",
    category: "FRIENDLY_ROAST",
    title: "your notes have been sitting here…",
    body: "like an abandoned group project.",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "roast_06",
    category: "FRIENDLY_ROAST",
    title: "attendance: secured ✅",
    body: "knowledge: loading… 👀",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "roast_07",
    category: "FRIENDLY_ROAST",
    title: "you survived the lecture.",
    body: "now survive the quiz. 🫡",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },

  // ==================================================
  // CATEGORY 9 — REAL FOMO CATEGORY (REAL_FOMO)
  // ==================================================
  {
    id: "fomo_01",
    category: "REAL_FOMO",
    title: "TODAY'S +10 XP 🚨",
    body: "still waiting for you.",
    enabled: true,
    priority: "normal",
    route: "/rewards",
    requiresCondition: "unclaimedDailyXp"
  },
  {
    id: "fomo_02",
    category: "REAL_FOMO",
    title: "today's challenge is still untouched 👀",
    body: "your move.",
    enabled: true,
    priority: "normal",
    route: "/quiz",
    requiresCondition: "untouchedChallenge"
  },
  {
    id: "fomo_03",
    category: "REAL_FOMO",
    title: "your streak is alive.",
    body: "don't make it awkward now. 🥲",
    enabled: true,
    priority: "normal",
    route: "/rewards",
    requiresCondition: "activeStreakUnclaimed"
  },
  {
    id: "fomo_04",
    category: "REAL_FOMO",
    title: "your latest learning kit is ready.",
    body: "your classmates are still making notes. 😭",
    enabled: true,
    priority: "normal",
    route: "/academic-library",
    requiresCondition: "hasLearningKit"
  },

  // ==================================================
  // CATEGORY 10 — OPEN-TO-COMPLETE-THE-STORY (COMPLETE_STORY)
  // ==================================================
  {
    id: "story_01",
    category: "COMPLETE_STORY",
    title: "we made 5 questions from today's lecture. 👀",
    body: "let's see what you actually remember.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "story_02",
    category: "COMPLETE_STORY",
    title: "we know which part you probably forgot.",
    body: "prove us wrong. 🧠",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },

  // ==================================================
  // CATEGORY 11 — REVERSE PSYCHOLOGY (REVERSE_PSYCHOLOGY)
  // ==================================================
  {
    id: "reverse_01",
    category: "REVERSE_PSYCHOLOGY",
    title: "don't open this.",
    body: "unless you want today's +10 XP. 👀",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "reverse_02",
    category: "REVERSE_PSYCHOLOGY",
    title: "seriously, don't.",
    body: "your quiz is waiting anyway.",
    enabled: true,
    priority: "normal",
    route: "/quiz"
  },
  {
    id: "reverse_03",
    category: "REVERSE_PSYCHOLOGY",
    title: "you probably shouldn't check your lecture.",
    body: "we definitely didn't find anything interesting. 😌",
    enabled: true,
    priority: "normal",
    route: "/academic-library"
  },
  {
    id: "reverse_04",
    category: "REVERSE_PSYCHOLOGY",
    title: "ignore this notification.",
    body: "your academic comeback won't mind. 💀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },
  {
    id: "reverse_05",
    category: "REVERSE_PSYCHOLOGY",
    title: "DO NOT OPEN.",
    body: "unless you're curious. 👀",
    enabled: true,
    priority: "normal",
    route: "/dashboard"
  },

  // ==================================================
  // CATEGORY 12 — XP CURRENCY CATEGORY (XP_CURRENCY)
  // ==================================================
  {
    id: "xp_01",
    category: "XP_CURRENCY",
    title: "+10 XP sitting on the counter 🪙",
    body: "claim it.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "xp_02",
    category: "XP_CURRENCY",
    title: "XP drop detected 🚨",
    body: "10+ points available.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "xp_03",
    category: "XP_CURRENCY",
    title: "your XP wallet is looking empty.",
    body: "we can fix that. 😌",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "xp_04",
    category: "XP_CURRENCY",
    title: "another day, another +10 XP.",
    body: "we love easy wins.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "xp_05",
    category: "XP_CURRENCY",
    title: "XP acquired? 👀",
    body: "if not, you know what to do.",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },
  {
    id: "xp_06",
    category: "XP_CURRENCY",
    title: "your academic bank account is open.",
    body: "deposit +10 XP. 🫡",
    enabled: true,
    priority: "normal",
    route: "/rewards"
  },

  // ==================================================
  // SPECIAL HIGH-PRIORITY DAILY STREAK BREAK WARNINGS (STREAK_WARNING)
  // ==================================================
  {
    id: "streak_warn_default",
    category: "STREAK_WARNING",
    title: "your streak is about to break. 🥲",
    body: "come back to NoteIT and keep it alive.",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_01",
    category: "STREAK_WARNING",
    title: "your streak is still alive. 👀",
    body: "don't let today be the day it ends.",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_02",
    category: "STREAK_WARNING",
    title: "your streak called.",
    body: "it wants you back. 🥲",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_03",
    category: "STREAK_WARNING",
    title: "🚨 streak warning",
    body: "one quick visit to NoteIT could save it.",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_04",
    category: "STREAK_WARNING",
    title: "your academic streak is hanging by a thread.",
    body: "come maintain it before the day ends. 🫡",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_05",
    category: "STREAK_WARNING",
    title: "future-you will hate this.",
    body: "your streak is about to disappear. 👀",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_06",
    category: "STREAK_WARNING",
    title: "don't break the chain.",
    body: "your streak is waiting for you.",
    enabled: true,
    priority: "high",
    route: "/rewards"
  },
  {
    id: "streak_warn_07",
    category: "STREAK_WARNING",
    title: "[name], your streak needs you.",
    body: "come back before today ends. 🫡",
    fallbackTitle: "hey scholar, your streak needs you.",
    enabled: true,
    priority: "high",
    route: "/rewards"
  }
];

/**
 * Helper to personalize notification title or body with user's name
 */
export function personalizeText(text: string, userName?: string, fallbackTitle?: string): string {
  if (text.includes('[name]')) {
    if (userName && userName.trim()) {
      const firstName = userName.trim().split(' ')[0];
      return text.replace(/\[name\]/g, firstName);
    } else if (fallbackTitle) {
      return fallbackTitle;
    } else {
      return text.replace(/\[name\]/g, 'scholar');
    }
  }
  return text;
}
