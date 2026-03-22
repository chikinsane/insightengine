import PptxGenJS from 'pptxgenjs'
import type { ExportConfig } from '../types'

export async function exportPPTX(config: ExportConfig): Promise<void> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = `${config.org.name} EVP Brand Report Q1 2026`
  pptx.author = 'EVP Control Tower'

  const ROSE = 'E11D48'
  const DARK = '1E293B'
  const MUTED = '94A3B8'
  const WHITE = 'FFFFFF'
  const EMERALD = '10B981'
  const AMBER = 'F59E0B'
  const LIGHT_ROSE = 'FFF1F5'
  const LIGHT_BLUE = 'F0F9FF'

  const addFooter = (slide: PptxGenJS.Slide) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 6.8, w: 10, h: 0.05, fill: { color: ROSE }
    })
    slide.addText(`${config.org.name} · EVP Brand Report Q1 2026 · Confidential`, {
      x: 0.3, y: 6.9, w: 7, h: 0.3,
      fontSize: 7, color: MUTED, align: 'left'
    })
  }

  // SLIDE 1: Cover
  const s1 = pptx.addSlide()
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 7.5, fill: { color: ROSE } })
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: 10, h: 2.3, fill: { color: 'BE123C' } })
  s1.addText('AQ', { x: 0.4, y: 0.8, w: 1.2, h: 1.2, fontSize: 32, bold: true, color: ROSE,
    fill: { color: WHITE }, align: 'center', valign: 'middle', shape: pptx.ShapeType.roundRect })
  s1.addText(config.org.name, { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 40, bold: true, color: WHITE })
  s1.addText('Employer Value Proposition Report', { x: 0.5, y: 3.2, w: 9, h: 0.7, fontSize: 22, color: 'FECDD3' })
  s1.addText(`Q1 2026 · ${config.org.country} · ${config.org.industry}`, {
    x: 0.5, y: 3.9, w: 9, h: 0.5, fontSize: 14, color: 'FECDD3'
  })
  s1.addText(`Overall Brand Score: ${config.overallScore}/100  ·  eNPS: ${config.enps > 0 ? '+' : ''}${config.enps}  ·  ${config.responseCount} Responses`, {
    x: 0.5, y: 5.5, w: 9, h: 0.5, fontSize: 13, color: WHITE
  })

  // SLIDE 2: Executive Summary
  const s2 = pptx.addSlide()
  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: ROSE } })
  s2.addText('Executive Summary', { x: 0.4, y: 0.2, w: 9, h: 0.7, fontSize: 24, bold: true, color: WHITE })

  const strengths = config.pillars.filter(p => p.status === 'top-strength' || p.status === 'strength').slice(0, 3)
  const gaps = config.pillars.filter(p => p.status === 'critical' || p.status === 'gap')

  // Score boxes row
  const kpis = [
    { label: 'Brand Score', value: `${config.overallScore}/100`, color: ROSE, bg: LIGHT_ROSE },
    { label: 'eNPS', value: `${config.enps > 0 ? '+' : ''}${config.enps}`, color: EMERALD, bg: 'F0FDF4' },
    { label: 'Responses', value: String(config.responseCount), color: '0EA5E9', bg: LIGHT_BLUE },
  ]
  kpis.forEach((kpi, i) => {
    s2.addShape(pptx.ShapeType.roundRect, { x: 0.4 + i * 3.1, y: 1.3, w: 2.8, h: 1.2, fill: { color: kpi.bg } })
    s2.addText(kpi.value, { x: 0.4 + i * 3.1, y: 1.4, w: 2.8, h: 0.65, fontSize: 28, bold: true, color: kpi.color, align: 'center' })
    s2.addText(kpi.label, { x: 0.4 + i * 3.1, y: 2.1, w: 2.8, h: 0.3, fontSize: 8, color: MUTED, align: 'center' })
  })

  s2.addText('Top Strengths', { x: 0.4, y: 2.8, w: 4, h: 0.4, fontSize: 13, bold: true, color: DARK })
  strengths.forEach((p, i) => {
    s2.addText(`✓  ${p.label}: ${p.internalScore.toFixed(1)}/5`, { x: 0.4, y: 3.2 + i * 0.5, w: 4, h: 0.4, fontSize: 11, color: EMERALD })
  })

  s2.addText('Critical Gaps', { x: 5.2, y: 2.8, w: 4.4, h: 0.4, fontSize: 13, bold: true, color: DARK })
  gaps.forEach((p, i) => {
    s2.addText(`⚠  ${p.label}: ${p.internalScore.toFixed(1)}/5`, { x: 5.2, y: 3.2 + i * 0.5, w: 4.4, h: 0.4, fontSize: 11, color: ROSE })
  })
  addFooter(s2)

  // SLIDE 3: Methodology
  const s3 = pptx.addSlide()
  s3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: ROSE } })
  s3.addText('Methodology', { x: 0.4, y: 0.2, w: 9, h: 0.7, fontSize: 24, bold: true, color: WHITE })
  const methodRows = [
    { label: 'Internal Survey', text: `${config.responseCount} responses · Likert 1–5 scale · 10 EVP pillars · Q1 2026` },
    { label: 'External Sources', text: 'Glassdoor (312) · AmbitionBox (478) · Naukri (203) · Indeed (156) · LinkedIn (1,240) · X/Twitter (890)' },
    { label: 'Scoring', text: 'Brand Score = ((avg pillar score − 1) / 4) × 100. External scores normalised to 1–5 scale.' },
    { label: 'Benchmark', text: 'Compared against Indian healthcare industry average of 68/100 across comparable employers.' },
  ]
  methodRows.forEach((row, i) => {
    s3.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.3 + i * 1.2, w: 9.2, h: 1.0, fill: { color: LIGHT_ROSE } })
    s3.addText(row.label, { x: 0.6, y: 1.4 + i * 1.2, w: 2.5, h: 0.35, fontSize: 10, bold: true, color: ROSE })
    s3.addText(row.text, { x: 0.6, y: 1.75 + i * 1.2, w: 8.8, h: 0.45, fontSize: 9.5, color: DARK })
  })
  addFooter(s3)

  // SLIDES 4-13: One per pillar
  const includedPillars = config.pillars.filter(p => config.includedPillarIds.includes(p.id))

  includedPillars.forEach((pillar) => {
    const s = pptx.addSlide()

    // Header
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: ROSE } })
    s.addText(`Pillar ${pillar.id} · ${pillar.label}`, { x: 0.4, y: 0.2, w: 8, h: 0.7, fontSize: 20, bold: true, color: WHITE })

    const statusColor = pillar.status === 'critical' ? ROSE : pillar.status === 'gap' ? AMBER : pillar.status === 'mixed' ? AMBER : EMERALD
    const statusBg = pillar.status === 'critical' ? 'FFF1F5' : pillar.status === 'gap' ? 'FFFBEB' : 'F0FDF4'
    s.addShape(pptx.ShapeType.roundRect, { x: 7.8, y: 0.15, w: 1.8, h: 0.75, fill: { color: statusBg } })
    s.addText(pillar.status.replace('-', ' ').toUpperCase(), { x: 7.8, y: 0.2, w: 1.8, h: 0.65, fontSize: 7.5, bold: true, color: statusColor, align: 'center', valign: 'middle' })

    // Score boxes
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.2, w: 2.5, h: 1.3, fill: { color: LIGHT_ROSE } })
    s.addText(pillar.internalScore.toFixed(1), { x: 0.4, y: 1.25, w: 2.5, h: 0.9, fontSize: 32, bold: true, color: ROSE, align: 'center' })
    s.addText('INTERNAL / 5.0', { x: 0.4, y: 2.2, w: 2.5, h: 0.25, fontSize: 7.5, color: MUTED, align: 'center' })

    s.addShape(pptx.ShapeType.roundRect, { x: 3.2, y: 1.2, w: 2.5, h: 1.3, fill: { color: LIGHT_BLUE } })
    s.addText(pillar.externalScore.toFixed(1), { x: 3.2, y: 1.25, w: 2.5, h: 0.9, fontSize: 32, bold: true, color: '0EA5E9', align: 'center' })
    s.addText('EXTERNAL / 5.0', { x: 3.2, y: 2.2, w: 2.5, h: 0.25, fontSize: 7.5, color: MUTED, align: 'center' })

    // Expert analysis
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.7, w: 0.06, h: 1.3, fill: { color: ROSE } })
    s.addShape(pptx.ShapeType.roundRect, { x: 0.55, y: 2.65, w: 9.1, h: 1.4, fill: { color: LIGHT_ROSE } })
    s.addText('Expert Analysis', { x: 0.65, y: 2.7, w: 8.9, h: 0.3, fontSize: 9.5, bold: true, color: ROSE })
    s.addText(pillar.expertOpinion, { x: 0.65, y: 3.0, w: 8.9, h: 1.0, fontSize: 8.5, color: DARK, italic: true, wrap: true })

    // Themes
    s.addText('Positive: ' + pillar.positiveThemes.join('  ·  '), {
      x: 0.4, y: 4.2, w: 9.2, h: 0.35, fontSize: 9, color: EMERALD
    })
    s.addText('Gaps: ' + pillar.negativeThemes.join('  ·  '), {
      x: 0.4, y: 4.55, w: 9.2, h: 0.35, fontSize: 9, color: ROSE
    })

    // Quote if space
    if (pillar.quotes.length > 0) {
      const q = pillar.quotes.find(q => q.sentiment === 'positive') ?? pillar.quotes[0]
      s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 5.0, w: 9.2, h: 1.0, fill: { color: q.sentiment === 'positive' ? 'F0FDF4' : LIGHT_ROSE } })
      s.addText(`"${q.text}"`, { x: 0.55, y: 5.1, w: 9.0, h: 0.65, fontSize: 8.5, italic: true, color: DARK, wrap: true })
      s.addText(`— ${q.source === 'internal' ? 'Internal Survey' : 'External Review'}`, {
        x: 0.55, y: 5.75, w: 9.0, h: 0.2, fontSize: 7.5, color: MUTED
      })
    }
    addFooter(s)
  })

  // SLIDE 14: Positives & Negatives
  const s14 = pptx.addSlide()
  s14.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: ROSE } })
  s14.addText('Positives & Negatives', { x: 0.4, y: 0.2, w: 9, h: 0.7, fontSize: 24, bold: true, color: WHITE })

  const s14strengths = config.pillars.filter(p => p.status === 'top-strength' || p.status === 'strength')
  const s14gaps = config.pillars.filter(p => p.status === 'critical' || p.status === 'gap')

  s14.addText('✅  Top Strengths', { x: 0.4, y: 1.2, w: 4.5, h: 0.4, fontSize: 13, bold: true, color: EMERALD })
  s14strengths.forEach((p, i) => {
    s14.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.7 + i * 0.8, w: 4.5, h: 0.65, fill: { color: 'F0FDF4' } })
    s14.addText(`${p.label}: ${p.internalScore.toFixed(1)}/5`, { x: 0.55, y: 1.75 + i * 0.8, w: 4.2, h: 0.55, fontSize: 10, bold: true, color: EMERALD, valign: 'middle' })
  })

  s14.addText('⚠  Critical Gaps', { x: 5.1, y: 1.2, w: 4.5, h: 0.4, fontSize: 13, bold: true, color: ROSE })
  s14gaps.forEach((p, i) => {
    s14.addShape(pptx.ShapeType.roundRect, { x: 5.1, y: 1.7 + i * 0.8, w: 4.5, h: 0.65, fill: { color: LIGHT_ROSE } })
    s14.addText(`${p.label}: ${p.internalScore.toFixed(1)}/5`, { x: 5.25, y: 1.75 + i * 0.8, w: 4.2, h: 0.55, fontSize: 10, bold: true, color: ROSE, valign: 'middle' })
  })
  addFooter(s14)

  // SLIDE 15: Recommendations
  const s15 = pptx.addSlide()
  s15.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: ROSE } })
  s15.addText('Priority Recommendations', { x: 0.4, y: 0.2, w: 9, h: 0.7, fontSize: 24, bold: true, color: WHITE })

  const recommendations = [
    { num: '1', pillar: 'Work-Life Balance', action: 'Implement shift rotation reform and 11-hour rest mandates for nursing staff.' },
    { num: '2', pillar: 'Employee Wellbeing', action: 'Launch EAP access, in-hospital counselling, and quarterly wellbeing pulse surveys.' },
    { num: '3', pillar: 'Compensation', action: 'Commission market benchmarking against top 5 Indian healthcare employers.' },
    { num: '4', pillar: 'Leadership', action: 'Deploy frontline manager programme focused on empathetic leadership and feedback.' },
    { num: '5', pillar: 'Mission & Purpose', action: 'Build employer brand campaign featuring authentic employee stories around patient impact.' },
  ]

  recommendations.forEach((rec, i) => {
    s15.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.25 + i * 1.05, w: 9.2, h: 0.9, fill: { color: LIGHT_ROSE } })
    s15.addShape(pptx.ShapeType.ellipse, { x: 0.45, y: 1.3 + i * 1.05, w: 0.55, h: 0.55, fill: { color: ROSE } })
    s15.addText(rec.num, { x: 0.45, y: 1.3 + i * 1.05, w: 0.55, h: 0.55, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' })
    s15.addText(rec.pillar, { x: 1.1, y: 1.3 + i * 1.05, w: 8.2, h: 0.3, fontSize: 10, bold: true, color: DARK })
    s15.addText(rec.action, { x: 1.1, y: 1.62 + i * 1.05, w: 8.2, h: 0.45, fontSize: 9, color: DARK })
  })
  addFooter(s15)

  // SLIDE 16: Thank You
  const s16 = pptx.addSlide()
  s16.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 7.5, fill: { color: ROSE } })
  s16.addShape(pptx.ShapeType.rect, { x: 0, y: 5.5, w: 10, h: 2, fill: { color: 'BE123C' } })
  s16.addText('Thank You', { x: 1, y: 1.5, w: 8, h: 1.5, fontSize: 52, bold: true, color: WHITE, align: 'center' })
  s16.addText('EVP Control Tower · Powered by Aster QCIL HR', { x: 1, y: 3.2, w: 8, h: 0.6, fontSize: 14, color: 'FECDD3', align: 'center' })
  s16.addText('This report is confidential and prepared exclusively for Aster QCIL HR Leadership', {
    x: 1, y: 5.8, w: 8, h: 0.5, fontSize: 10, color: 'FECDD3', align: 'center'
  })

  await pptx.writeFile({ fileName: `${config.org.name.replace(/\s+/g, '-')}-EVP-Report-Q1-2026.pptx` })
}
