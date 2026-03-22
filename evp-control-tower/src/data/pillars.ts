import type { Pillar } from '../types'

export const PILLARS: Pillar[] = [
  {
    id: 1,
    key: 'comp_benefits',
    label: 'Compensation & Benefits',
    internalScore: 3.4,
    externalScore: 3.3,
    status: 'gap',
    expertOpinion:
      "Aster QCIL's Compensation & Benefits score of 3.4 sits below the healthcare sector benchmark of 3.7, indicating a meaningful gap that is actively influencing attrition decisions — particularly among mid-career clinical and nursing staff. External reviews on Glassdoor and AmbitionBox corroborate this, with candidates frequently citing pay parity concerns relative to Apollo and Fortis. A structured compensation benchmarking exercise and targeted benefits enhancement for high-turnover roles should be prioritised in the near-term HR roadmap.",
    positiveThemes: ['Timely salary payments', 'Medical insurance coverage', 'Festival bonuses'],
    negativeThemes: ['Below market pay', 'Increment dissatisfaction'],
    quotes: [
      {
        text: 'Salary is paid on time and the health insurance coverage for family members is a real benefit.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'The medical benefits are decent and the PF contributions are consistent.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'Pay increments have been minimal over the last two years — not keeping pace with market rates.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'Compared to other hospital chains in Bangalore, the CTC offered to experienced nurses is noticeably lower.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 2,
    key: 'work_life_balance',
    label: 'Work-Life Balance',
    internalScore: 3.1,
    externalScore: 2.9,
    status: 'critical',
    expertOpinion:
      "Work-Life Balance at 3.1 is Aster QCIL's most critical EVP gap, driven primarily by nursing and clinical staff reporting unsustainable shift patterns and insufficient recovery time. External reviews on AmbitionBox and Glassdoor corroborate this with a 2.9 score, indicating the issue is widely visible to talent in the market. Immediate structural intervention — including shift rotation reform and protected time-off policies — is required to prevent further attrition in frontline care roles.",
    positiveThemes: ['Flexible admin hours', 'Leave encashment', 'Weekend offs for admin'],
    negativeThemes: ['Unsustainable shift patterns', 'Inadequate recovery time'],
    quotes: [
      {
        text: 'Administrative staff get reasonable hours and the leave policy is fairly applied.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'The management team has decent flexibility in terms of working hours and WFH on some days.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'Night shifts are back to back with no adequate gap — I have gone weeks without a full rest day.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'The shift rostering system is chaotic. No predictability, last-minute changes, and weekend leaves are rarely approved.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 3,
    key: 'career_growth',
    label: 'Career Growth & Learning',
    internalScore: 4.0,
    externalScore: 3.8,
    status: 'strength',
    expertOpinion:
      "Aster QCIL's Career Growth & Learning score of 4.0 reflects a genuine organisational investment in employee development, particularly through structured clinical training programmes and internal promotion pathways for nursing staff. The 3.8 external score indicates this reputation is beginning to permeate the talent market, though it lags internal perception — suggesting an opportunity to amplify success stories in employer brand channels. Strengthening visibility of career trajectories for non-clinical functions would further solidify this as a competitive EVP advantage.",
    positiveThemes: ['Structured training programmes', 'Internal promotions', 'CME support'],
    negativeThemes: ['Limited non-clinical pathways', 'Slow progression timelines'],
    quotes: [
      {
        text: 'I have completed three CME certifications this year — Aster fully sponsored all of them.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'There are clear career ladders for nurses and doctors. I moved from staff nurse to senior nurse in 18 months.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'Career growth for support functions like finance and admin is not clearly defined or supported.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'Promotions can take longer than expected — the process lacks transparency for mid-level staff.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 4,
    key: 'culture_values',
    label: 'Culture & Values',
    internalScore: 4.3,
    externalScore: 4.1,
    status: 'strength',
    expertOpinion:
      "Culture & Values at 4.3 is one of Aster QCIL's strongest EVP dimensions, with employees consistently citing the organisation's patient-first ethos and collaborative work culture as key reasons for joining and staying. The 4.1 external score confirms that this cultural identity is visible and credible to prospective employees, giving it significant weight as a recruitment differentiator. To fully capitalise on this asset, Aster QCIL should embed culture storytelling — through employee testimonials and values-in-action content — across all talent acquisition touchpoints.",
    positiveThemes: ['Patient-first ethos', 'Collaborative teams', 'Values alignment'],
    negativeThemes: ['Inconsistent leadership culture', 'Siloed departments'],
    quotes: [
      {
        text: 'The values here are not just posters on the wall — colleagues genuinely live them in how they treat patients and each other.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'Aster QCIL has a strong culture of respect and professionalism that I have not seen in other hospital chains.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'The culture at the unit level can vary significantly depending on the ward manager — more consistency is needed.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'Inter-department coordination is sometimes poor, which affects both patient care and team morale.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 5,
    key: 'leadership',
    label: 'Leadership & Management',
    internalScore: 3.7,
    externalScore: 3.5,
    status: 'mixed',
    expertOpinion:
      "Leadership & Management at 3.7 presents a mixed picture at Aster QCIL — senior leadership is widely respected for clinical vision and strategic direction, while frontline management quality is inconsistent across units and geographies. The gap between internal (3.7) and external (3.5) scores suggests that managerial concerns are influencing candidate decisions and exit narratives in the market. Targeted manager capability programmes, structured feedback mechanisms, and transparent escalation pathways would meaningfully improve both scores and reduce attrition linked to direct manager dissatisfaction.",
    positiveThemes: ['Strong clinical leadership', 'Accessible senior leaders', 'Strategic vision'],
    negativeThemes: ['Inconsistent frontline managers', 'Limited upward feedback'],
    quotes: [
      {
        text: 'The CMO and senior medical leadership are genuinely respected — they are visible and accessible on the wards.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'Senior management at Aster QCIL understands healthcare deeply and makes decisions that prioritise patient outcomes.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'My immediate supervisor has very little people management training — it creates unnecessary stress in the team.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'Middle management quality is highly variable. Some wards run brilliantly, others feel completely unsupported.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 6,
    key: 'work_environment',
    label: 'Work Environment',
    internalScore: 3.9,
    externalScore: 3.7,
    status: 'strength',
    expertOpinion:
      "Work Environment scores of 3.9 (internal) and 3.7 (external) reflect a broadly positive physical and psychological workplace at Aster QCIL, with newer facilities in Bangalore and Hyderabad performing particularly well. Employees highlight modern clinical equipment, clean workspaces, and functional break facilities as positive contributors to day-to-day experience. Investment in upgrading older facility infrastructure — particularly in Kochi and Chennai units — would reduce the score variance across locations and ensure a consistent employer brand experience.",
    positiveThemes: ['Modern clinical equipment', 'Clean facilities', 'Safe workspaces'],
    negativeThemes: ['Ageing infrastructure at older sites', 'Inadequate rest areas'],
    quotes: [
      {
        text: 'The new Bangalore facility is world-class — everything from the equipment to the break rooms is excellent.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'The work environment is clean, well-maintained, and equipped with the tools we need to do our jobs effectively.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'Rest areas for nursing staff are cramped and not sufficient for a team our size — we barely have space to sit during breaks.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'Some of the older units have outdated infrastructure that makes work harder than it needs to be.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 7,
    key: 'dei',
    label: 'Diversity, Equity & Inclusion',
    internalScore: 4.1,
    externalScore: 3.9,
    status: 'strength',
    expertOpinion:
      "Aster QCIL's Diversity, Equity & Inclusion score of 4.1 positions it as a sector leader among Indian healthcare employers, reflecting a genuinely diverse workforce across gender, geography, and clinical discipline. The 3.9 external score confirms this reputation is gaining traction with prospective employees, particularly among women entering clinical careers. To move from strength to top-strength on DEI, the organisation should focus on representation in senior leadership roles and formalise pay equity reporting as part of its employer brand narrative.",
    positiveThemes: ['Gender diversity', 'Multicultural workforce', 'Inclusive policies'],
    negativeThemes: ['Limited senior leadership diversity', 'Pay equity gaps'],
    quotes: [
      {
        text: 'I feel genuinely included here regardless of my background — colleagues from across India and different religions work together seamlessly.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'Aster QCIL has one of the best gender diversity ratios I have seen in healthcare. Women are well represented at all levels.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'At the senior director level and above, the gender ratio drops significantly — this needs deliberate attention.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'While diversity is visible, I am not sure there is a structured pay equity review happening — this is important for trust.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 8,
    key: 'wellbeing',
    label: 'Employee Wellbeing',
    internalScore: 3.2,
    externalScore: 3.0,
    status: 'critical',
    expertOpinion:
      "Employee Wellbeing at 3.2 represents a systemic challenge at Aster QCIL, with burnout risk and mental health support gaps cited repeatedly across nursing, pharmacy, and operations roles. The 3.0 external score signals that this perception has reached the broader talent market, creating a reputational risk in recruitment. A structured wellbeing programme — covering mental health, EAP access, and peer support — is an urgent investment priority.",
    positiveThemes: ['Team peer support', 'Physical health benefits', 'Counselling awareness'],
    negativeThemes: ['Burnout risk', 'Mental health support gaps'],
    quotes: [
      {
        text: 'My team is incredibly supportive — we look out for each other during tough shifts, which makes a real difference.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'The organisation has started to talk more openly about mental health, which feels like a positive shift.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'I experienced serious burnout last year and there was no structured support — I had to figure it out myself.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'There is no functional Employee Assistance Programme. For a healthcare employer, this is a significant gap.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 9,
    key: 'clinical_excellence',
    label: 'Clinical Excellence Culture',
    internalScore: 4.5,
    externalScore: 4.3,
    status: 'top-strength',
    expertOpinion:
      "Aster QCIL's Clinical Excellence Culture score of 4.5 reflects a deeply mission-driven workforce that takes immense pride in clinical standards and patient care quality. This is a rare and genuine EVP differentiator in the Indian healthcare market, consistently surfacing in both internal responses and external platform reviews. Organisations should leverage this as a cornerstone of their recruitment narrative, particularly for attracting specialist clinical talent.",
    positiveThemes: ['High clinical standards', 'Evidence-based protocols', 'Quality accreditations'],
    negativeThemes: ['Resource constraints', 'Administrative burden on clinicians'],
    quotes: [
      {
        text: 'The clinical standards here are genuinely world-class. I am proud to be part of a team that takes evidence-based care so seriously.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: 'Aster QCIL is known for its clinical rigour. Joining here was the best career decision I made as a specialist.',
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'Resource constraints in some units mean we cannot always deliver the standard of care we aspire to — that is genuinely frustrating.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'The administrative documentation load on senior doctors is excessive and takes time away from patient care.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
  {
    id: 10,
    key: 'mission_purpose',
    label: 'Mission & Patient Purpose',
    internalScore: 4.6,
    externalScore: 4.4,
    status: 'top-strength',
    expertOpinion:
      "Aster QCIL's Mission & Patient Purpose score of 4.6 places it in the top decile of Indian healthcare employers. Employees across clinical and nursing functions consistently cite pride in patient outcomes and the organisation's community health mission as primary drivers of engagement and retention. This represents a powerful and authentic EVP anchor that should be amplified in all employer brand communications.",
    positiveThemes: ['Patient impact pride', 'Community health mission', 'Purpose-driven work'],
    negativeThemes: ['Mission-reality gap in resource-scarce units', 'Limited community outreach visibility'],
    quotes: [
      {
        text: 'Every morning I come to work knowing I am making a difference to real patients — that purpose keeps me going through difficult days.',
        source: 'internal',
        sentiment: 'positive',
      },
      {
        text: "Aster QCIL's community health mission is not just marketing — you feel it in the way decisions are made at every level.",
        source: 'external',
        sentiment: 'positive',
      },
      {
        text: 'In our understaffed unit, the mission feels disconnected from the reality — we want to serve patients well but lack the resources.',
        source: 'internal',
        sentiment: 'negative',
      },
      {
        text: 'The community outreach programmes are excellent in concept but not very visible to staff on the ground.',
        source: 'external',
        sentiment: 'negative',
      },
    ],
  },
]
