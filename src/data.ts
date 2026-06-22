/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Source, Lecture, WeakTopic, Quiz, NotificationItem, UserSettings, FAQItem, PricingPlan } from './types';

export const INITIAL_SOURCES: Source[] = [
  { id: '1', name: 'Lecture_BioGenetics_04.pdf', type: 'pdf', size: '4.2 MB', addedAt: '2 hours ago', wordCount: 3452 },
  { id: '2', name: 'Quantum_Entanglement_Theory.txt', type: 'text', size: '15 KB', addedAt: 'Yesterday', wordCount: 1200 },
  { id: '3', name: 'Economic_Models_Midterm_Review.pdf', type: 'pdf', size: '1.8 MB', addedAt: '3 days ago', wordCount: 2200 },
  { id: '4', name: 'Ethics_in_AI_Symposium_Record.wav', type: 'recording', size: '24.5 MB', addedAt: 'Oct 15, 2023', wordCount: 4500 }
];

export const INITIAL_LECTURES: Lecture[] = [
  { id: 'l1', title: 'Advanced Quantum Mechanics - L04', subject: 'Physics', duration: '42 mins', addedAt: '2 hours ago', status: 'transcribing', type: 'recording' },
  { id: 'l2', title: 'European Economic History 1945-2000', subject: 'Economics', pages: 12, addedAt: '5 hours ago', status: 'generated', type: 'pdf' },
  { id: 'l3', title: 'Neural Net Architectures & Optimization', subject: 'Computer Science', pages: 18, addedAt: 'Oct 18, 2023', status: 'generated', type: 'pdf' },
  { id: 'l4', title: 'Ethics in AI: Contemporary Symposium', subject: 'Philosophy', duration: '14 mins', addedAt: 'Oct 15, 2023', status: 'generated', type: 'recording' }
];

export const INITIAL_WEAK_TOPICS: WeakTopic[] = [
  {
    id: 'wt1',
    topicName: 'Calculus III: Triple Integrals',
    subject: 'Mathematics',
    masteryScore: 34,
    lastAttempt: 'Oct 24, 2023',
    aiDiagnosis: 'Difficulty identifying symmetry elements in 3D structures and choosing optimal coordinate systems.',
    actionPlan: [
      'Practice boundary mapping with spherical coordinate sheets.',
      'Solve Triple Integrals mock exercise 1-12.',
      'Consult AI Workspace on Jacobian transformation mechanics.'
    ]
  },
  {
    id: 'wt2',
    topicName: 'Organic Chemistry: Chirality',
    subject: 'Chemistry',
    masteryScore: 41,
    lastAttempt: 'Oct 22, 2023',
    aiDiagnosis: 'Persistent confusion between R/S configurations in complex multi-center Fischer projections.',
    actionPlan: [
      'Generate a focused interactive quiz on multi-center stereoisomers.',
      'Interactive 3D model visualizer consult on priority rules.',
      'Do custom flashcard run of 20 practice compounds.'
    ]
  },
  {
    id: 'wt3',
    topicName: 'Neural Networks: Backprop Algorithm',
    subject: 'Computer Science',
    masteryScore: 28,
    lastAttempt: 'Oct 28, 2023',
    aiDiagnosis: 'Mathematical derivation of chain rule in matrix form is incorrectly applied in recent synthesis notes.',
    actionPlan: [
      'Deconstruct the gradient descent updates for hidden layers manually.',
      'Re-watch neural lecture snippets between timestamp 14:02 - 18:45.',
      'Simplify Backpropagation concepts using simplified visual matrix shapes.'
    ]
  },
  {
    id: 'wt4',
    topicName: 'Quantum Mechanics: Wavefunctions',
    subject: 'Physics',
    masteryScore: 55,
    lastAttempt: 'Oct 15, 2023',
    aiDiagnosis: 'Incomplete normalization factors in critical boundary state calculations.',
    actionPlan: [
      'Revise infinite square well wavefunction properties.',
      'Review Hermitian operators and eigen value mappings.'
    ]
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Neural Plasticity & Cognitive Recovery',
    topic: 'Neurobiology',
    questionsCount: 30,
    estimatedTime: '20 mins',
    status: 'available',
    questions: [], // will be initialized to active questions
    easyQuestions: [
      {
        id: 'q1_e1',
        type: 'mcq',
        question: 'Which of the following describes synaptic pruning?',
        options: [
          'A process in which unused synapses/connections are destroyed to increase network efficiency.',
          'The constant creation of brand new neurons in the central hippocampus.',
          'An abnormal clinical condition causing myelin sheath degradation.',
          'The integration of Google digital tools with human memory structures.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Synaptic pruning is the natural process where the brain removes extra, unused synapses to optimize neural networks.',
        sourceCitation: '[Source: Neurobiology Basics.pdf, Page 12]'
      },
      {
        id: 'q1_e2',
        type: 'true_false',
        question: 'True or False: In adult humans, neurogenesis occurs prominently in the cerebellar cortex.',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'Adult neurogenesis is primarily restricted to the hippocampal subgranular zone and the subventricular zone, not the cerebellum.',
        sourceCitation: '[Source: Brain Regeneration.pdf, Page 4]'
      },
      {
        id: 'q1_e3',
        type: 'fill_blank',
        question: 'The major excitatory neurotransmitter involved in Long-Term Potentiation (LTP) is ____, which acts on NMDA receptors.',
        options: ['GABA', 'Glutamate', 'Dopamine', 'Acetylcholine'],
        correctAnswerIndex: 1,
        explanation: 'Glutamate is the main excitatory neurotransmitter in the CNS and is crucial for LTP by activating NMDA receptors.',
        sourceCitation: '[Source: Synaptic Transmission.pdf, Page 8]'
      },
      {
        id: 'q1_e4',
        type: 'match_following',
        question: 'Match the neuroplasticity term to its correct description:',
        options: [
          'A-1, B-2, C-3',
          'A-2, B-1, C-3',
          'A-3, B-2, C-1',
          'A-1, B-3, C-2'
        ],
        correctAnswerIndex: 0,
        matchLeft: ['A. Synaptic Plasticity', 'B. Neurogenesis', 'C. Cortical Reorganization'],
        matchRight: ['1. Changes in synapse strength', '2. Creation of new neurons', '3. Re-mapping of brain regions'],
        correctMatchPairs: { 'A': '1', 'B': '2', 'C': '3' },
        explanation: 'Synaptic plasticity refers to changes in connection strength, neurogenesis to new neurons, and reorganization to remapping inputs.',
        sourceCitation: '[Source: Cognitive Recovery.pdf, Page 22]'
      },
      {
        id: 'q1_e5',
        type: 'assertion_reason',
        question: 'Determine if the assertion and reason statements are correct and related.',
        options: [
          'Both A and R are true and R is the correct explanation of A.',
          'Both A and R are true but R is NOT the correct explanation of A.',
          'A is true but R is false.',
          'A is false but R is true.'
        ],
        correctAnswerIndex: 0,
        scenario: 'Assertion (A): Repeating recovery exercises is critical for stroke rehabilitation.\nReason (R): High-repetition practice stimulates Hebbian learning and stabilizes newly formed pathways.',
        explanation: 'High-repetition physical practice forces the firing of matching motor networks, driving synaptic consolidation ("fire together, wire together").',
        sourceCitation: '[Source: Stroke Rehab Principles.pdf, Page 15]'
      },
      {
        id: 'q1_e6',
        type: 'scenario_based',
        question: 'What should the therapist prioritize based on this diagnostic profile?',
        options: [
          'Include active cognitive retrieval exercises during rehabilitation sessions.',
          'Ensure absolute cognitive rest and avoid mental challenge.',
          'Focus solely on physical motor exercises without cognitive tasks.',
          'Increase sleep intervals to 12 hours a day.'
        ],
        correctAnswerIndex: 0,
        scenario: 'A 45-year-old patient recovers from a minor traumatic brain injury. While their motor skills are largely intact, they struggle with working memory and cognitive fatigue during multi-step tasks.',
        explanation: 'Active retrieval and cognitive engagement stimulate plastic structural changes in the hippocampus, which is critical for restoring memory pathways.',
        sourceCitation: '[Source: Traumatic Brain Injury.pdf, Page 42]'
      },
      {
        id: 'q1_e7',
        type: 'mcq',
        question: 'What is the role of brain-derived neurotrophic factor (BDNF)?',
        options: [
          'It promotes the survival, growth, and maintenance of neurons.',
          'It triggers immediate programmed cell death of microglia.',
          'It acts as the primary chemical barrier to block blood flow.',
          'It degrades neurotransmitters in the synaptic cleft.'
        ],
        correctAnswerIndex: 0,
        explanation: 'BDNF is a crucial protein that supports the survival of existing neurons and encourages the growth of new synapses.',
        sourceCitation: '[Source: Molecular Neuroscience.pdf, Page 110]'
      },
      {
        id: 'q1_e8',
        type: 'true_false',
        question: 'True or False: Cognitive reserve theory suggests that higher education levels can delay clinical symptoms of dementia.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Cognitive reserve allows the brain to utilize alternative neural pathways, delaying the functional impacts of cognitive decline.',
        sourceCitation: '[Source: Aging and Cognition.pdf, Page 53]'
      },
      {
        id: 'q1_e9',
        type: 'fill_blank',
        question: 'The anatomical structure that coordinates complex motor learning and error correction is the ____.',
        options: ['Cerebellum', 'Hippocampus', 'Amygdala', 'Thalamus'],
        correctAnswerIndex: 0,
        explanation: 'The cerebellum is primary responsible for sensorimotor coordination, motor learning, and fine-tuning physical actions.',
        sourceCitation: '[Source: Motor Systems.pdf, Page 35]'
      },
      {
        id: 'q1_e10',
        type: 'mcq',
        question: 'Which brain region acts as the main hub for sorting sensory inputs?',
        options: ['Thalamus', 'Hypothalamus', 'Medulla', 'Pons'],
        correctAnswerIndex: 0,
        explanation: 'The thalamus is the gateway for sensory information, routing incoming signals to the appropriate areas of the cerebral cortex.',
        sourceCitation: '[Source: Neuroanatomy Guide.pdf, Page 19]'
      }
    ],
    mediumQuestions: [
      {
        id: 'q1_m1',
        type: 'mcq',
        question: 'During Long-Term Potentiation (LTP), what is the key event triggered by Calcium entry through NMDA receptors?',
        options: [
          'Insertion of additional AMPA receptors into the postsynaptic membrane.',
          'Immediate blocking of voltage-gated Sodium channels.',
          'Upregulation of potassium leak currents in astrocytes.',
          'Dissociation of myelin sheaths surrounding axon segments.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Calcium influx triggers intracellular cascades that insert more AMPA receptors postsynaptically, increasing synaptic sensitivity.',
        sourceCitation: '[Source: Molecular LTP.pdf, Page 29]'
      },
      {
        id: 'q1_m2',
        type: 'true_false',
        question: 'True or False: Long-Term Depression (LTD) is characterized by a low-frequency stimulation that decreases synaptic strength.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'LTD is indeed triggered by low-frequency stimulation, causing a decrease in synaptic efficacy by internalizing AMPA receptors.',
        sourceCitation: '[Source: Synaptic Plasticity.pdf, Page 72]'
      },
      {
        id: 'q1_m3',
        type: 'fill_blank',
        question: 'The specialized glial cells that form the myelin sheath in the Central Nervous System are ____.',
        options: ['Oligodendrocytes', 'Schwann cells', 'Astrocytes', 'Microglia'],
        correctAnswerIndex: 0,
        explanation: 'Oligodendrocytes myelinate CNS axons, whereas Schwann cells perform the same role in the Peripheral Nervous System (PNS).',
        sourceCitation: '[Source: Glial Biology.pdf, Page 14]'
      },
      {
        id: 'q1_m4',
        type: 'match_following',
        question: 'Match the receptors to their primary activation mechanism:',
        options: [
          'A-1, B-2, C-3',
          'A-2, B-3, C-1',
          'A-3, B-1, C-2',
          'A-1, B-3, C-2'
        ],
        correctAnswerIndex: 0,
        matchLeft: ['A. AMPA Receptor', 'B. NMDA Receptor', 'C. metabotropic glutamate receptor'],
        matchRight: ['1. Ligand-gated Na+ influx', '2. Voltage & ligand-gated Ca2+ influx', '3. G-protein coupled cascade'],
        correctMatchPairs: { 'A': '1', 'B': '2', 'C': '3' },
        explanation: 'AMPA allows fast Na+ entry; NMDA is blocked by Mg2+ requiring depolarization to open for Ca2+; mGluRs are G-protein coupled.',
        sourceCitation: '[Source: Synaptic Receptors.pdf, Page 61]'
      },
      {
        id: 'q1_m5',
        type: 'assertion_reason',
        question: 'Determine if the assertion and reason statements are correct and related.',
        options: [
          'Both A and R are true and R is the correct explanation of A.',
          'Both A and R are true but R is NOT the correct explanation of A.',
          'A is true but R is false.',
          'A is false but R is true.'
        ],
        correctAnswerIndex: 1,
        scenario: 'Assertion (A): Microglia are crucial for developmental brain wiring.\nReason (R): Microglia produce action potentials that bypass damaged axonal networks.',
        explanation: 'Microglia do prune synapses during development (making assertion A true), but they are immune glial cells and do NOT produce action potentials (making reason R false).',
        sourceCitation: '[Source: Glia and Development.pdf, Page 85]'
      },
      {
        id: 'q1_m6',
        type: 'scenario_based',
        question: 'Which neural mechanism is primarily responsible for the rapid adaptation in this sensory map?',
        options: [
          'Unmasking of pre-existing latent horizontal connections in the cortex.',
          'Immediate neurogenesis in the primary sensory cortex.',
          'Total degradation of myelinated descending tracts.',
          'Permanent shrinkage of somatic cell bodies in the thalamus.'
        ],
        correctAnswerIndex: 0,
        scenario: 'A laboratory animal undergoes sensory deprivation in its middle digits. Within days, cortical maps show that adjacent finger representations have expanded to occupy the inactive cortical territory.',
        explanation: 'Rapid cortical remapping (within days) occurs by unmasking and strengthening latent horizontal synapses, rather than structural neurogenesis.',
        sourceCitation: '[Source: Cortical Remapping.pdf, Page 104]'
      },
      {
        id: 'q1_m7',
        type: 'mcq',
        question: 'What is the role of retrograde messengers, such as Nitric Oxide, in LTP?',
        options: [
          'They travel back to the presynaptic terminal to increase future glutamate release.',
          'They bind postsynaptic receptors to block calcium entry.',
          'They degrade myelin sheaths to speed up local signaling.',
          'They stimulate the immediate destruction of astrocytes.'
        ],
        correctAnswerIndex: 0,
        explanation: 'NO acts retrogradely, diffusing back to the presynaptic cell to enhance neurotransmitter release, reinforcing the synapse.',
        sourceCitation: '[Source: Retrograde Messengers.pdf, Page 92]'
      },
      {
        id: 'q1_m8',
        type: 'true_false',
        question: 'True or False: Environmental enrichment increases dendritic branching and spine density in cortical neurons.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Enriched environments provide sensory, cognitive, and physical stimulation, leading to structural remodeling of dendrites.',
        sourceCitation: '[Source: Plasticity and Environment.pdf, Page 47]'
      },
      {
        id: 'q1_m9',
        type: 'fill_blank',
        question: 'The process by which new neurons migrate to their final destinations along specialized cells is guided by ____ glia.',
        options: ['Radial', 'Micro', 'Astro', 'Schwann'],
        correctAnswerIndex: 0,
        explanation: 'Radial glial cells act as scaffolds, guiding migrating immature neurons during neural development.',
        sourceCitation: '[Source: Neural Migration.pdf, Page 39]'
      },
      {
        id: 'q1_m10',
        type: 'mcq',
        question: 'Which factor blocks the NMDA receptor pore at resting membrane potentials?',
        options: ['Magnesium ion (Mg2+)', 'Sodium ion (Na+)', 'Potassium ion (K+)', 'Chloride ion (Cl-)'],
        correctAnswerIndex: 0,
        explanation: 'At rest, a Magnesium ion sits in the NMDA channel pore, preventing ion flow until depolarization ejects it.',
        sourceCitation: '[Source: Biophysics of Receptors.pdf, Page 121]'
      }
    ],
    hardQuestions: [
      {
        id: 'q1_h1',
        type: 'mcq',
        question: 'Which signaling cascade is primary responsible for translating calcium signals into gene expression changes during late-phase LTP (L-LTP)?',
        options: [
          'CaMKII -> Adenylyl Cyclase -> cAMP -> PKA -> CREB phosphorylation.',
          'IP3 -> DAG -> PKC -> Immediate axon growth induction.',
          'GABA-A depolarization -> Cl- efflux -> Myelin consolidation.',
          'Glutamate -> AMPA internalization -> Thalamic silencing.'
        ],
        correctAnswerIndex: 0,
        explanation: 'L-LTP requires transcription and translation, which is triggered by Ca2+ activating cAMP-PKA pathways to phosphorylate the CREB transcription factor.',
        sourceCitation: '[Source: Advanced Synaptic Plasticity.pdf, Page 204]'
      },
      {
        id: 'q1_h2',
        type: 'true_false',
        question: 'True or False: Silent synapses are neurobiologically defined as having NMDA receptors but lacking functional AMPA receptors.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Silent synapses have NMDA receptors but no AMPA receptors. Since NMDA is blocked at rest, they show no response (silent) until depolarized.',
        sourceCitation: '[Source: Silent Synapses.pdf, Page 88]'
      },
      {
        id: 'q1_h3',
        type: 'fill_blank',
        question: 'The enzymatic activation of ____ is the critical event that phosphorylates AMPA receptors to increase their single-channel conductance during early LTP.',
        options: ['CaMKII', 'Calcineurin', 'Caspase-3', 'AChE'],
        correctAnswerIndex: 0,
        explanation: 'Calcium/calmodulin-dependent protein kinase II (CaMKII) phosphorylates AMPA receptors directly, enhancing their conductance and traffic.',
        sourceCitation: '[Source: Enzymatic Kinases.pdf, Page 112]'
      },
      {
        id: 'q1_h4',
        type: 'match_following',
        question: 'Match the cellular components to their specific role in structural plasticity:',
        options: [
          'A-1, B-2, C-3',
          'A-3, B-1, C-2',
          'A-2, B-3, C-1',
          'A-1, B-3, C-2'
        ],
        correctAnswerIndex: 1,
        matchLeft: ['A. Cofilin', 'B. Actin Filaments', 'C. PSD-95'],
        matchRight: ['1. Dynamic cytoskeletal structural core', '2. Scaffolding anchor for postsynaptic density', '3. Depolymerizes actin to allow spine remodeling'],
        correctMatchPairs: { 'A': '3', 'B': '1', 'C': '2' },
        explanation: 'Cofilin severs actin to allow spine shape changes; actin filaments are the cytoskeletal core; PSD-95 anchors postsynaptic proteins.',
        sourceCitation: '[Source: Cytoskeleton Dynamics.pdf, Page 174]'
      },
      {
        id: 'q1_h5',
        type: 'assertion_reason',
        question: 'Determine if the assertion and reason statements are correct and related.',
        options: [
          'Both A and R are true and R is the correct explanation of A.',
          'Both A and R are true but R is NOT the correct explanation of A.',
          'A is true but R is false.',
          'A is false but R is true.'
        ],
        correctAnswerIndex: 0,
        scenario: 'Assertion (A): Protein synthesis inhibitors block the maintenance of LTP but do not affect its induction.\nReason (R): Early-phase LTP relies on post-translational modification of existing proteins, whereas late-phase LTP requires de novo protein synthesis.',
        explanation: 'Induction and early-phase LTP rely on modifying pre-existing receptors (e.g. CaMKII phosphorylation). However, late-phase LTP (maintenance) requires new proteins to physically stabilize and expand the dendritic spine.',
        sourceCitation: '[Source: Protein Synthesis & Memory.pdf, Page 130]'
      },
      {
        id: 'q1_h6',
        type: 'scenario_based',
        question: 'Which developmental process has been pathologically disrupted in this clinical model?',
        options: [
          'Defective synaptic pruning due to impaired microglial phagocytosis.',
          'Excessive Schwann cell myelination in peripheral nerve tracks.',
          'Complete inhibition of glutamate release in the thalamus.',
          'Premature death of radial glial cells in the neocortex.'
        ],
        correctAnswerIndex: 0,
        scenario: 'An experimental mouse model lacking the CX3CR1 chemokine receptor (expressed in microglia) exhibits a persistent excess of dendritic spines and immature synaptic connections in the visual cortex during adulthood.',
        explanation: 'CX3CR1-deficient microglia cannot prune synapses properly. This results in an overabundance of weak, immature, unpruned connections in the adult cortex.',
        sourceCitation: '[Source: Microglial Pruning Pathology.pdf, Page 312]'
      },
      {
        id: 'q1_h7',
        type: 'mcq',
        question: 'What is the function of the protein Arc (activity-regulated cytoskeleton-associated protein) in homeostatic plasticity?',
        options: [
          'It accelerates the endocytosis of AMPA receptors, reducing overall excitability.',
          'It directly synthesizes myelin lipids inside oligodendrocytes.',
          'It triggers apoptosis in active postsynaptic cells.',
          'It blocks the transcription of BDNF in the nucleus.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Arc regulates synaptic scaling and receptor trafficking by promoting the internalization of AMPA receptors to adjust network baseline activity.',
        sourceCitation: '[Source: Arc Gene Function.pdf, Page 155]'
      },
      {
        id: 'q1_h8',
        type: 'true_false',
        question: 'True or False: Spine enlargement during LTP is mediated by the rapid polymerization of G-actin into F-actin, shifting structural volume.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'LTP induction shifts the actin equilibrium toward polymerized F-actin, expanding the physical cytoskeleton of the dendritic spine.',
        sourceCitation: '[Source: Actin Dynamics.pdf, Page 225]'
      },
      {
        id: 'q1_h9',
        type: 'fill_blank',
        question: 'The immediate-early gene product that binds to the promoter of neurotrophic factors and is activated by CREB is ____.',
        options: ['c-Fos', 'mTOR', 'Akt', 'GSK3B'],
        correctAnswerIndex: 0,
        explanation: 'c-Fos is an immediate-early gene activated by CREB that dimerizes with c-Jun to regulate downstream plasticity genes.',
        sourceCitation: '[Source: Transcription Factors.pdf, Page 97]'
      },
      {
        id: 'q1_h10',
        type: 'mcq',
        question: 'What is the role of CaM-kinase kinase (CaMKK) in late LTP?',
        options: [
          'It phosphorylates CaMKIV, which in turn activates CREB in the nucleus.',
          'It degrades calcium ions in the postsynaptic cytoplasm.',
          'It directly internalizes GABA receptors in the membrane.',
          'It acts as a structural anchor at the PSD-95 lattice.'
        ],
        correctAnswerIndex: 0,
        explanation: 'CaMKK acts upstream of CaMKIV in the nucleus, triggering the phosphorylation and activation of CREB to start transcription.',
        sourceCitation: '[Source: Nuclear Kinases.pdf, Page 268]'
      }
    ]
  },
  {
    id: 'q2',
    title: 'Chirality & Fischer Projections Review',
    topic: 'Organic Chemistry',
    questionsCount: 30,
    estimatedTime: '15 mins',
    status: 'available',
    questions: [],
    easyQuestions: [
      {
        id: 'q2_e1',
        type: 'mcq',
        question: 'What is the absolute configuration of a carbon center where priority groups 1 -> 2 -> 3 run clockwise with Hydrogen in the vertical position?',
        options: ['R configuration', 'S configuration', 'D configuration', 'L configuration'],
        correctAnswerIndex: 0,
        explanation: 'With Hydrogen in a vertical position (pointing away), clockwise priority sequence directly maps to the R configuration.',
        sourceCitation: '[Source: Stereochemistry Guide.pdf, Page 12]'
      },
      {
        id: 'q2_e2',
        type: 'true_false',
        question: 'True or False: Achiral molecules are superimposable on their mirror images.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Achiral molecules have an internal plane of symmetry, making them superimposable on their mirror images.',
        sourceCitation: '[Source: Molecular Symmetry.pdf, Page 4]'
      },
      {
        id: 'q2_e3',
        type: 'fill_blank',
        question: 'A carbon atom bonded to four distinct substituents is known as a ____ center.',
        options: ['Chiral', 'Aromatic', 'Planar', 'Anomeric'],
        correctAnswerIndex: 0,
        explanation: 'A tetrahedral carbon with 4 different groups is a chiral center, also called a stereocenter or asymmetric carbon.',
        sourceCitation: '[Source: Basic Chirality.pdf, Page 8]'
      },
      // 7 more questions to satisfy the 10 count
      {
        id: 'q2_e4',
        type: 'mcq',
        question: 'What term defines a mixture containing equal amounts of left- and right-handed enantiomers?',
        options: ['Racemic mixture', 'Meso compound', 'Diastereomer', 'Anomer'],
        correctAnswerIndex: 0,
        explanation: 'A racemic mixture has equal proportions of both enantiomers, resulting in zero net optical activity.',
        sourceCitation: '[Source: Chirality Intro.pdf, Page 15]'
      },
      {
        id: 'q2_e5',
        type: 'true_false',
        question: 'True or False: Meso compounds are optically active.',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'Meso compounds contain chiral centers but have an internal plane of symmetry, making them optically inactive due to internal compensation.',
        sourceCitation: '[Source: Stereo Properties.pdf, Page 32]'
      },
      {
        id: 'q2_e6',
        type: 'mcq',
        question: 'Which prefix designates clockwise rotation of plane-polarized light?',
        options: ['dextrorotatory (+)', 'levorotatory (-)', 'R-', 'S-'],
        correctAnswerIndex: 0,
        explanation: 'Dextrorotatory (+) refers to clockwise rotation, while levorotatory (-) refers to counter-clockwise rotation.',
        sourceCitation: '[Source: Light Rotation.pdf, Page 19]'
      },
      {
        id: 'q2_e7',
        type: 'fill_blank',
        question: 'In Fischer projections, horizontal bonds represent groups pointing ____ the viewer.',
        options: ['Towards', 'Away from', 'Parallel to', 'Below'],
        correctAnswerIndex: 0,
        explanation: 'In a Fischer projection, horizontal lines represent bonds coming out of the page towards you, while vertical lines represent bonds going away.',
        sourceCitation: '[Source: Fischer Rules.pdf, Page 22]'
      },
      {
        id: 'q2_e8',
        type: 'mcq',
        question: 'Which priority rule system is used to determine R/S configurations?',
        options: ['Cahn-Ingold-Prelog (CIP)', 'Markovnikov', 'Hunds Rule', 'Lewis System'],
        correctAnswerIndex: 0,
        explanation: 'The Cahn-Ingold-Prelog (CIP) priority rules assign priorities based on atomic numbers to denote R/S configs.',
        sourceCitation: '[Source: IUPAC Rules.pdf, Page 41]'
      },
      {
        id: 'q2_e9',
        type: 'true_false',
        question: 'True or False: Enantiomers have identical physical properties in an achiral environment.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Enantiomers share physical properties like melting/boiling points and density, and only differ in their interaction with polarized light or chiral agents.',
        sourceCitation: '[Source: Organic Chemistry.pdf, Page 88]'
      },
      {
        id: 'q2_e10',
        type: 'mcq',
        question: 'How many stereoisomers can exist for a molecule with 3 chiral centers?',
        options: ['8', '6', '4', '16'],
        correctAnswerIndex: 0,
        explanation: 'The maximum number of stereoisomers is given by 2^n, where n is the number of chiral centers. 2^3 = 8.',
        sourceCitation: '[Source: Stereochemistry Principles.pdf, Page 50]'
      }
    ],
    mediumQuestions: [
      {
        id: 'q2_m1',
        type: 'mcq',
        question: 'How are diastereomers distinguished physically from enantiomers?',
        options: [
          'Diastereomers have entirely distinct physical properties (boiling points, solubilities) in all environments.',
          'They rotate light in identical magnitudes.',
          'They cannot be separated by standard crystallization.',
          'They have identical dipole moments.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Diastereomers are not mirror images and have distinct physical properties, making them easy to separate via chromatography or crystallization.',
        sourceCitation: '[Source: Diastereomers.pdf, Page 41]'
      },
      {
        id: 'q2_m2',
        type: 'true_false',
        question: 'True or False: Rotating a Fischer projection by 90 degrees in the plane of the page changes the stereochemical configuration.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Rotating a Fischer projection by 90 degrees exchanges horizontal and vertical groups, inverting the configuration (R becomes S). A 180-degree rotation preserves it.',
        sourceCitation: '[Source: Fischer Transformations.pdf, Page 12]'
      },
      {
        id: 'q2_m3',
        type: 'fill_blank',
        question: 'If a chiral molecule is dextrorotatory, its enantiomer must be ____.',
        options: ['Levorotatory', 'Meso', 'Achiral', 'Racemic'],
        correctAnswerIndex: 0,
        explanation: 'Enantiomers always rotate plane-polarized light in equal magnitudes but opposite directions.',
        sourceCitation: '[Source: Optical Activity.pdf, Page 29]'
      },
      {
        id: 'q2_m4',
        type: 'mcq',
        question: 'Which of the following molecules has a meso stereoisomer?',
        options: ['Tartaric acid', '2-chlorobutane', 'Lactic acid', '1-phenylethanol'],
        correctAnswerIndex: 0,
        explanation: 'Tartaric acid contains two identical chiral carbons, giving rise to a symmetrical meso form.',
        sourceCitation: '[Source: Meso Structures.pdf, Page 33]'
      },
      {
        id: 'q2_m5',
        type: 'true_false',
        question: 'True or False: Resolution is the process of separating a racemic mixture into its individual pure enantiomers.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Resolution separates enantiomers, typically by reacting them with a chiral agent to create separable diastereomeric salts.',
        sourceCitation: '[Source: Resolution Methods.pdf, Page 52]'
      },
      {
        id: 'q2_m6',
        type: 'mcq',
        question: 'What is the relationship between (2R, 3R)-tartaric acid and (2S, 3S)-tartaric acid?',
        options: ['Enantiomers', 'Diastereomers', 'Identical compounds', 'Constitutional isomers'],
        correctAnswerIndex: 0,
        explanation: 'Since all chiral centers are inverted (R,R to S,S), the two molecules are non-superimposable mirror images: enantiomers.',
        sourceCitation: '[Source: Stereoisomers.pdf, Page 64]'
      },
      {
        id: 'q2_m7',
        type: 'fill_blank',
        question: 'A reaction that yields predominantly one stereoisomer over another is described as ____.',
        options: ['Stereoselective', 'Regioselective', 'Endothermic', 'Catalytic'],
        correctAnswerIndex: 0,
        explanation: 'Stereoselective reactions favor the formation of a specific stereoisomer pathway.',
        sourceCitation: '[Source: Synthesis Mechanics.pdf, Page 78]'
      },
      {
        id: 'q2_m8',
        type: 'mcq',
        question: 'Which conformer of cyclohexane is the most stable at room temperature?',
        options: ['Chair conformer', 'Boat conformer', 'Twist-boat conformer', 'Half-chair conformer'],
        correctAnswerIndex: 0,
        explanation: 'The chair conformation minimizes both torsional strain and steric strain, making it the lowest energy conformer.',
        sourceCitation: '[Source: Conformational Analysis.pdf, Page 85]'
      },
      {
        id: 'q2_m9',
        type: 'true_false',
        question: 'True or False: A mixture of 70% R enantiomer and 30% S enantiomer has an enantiomeric excess (ee) of 40%.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Enantiomeric excess is calculated as %major - %minor, which is 70% - 30% = 40% ee.',
        sourceCitation: '[Source: Enantiomeric Purity.pdf, Page 91]'
      },
      {
        id: 'q2_m10',
        type: 'mcq',
        question: 'Which element is NOT a potential source of chirality?',
        options: ['Planar sp2 hybridized carbon', 'Asymmetric sulfur (sulfoxides)', 'Chiral nitrogen (quaternary ammonium salts)', 'Asymmetric phosphorus'],
        correctAnswerIndex: 0,
        explanation: 'A planar sp2 carbon has a plane of symmetry and is achiral. Sulfoxides and quaternary nitrogen can be chiral centers.',
        sourceCitation: '[Source: Heteroatom Chirality.pdf, Page 112]'
      }
    ],
    hardQuestions: [
      {
        id: 'q2_h1',
        type: 'mcq',
        question: 'What is the absolute configuration of a carbon center where priority groups are 1: -OH, 2: -CHO, 3: -CH2OH, and 4: -H, with -H in a horizontal position and sequence 1 -> 2 -> 3 counter-clockwise?',
        options: ['R configuration', 'S configuration', 'D configuration', 'L configuration'],
        correctAnswerIndex: 0,
        explanation: 'For horizontal -H, counter-clockwise sequence (which normally means S) is reversed to R configuration.',
        sourceCitation: '[Source: Stereochemical Rules.pdf, Page 72]'
      },
      {
        id: 'q2_h2',
        type: 'true_false',
        question: 'True or False: Chiral nitrogen in tertiary amines does not exhibit optical activity at room temperature due to rapid nitrogen inversion.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Tertiary amines undergo rapid pyramidal inversion ("umbrella inversion") at room temperature, racemizing the configurations too fast to resolve.',
        sourceCitation: '[Source: Pyramidal Inversion.pdf, Page 94]'
      },
      {
        id: 'q2_h3',
        type: 'fill_blank',
        question: 'The stereochemical configuration of an SN2 reaction is characterized by a complete ____ of configuration.',
        options: ['Inversion', 'Retention', 'Racemization', 'Elimination'],
        correctAnswerIndex: 0,
        explanation: 'SN2 reactions feature backside attack, which consistently inverts the configuration at the stereocenter (Walden inversion).',
        sourceCitation: '[Source: SN2 Kinetics.pdf, Page 104]'
      },
      {
        id: 'q2_h4',
        type: 'mcq',
        question: 'What is the relationship between cis-1,2-dimethylcyclohexane and trans-1,2-dimethylcyclohexane?',
        options: ['Diastereomers', 'Enantiomers', 'Constitutional isomers', 'Conformational isomers'],
        correctAnswerIndex: 0,
        explanation: 'They are stereoisomers but are not mirror images, which means they are diastereomers.',
        sourceCitation: '[Source: Ring Isomerism.pdf, Page 115]'
      },
      {
        id: 'q2_h5',
        type: 'true_false',
        question: 'True or False: Allenes can exhibit chirality even in the absence of a tetrahedral asymmetric carbon.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Allenes with different groups on each end are chiral because the two pi-bonds are perpendicular, creating a chiral axis.',
        sourceCitation: '[Source: Axial Chirality.pdf, Page 129]'
      },
      {
        id: 'q2_h6',
        type: 'mcq',
        question: 'Which term describes stereoisomers that differ by rotation around a single bond but are locked due to steric hindrance?',
        options: ['Atropisomers', 'Anomers', 'Epimers', 'Enantiomers'],
        correctAnswerIndex: 0,
        explanation: 'Atropisomers are conformational diastereomers or enantiomers that are stable due to restricted rotation (e.g., binaphthyls).',
        sourceCitation: '[Source: Restricted Rotation.pdf, Page 145]'
      },
      {
        id: 'q2_h7',
        type: 'fill_blank',
        question: 'The stereochemical configuration of SN1 reactions typically results in partial ____.',
        options: ['Racemization', 'Inversion', 'Retention', 'Transposition'],
        correctAnswerIndex: 0,
        explanation: 'SN1 forms a planar carbocation intermediate. Attack can occur from either side, resulting in racemization, often with slight inversion preference.',
        sourceCitation: '[Source: SN1 Intermediates.pdf, Page 155]'
      },
      {
        id: 'q2_h8',
        type: 'mcq',
        question: 'Which method uses chiral stationary phases to separate racemic enantiomers directly?',
        options: ['Chiral HPLC', 'Fractional distillation', 'Acid-base extraction', 'Recrystallization'],
        correctAnswerIndex: 0,
        explanation: 'Chiral HPLC columns contain chiral packing material that interacts differently with enantiomers, allowing physical separation.',
        sourceCitation: '[Source: Chiral Chromatography.pdf, Page 188]'
      },
      {
        id: 'q2_h9',
        type: 'true_false',
        question: 'True or False: A mixture of diastereomers can be separated by standard physical methods such as fractional distillation or crystallization.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Since diastereomers have different physical properties (boiling points, solubility), they are easily separable by conventional means.',
        sourceCitation: '[Source: Physical Separations.pdf, Page 199]'
      },
      {
        id: 'q2_h10',
        type: 'mcq',
        question: 'What is the stereochemical relationship between D-glucose and D-galactose?',
        options: ['Epimers', 'Enantiomers', 'Anomers', 'Constitutional isomers'],
        correctAnswerIndex: 0,
        explanation: 'They differ in configuration at exactly one chiral center (C4), making them epimers.',
        sourceCitation: '[Source: Carbohydrate Stereochemistry.pdf, Page 222]'
      }
    ]
  },
  {
    id: 'q3',
    title: 'Calculus III: Triple Integrals',
    topic: 'Mathematics',
    questionsCount: 30,
    estimatedTime: '25 mins',
    status: 'available',
    questions: [],
    easyQuestions: [
      {
        id: 'q3_e1',
        type: 'mcq',
        question: 'What is the volume element dV in Cartesian coordinates?',
        options: ['dx dy dz', 'r dr dθ dz', 'ρ² sin(φ) dρ dθ dφ', 'ρ sin(φ) dρ dθ dφ'],
        correctAnswerIndex: 0,
        explanation: 'In Cartesian coordinates, the volume element dV is simply the product of differentials: dx dy dz.',
        sourceCitation: '[Source: Multivariable Integration.pdf, Page 3]'
      },
      {
        id: 'q3_e2',
        type: 'true_false',
        question: 'True or False: The volume of a solid region E is calculated as the triple integral of 1 over E.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Integrating the constant function 1 over a 3D region E yields the physical volume of E: V(E) = ∭_E 1 dV.',
        sourceCitation: '[Source: Volume Formulas.pdf, Page 4]'
      },
      {
        id: 'q3_e3',
        type: 'fill_blank',
        question: 'In cylindrical coordinates, the variable r represents the distance from the point to the ____ axis.',
        options: ['z', 'x', 'y', 'origin'],
        correctAnswerIndex: 0,
        explanation: 'In cylindrical coordinates, r represents the polar radius in the xy-plane, which measures distance from the z-axis.',
        sourceCitation: '[Source: Coordinate Systems.pdf, Page 8]'
      },
      // 7 more questions to satisfy the 10 count
      {
        id: 'q3_e4',
        type: 'mcq',
        question: 'What is the range of the spherical coordinate φ (latitude angle) in standard multivariable calculus?',
        options: ['[0, π]', '[0, 2π]', '[-π/2, π/2]', '[0, π/2]'],
        correctAnswerIndex: 0,
        explanation: 'The angle φ measures the polar angle down from the positive z-axis, ranging from 0 (North Pole) to π (South Pole).',
        sourceCitation: '[Source: Spherical Calculus.pdf, Page 15]'
      },
      {
        id: 'q3_e5',
        type: 'true_false',
        question: 'True or False: The limits of integration for a triple integral must always be constant numbers.',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'Only the outermost limits of integration must be constants. The inner limits can be functions of the outer variables.',
        sourceCitation: '[Source: Iterated Integrals.pdf, Page 32]'
      },
      {
        id: 'q3_e6',
        type: 'mcq',
        question: 'Which coordinate system is best suited for integrating over a solid cone bounded by z = √(x^2 + y^2)?',
        options: ['Cylindrical', 'Cartesian', 'Spherical', 'Ellipsoidal'],
        correctAnswerIndex: 0,
        explanation: 'A cone z = r has simple boundaries in cylindrical coordinates, making z integration limits easy to define.',
        sourceCitation: '[Source: Symmetry Boundaries.pdf, Page 19]'
      },
      {
        id: 'q3_e7',
        type: 'fill_blank',
        question: 'The Jacobian determinant acts as a local scaling factor for ____ changes.',
        options: ['Volume', 'Line', 'Slope', 'Surface'],
        correctAnswerIndex: 0,
        explanation: 'The Jacobian scales differential elements during variable transformations (e.g. dV = J du dv dw).',
        sourceCitation: '[Source: Jacobian Transformations.pdf, Page 22]'
      },
      {
        id: 'q3_e8',
        type: 'mcq',
        question: 'What is the Jacobian for standard Cartesian-to-cylindrical coordinates conversion?',
        options: ['r', 'r^2', '1', 'sin(θ)'],
        correctAnswerIndex: 0,
        explanation: 'The cylindrical volume element is dV = r dz dr dθ, showing that the Jacobian factor is r.',
        sourceCitation: '[Source: Cylindrical Jacobian.pdf, Page 41]'
      },
      {
        id: 'q3_e9',
        type: 'true_false',
        question: 'True or False: Fubinis Theorem states that the order of integration does not affect the value of a triple integral of a continuous function.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'If E is a simple bounded region and f is continuous, Fubinis Theorem allows changing the integration order without altering the result.',
        sourceCitation: '[Source: Integration Theorems.pdf, Page 88]'
      },
      {
        id: 'q3_e10',
        type: 'mcq',
        question: 'If E is a sphere of radius R, what is the triple integral of 1 over E?',
        options: ['(4/3)πR^3', 'πR^2', '2πR^3', '(3/4)πR^2'],
        correctAnswerIndex: 0,
        explanation: 'Integrating 1 over E yields the volume of the sphere, which is given by the standard formula V = (4/3)πR^3.',
        sourceCitation: '[Source: Geometric Integration.pdf, Page 50]'
      }
    ],
    mediumQuestions: [
      {
        id: 'q3_m1',
        type: 'mcq',
        question: 'What is the volume element dV in spherical coordinates?',
        options: [
          'ρ² sin(φ) dρ dθ dφ',
          'ρ sin(φ) dρ dθ dφ',
          'r dr dθ dz',
          'dx dy dz'
        ],
        correctAnswerIndex: 0,
        explanation: 'Calculating the Jacobian matrix determinant for Cartesian-to-spherical conversions yields ρ² sin(φ) dρ dθ dφ.',
        sourceCitation: '[Source: Spherical Jacobian.pdf, Page 22]'
      },
      {
        id: 'q3_m2',
        type: 'true_false',
        question: 'True or False: The projection of a solid region E onto the xy-plane is used to determine the outer integration boundaries.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Projecting E onto a coordinate plane defines the 2D integration region D, providing boundaries for the outer double integrals.',
        sourceCitation: '[Source: Region Projection.pdf, Page 12]'
      },
      {
        id: 'q3_m3',
        type: 'fill_blank',
        question: 'When integrating over a cylinder x^2 + y^2 = 9, the polar radius r ranges from 0 to ____.',
        options: ['3', '9', '2', '6'],
        correctAnswerIndex: 0,
        explanation: 'The equation x^2 + y^2 = 9 describes a cylinder of radius R = √9 = 3.',
        sourceCitation: '[Source: Circular Boundaries.pdf, Page 29]'
      },
      {
        id: 'q3_m4',
        type: 'mcq',
        question: 'Which coordinate system should be used to evaluate the triple integral of z^2 over the upper hemisphere of x^2+y^2+z^2 = 4?',
        options: ['Spherical', 'Cylindrical', 'Cartesian', 'Bipolar'],
        correctAnswerIndex: 0,
        explanation: 'Spherical coordinates are ideal for spheres and hemispheres because the boundaries are constant values: ρ from 0 to 2, φ from 0 to π/2.',
        sourceCitation: '[Source: Hemisphere Integration.pdf, Page 33]'
      },
      {
        id: 'q3_m5',
        type: 'true_false',
        question: 'True or False: The center of mass of a solid region with constant density is identical to its centroid.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'If density is constant, it cancels out of the center of mass equations, reducing them to the geometric centroid coordinates.',
        sourceCitation: '[Source: Mass Calculations.pdf, Page 52]'
      },
      {
        id: 'q3_m6',
        type: 'mcq',
        question: 'What is the mass of a cube of side 2 if its density is equal to the distance from the xy-plane?',
        options: ['8', '4', '16', '12'],
        correctAnswerIndex: 0,
        explanation: 'Mass is ∭_E z dV. Bounded by [0,2] for x, y, z, we get ∫_0^2 dx ∫_0^2 dy ∫_0^2 z dz = 2 * 2 * [z^2/2]_0^2 = 4 * 2 = 8.',
        sourceCitation: '[Source: Density Integrals.pdf, Page 64]'
      },
      {
        id: 'q3_m7',
        type: 'fill_blank',
        question: 'In cylindrical coordinates, the angle θ ranges from 0 to ____ for a full rotation.',
        options: ['2π', 'π', 'π/2', '4π'],
        correctAnswerIndex: 0,
        explanation: 'A full circular rotation in the xy-plane ranges from 0 to 2π radians.',
        sourceCitation: '[Source: Polar Angles.pdf, Page 78]'
      },
      {
        id: 'q3_m8',
        type: 'mcq',
        question: 'If the limits of integration for x are from y to 2y, which description fits the boundaries?',
        options: ['The region is bounded by the planes x = y and x = 2y.', 'The region is a rectangle.', 'The region is a sphere.', 'The boundaries are constant.'],
        correctAnswerIndex: 0,
        explanation: 'Limits of y to 2y mean x is bounded laterally by slanted lines x = y and x = 2y.',
        sourceCitation: '[Source: Domain Boundaries.pdf, Page 85]'
      },
      {
        id: 'q3_m9',
        type: 'true_false',
        question: 'True or False: The Jacobian determinant for cartesian to spherical coordinates is always positive in the integration domain.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'The Jacobian is ρ^2 sin(φ). Since ρ >= 0 and φ is in [0, π] where sin(φ) >= 0, the Jacobian is indeed always non-negative.',
        sourceCitation: '[Source: Jacobian Signs.pdf, Page 91]'
      },
      {
        id: 'q3_m10',
        type: 'mcq',
        question: 'Which is the correct conversion of coordinates from cartesian (x,y,z) to spherical (ρ,θ,φ)?',
        options: [
          'x = ρ sin(φ) cos(θ), y = ρ sin(φ) sin(θ), z = ρ cos(φ)',
          'x = ρ cos(φ) cos(θ), y = ρ cos(φ) sin(θ), z = ρ sin(φ)',
          'x = r cos(θ), y = r sin(θ), z = z',
          'x = ρ sin(θ), y = ρ cos(θ), z = φ'
        ],
        correctAnswerIndex: 0,
        explanation: 'The standard conversion formulas map spherical variables based on trigonometry of the projection onto the xy-plane.',
        sourceCitation: '[Source: Spherical Conversion.pdf, Page 112]'
      }
    ],
    hardQuestions: [
      {
        id: 'q3_h1',
        type: 'mcq',
        question: 'Evaluate the triple integral ∭_E z dV, where E is the solid region in the first octant bounded by the sphere x²+y²+z²=1.',
        options: [
          'π / 16',
          'π / 8',
          'π / 4',
          'π / 32'
        ],
        correctAnswerIndex: 0,
        explanation: 'Using spherical coordinates: ∭_E ρ cos(φ) (ρ² sin(φ)) dρ dθ dφ = (∫_0^{π/2} dθ) (∫_0^1 ρ³ dρ) (∫_0^{π/2} sin(φ) cos(φ) dφ) = (π/2) * (1/4) * (1/2) = π/16.',
        sourceCitation: '[Source: Sphere Integrations.pdf, Page 82]'
      },
      {
        id: 'q3_h2',
        type: 'true_false',
        question: 'True or False: The Jacobian of the linear transformation x = u+v, y = u-v is 2.',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'The Jacobian matrix has rows [1, 1] and [1, -1]. The determinant is (1*-1) - (1*1) = -2. The absolute value is 2, but the actual determinant is -2.',
        sourceCitation: '[Source: Linear Transformations.pdf, Page 95]'
      },
      {
        id: 'q3_h3',
        type: 'fill_blank',
        question: 'The center of mass coordinates are given by dividing the moments Myz, Mxz, Mxy by the total ____.',
        options: ['Mass', 'Volume', 'Density', 'Area'],
        correctAnswerIndex: 0,
        explanation: 'The coordinates of the center of mass are x_bar = Myz/m, y_bar = Mxz/m, z_bar = Mxy/m, where m is the total mass.',
        sourceCitation: '[Source: Center of Mass.pdf, Page 104]'
      },
      {
        id: 'q3_h4',
        type: 'mcq',
        question: 'Which coordinates should be used to integrate over an ellipsoid x^2/a^2 + y^2/b^2 + z^2/c^2 <= 1?',
        options: ['Modified spherical coordinates', 'Standard cylindrical coordinates', 'Cartesian coordinates', 'Parabolic coordinates'],
        correctAnswerIndex: 0,
        explanation: 'Modified spherical coordinates x = aρ sin(φ)cos(θ), y = bρ sin(φ)sin(θ), z = cρ cos(φ) map the ellipsoid to a unit sphere, with Jacobian abcρ^2 sin(φ).',
        sourceCitation: '[Source: Ellipsoid Integration.pdf, Page 115]'
      },
      {
        id: 'q3_h5',
        type: 'true_false',
        question: 'True or False: If E is the region between z = x^2+y^2 and z = 4, the cylinder coordinates limits for z are from 0 to r^2.',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'The lower bound is the paraboloid z = x^2+y^2 = r^2, and the upper bound is the plane z = 4, so z limits are from r^2 to 4.',
        sourceCitation: '[Source: Paraboloid Bounds.pdf, Page 129]'
      },
      {
        id: 'q3_h6',
        type: 'mcq',
        question: 'What is the moment of inertia Iz of a solid cylinder of radius R, height H, and constant density K about its central z-axis?',
        options: ['(1/2)mR^2', 'mR^2', '(1/3)mR^2', '(2/3)mR^2'],
        correctAnswerIndex: 0,
        explanation: 'Iz = ∭_E r^2 K dV = K ∫_0^{2π} dθ ∫_0^R r^3 dr ∫_0^H dz = K * 2π * (R^4/4) * H = (1/2) * (K * πR^2H) * R^2 = (1/2)mR^2.',
        sourceCitation: '[Source: Moments of Inertia.pdf, Page 145]'
      },
      {
        id: 'q3_h7',
        type: 'fill_blank',
        question: 'The volume of a region bounded below by z = 0, above by z = 1-x^2-y^2, and laterally by the cylinder x^2+y^2=1 is evaluated in polar limits where r goes from 0 to ____.',
        options: ['1', '2', '0.5', '4'],
        correctAnswerIndex: 0,
        explanation: 'The lateral boundary is x^2+y^2 = 1, which corresponds to the polar radius r = 1.',
        sourceCitation: '[Source: Polar Integration Limits.pdf, Page 155]'
      },
      {
        id: 'q3_h8',
        type: 'mcq',
        question: 'Evaluate ∭_E (x^2+y^2+z^2) dV, where E is the unit ball x^2+y^2+z^2 <= 1.',
        options: ['4π / 5', '2π / 3', '4π / 3', '3π / 5'],
        correctAnswerIndex: 0,
        explanation: 'Using spherical coordinates: ∫_0^{2π} dθ ∫_0^π sin(φ) dφ ∫_0^1 ρ^4 dρ = 2π * 2 * (1/5) = 4π / 5.',
        sourceCitation: '[Source: Ball Integrals.pdf, Page 188]'
      },
      {
        id: 'q3_h9',
        type: 'true_false',
        question: 'True or False: The triple integral of z over a region symmetric about the xy-plane is zero if density is constant.',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'If E is symmetric about z = 0, the integral of the odd function z over E cancels out to zero.',
        sourceCitation: '[Source: Symmetry cancellations.pdf, Page 199]'
      },
      {
        id: 'q3_h10',
        type: 'mcq',
        question: 'Which theorem connects a triple integral of the divergence of a vector field over E to a surface integral over its boundary?',
        options: ['Divergence Theorem (Gauss Theorem)', 'Stokes Theorem', 'Greens Theorem', 'Fubini Theorem'],
        correctAnswerIndex: 0,
        explanation: 'The Divergence Theorem equates ∭_E div(F) dV to the flux double integral of F over the boundary surface ∂E.',
        sourceCitation: '[Source: Vector Calculus.pdf, Page 222]'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Quantum Mechanics synthesis complete',
    description: 'Our AI has mapped the core principles of Wave-Particle Duality and Entanglement from your recent lecture notes.',
    timeLabel: 'Today',
    category: 'ai-insights',
    read: false,
    timestamp: '2 hours ago',
    actionLabel: 'View Summary',
    actionPage: 'research-hub'
  },
  {
    id: 'n2',
    title: 'New Quiz generated: Calculus III',
    description: 'Strengthen your understanding of Triple Integrals. We identified this as a weak area based on your previous sessions.',
    timeLabel: 'Today',
    category: 'ai-insights',
    read: false,
    timestamp: '5 hours ago',
    actionLabel: 'Start Quiz',
    actionPage: 'quiz-mode'
  },
  {
    id: 'n3',
    title: 'Weekly mastery report available',
    description: 'Your knowledge retention has increased by 12% this week. View the full breakdown of mastered concepts.',
    timeLabel: 'Yesterday',
    category: 'system',
    read: true,
    timestamp: '1 day ago',
    actionLabel: 'View Report',
    actionPage: 'dashboard'
  },
  {
    id: 'n4',
    title: 'Collaborator joined: Dr. Aris Thorne',
    description: 'Dr. Thorne has accepted your invitation to the "Astrophysics Research" workspace.',
    timeLabel: 'Yesterday',
    category: 'collaboration',
    read: true,
    timestamp: '1 day ago'
  },
  {
    id: 'n5',
    title: 'Subscription renewed successfully',
    description: 'Your Note-IT AI Researcher plan has been renewed. Thank you for continuing your research journey with us.',
    timeLabel: '2 days ago',
    category: 'system',
    read: true,
    timestamp: '2 days ago'
  }
];

export const INITIAL_SETTINGS: UserSettings = {
  profile: {
    fullName: 'Julian Sterling',
    emailAddress: 'j.sterling@university.edu',
    bio: 'Synthesizing modern economic theories with historical data patterns. Focused on AI-assisted academic literature reviews.',
    avatarUrl: '',
    institution: 'Cambridge University',
    role: 'Senior Researcher'
  },
  subscription: {
    planName: 'BYOK',
    price: '₹0',
    billingCycle: 'monthly',
    nextBillDate: 'Dec 15, 2026',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ]
  },
  integrations: {
    canvasConnected: true,
    blackboardConnected: false,
    canvasUrl: 'camb-uni.instructure.com',
    lastSynced: '2 hours ago'
  },
  aiLevels: {
    proactiveConceptSuggestion: true,
    automatedBibliography: true,
    highIntensitySynthesis: false
  }
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'How secure is my academic data and research outputs?',
    answer: 'We run isolated storage sandboxes. Your documents, transcripts, and session outputs are encrypted in transit and at rest using AES-256. We strictly enforce a proprietary policy: your uploaded papers and personal annotations are NEVER passed into public models for training.'
  },
  {
    id: 'faq2',
    question: 'Can I export my synthesized materials to standard formats like LaTeX or Markdown?',
    answer: 'Absolutely. Every note, summary, research outline, or flashcard deck you generate inside Note-IT AI is exportable. You can click "Export" on the workspace headers and select LaTeX (.tex) for mathematical typesetting or clean GitHub-flavored Markdown (.md).'
  },
  {
    id: 'faq3',
    question: 'Does Note-IT AI cite and match statements back to my exact source material?',
    answer: 'Yes! That is one of our fundamental design objectives. When you read an AI Summary or work through the Research Hub, any claims or synthesized bullet points generate clickable citation numbers. Clicking a number scrolls your file preview directly to the matching paragraph block or specific timestamp inside raw transcribing logs.'
  },
  {
    id: 'faq4',
    question: 'How does the "Weak Topic Tracking" radar work?',
    answer: 'Note-IT AI aggregates telemetry from your generated quizzes, lecture reviews, and recall sessions. It uses custom semantic mapping to trace concepts back to centralized fields (like Linear Algebra or Neurobiology), analyzes error rates, and identifies cognitive gaps, helping you schedule optimal review plans.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'BYOK',
    tierLabel: 'TIER 01',
    price: '₹0',
    period: 'forever',
    tagline: 'Bring your own API key for unlimited analysis.',
    description: 'Use your own Gemini or OpenAI API keys directly.',
    ctaText: 'Get Started',
    features: [
      'Bring Your Own Key (BYOK)',
      'Unlimited AI Synthesis & Chats',
      '100 GB High-Speed Storage',
      'Academic Library & Quiz Workspace'
    ],
    isPopular: false,
    highlighted: false
  },
  {
    name: 'Premium',
    tierLabel: 'TIER 02',
    price: '₹400',
    period: 'month',
    tagline: 'No API key needed. Managed high-speed academic AI model access.',
    description: 'We provide high-speed, managed Gemini API keys.',
    ctaText: 'Upgrade to Premium',
    features: [
      'Direct API access (We provide keys)',
      'Unlimited managed AI runs',
      '100 GB High-Speed Storage',
      'Instant OCR & Math Formula Parsing',
      'Weak Topic Tracker Radar',
      'Priority Email & Chat Support'
    ],
    isPopular: true,
    highlighted: true
  },
  {
    name: 'Institution',
    tierLabel: 'TIER 03',
    price: 'Custom',
    period: 'enterprise',
    tagline: 'Team collaboration, SSO, and advanced academic model fine-tuning.',
    description: 'Engineered safely for full-scale universities, laboratories, or hospitals.',
    ctaText: 'Contact Sales',
    features: [
      'Everything in Premium plus:',
      'SSO & SAML Security Auditing',
      'Dedicated Academic Success Manager',
      'Unlimited Shared Workspaces',
      'Custom LLM Fine-Tuning options'
    ],
    isPopular: false,
    highlighted: false
  }
];
