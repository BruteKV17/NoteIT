/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  GraduationCap, 
  Sparkles, 
  Compass, 
  BookMarked, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Brain,
  Cpu,
  FileCode,
  CheckCircle,
  Star
} from 'lucide-react';

// Types and mock imports
import { PageId, Source, Lecture, WeakTopic, Quiz, QuizQuestion, NotificationItem, UserSettings, Note } from './types';
import { useNotes } from './hooks/useNotes';
import { useLectures } from './hooks/useLectures';
import { 
  INITIAL_SOURCES, 
  INITIAL_LECTURES, 
  INITIAL_WEAK_TOPICS, 
  INITIAL_QUIZZES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SETTINGS 
} from './data';

// Component imports
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import ResearchHubView from './components/ResearchHubView';
import LibraryView from './components/LibraryView';
import QuizView from './components/QuizView';
import KnowledgeStudioView from './components/KnowledgeStudioView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import SupportView from './components/SupportView';
import PricingView from './components/PricingView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import LectureCaptureView from './components/LectureCaptureView';
import LectureProcessingView from './components/LectureProcessingView';
import LandingView from './components/LandingView';
import OnboardingView from './components/OnboardingView';
import BruteLoader from './components/BruteLoader';
import { generateAdditionalQuizQuestions } from './services/gemini';

export default function App() {
  
  // Theme state defaulting to dark for premium academic vibes
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Authenticated user session state (gates with custom AuthView screen)
  const [sessionUser, setSessionUser] = useState<{ uid: string; fullName: string; emailAddress: string } | null>(null);

  // Hook up Firestore notes & lectures in real-time
  const { notes, isLoading: notesLoading, error: notesError, addNote, updateNote, deleteNote } = useNotes(sessionUser?.uid);
  const { 
    lectures: dbLectures, 
    isLoading: lecturesLoading, 
    addLecture, 
    updateLecture, 
    deleteLecture, 
    uploadLectureAudio,
    uploadLectureDocument
  } = useLectures(sessionUser?.uid);

  // Use only real Firestore lectures
  const combinedLectures = dbLectures;


  // Onboarding checks
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Setup Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loggedUser = {
          uid: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Academic Scholar',
          emailAddress: user.email || ''
        };
        
        try {
          console.log("Checking onboarding status for user UID:", user.uid);
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && userDocSnap.data().onboarding_completed) {
            const data = userDocSnap.data();
            console.log("User onboarding already completed. Loaded user data:", data);
            setSettings(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || loggedUser.fullName,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                emailAddress: data.email || loggedUser.emailAddress,
                institution: data.school_or_university || '',
                countryCode: data.country_code || '',
                phoneNumber: data.phone_number || '',
                avatarUrl: data.profile_image_url || '',
                onboardingCompleted: true
              }
            }));
            setSessionUser(loggedUser);
            setIsOnboarding(false);
            setActivePage(prev => (prev === 'landing' || prev === 'auth' ? 'dashboard' : prev));
          } else {
            console.log("Onboarding incomplete or document missing for user UID:", user.uid);
            setSessionUser(loggedUser);
            setIsOnboarding(true);
          }
        } catch (err: any) {
          console.error("Error checking onboarding status:", {
            currentUserUID: user.uid,
            exactFirestoreError: err
          });
          setSessionUser(loggedUser);
          setIsOnboarding(true);
        } finally {
          setCheckingOnboarding(false);
        }
      } else {
        setSessionUser(null);
        setIsOnboarding(false);
        setCheckingOnboarding(false);
        setActivePage('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for Firestore weak topics
  useEffect(() => {
    if (!sessionUser) {
      setWeakTopics([]);
      return;
    }
    const weakTopicsRef = collection(db, 'users', sessionUser.uid, 'weakTopics');
    const q = query(weakTopicsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: WeakTopic[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          topicName: data.topicName || '',
          subject: data.subject || '',
          masteryScore: data.masteryScore || 30,
          lastAttempt: data.lastAttempt || 'Just now',
          aiDiagnosis: data.aiDiagnosis || '',
          actionPlan: data.actionPlan || []
        });
      });
      setWeakTopics(list);
    }, (err) => {
      console.error("Error fetching weak topics:", err);
    });
    return () => unsubscribe();
  }, [sessionUser]);

  // Aggregate quizzes dynamically from processed lectures in Firestore
  useEffect(() => {
    const generatedQuizzes: Quiz[] = [...INITIAL_QUIZZES];
    combinedLectures.forEach(lecture => {
      if (lecture.quiz && lecture.quiz.length > 0) {
        const mappedQuestions = lecture.quiz.map((q: any, idx: number) => ({
          id: `q-${lecture.id}-${idx}`,
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.correctAnswer,
          explanation: q.explanation || 'Review concepts in your study outline.',
          sourceCitation: q.sourceCitation || `[Source: ${lecture.title}]`
        }));

        generatedQuizzes.push({
          id: `quiz-${lecture.id}`,
          title: `${lecture.title} Review`,
          topic: lecture.subject,
          questionsCount: lecture.quiz.length,
          estimatedTime: `${lecture.quiz.length * 1} mins`,
          status: 'available',
          questions: mappedQuestions,
          easyQuestions: mappedQuestions,
          mediumQuestions: [],
          hardQuestions: [],
          contextText: lecture.transcript || lecture.summary || ""
        });
      }
    });
    setQuizzes(generatedQuizzes);
  }, [combinedLectures]);

  // High-level dashboard states
  const [activePage, setActivePage] = useState<PageId>('landing');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Core records lists managed in React state (empty by default, loaded dynamically)
  const [sources, setSources] = useState<Source[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const [processingLectureId, setProcessingLectureId] = useState<string | null>(null);
  const [processingAudioBlob, setProcessingAudioBlob] = useState<Blob | null>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);


  // Callbacks: Sources
  const handleAddSource = (newSource: Source) => {
    setSources(prev => [newSource, ...prev]);
    // Send background notification automated
    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `Source Synced: ${newSource.name}`,
      description: `Analyzing document headers, citation tags, and indexing semantic concepts...`,
      timeLabel: 'Today',
      category: 'system',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [note, ...prev]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // Callbacks: Lectures
  const handleAddLecture = async (newLecture: Lecture) => {
    if (sessionUser) {
      try {
        await addLecture({
          title: newLecture.title,
          subject: newLecture.subject,
          duration: newLecture.duration,
          pages: newLecture.pages,
          status: newLecture.status,
          type: newLecture.type,
          addedAt: 'Just now'
        });
      } catch (err) {
        console.error('Failed to add lecture to Firestore:', err);
      }
    } else {
      setLectures(prev => [newLecture, ...prev]);
    }

    // Also add to sources list as a PDF/text simulation
    const simulatedSrc: Source = {
      id: newLecture.id,
      name: newLecture.title + (newLecture.type === 'recording' ? '.wav' : '.pdf'),
      type: newLecture.type === 'recording' ? 'recording' : 'pdf',
      size: newLecture.type === 'recording' ? '14.5 MB' : '3.8 MB',
      addedAt: 'Just now'
    };
    setSources(prev => [simulatedSrc, ...prev]);
    
    // Notification log
    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `New processing: ${newLecture.title}`,
      description: `High-Intensity Synthesis Engine has started transcribing and generating standard markdown outlines.`,
      timeLabel: 'Today',
      category: 'system',
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [note, ...prev]);
  };

  const handleDeleteLecture = async (id: string) => {
    if (sessionUser && dbLectures.some(l => l.id === id)) {
      try {
        await deleteLecture(id);
      } catch (err) {
        console.error('Failed to delete lecture from Firestore:', err);
      }
    } else {
      setLectures(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSaveCapture = async (title: string, subject: string, duration: string, audioBlob: Blob) => {
    if (!sessionUser) return;
    try {
      const lectureId = await addLecture({
        title,
        subject,
        duration,
        type: 'recording',
        status: 'recording'
      });
      
      setProcessingLectureId(lectureId);
      setProcessingAudioBlob(audioBlob);
      setActivePage('lecture-processing');
    } catch (err) {
      console.error('Failed to start saving lecture capture:', err);
    }
  };

  const handleSaveDocument = async (title: string, subject: string, file: File) => {
    if (!sessionUser) return;
    try {
      let type: 'pdf' | 'ppt' | 'text' = 'pdf';
      if (file.name.endsWith('.pptx')) type = 'ppt';
      else if (file.name.endsWith('.docx')) type = 'text';

      const lectureId = await addLecture({
        title,
        subject,
        type,
        status: 'uploading'
      });
      
      setProcessingLectureId(lectureId);
      setProcessingFile(file);
      setProcessingAudioBlob(null);
      setActivePage('lecture-processing');
    } catch (err) {
      console.error('Failed to start saving document:', err);
    }
  };

  // Callbacks: Quiz scoring updates
  const handleUpdateQuizScore = (quizId: string, score: number) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) {
        return { ...q, score, status: 'completed' as const };
      }
      return q;
    }));

    // Update Weak Topic Mastery dynamically based on quiz scoring
    setWeakTopics(prev => prev.map(wt => {
      if (quizId === 'q3' && wt.id === 'wt1') { // Calculus III
        return { ...wt, masteryScore: Math.max(wt.masteryScore, score), lastAttempt: 'Just now' };
      }
      if (quizId === 'q2' && wt.id === 'wt2') { // StereoChem
        return { ...wt, masteryScore: Math.max(wt.masteryScore, score), lastAttempt: 'Just now' };
      }
      return wt;
    }));

    // Trigger congratulations notification
    const note: NotificationItem = {
      id: Math.random().toString(),
      title: `Quiz Finished! Score: ${score}%`,
      description: `We've integrated your recall telemetry into the active Knowledge Radar. Mastery scores calibrated.`,
      timeLabel: 'Today',
      category: 'ai-insights',
      read: false,
      timestamp: 'Just now',
      actionLabel: 'View Progress',
      actionPage: 'dashboard'
    };
    setNotifications(prev => [note, ...prev]);
  };

  const handleAddQuestions = (quizId: string, difficulty: 'easy' | 'medium' | 'hard', newQuestions: QuizQuestion[]) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) {
        if (difficulty === 'easy') {
          const updated = [...(q.easyQuestions || []), ...newQuestions];
          return { ...q, easyQuestions: updated, questionsCount: updated.length };
        } else if (difficulty === 'medium') {
          const updated = [...(q.mediumQuestions || []), ...newQuestions];
          return { ...q, mediumQuestions: updated, questionsCount: updated.length };
        } else {
          const updated = [...(q.hardQuestions || []), ...newQuestions];
          return { ...q, hardQuestions: updated, questionsCount: updated.length };
        }
      }
      return q;
    }));
  };

  // Callbacks: Notifications actions
  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Callbacks: Settings & Upgrading Tiers
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (sessionUser) {
      const profileData = {
        first_name: newSettings.profile.firstName || '',
        last_name: newSettings.profile.lastName || '',
        school_or_university: newSettings.profile.institution || '',
        email: newSettings.profile.emailAddress || '',
        country_code: newSettings.profile.countryCode || '',
        phone_number: newSettings.profile.phoneNumber || '',
        profile_image_url: newSettings.profile.avatarUrl || '',
        onboarding_completed: true,
        updated_at: serverTimestamp()
      };
      
      console.log("Save settings attempt:", {
        currentUserUID: sessionUser.uid,
        authenticatedState: !!sessionUser.uid,
        firestoreDocumentPath: `users/${sessionUser.uid}`,
        writeRequestPayload: profileData
      });

      try {
        const userDocRef = doc(db, 'users', sessionUser.uid);
        await setDoc(userDocRef, profileData, { merge: true });
        console.log("Updated root user settings successfully in users/" + sessionUser.uid);
      } catch (err: any) {
        console.error("Save settings failed:", {
          currentUserUID: sessionUser.uid,
          authenticatedState: !!sessionUser.uid,
          firestoreDocumentPath: `users/${sessionUser.uid}`,
          writeRequestPayload: profileData,
          exactFirestoreError: err
        });
      }
    }
  };

  const handleUpgradePlan = (planName: 'Scholar' | 'Researcher' | 'Institution', price: string, billingCycle: 'monthly' | 'yearly') => {
    const upgradedFeatures = [
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Proactive Concept Recommendations',
      'Priority Email Support'
    ];

    setSettings(prev => ({
      ...prev,
      subscription: {
        planName,
        price,
        billingCycle,
        nextBillDate: billingCycle === 'yearly' ? 'Dec 15, 2027' : 'Jan 15, 2027',
        features: planName === 'Scholar' ? ['Standard AI Synthesis (5)', '5GB Storage'] : upgradedFeatures
      }
    }));
  };

  // Sync click shortcut helper
  const handleNewAnalysisShortcut = () => {
    setActivePage('academic-library');
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLoginSuccess = (user: { fullName: string; emailAddress: string }) => {
    setCheckingOnboarding(true);
  };

  // Layout router switch
  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            setActivePage={setActivePage}
            setSelectedQuizId={setSelectedQuizId}
            lectures={combinedLectures}
            weakTopics={weakTopics}
            onNewAnalysis={handleNewAnalysisShortcut}
            onOpenLecture={(id) => {
              // Clicked lecture card shortcut transitions to workspace
              setActivePage('research-hub');
            }}
            theme={theme}
            notes={notes}
          />
        );
      case 'lecture-capture':
        return (
          <LectureCaptureView
            onSaveCapture={handleSaveCapture}
            setActivePage={setActivePage}
            theme={theme}
            lectures={combinedLectures}
            activeLectureId={activeLectureId}
            setActiveLectureId={setActiveLectureId}
            notes={notes}
          />
        );
      case 'lecture-processing':
        return (
          <LectureProcessingView
            userId={sessionUser?.uid}
            lectureId={processingLectureId}
            audioBlob={processingAudioBlob}
            documentFile={processingFile}
            uploadLectureAudio={uploadLectureAudio}
            uploadLectureDocument={uploadLectureDocument}
            updateLecture={updateLecture}
            setActivePage={setActivePage}
            theme={theme}
            setActiveLectureId={setActiveLectureId}
          />
        );
      case 'profile':
        return (
          <ProfileView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            setActivePage={setActivePage}
            theme={theme}
          />
        );
      case 'research-hub':
        return (
          <ResearchHubView
            sources={sources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            searchQuery={searchQuery}
            notes={notes}
            notesLoading={notesLoading}
            addNote={addNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            lectures={combinedLectures}
            updateLecture={updateLecture}
            deleteLecture={handleDeleteLecture}
            setActivePage={setActivePage}
          />
        );
      case 'academic-library':
        return (
          <LibraryView
            lectures={combinedLectures}
            onAddLecture={handleAddLecture}
            onDeleteLecture={handleDeleteLecture}
            onSaveDocument={handleSaveDocument}
            setActivePage={setActivePage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            theme={theme}
            onUpdateLecture={updateLecture}
          />
        );
      case 'quiz-mode':
        return (
          <QuizView
            quizzes={quizzes}
            selectedQuizId={selectedQuizId}
            setSelectedQuizId={setSelectedQuizId}
            onUpdateQuizScore={handleUpdateQuizScore}
            onAddQuestions={handleAddQuestions}
            theme={theme}
          />
        );
      case 'knowledge-studio':
        return (
          <KnowledgeStudioView
            userId={sessionUser?.uid}
            theme={theme}
            setActivePage={setActivePage}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onClearNotifications={handleClearNotifications}
            setActivePage={setActivePage}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            setActivePage={setActivePage}
          />
        );
      case 'help-support':
        return <SupportView />;
      case 'pricing':
        return (
          <PricingView
            settings={settings}
            onUpgradePlan={handleUpgradePlan}
            setActivePage={setActivePage}
          />
        );
      default:
        return (
          <LandingView
            onEnterApp={() => setActivePage('dashboard')}
            onLoginSuccess={handleLoginSuccess}
            onNavigateToPricing={() => setActivePage('pricing')}
          />
        );
    }
  };

  const isLanding = activePage === 'landing';

  if (checkingOnboarding) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#FAF9F5]'
      }`}>
        <BruteLoader size="lg" message="Loading Note-IT AI Interface..." />
      </div>
    );
  }

  if (sessionUser === null) {
    return (
      <AuthView 
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
      />
    );
  }

  if (isOnboarding) {
    return (
      <OnboardingView
        userId={sessionUser.uid}
        email={sessionUser.emailAddress}
        fullName={sessionUser.fullName}
        theme={theme}
        onComplete={(userData) => {
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || sessionUser.fullName,
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              emailAddress: userData.email || sessionUser.emailAddress,
              institution: userData.school_or_university || '',
              countryCode: userData.country_code || '',
              phoneNumber: userData.phone_number || '',
              avatarUrl: userData.profile_image_url || '',
              onboardingCompleted: true
            }
          }));
          setIsOnboarding(false);
          setActivePage('dashboard');
        }}
      />
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-all duration-300 ${
      theme === 'dark' ? 'bg-[#0a0a0c] text-neutral-100' : 'bg-[#FAF9F5] text-gray-900'
    }`}>
      
      {/* Sidebar - hides completely on landing page layout */}
      {!isLanding && (
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
          settings={settings}
          onNewAnalysis={handleNewAnalysisShortcut}
          theme={theme}
          onLogOut={handleLogOut}
        />
      )}

      {/* Main core layout frame container */}
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        {/* Navbar - hides on landing page layout */}
        {!isLanding && (
          <Navbar
            activePage={activePage}
            setActivePage={setActivePage}
            setIsOpenMobile={setIsOpenMobile}
            settings={settings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNewAnalysis={handleNewAnalysisShortcut}
            theme={theme}
            setTheme={setTheme}
            onLogOut={handleLogOut}
          />
        )}

        {/* Dynamic page contents viewer */}
        <main className={`flex-1 overflow-y-auto ${
          isLanding 
            ? 'p-0 text-gray-900 bg-[#FAF9F5]' 
            : theme === 'dark' 
              ? 'p-4 md:p-6 bg-[#0a0a0c]' 
              : 'p-4 md:p-6 bg-[#FAF9F5]'
        }`}>
          {renderActiveView()}
        </main>
      </div>

    </div>
  );
}
