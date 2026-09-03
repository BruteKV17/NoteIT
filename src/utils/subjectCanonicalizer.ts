/**
 * Canonical Subject Management & Autocomplete System
 * Ensures consistent subject identifiers (subjectId) across Student Subject Map,
 * Academic Library, Exam Rush, Practice Blitz, and Faculty Portal.
 */

export interface CanonicalSubject {
  subjectId: string;
  canonicalName: string;
  category: 'Computer Science' | 'Information Technology' | 'Mathematics' | 'Electronics' | 'General Engineering';
  aliases: string[];
}

export const CANONICAL_SUBJECTS: CanonicalSubject[] = [
  {
    subjectId: 'CS-DBMS-001',
    canonicalName: 'Database Management Systems',
    category: 'Computer Science',
    aliases: ['DBMS', 'Database', 'Databases', 'Relational Databases', 'SQL', 'RDBMS']
  },
  {
    subjectId: 'CS-DSA-002',
    canonicalName: 'Data Structures & Algorithms',
    category: 'Computer Science',
    aliases: ['DSA', 'Data Structures', 'Algorithms', 'Data Structure', 'Algo']
  },
  {
    subjectId: 'CS-CN-003',
    canonicalName: 'Computer Networks',
    category: 'Computer Science',
    aliases: ['CN', 'Networks', 'Networking', 'Computer Network', 'IP Networks']
  },
  {
    subjectId: 'CS-OS-004',
    canonicalName: 'Operating Systems',
    category: 'Computer Science',
    aliases: ['OS', 'Operating System', 'Linux Kernel', 'Process Management']
  },
  {
    subjectId: 'CS-CAO-005',
    canonicalName: 'Computer Architecture & Organization',
    category: 'Computer Science',
    aliases: ['CAO', 'COA', 'Computer Architecture', 'Computer Organization', 'Microprocessors']
  },
  {
    subjectId: 'CS-CD-006',
    canonicalName: 'Compiler Design',
    category: 'Computer Science',
    aliases: ['CD', 'Compiler', 'Compilers', 'Parsing', 'Syntax Analysis']
  },
  {
    subjectId: 'CS-TOC-007',
    canonicalName: 'Theory of Computation',
    category: 'Computer Science',
    aliases: ['TOC', 'Automata', 'Automata Theory', 'Formal Languages', 'Turing Machines']
  },
  {
    subjectId: 'CS-SE-008',
    canonicalName: 'Software Engineering',
    category: 'Computer Science',
    aliases: ['SE', 'Software Dev', 'SDLC', 'Agile Methodologies']
  },
  {
    subjectId: 'CS-AIML-009',
    canonicalName: 'Artificial Intelligence & Machine Learning',
    category: 'Computer Science',
    aliases: ['AI', 'ML', 'AIML', 'Machine Learning', 'Deep Learning', 'Neural Networks']
  },
  {
    subjectId: 'CS-DMA-010',
    canonicalName: 'Data Mining & Data Analytics',
    category: 'Computer Science',
    aliases: ['Data Analytics', 'Data Mining', 'Big Data', 'Business Intelligence']
  },
  {
    subjectId: 'CS-CG-011',
    canonicalName: 'Computer Graphics & Visualization',
    category: 'Computer Science',
    aliases: ['CG', 'Computer Graphics', 'OpenGL', 'Rendering']
  },
  {
    subjectId: 'CS-WEB-012',
    canonicalName: 'Web Technologies',
    category: 'Computer Science',
    aliases: ['Web Dev', 'Web Development', 'Full Stack', 'HTML/CSS/JS']
  },
  {
    subjectId: 'CS-CLOUD-013',
    canonicalName: 'Cloud Computing',
    category: 'Computer Science',
    aliases: ['Cloud', 'AWS', 'Distributed Systems', 'Cloud Architecture']
  },
  {
    subjectId: 'MATH-DM-014',
    canonicalName: 'Discrete Mathematics',
    category: 'Mathematics',
    aliases: ['DM', 'Discrete Math', 'Discrete Structures', 'Graph Theory']
  },
  {
    subjectId: 'MATH-EM-015',
    canonicalName: 'Engineering Mathematics',
    category: 'Mathematics',
    aliases: ['Maths', 'Math', 'Linear Algebra', 'Calculus', 'Probability & Statistics']
  }
];

/**
 * Autocomplete helper for canonical subjects based on query string
 */
export function searchCanonicalSubjects(query: string): CanonicalSubject[] {
  if (!query || !query.trim()) return CANONICAL_SUBJECTS.slice(0, 6);
  const q = query.toLowerCase().trim();

  return CANONICAL_SUBJECTS.filter(subject => {
    if (subject.canonicalName.toLowerCase().includes(q)) return true;
    if (subject.subjectId.toLowerCase().includes(q)) return true;
    return subject.aliases.some(alias => alias.toLowerCase().includes(q));
  });
}

/**
 * Resolves any subject string (e.g. "DBMS", "Database", "Databases") to its canonical subject object
 */
export function resolveCanonicalSubject(subjectNameOrId: string): CanonicalSubject {
  if (!subjectNameOrId) return CANONICAL_SUBJECTS[0];
  const target = subjectNameOrId.trim().toLowerCase();

  const exactMatch = CANONICAL_SUBJECTS.find(
    s => s.subjectId.toLowerCase() === target || s.canonicalName.toLowerCase() === target
  );
  if (exactMatch) return exactMatch;

  const aliasMatch = CANONICAL_SUBJECTS.find(
    s => s.aliases.some(a => a.toLowerCase() === target || target.includes(a.toLowerCase()))
  );
  if (aliasMatch) return aliasMatch;

  // Fallback to custom created canonical subject object
  return {
    subjectId: `SUBJ-${subjectNameOrId.toUpperCase().replace(/\s+/g, '-').slice(0, 12)}`,
    canonicalName: subjectNameOrId,
    category: 'General Engineering',
    aliases: [subjectNameOrId]
  };
}
