import type { Pillar } from '../types'

type PillarOverride = Pick<Pillar, 'key' | 'label' | 'expertOpinion' | 'positiveThemes' | 'negativeThemes' | 'quotes'>

interface SectorPillars {
  pillar9: PillarOverride
  pillar10: PillarOverride
}

const HEALTHCARE: SectorPillars = {
  pillar9: {
    key: 'clinical_excellence',
    label: 'Clinical Excellence Culture',
    expertOpinion:
      "The Clinical Excellence Culture score of 4.5 reflects a deeply mission-driven workforce that takes immense pride in clinical standards and patient care quality. This is a rare and genuine EVP differentiator in the Indian healthcare market, consistently surfacing in both internal responses and external platform reviews. Organisations should leverage this as a cornerstone of their recruitment narrative, particularly for attracting specialist clinical talent.",
    positiveThemes: ['High clinical standards', 'Evidence-based protocols', 'Quality accreditations'],
    negativeThemes: ['Resource constraints', 'Administrative burden on clinicians'],
    quotes: [
      { text: 'The clinical standards here are genuinely world-class. I am proud to be part of a team that takes evidence-based care so seriously.', source: 'internal', sentiment: 'positive' },
      { text: 'Joining here was the best career decision I made as a specialist — the clinical rigour is unmatched.', source: 'external', sentiment: 'positive' },
      { text: 'Resource constraints in some units mean we cannot always deliver the standard of care we aspire to.', source: 'internal', sentiment: 'negative' },
      { text: 'The administrative documentation load on senior doctors is excessive and takes time away from patient care.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'mission_purpose',
    label: 'Mission & Patient Purpose',
    expertOpinion:
      "The Mission & Patient Purpose score of 4.6 places this organisation in the top decile of Indian healthcare employers. Employees across clinical and nursing functions consistently cite pride in patient outcomes and the organisation's community health mission as primary drivers of engagement and retention. This represents a powerful and authentic EVP anchor that should be amplified in all employer brand communications.",
    positiveThemes: ['Patient impact pride', 'Community health mission', 'Purpose-driven work'],
    negativeThemes: ['Mission-reality gap in resource-scarce units', 'Limited community outreach visibility'],
    quotes: [
      { text: 'Every morning I come to work knowing I am making a difference to real patients — that purpose keeps me going.', source: 'internal', sentiment: 'positive' },
      { text: 'The community health mission is not just marketing — you feel it in the way decisions are made at every level.', source: 'external', sentiment: 'positive' },
      { text: 'In our understaffed unit, the mission feels disconnected from the reality — we want to serve patients well but lack the resources.', source: 'internal', sentiment: 'negative' },
      { text: 'The community outreach programmes are excellent in concept but not very visible to staff on the ground.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const IT: SectorPillars = {
  pillar9: {
    key: 'engineering_culture',
    label: 'Engineering & Innovation Culture',
    expertOpinion:
      "The Engineering & Innovation Culture score of 4.5 reflects a technically rigorous environment where employees feel empowered to build, experiment, and ship. This is a key differentiator for attracting top engineering talent in a competitive market, with candidates citing hackathons, open-source contributions, and tech stack modernity as standout positives. Sustaining this advantage requires continued investment in R&D, developer tooling, and internal mobility across engineering functions.",
    positiveThemes: ['Cutting-edge tech stack', 'Hackathons & innovation sprints', 'Engineering autonomy'],
    negativeThemes: ['Technical debt in legacy systems', 'Cross-team alignment challenges'],
    quotes: [
      { text: 'The tech stack is modern and the team actively evaluates new tools — I feel like I am always learning.', source: 'internal', sentiment: 'positive' },
      { text: 'Engineering here is genuinely world-class. The architecture decisions are thoughtful and the code quality is high.', source: 'external', sentiment: 'positive' },
      { text: 'Some legacy codebases are a significant drag — we spend too much time maintaining old systems.', source: 'internal', sentiment: 'negative' },
      { text: 'Cross-team alignment can be slow, which affects how quickly engineering can ship features.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'product_impact',
    label: 'Product Impact & Purpose',
    expertOpinion:
      "The Product Impact & Purpose score of 4.6 signals that employees feel a strong connection to the real-world impact of what they build. This sense of purpose is a powerful retention driver in the tech sector, where talented engineers and PMs have abundant alternatives. Organisations should actively highlight product impact stories — user growth milestones, social impact metrics, and customer testimonials — in both internal communications and employer brand content.",
    positiveThemes: ['Real-world product impact', 'User-centred mission', 'Scale & growth excitement'],
    negativeThemes: ['Scope creep diluting focus', 'Limited visibility of downstream impact'],
    quotes: [
      { text: 'I can see millions of users benefiting from what our team ships every sprint — that is genuinely motivating.', source: 'internal', sentiment: 'positive' },
      { text: 'The product mission is clear and the leadership connects every team\'s work to user outcomes. That is rare.', source: 'external', sentiment: 'positive' },
      { text: 'We sometimes lose focus due to too many priorities — it dilutes the sense of impact.', source: 'internal', sentiment: 'negative' },
      { text: 'Individual contributors don\'t always see how their work connects to the bigger product vision.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const FMCG: SectorPillars = {
  pillar9: {
    key: 'brand_excellence',
    label: 'Brand Pride & Market Excellence',
    expertOpinion:
      "The Brand Pride & Market Excellence score of 4.5 reflects strong employee identification with the company's consumer brands and market leadership position. In FMCG, employer brand and consumer brand are deeply intertwined — employees who are proud ambassadors of the products they make are measurably more engaged and loyal. This strength should be leveraged in recruitment by showcasing brand legacy, distribution scale, and market share milestones as EVP proof points.",
    positiveThemes: ['Iconic brand portfolio', 'Market leadership pride', 'Category innovation'],
    negativeThemes: ['Legacy brand constraints', 'Slow innovation cycles in mature categories'],
    quotes: [
      { text: 'I am proud to work on brands that are in every Indian household. That legacy means something to me.', source: 'internal', sentiment: 'positive' },
      { text: 'The company has an unmatched distribution network and brand equity — working here opens doors throughout your career.', source: 'external', sentiment: 'positive' },
      { text: 'Some of our legacy brands don\'t resonate with younger consumers — we need bolder innovation investment.', source: 'internal', sentiment: 'negative' },
      { text: 'Innovation cycles are slow due to bureaucratic approval processes — agile competitors are moving faster.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'consumer_mission',
    label: 'Consumer-First Culture',
    expertOpinion:
      "The Consumer-First Culture score of 4.6 places this organisation among the strongest consumer-centric employers in the FMCG sector. Employees at all levels demonstrate a genuine understanding of and connection to consumer needs, which drives both product quality and go-to-market effectiveness. This cultural orientation is a significant competitive advantage and should be highlighted in employer brand campaigns targeting marketing, supply chain, and commercial talent.",
    positiveThemes: ['Deep consumer insight culture', 'Consumer empathy in decision-making', 'Field-first mindset'],
    negativeThemes: ['Data silos limiting consumer understanding', 'Disconnect between HQ and field teams'],
    quotes: [
      { text: 'Every decision we make starts with the consumer. That discipline is embedded at every level of the organisation.', source: 'internal', sentiment: 'positive' },
      { text: 'The consumer-first culture here is genuine — it shows up in how teams prioritise, measure, and celebrate success.', source: 'external', sentiment: 'positive' },
      { text: 'Consumer data is often siloed between departments — we don\'t have a unified view that would help us move faster.', source: 'internal', sentiment: 'negative' },
      { text: 'There is sometimes a disconnect between what the HQ teams believe consumers want and what the field teams actually observe.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const BFSI: SectorPillars = {
  pillar9: {
    key: 'risk_compliance',
    label: 'Integrity & Compliance Culture',
    expertOpinion:
      "The Integrity & Compliance Culture score of 4.5 reflects an organisation where ethical conduct and regulatory adherence are genuinely embedded in day-to-day decision-making. In BFSI, this is not merely a hygiene factor — it is a talent differentiator, particularly for senior hires who have witnessed compliance failures at competitor organisations. This strength should be amplified in employer brand communications targeting risk, audit, and legal talent, who consistently rate culture of integrity as a top career decision factor.",
    positiveThemes: ['Strong compliance culture', 'Ethical leadership', 'Regulatory clarity'],
    negativeThemes: ['Bureaucratic processes', 'Slow regulatory change adaptation'],
    quotes: [
      { text: 'The ethical culture here is non-negotiable — I have never been asked to cut corners, and leadership sets that tone from the top.', source: 'internal', sentiment: 'positive' },
      { text: 'In a sector where compliance failures make headlines, working here feels like working with real integrity.', source: 'external', sentiment: 'positive' },
      { text: 'Compliance processes can be slow and cumbersome — they sometimes block legitimate business decisions unnecessarily.', source: 'internal', sentiment: 'negative' },
      { text: 'Adapting to regulatory changes takes longer than at some newer BFSI players who have more agile compliance frameworks.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'financial_mission',
    label: 'Financial Inclusion Mission',
    expertOpinion:
      "The Financial Inclusion Mission score of 4.6 signals that employees feel a genuine sense of social purpose in their work — extending financial services to underserved segments of the Indian economy. This purpose-driven dimension is increasingly important for attracting mission-aligned talent, particularly from younger graduate cohorts who prioritise societal impact in career decisions. Organisations should quantify and communicate the scale of this mission — accounts opened, credit extended to first-time borrowers, rural penetration — as concrete employer brand proof points.",
    positiveThemes: ['Social impact at scale', 'First-generation credit access', 'Rural penetration mission'],
    negativeThemes: ['Impact visibility gaps for back-office roles', 'Mission-margin tension'],
    quotes: [
      { text: 'Knowing that our products are helping first-generation borrowers build credit and assets is deeply motivating.', source: 'internal', sentiment: 'positive' },
      { text: 'The scale of financial inclusion this organisation is driving is remarkable — it is something I am proud to be part of.', source: 'external', sentiment: 'positive' },
      { text: 'Colleagues in back-office and technology roles don\'t always feel connected to the inclusion mission — it feels remote from their daily work.', source: 'internal', sentiment: 'negative' },
      { text: 'There is sometimes a tension between commercial objectives and genuine financial inclusion — the latter can feel secondary to targets.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const TELECOM: SectorPillars = {
  pillar9: {
    key: 'digital_culture',
    label: 'Digital Innovation Culture',
    expertOpinion:
      "The Digital Innovation Culture score of 4.5 reflects a workforce energised by the pace of technological change and the organisation's ambition in digital infrastructure and services. Employees cite 5G rollouts, AI-driven personalisation, and digital platform investments as sources of professional pride and excitement. To sustain this as an EVP strength, leadership must continue to invest in digital upskilling and provide employees with first-mover access to emerging technologies.",
    positiveThemes: ['5G & next-gen infrastructure', 'Digital platform innovation', 'Technology-first mindset'],
    negativeThemes: ['Legacy infrastructure drag', 'Change management gaps'],
    quotes: [
      { text: 'The scale and ambition of our digital infrastructure projects is genuinely exciting — I am working on technology that affects millions.', source: 'internal', sentiment: 'positive' },
      { text: 'The organisation is at the forefront of digital transformation in India — the learning opportunities are exceptional.', source: 'external', sentiment: 'positive' },
      { text: 'Legacy infrastructure limitations slow down our ability to innovate as fast as we would like.', source: 'internal', sentiment: 'negative' },
      { text: 'Change management for new digital initiatives is inconsistent — adoption is patchy across teams.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'social_connectivity',
    label: 'Social Impact & Connectivity',
    expertOpinion:
      "The Social Impact & Connectivity score of 4.6 reflects a strong sense of societal purpose among employees — connecting India's underserved communities to digital infrastructure. As internet and mobile connectivity increasingly determine economic participation, employees feel they are working on infrastructure that is genuinely transformative. This purpose narrative should be central to employer brand communications, particularly for attracting talent motivated by technology's role in social equity.",
    positiveThemes: ['Digital inclusion mission', 'Rural connectivity impact', 'Bridging the digital divide'],
    negativeThemes: ['Slow last-mile connectivity progress', 'Limited individual impact visibility'],
    quotes: [
      { text: 'Connecting rural India to the internet is not just a business objective — it is a mission I genuinely believe in.', source: 'internal', sentiment: 'positive' },
      { text: 'The organisation\'s commitment to affordable, wide-reach connectivity is something I am genuinely proud of.', source: 'external', sentiment: 'positive' },
      { text: 'Last-mile connectivity targets are ambitious but progress on the ground is frustratingly slow.', source: 'internal', sentiment: 'negative' },
      { text: 'Individual engineers and PMs often struggle to see their specific contribution to the broader connectivity mission.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const AUTOMOTIVE: SectorPillars = {
  pillar9: {
    key: 'engineering_excellence',
    label: 'Engineering Excellence Culture',
    expertOpinion:
      "The Engineering Excellence Culture score of 4.5 reflects a workforce deeply proud of design, manufacturing, and quality standards. In automotive, where product quality is synonymous with brand trust and safety, this cultural orientation is both a business imperative and an EVP differentiator. Employees — particularly in R&D, design, and manufacturing — cite precision engineering standards, collaborative problem-solving, and quality certifications as core reasons for organisational loyalty.",
    positiveThemes: ['Precision engineering standards', 'Quality & safety culture', 'Manufacturing pride'],
    negativeThemes: ['EV transition uncertainty', 'Silos between design and manufacturing'],
    quotes: [
      { text: 'The engineering standards here are exceptional — every component goes through rigorous quality checks. I am proud of what we build.', source: 'internal', sentiment: 'positive' },
      { text: 'Working here means working with world-class manufacturing processes. The engineering culture is genuinely best-in-class.', source: 'external', sentiment: 'positive' },
      { text: 'The transition to EV creates uncertainty — some legacy manufacturing skills feel less relevant, which is unsettling.', source: 'internal', sentiment: 'negative' },
      { text: 'Design and manufacturing teams sometimes work in silos, which creates rework and delays in the development cycle.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'sustainability_mission',
    label: 'Sustainability & Future Mobility Mission',
    expertOpinion:
      "The Sustainability & Future Mobility Mission score of 4.6 reflects employees' strong identification with the organisation's transition to cleaner, connected, and autonomous mobility. As the automotive industry undergoes its most significant transformation since the combustion engine, employees who feel invested in this mission demonstrate higher engagement and lower attrition. Amplifying this purpose narrative — through EV milestones, carbon reduction targets, and future mobility investments — is critical for attracting the next generation of engineering and technology talent.",
    positiveThemes: ['EV & clean mobility mission', 'Sustainability commitments', 'Future mobility vision'],
    negativeThemes: ['Transition pace anxiety', 'Short-term vs long-term mission tension'],
    quotes: [
      { text: 'Being part of India\'s electric mobility transition feels historic. I am building vehicles that will shape how the country moves.', source: 'internal', sentiment: 'positive' },
      { text: 'The organisation\'s commitment to EV and sustainability is not just rhetoric — it is backed by real investment and clear targets.', source: 'external', sentiment: 'positive' },
      { text: 'The pace of the EV transition creates anxiety — there is uncertainty about which roles will be relevant in five years.', source: 'internal', sentiment: 'negative' },
      { text: 'Short-term sales pressures sometimes overshadow the long-term sustainability mission — the balance is not always right.', source: 'external', sentiment: 'negative' },
    ],
  },
}

const CONGLOMERATE: SectorPillars = {
  pillar9: {
    key: 'entrepreneurial_culture',
    label: 'Entrepreneurial Culture',
    expertOpinion:
      "The Entrepreneurial Culture score of 4.5 reflects a distinctive environment where employees across business units feel empowered to take ownership, move fast, and build. Conglomerates that successfully maintain an entrepreneurial ethos despite scale are rare — and this organisation demonstrates that it is possible through business unit autonomy, internal venture programmes, and leadership that rewards initiative. This is a powerful differentiator for attracting high-potential talent who want the stability of a large group with the energy of a startup.",
    positiveThemes: ['Intrapreneurship opportunities', 'Business unit autonomy', 'Risk-taking encouraged'],
    negativeThemes: ['Group bureaucracy slowing decisions', 'Resource allocation competition between BUs'],
    quotes: [
      { text: 'I have more autonomy here than I did at smaller companies. The group trusts its business units to operate like independent businesses.', source: 'internal', sentiment: 'positive' },
      { text: 'The entrepreneurial culture within a large, stable group is a rare combination — it gives you the best of both worlds.', source: 'external', sentiment: 'positive' },
      { text: 'Group-level approvals can slow down decisions that should be made at the business unit level — it dampens agility.', source: 'internal', sentiment: 'negative' },
      { text: 'Competition between business units for group resources can create unhealthy politics — collaboration across the group needs improvement.', source: 'external', sentiment: 'negative' },
    ],
  },
  pillar10: {
    key: 'group_mission',
    label: 'Group Mission & Nation-Building Legacy',
    expertOpinion:
      "The Group Mission & Nation-Building Legacy score of 4.6 reflects the deep sense of purpose that employees draw from being part of an organisation with a generational contribution to India's economic and social development. For diversified conglomerates with decades of nation-building heritage, this legacy is a unique and authentic EVP asset. It resonates particularly strongly with senior hires and long-tenured employees, and should be woven into the employer brand narrative as a differentiator from transactional, returns-focused competitors.",
    positiveThemes: ['National legacy & pride', 'Multi-generational impact', 'Sector leadership across industries'],
    negativeThemes: ['Legacy vs agility tension', 'Younger talent less connected to legacy narrative'],
    quotes: [
      { text: 'Being part of an organisation that has shaped Indian industry for generations gives my work a sense of historical weight.', source: 'internal', sentiment: 'positive' },
      { text: 'The group\'s contribution to India — from infrastructure to consumer goods to financial services — is genuinely inspiring to be part of.', source: 'external', sentiment: 'positive' },
      { text: 'The legacy narrative sometimes creates inertia — a reluctance to disrupt because of what has always been done.', source: 'internal', sentiment: 'negative' },
      { text: 'Younger employees are less motivated by legacy and more by impact and agility — the group needs to update its purpose narrative for a new generation.', source: 'external', sentiment: 'negative' },
    ],
  },
}

function getSectorGroup(industry: string): SectorPillars {
  switch (industry) {
    case 'Healthcare':
    case 'Healthtech':
    case 'Pharma':
      return HEALTHCARE
    case 'IT':
    case 'Fintech':
    case 'Edtech':
      return IT
    case 'FMCG':
    case 'Retail':
    case 'eCommerce':
      return FMCG
    case 'BFSI':
      return BFSI
    case 'Telecom':
    case 'Media':
      return TELECOM
    case 'Automotive':
      return AUTOMOTIVE
    case 'Diversified Conglomerate':
      return CONGLOMERATE
    default:
      return HEALTHCARE
  }
}

export function getSectorPillars(industry: string) {
  return getSectorGroup(industry)
}
