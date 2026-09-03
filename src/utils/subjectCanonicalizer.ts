/**
 * Canonical Subject Management & Autocomplete System
 * Ensures consistent subject identifiers (subjectId) across Student Subject Map,
 * Academic Library, Exam Rush, Practice Blitz, and Faculty Portal.
 */

export interface CanonicalSubject {
  subjectId: string;
  canonicalName: string;
  category: 
    | 'Computer Science & IT'
    | 'Electronics & Electrical'
    | 'Mechanical & Civil'
    | 'Biotechnology & Chemical'
    | 'BBA & Management'
    | 'BCA & Applications'
    | 'B.Sc Sciences'
    | 'Mathematics & Statistics';
  aliases: string[];
}

export const CANONICAL_SUBJECTS: CanonicalSubject[] = [
  // --- COMPUTER SCIENCE & IT (B.TECH CSE / IT) ---
  {
    subjectId: 'CS-DBMS-001',
    canonicalName: 'Database Management Systems',
    category: 'Computer Science & IT',
    aliases: ['DBMS', 'Database', 'Databases', 'Relational Databases', 'SQL', 'RDBMS']
  },
  {
    subjectId: 'CS-DSA-002',
    canonicalName: 'Data Structures & Algorithms',
    category: 'Computer Science & IT',
    aliases: ['DSA', 'Data Structures', 'Algorithms', 'Data Structure', 'Algo']
  },
  {
    subjectId: 'CS-CN-003',
    canonicalName: 'Computer Networks',
    category: 'Computer Science & IT',
    aliases: ['CN', 'Networks', 'Networking', 'Computer Network', 'IP Networks']
  },
  {
    subjectId: 'CS-OS-004',
    canonicalName: 'Operating Systems',
    category: 'Computer Science & IT',
    aliases: ['OS', 'Operating System', 'Linux Kernel', 'Process Management']
  },
  {
    subjectId: 'CS-CAO-005',
    canonicalName: 'Computer Architecture & Organization',
    category: 'Computer Science & IT',
    aliases: ['CAO', 'COA', 'Computer Architecture', 'Computer Organization', 'Microprocessors']
  },
  {
    subjectId: 'CS-CD-006',
    canonicalName: 'Compiler Design',
    category: 'Computer Science & IT',
    aliases: ['CD', 'Compiler', 'Compilers', 'Parsing', 'Syntax Analysis']
  },
  {
    subjectId: 'CS-TOC-007',
    canonicalName: 'Theory of Computation',
    category: 'Computer Science & IT',
    aliases: ['TOC', 'Automata', 'Automata Theory', 'Formal Languages', 'Turing Machines']
  },
  {
    subjectId: 'CS-SE-008',
    canonicalName: 'Software Engineering',
    category: 'Computer Science & IT',
    aliases: ['SE', 'Software Dev', 'SDLC', 'Agile Methodologies']
  },
  {
    subjectId: 'CS-AIML-009',
    canonicalName: 'Artificial Intelligence & Machine Learning',
    category: 'Computer Science & IT',
    aliases: ['AI', 'ML', 'AIML', 'Machine Learning', 'Deep Learning', 'Neural Networks']
  },
  {
    subjectId: 'CS-DMA-010',
    canonicalName: 'Data Mining & Data Analytics',
    category: 'Computer Science & IT',
    aliases: ['Data Analytics', 'Data Mining', 'Big Data', 'Business Intelligence']
  },
  {
    subjectId: 'CS-CG-011',
    canonicalName: 'Computer Graphics & Visualization',
    category: 'Computer Science & IT',
    aliases: ['CG', 'Computer Graphics', 'OpenGL', 'Rendering']
  },
  {
    subjectId: 'CS-WEB-012',
    canonicalName: 'Web Technologies & Full Stack',
    category: 'Computer Science & IT',
    aliases: ['Web Dev', 'Web Development', 'Full Stack', 'HTML/CSS/JS', 'Web Tech']
  },
  {
    subjectId: 'CS-CLOUD-013',
    canonicalName: 'Cloud Computing & Distributed Systems',
    category: 'Computer Science & IT',
    aliases: ['Cloud', 'AWS', 'Distributed Systems', 'Cloud Architecture']
  },
  {
    subjectId: 'CS-SEC-014',
    canonicalName: 'Cybersecurity & Cryptography',
    category: 'Computer Science & IT',
    aliases: ['Cyber Security', 'Cryptography', 'Network Security', 'InfoSec']
  },
  {
    subjectId: 'CS-JAVA-015',
    canonicalName: 'Object Oriented Programming with Java',
    category: 'Computer Science & IT',
    aliases: ['Java', 'OOP Java', 'Core Java', 'Advanced Java']
  },
  {
    subjectId: 'CS-PY-016',
    canonicalName: 'Python Programming & Applications',
    category: 'Computer Science & IT',
    aliases: ['Python', 'Python Programming', 'Py']
  },
  {
    subjectId: 'CS-C-017',
    canonicalName: 'Programming in C & Problem Solving',
    category: 'Computer Science & IT',
    aliases: ['C Programming', 'C Language', 'PPS', 'Problem Solving in C']
  },
  {
    subjectId: 'CS-CPP-018',
    canonicalName: 'Object Oriented Programming with C++',
    category: 'Computer Science & IT',
    aliases: ['C++', 'CPP', 'OOP C++', 'C++ Programming']
  },
  {
    subjectId: 'CS-MOB-019',
    canonicalName: 'Mobile Application Development',
    category: 'Computer Science & IT',
    aliases: ['Mobile Dev', 'Android', 'iOS', 'Flutter', 'React Native']
  },
  {
    subjectId: 'CS-IOT-020',
    canonicalName: 'Internet of Things (IoT) & Embedded Systems',
    category: 'Computer Science & IT',
    aliases: ['IoT', 'Internet of Things', 'Embedded IoT', 'Sensors']
  },
  {
    subjectId: 'CS-BD-021',
    canonicalName: 'Big Data Engineering & Hadoop',
    category: 'Computer Science & IT',
    aliases: ['Big Data', 'Hadoop', 'Spark', 'Data Engineering']
  },
  {
    subjectId: 'CS-DL-022',
    canonicalName: 'Deep Learning & Neural Networks',
    category: 'Computer Science & IT',
    aliases: ['Deep Learning', 'Neural Networks', 'CNN', 'RNN', 'Transformers']
  },
  {
    subjectId: 'CS-NLP-023',
    canonicalName: 'Natural Language Processing (NLP)',
    category: 'Computer Science & IT',
    aliases: ['NLP', 'Language Models', 'LLMs', 'Text Processing']
  },
  {
    subjectId: 'CS-CV-024',
    canonicalName: 'Computer Vision & Image Processing',
    category: 'Computer Science & IT',
    aliases: ['Computer Vision', 'Image Processing', 'OpenCV', 'DIP']
  },
  {
    subjectId: 'CS-DEVOPS-025',
    canonicalName: 'DevOps & Continuous Integration',
    category: 'Computer Science & IT',
    aliases: ['DevOps', 'CI/CD', 'Docker', 'Kubernetes', 'Jenkins']
  },
  {
    subjectId: 'CS-IR-026',
    canonicalName: 'Information Retrieval & Web Search',
    category: 'Computer Science & IT',
    aliases: ['Information Retrieval', 'IR', 'Search Engines']
  },

  // --- ELECTRONICS & ELECTRICAL ENGINEERING (B.TECH ECE / EE / EEE) ---
  {
    subjectId: 'ECE-ADC-027',
    canonicalName: 'Analog & Digital Electronics',
    category: 'Electronics & Electrical',
    aliases: ['Analog Electronics', 'Digital Circuits', 'ADE', 'EDC', 'Electronic Devices']
  },
  {
    subjectId: 'ECE-DSP-028',
    canonicalName: 'Digital Signal Processing',
    category: 'Electronics & Electrical',
    aliases: ['DSP', 'Signal Processing', 'Digital Signals']
  },
  {
    subjectId: 'ECE-MP-029',
    canonicalName: 'Microprocessors & Microcontrollers',
    category: 'Electronics & Electrical',
    aliases: ['MPMC', '8085', '8086', 'ARM', 'Microcontrollers', 'Embedded Systems']
  },
  {
    subjectId: 'ECE-VLSI-030',
    canonicalName: 'VLSI Design & Microelectronics',
    category: 'Electronics & Electrical',
    aliases: ['VLSI', 'CMOS Design', 'Microelectronics', 'Verilog', 'VHDL']
  },
  {
    subjectId: 'EE-CS-031',
    canonicalName: 'Control Systems Engineering',
    category: 'Electronics & Electrical',
    aliases: ['Control Systems', 'CS', 'Automatic Control', 'Feedback Systems']
  },
  {
    subjectId: 'ECE-SS-032',
    canonicalName: 'Signals and Systems',
    category: 'Electronics & Electrical',
    aliases: ['Signals & Systems', 'S&S', 'Fourier Transform', 'Laplace']
  },
  {
    subjectId: 'ECE-WMC-033',
    canonicalName: 'Wireless & Mobile Communication',
    category: 'Electronics & Electrical',
    aliases: ['Wireless Comms', 'Mobile Communication', '5G Networks', 'Cellular Networks']
  },
  {
    subjectId: 'ECE-EMFT-034',
    canonicalName: 'Electromagnetic Field Theory',
    category: 'Electronics & Electrical',
    aliases: ['EMFT', 'Electromagnetics', 'Maxwell Equations', 'Wave Propagation']
  },
  {
    subjectId: 'ECE-AWP-035',
    canonicalName: 'Antenna and Wave Propagation',
    category: 'Electronics & Electrical',
    aliases: ['AWP', 'Antennas', 'Radar Engineering', 'RF Engineering']
  },
  {
    subjectId: 'ECE-OCN-036',
    canonicalName: 'Optical Communication & Networks',
    category: 'Electronics & Electrical',
    aliases: ['Optical Communication', 'Fiber Optics', 'Photonics']
  },
  {
    subjectId: 'EE-PS-037',
    canonicalName: 'Power Systems & Smart Grid',
    category: 'Electronics & Electrical',
    aliases: ['Power Systems', 'Grid', 'Power Generation', 'Transmission & Distribution']
  },
  {
    subjectId: 'EE-EM-038',
    canonicalName: 'Electrical Machines',
    category: 'Electronics & Electrical',
    aliases: ['Electrical Machines', 'Transformers', 'Induction Motors', 'DC Machines']
  },
  {
    subjectId: 'EE-PE-039',
    canonicalName: 'Power Electronics & Drives',
    category: 'Electronics & Electrical',
    aliases: ['Power Electronics', 'Inverters', 'Converters', 'Thyristors']
  },
  {
    subjectId: 'EE-SP-040',
    canonicalName: 'Switchgear and Power Protection',
    category: 'Electronics & Electrical',
    aliases: ['Switchgear', 'Protection', 'Circuit Breakers', 'Relays']
  },
  {
    subjectId: 'EE-HVE-041',
    canonicalName: 'High Voltage Engineering',
    category: 'Electronics & Electrical',
    aliases: ['High Voltage', 'HVE', 'Insulation']
  },

  // --- MECHANICAL & CIVIL ENGINEERING (B.TECH ME / CE) ---
  {
    subjectId: 'ME-ET-042',
    canonicalName: 'Engineering Thermodynamics',
    category: 'Mechanical & Civil',
    aliases: ['Thermodynamics', 'Thermo', 'Applied Thermodynamics']
  },
  {
    subjectId: 'ME-FM-043',
    canonicalName: 'Fluid Mechanics & Hydraulic Machines',
    category: 'Mechanical & Civil',
    aliases: ['Fluid Mechanics', 'FM', 'Hydraulics', 'Turbines', 'Pumps']
  },
  {
    subjectId: 'ME-SOM-044',
    canonicalName: 'Strength of Materials & Solid Mechanics',
    category: 'Mechanical & Civil',
    aliases: ['SOM', 'Strength of Materials', 'Mechanics of Solids', 'MOS']
  },
  {
    subjectId: 'ME-TOM-045',
    canonicalName: 'Theory of Machines & Kinematics',
    category: 'Mechanical & Civil',
    aliases: ['Theory of Machines', 'TOM', 'Kinematics', 'Dynamics of Machinery']
  },
  {
    subjectId: 'ME-HMT-046',
    canonicalName: 'Heat and Mass Transfer',
    category: 'Mechanical & Civil',
    aliases: ['Heat Transfer', 'HMT', 'Conduction', 'Convection', 'Radiation']
  },
  {
    subjectId: 'ME-MT-047',
    canonicalName: 'Manufacturing Technology & Workshop Practice',
    category: 'Mechanical & Civil',
    aliases: ['Manufacturing', 'Casting', 'Welding', 'Machining', 'Production Engg']
  },
  {
    subjectId: 'ME-CAD-048',
    canonicalName: 'Computer Aided Design & Manufacturing (CAD/CAM)',
    category: 'Mechanical & Civil',
    aliases: ['CAD', 'CAM', 'CAD/CAM', 'CNC Machining', '3D Modeling']
  },
  {
    subjectId: 'ME-AE-049',
    canonicalName: 'Automobile Engineering',
    category: 'Mechanical & Civil',
    aliases: ['Automobile', 'IC Engines', 'Automotive Systems', 'EV Technology']
  },
  {
    subjectId: 'ME-RAC-050',
    canonicalName: 'Refrigeration & Air Conditioning (RAC)',
    category: 'Mechanical & Civil',
    aliases: ['RAC', 'Refrigeration', 'HVAC', 'Air Conditioning']
  },
  {
    subjectId: 'CE-SA-051',
    canonicalName: 'Structural Analysis & Design',
    category: 'Mechanical & Civil',
    aliases: ['Structural Analysis', 'Structures', 'Trusses', 'Beams']
  },
  {
    subjectId: 'CE-CT-052',
    canonicalName: 'Concrete Technology & RCC Design',
    category: 'Mechanical & Civil',
    aliases: ['Concrete Technology', 'RCC', 'Reinforced Concrete', 'Design of Structures']
  },
  {
    subjectId: 'CE-GE-053',
    canonicalName: 'Geotechnical & Soil Engineering',
    category: 'Mechanical & Civil',
    aliases: ['Geotechnical Engg', 'Soil Mechanics', 'Foundation Engineering']
  },
  {
    subjectId: 'CE-SURV-054',
    canonicalName: 'Surveying & Geomatics',
    category: 'Mechanical & Civil',
    aliases: ['Surveying', 'GIS', 'Remote Sensing', 'Levelling']
  },
  {
    subjectId: 'CE-EE-055',
    canonicalName: 'Environmental Engineering & Sanitation',
    category: 'Mechanical & Civil',
    aliases: ['Environmental Engg', 'Water Supply', 'Waste Management', 'Sewage Treatment']
  },
  {
    subjectId: 'CE-TE-056',
    canonicalName: 'Transportation & Highway Engineering',
    category: 'Mechanical & Civil',
    aliases: ['Transportation Engg', 'Highways', 'Pavement Design', 'Traffic Engg']
  },
  {
    subjectId: 'CE-WRE-057',
    canonicalName: 'Hydrology & Water Resources Engineering',
    category: 'Mechanical & Civil',
    aliases: ['Hydrology', 'Water Resources', 'Irrigation Engineering', 'Dams']
  },

  // --- BIOTECHNOLOGY & CHEMICAL ENGINEERING ---
  {
    subjectId: 'BT-MB-058',
    canonicalName: 'Molecular Biology & Recombinant DNA',
    category: 'Biotechnology & Chemical',
    aliases: ['Molecular Biology', 'Mol Bio', 'rDNA Technology', 'Gene Cloning']
  },
  {
    subjectId: 'BT-BPE-059',
    canonicalName: 'Bioprocess Engineering & Fermentation',
    category: 'Biotechnology & Chemical',
    aliases: ['Bioprocess', 'Fermentation', 'Bioreactors', 'Downstream Processing']
  },
  {
    subjectId: 'BT-BI-060',
    canonicalName: 'Bioinformatics & Computational Genomics',
    category: 'Biotechnology & Chemical',
    aliases: ['Bioinformatics', 'Computational Biology', 'Sequence Alignment', 'BLAST']
  },
  {
    subjectId: 'BT-IMM-061',
    canonicalName: 'Immunology & Immunotechnology',
    category: 'Biotechnology & Chemical',
    aliases: ['Immunology', 'Immune System', 'Antibodies', 'Vaccines']
  },
  {
    subjectId: 'BT-CB-062',
    canonicalName: 'Cell Biology & Physiology',
    category: 'Biotechnology & Chemical',
    aliases: ['Cell Biology', 'Cell Structure', 'Organelles', 'Signal Transduction']
  },
  {
    subjectId: 'BT-ET-063',
    canonicalName: 'Enzyme Technology & Biocatalysis',
    category: 'Biotechnology & Chemical',
    aliases: ['Enzymology', 'Enzyme Kinetics', 'Biocatalysis']
  },
  {
    subjectId: 'CHE-CRE-064',
    canonicalName: 'Chemical Reaction Engineering',
    category: 'Biotechnology & Chemical',
    aliases: ['CRE', 'Reaction Kinetics', 'Chemical Reactors']
  },
  {
    subjectId: 'CHE-MTO-065',
    canonicalName: 'Mass Transfer Operations',
    category: 'Biotechnology & Chemical',
    aliases: ['Mass Transfer', 'Distillation', 'Absorption', 'Extraction']
  },

  // --- BBA & MANAGEMENT SUBJECTS ---
  {
    subjectId: 'BBA-PMOB-066',
    canonicalName: 'Principles of Management & OB',
    category: 'BBA & Management',
    aliases: ['Management Principles', 'Organizational Behavior', 'OB', 'POM']
  },
  {
    subjectId: 'BBA-FA-067',
    canonicalName: 'Financial Accounting & Reporting',
    category: 'BBA & Management',
    aliases: ['Financial Accounting', 'Accounting', 'Balance Sheet', 'Bookkeeping']
  },
  {
    subjectId: 'BBA-CMA-068',
    canonicalName: 'Cost & Management Accounting',
    category: 'BBA & Management',
    aliases: ['Cost Accounting', 'Management Accounting', 'Costing', 'Budgeting']
  },
  {
    subjectId: 'BBA-MM-069',
    canonicalName: 'Marketing Management & Strategy',
    category: 'BBA & Management',
    aliases: ['Marketing', 'Marketing Strategy', '4 Ps', 'Branding']
  },
  {
    subjectId: 'BBA-HRM-070',
    canonicalName: 'Human Resource Management (HRM)',
    category: 'BBA & Management',
    aliases: ['HRM', 'Human Resources', 'Talent Management', 'Recruitment']
  },
  {
    subjectId: 'BBA-BL-071',
    canonicalName: 'Business Law & Corporate Governance',
    category: 'BBA & Management',
    aliases: ['Business Law', 'Company Law', 'Mercantile Law', 'Corporate Governance']
  },
  {
    subjectId: 'BBA-BS-072',
    canonicalName: 'Business Statistics & Quantitative Methods',
    category: 'BBA & Management',
    aliases: ['Business Statistics', 'QT', 'Quantitative Techniques', 'Business Maths']
  },
  {
    subjectId: 'BBA-FM-073',
    canonicalName: 'Financial Management & Corporate Finance',
    category: 'BBA & Management',
    aliases: ['Financial Management', 'Corporate Finance', 'Capital Budgeting', 'FM']
  },
  {
    subjectId: 'BBA-OSCM-074',
    canonicalName: 'Operations & Supply Chain Management',
    category: 'BBA & Management',
    aliases: ['Operations Management', 'Supply Chain', 'SCM', 'Logistics']
  },
  {
    subjectId: 'BBA-ENT-075',
    canonicalName: 'Entrepreneurship & Startup Management',
    category: 'BBA & Management',
    aliases: ['Entrepreneurship', 'Startups', 'Venture Creation', 'Business Model']
  },
  {
    subjectId: 'BBA-IB-076',
    canonicalName: 'International Business & Trade',
    category: 'BBA & Management',
    aliases: ['International Business', 'Foreign Trade', 'EXIM', 'Globalization']
  },
  {
    subjectId: 'BBA-BC-077',
    canonicalName: 'Business Communication & Negotiation',
    category: 'BBA & Management',
    aliases: ['Business Communication', 'Corporate Comms', 'Negotiation']
  },
  {
    subjectId: 'BBA-SM-078',
    canonicalName: 'Strategic Management & Business Policy',
    category: 'BBA & Management',
    aliases: ['Strategic Management', 'Strategy', 'SWOT Analysis', 'Competitive Advantage']
  },
  {
    subjectId: 'BBA-DM-079',
    canonicalName: 'Digital Marketing & Social Media',
    category: 'BBA & Management',
    aliases: ['Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing']
  },
  {
    subjectId: 'BBA-ME-080',
    canonicalName: 'Managerial Economics & Business Environment',
    category: 'BBA & Management',
    aliases: ['Managerial Economics', 'Microeconomics', 'Business Environment', 'Demand Forecasting']
  },
  {
    subjectId: 'BBA-CB-081',
    canonicalName: 'Consumer Behavior & Market Research',
    category: 'BBA & Management',
    aliases: ['Consumer Behavior', 'Market Research', 'Marketing Research']
  },
  {
    subjectId: 'BBA-SA-082',
    canonicalName: 'Investment & Security Analysis',
    category: 'BBA & Management',
    aliases: ['Security Analysis', 'Portfolio Management', 'Stock Market', 'Investments']
  },
  {
    subjectId: 'BBA-BA-083',
    canonicalName: 'Business Analytics & Data Driven Decision Making',
    category: 'BBA & Management',
    aliases: ['Business Analytics', 'Data Driven Decisions', 'PowerBI', 'Tableau']
  },
  {
    subjectId: 'BBA-RM-084',
    canonicalName: 'Risk Management & Banking Operations',
    category: 'BBA & Management',
    aliases: ['Risk Management', 'Banking Operations', 'Financial Risk']
  },
  {
    subjectId: 'BBA-RTM-085',
    canonicalName: 'Retail Management & Merchandising',
    category: 'BBA & Management',
    aliases: ['Retail Management', 'Merchandising', 'Store Operations']
  },

  // --- BCA & COMPUTER APPLICATIONS ---
  {
    subjectId: 'BCA-FIT-086',
    canonicalName: 'Fundamentals of Information Technology',
    category: 'BCA & Applications',
    aliases: ['FIT', 'IT Fundamentals', 'Computer Fundamentals']
  },
  {
    subjectId: 'BCA-SAD-087',
    canonicalName: 'System Analysis and Design (SAD)',
    category: 'BCA & Applications',
    aliases: ['SAD', 'System Analysis', 'DFD', 'UML Diagrams']
  },
  {
    subjectId: 'BCA-EC-088',
    canonicalName: 'E-Commerce & Cyber Law',
    category: 'BCA & Applications',
    aliases: ['E-Commerce', 'Cyber Law', 'IT Act', 'Digital Payment Systems']
  },
  {
    subjectId: 'BCA-OSS-089',
    canonicalName: 'Open Source Software & Linux Administration',
    category: 'BCA & Applications',
    aliases: ['Open Source', 'Linux Admin', 'Shell Scripting', 'Ubuntu']
  },
  {
    subjectId: 'BCA-MIS-090',
    canonicalName: 'Management Information Systems (MIS)',
    category: 'BCA & Applications',
    aliases: ['MIS', 'Management Info Systems', 'ERP', 'Enterprise Systems']
  },
  {
    subjectId: 'BCA-SPM-091',
    canonicalName: 'Software Project Management',
    category: 'BCA & Applications',
    aliases: ['SPM', 'Project Management', 'Agile Scrum', 'Function Points']
  },
  {
    subjectId: 'BCA-DSR-092',
    canonicalName: 'Data Science & R Programming',
    category: 'BCA & Applications',
    aliases: ['Data Science with R', 'R Programming', 'Data Viz']
  },
  {
    subjectId: 'BCA-EH-093',
    canonicalName: 'Ethical Hacking & Network Defense',
    category: 'BCA & Applications',
    aliases: ['Ethical Hacking', 'Penetration Testing', 'Network Security', 'CEH']
  },
  {
    subjectId: 'BCA-MM-094',
    canonicalName: 'Multimedia Technologies & Animation',
    category: 'BCA & Applications',
    aliases: ['Multimedia', 'Animation', 'Flash', 'Audio Video Editing']
  },
  {
    subjectId: 'BCA-CAD-095',
    canonicalName: 'Cloud Application Development',
    category: 'BCA & Applications',
    aliases: ['Cloud Apps', 'SaaS', 'PaaS', 'Serverless']
  },

  // --- B.SC SCIENCES & MATHEMATICS ---
  {
    subjectId: 'BSC-CM-096',
    canonicalName: 'Classical Mechanics & Relativity',
    category: 'B.Sc Sciences',
    aliases: ['Classical Mechanics', 'Newtonian Mechanics', 'Special Relativity', 'Lagrangian']
  },
  {
    subjectId: 'BSC-QM-097',
    canonicalName: 'Quantum Mechanics & Atomic Physics',
    category: 'B.Sc Sciences',
    aliases: ['Quantum Mechanics', 'Atomic Physics', 'Schrodinger Equation', 'Wave Mechanics']
  },
  {
    subjectId: 'BSC-EM-098',
    canonicalName: 'Electromagnetism & Electrodynamics',
    category: 'B.Sc Sciences',
    aliases: ['Electromagnetism', 'Electrodynamics', 'Vector Fields', 'Magnetism']
  },
  {
    subjectId: 'BSC-OPT-099',
    canonicalName: 'Optics, Lasers & Wave Motion',
    category: 'B.Sc Sciences',
    aliases: ['Optics', 'Wave Optics', 'Lasers', 'Interference & Diffraction']
  },
  {
    subjectId: 'BSC-TSM-100',
    canonicalName: 'Thermal Physics & Statistical Mechanics',
    category: 'B.Sc Sciences',
    aliases: ['Thermal Physics', 'Statistical Mechanics', 'Entropy', 'Partition Function']
  },
  {
    subjectId: 'BSC-OC-101',
    canonicalName: 'Organic Chemistry & Reaction Mechanisms',
    category: 'B.Sc Sciences',
    aliases: ['Organic Chemistry', 'Stereochemistry', 'Reaction Mechanisms', 'Aromaticity']
  },
  {
    subjectId: 'BSC-IC-102',
    canonicalName: 'Inorganic Chemistry & Coordination Compounds',
    category: 'B.Sc Sciences',
    aliases: ['Inorganic Chemistry', 'Coordination Chemistry', 'Transition Metals', 'Periodic Table']
  },
  {
    subjectId: 'BSC-PC-103',
    canonicalName: 'Physical Chemistry & Chemical Kinetics',
    category: 'B.Sc Sciences',
    aliases: ['Physical Chemistry', 'Chemical Kinetics', 'Electrochemistry', 'Surface Chemistry']
  },
  {
    subjectId: 'BSC-AC-104',
    canonicalName: 'Analytical Chemistry & Spectroscopy',
    category: 'B.Sc Sciences',
    aliases: ['Analytical Chemistry', 'Spectroscopy', 'NMR', 'IR', 'Chromatography']
  },
  {
    subjectId: 'BSC-BC-105',
    canonicalName: 'Biochemistry & Biomolecules',
    category: 'B.Sc Sciences',
    aliases: ['Biochemistry', 'Proteins', 'Enzymes', 'Metabolic Pathways']
  },

  // --- MATHEMATICS & STATISTICS (BSC / BTECH / BCA) ---
  {
    subjectId: 'MATH-CAL-106',
    canonicalName: 'Calculus & Multivariable Calculus',
    category: 'Mathematics & Statistics',
    aliases: ['Calculus', 'Multivariable Calculus', 'Integration', 'Differentiation', 'Limits']
  },
  {
    subjectId: 'MATH-DE-107',
    canonicalName: 'Differential Equations & Vector Calculus',
    category: 'Mathematics & Statistics',
    aliases: ['Differential Equations', 'ODE', 'PDE', 'Vector Calculus', 'Laplace Transforms']
  },
  {
    subjectId: 'MATH-LA-108',
    canonicalName: 'Linear Algebra & Matrix Theory',
    category: 'Mathematics & Statistics',
    aliases: ['Linear Algebra', 'Matrices', 'Vector Spaces', 'Eigenvalues']
  },
  {
    subjectId: 'MATH-RA-109',
    canonicalName: 'Real Analysis & Complex Analysis',
    category: 'Mathematics & Statistics',
    aliases: ['Real Analysis', 'Complex Analysis', 'Analytic Functions', 'Sequence & Series']
  },
  {
    subjectId: 'MATH-AA-110',
    canonicalName: 'Abstract Algebra & Group Theory',
    category: 'Mathematics & Statistics',
    aliases: ['Abstract Algebra', 'Group Theory', 'Rings & Fields']
  },
  {
    subjectId: 'MATH-NM-111',
    canonicalName: 'Numerical Methods & Computational Analysis',
    category: 'Mathematics & Statistics',
    aliases: ['Numerical Methods', 'Numerical Analysis', 'Newton Raphson', 'Interpolation']
  },
  {
    subjectId: 'MATH-PROB-112',
    canonicalName: 'Probability Theory & Mathematical Statistics',
    category: 'Mathematics & Statistics',
    aliases: ['Probability', 'Statistics', 'Bayes Theorem', 'Random Variables', 'Distributions']
  },
  {
    subjectId: 'BSC-MB-113',
    canonicalName: 'Microbiology & Applied Bacteriology',
    category: 'B.Sc Sciences',
    aliases: ['Microbiology', 'Bacteriology', 'Virology', 'Staining']
  },
  {
    subjectId: 'BSC-GEN-114',
    canonicalName: 'Genetics & Cytology',
    category: 'B.Sc Sciences',
    aliases: ['Genetics', 'Mendelian Genetics', 'Chromosomes', 'Cytology']
  },
  {
    subjectId: 'BSC-BOT-115',
    canonicalName: 'Plant Physiology & Applied Botany',
    category: 'B.Sc Sciences',
    aliases: ['Botany', 'Plant Physiology', 'Photosynthesis', 'Plant Anatomy']
  }
];

/**
 * Autocomplete helper for canonical subjects based on query string or branch category
 */
export function searchCanonicalSubjects(query: string, categoryFilter?: string): CanonicalSubject[] {
  let list = CANONICAL_SUBJECTS;
  
  if (categoryFilter && categoryFilter !== 'ALL') {
    list = list.filter(s => s.category === categoryFilter);
  }

  if (!query || !query.trim()) return list.slice(0, 12);
  const q = query.toLowerCase().trim();

  return list.filter(subject => {
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
    category: 'Computer Science & IT',
    aliases: [subjectNameOrId]
  };
}

