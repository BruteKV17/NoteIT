/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Users, CheckCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { PageId } from '../../types';

interface FacultyMyCoursesProps {
  setActivePage: (page: PageId) => void;
}

export default function FacultyMyCourses({ setActivePage }: FacultyMyCoursesProps) {
  const courses = [
    {
      id: 'cs301',
      code: 'CS301',
      title: 'Operating Systems',
      department: 'Computer Science & Engineering',
      studentsCount: 64,
      lecturesConducted: 17,
      totalLectures: 25,
      completionRate: 68,
      avgQuizScore: 76,
      pendingDoubts: 8,
      syllabus: ['Process Management', 'Threads & Concurrency', 'Deadlock & Starvation', 'Memory Management', 'Virtual Memory', 'File System Interface']
    },
    {
      id: 'cs201',
      code: 'CS201',
      title: 'Data Structures & Algorithms',
      department: 'Computer Science & Engineering',
      studentsCount: 64,
      lecturesConducted: 20,
      totalLectures: 28,
      completionRate: 71,
      avgQuizScore: 82,
      pendingDoubts: 4,
      syllabus: ['Arrays & Linked Lists', 'Stacks & Queues', 'Trees & Binary Search Trees', 'Graph Algorithms', 'Sorting & Searching', 'Dynamic Programming']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--app-border)] pb-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[var(--app-text)]">My Assigned Courses</h1>
          <p className="text-xs font-mono text-[var(--app-muted)]">Manage your assigned academic subjects and course progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map(course => (
          <div key={course.id} className="p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] space-y-5 shadow-sm hover:border-[var(--app-brand)] transition-colors">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-[var(--app-brand)]/10 text-[var(--app-brand)] font-mono text-xs font-bold uppercase">
                  {course.code}
                </span>
                <h2 className="text-xl font-heading font-extrabold text-[var(--app-text)] mt-2">{course.title}</h2>
                <p className="text-xs font-mono text-[var(--app-muted)]">{course.department}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  Active Term
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-center font-mono">
              <div>
                <div className="text-lg font-bold text-[var(--app-text)]">{course.studentsCount}</div>
                <div className="text-[10px] text-[var(--app-muted)]">Students</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--app-text)]">{course.lecturesConducted}/{course.totalLectures}</div>
                <div className="text-[10px] text-[var(--app-muted)]">Lectures</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-500">{course.pendingDoubts}</div>
                <div className="text-[10px] text-[var(--app-muted)]">Pending Doubts</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--app-muted)]">Syllabus Completion</span>
                <span className="font-bold text-[var(--app-text)]">{course.completionRate}%</span>
              </div>
              <div className="w-full bg-[var(--app-surface-alt)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--app-brand)] h-full transition-all" style={{ width: `${course.completionRate}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[var(--app-text)] uppercase tracking-wider block">Syllabus Modules</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {course.syllabus.map((mod, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-[var(--app-surface-alt)] border border-[var(--app-border)] text-[var(--app-text)]">
                    {idx < 3 ? '✓ ' : '• '}{mod}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--app-border)] flex justify-between items-center">
              <button
                onClick={() => setActivePage('faculty-course-progress')}
                className="text-xs font-mono font-bold text-[var(--app-brand)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Course Details</span>
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setActivePage('faculty-doubts')}
                className="px-3 py-1.5 rounded-lg bg-[var(--app-brand)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                View Doubts ({course.pendingDoubts})
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
