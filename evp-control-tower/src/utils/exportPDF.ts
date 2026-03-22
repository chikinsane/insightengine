import jsPDF from 'jspdf'
import type { ExportConfig } from '../types'

export async function exportPDF(config: ExportConfig): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const ROSE: [number, number, number] = [225, 29, 72]
  const DARK: [number, number, number] = [30, 41, 59]
  const MUTED: [number, number, number] = [148, 163, 184]
  const WHITE: [number, number, number] = [255, 255, 255]
  const EMERALD: [number, number, number] = [16, 185, 129]
  const AMBER: [number, number, number] = [245, 158, 11]

  let pageNum = 0
  let y = 20

  const addPage = () => {
    doc.addPage()
    y = 20
    pageNum++
  }

  const footer = (label: string) => {
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text('Aster QCIL · EVP Brand Report Q1 2026 · Confidential', 20, H - 10)
    doc.text(label, W - 20, H - 10, { align: 'right' })
    // Rose line at bottom
    doc.setDrawColor(...ROSE)
    doc.setLineWidth(0.8)
    doc.line(0, H - 13, W, H - 13)
  }

  const heading = (text: string, size = 16) => {
    doc.setFontSize(size)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.text(text, 20, y)
    y += size * 0.45 + 4
  }

  const body = (text: string, size = 9.5) => {
    doc.setFontSize(size)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, W - 40)
    doc.text(lines, 20, y)
    y += lines.length * (size * 0.38) + 3
  }

  const hr = () => {
    doc.setDrawColor(...MUTED)
    doc.setLineWidth(0.3)
    doc.line(20, y, W - 20, y)
    y += 5
  }

  // ─── PAGE 1: COVER ───────────────────────────────────────────────
  doc.setFillColor(...ROSE)
  doc.rect(0, 0, W, 75, 'F')

  // Logo block
  doc.setFillColor(...WHITE)
  doc.roundedRect(18, 14, 30, 30, 4, 4, 'F')
  doc.setFontSize(16)
  doc.setTextColor(...ROSE)
  doc.setFont('helvetica', 'bold')
  doc.text('AQ', 21, 33)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.text('Employer Brand Report', 55, 30)
  doc.setFontSize(14)
  doc.text('EVP Analysis · Q1 2026', 55, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${config.org.name} · ${config.org.country} · ${config.org.industry}`, 55, 55)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 55, 65)

  y = 90
  heading('Executive Summary', 14)
  body(`This report presents the Q1 2026 Employer Value Proposition (EVP) analysis for ${config.org.name}, based on ${config.responseCount} internal survey responses and ${config.enps > 0 ? '+' : ''}${config.enps} eNPS, aggregated across Glassdoor, AmbitionBox, Naukri, Indeed, LinkedIn, and X (Twitter).`)
  y += 3

  // Score boxes
  doc.setFillColor(255, 241, 245)
  doc.roundedRect(20, y, 50, 22, 3, 3, 'F')
  doc.setTextColor(...ROSE)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(String(config.overallScore), 32, y + 13)
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('BRAND SCORE / 100', 21, y + 20)

  doc.setFillColor(240, 253, 244)
  doc.roundedRect(76, y, 50, 22, 3, 3, 'F')
  doc.setTextColor(...EMERALD)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${config.enps > 0 ? '+' : ''}${config.enps}`, 88, y + 13)
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('EMPLOYEE NPS', 77, y + 20)

  doc.setFillColor(240, 249, 255)
  doc.roundedRect(132, y, 55, 22, 3, 3, 'F')
  doc.setTextColor(14, 165, 233)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(String(config.responseCount), 144, y + 13)
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('SURVEY RESPONSES', 133, y + 20)
  y += 32

  hr()
  heading('Top Strengths', 11)
  const strengths = config.pillars.filter(p => p.status === 'top-strength' || p.status === 'strength')
  strengths.slice(0, 3).forEach(p => {
    doc.setTextColor(...EMERALD)
    doc.setFontSize(9)
    doc.text(`✓ ${p.label}: ${p.internalScore.toFixed(1)} / 5.0`, 22, y)
    y += 6
  })
  y += 2
  hr()
  heading('Critical Gaps', 11)
  const gaps = config.pillars.filter(p => p.status === 'critical' || p.status === 'gap')
  gaps.forEach(p => {
    doc.setTextColor(...ROSE)
    doc.setFontSize(9)
    doc.text(`⚠ ${p.label}: ${p.internalScore.toFixed(1)} / 5.0`, 22, y)
    y += 6
  })
  footer('Page 1 · Cover')

  // ─── PAGE 2: METHODOLOGY ──────────────────────────────────────────
  addPage()
  heading('Methodology', 15)
  hr()
  body('Internal Survey: ' + config.responseCount + ' responses collected via the Aster QCIL EVP Survey Q1 2026, distributed across all major departments and locations. Questions used a 1–5 Likert scale for 10 EVP pillars and a 0–10 Net Promoter Score question.')
  y += 4
  body('External Listening: Sentiment data aggregated from Glassdoor (312 reviews), AmbitionBox (478), Naukri (203), Indeed (156), LinkedIn (1,240 signals), and X/Twitter (890 mentions). Scores normalised to a 1–5 scale where applicable.')
  y += 4
  body('Composite Score: The overall Employer Brand Score (0–100) is derived from the weighted average of all 10 internal pillar scores, converted using the formula: Score = ((avg − 1) / 4) × 100. The composite score of ' + config.overallScore + '/100 places Aster QCIL above the Indian healthcare industry average of 68/100.')
  y += 4
  body('Expert Analysis: Each pillar analysis reflects a synthesis of survey verbatims, external review themes, and industry benchmarks against comparable Indian healthcare employers.')
  footer('Page 2 · Methodology')

  // ─── PAGES 3-12: ONE PER PILLAR ───────────────────────────────────
  const includedPillars = config.pillars.filter(p => config.includedPillarIds.includes(p.id))

  includedPillars.forEach((pillar, i) => {
    addPage()

    // Rose header bar
    doc.setFillColor(...ROSE)
    doc.rect(0, 0, W, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Pillar ${pillar.id} of 10 · ${pillar.label}`, 20, 9.5)

    // Status badge
    const statusColor: [number, number, number] =
      pillar.status === 'critical' ? ROSE :
      pillar.status === 'gap' ? AMBER :
      pillar.status === 'mixed' ? AMBER : EMERALD
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(W - 60, 3, 55, 8, 2, 2, 'F')
    doc.setTextColor(...statusColor)
    doc.setFontSize(7.5)
    const statusLabel = pillar.status.replace('-', ' ').toUpperCase()
    doc.text(statusLabel, W - 33, 8.5, { align: 'center' })

    y = 24

    // Score boxes side by side
    doc.setFillColor(255, 241, 245)
    doc.roundedRect(20, y, 52, 28, 3, 3, 'F')
    doc.setTextColor(...ROSE)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(pillar.internalScore.toFixed(1), 30, y + 17)
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text('INTERNAL SCORE / 5.0', 21, y + 25)

    doc.setFillColor(240, 249, 255)
    doc.roundedRect(78, y, 52, 28, 3, 3, 'F')
    doc.setTextColor(14, 165, 233)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(pillar.externalScore.toFixed(1), 88, y + 17)
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text('EXTERNAL SCORE / 5.0', 79, y + 25)

    // Score bars
    const barY = y + 36
    doc.setFontSize(8)
    doc.setTextColor(...DARK)
    doc.text('Internal', 20, barY)
    doc.setFillColor(229, 231, 235)
    doc.roundedRect(45, barY - 4, 130, 6, 2, 2, 'F')
    doc.setFillColor(...ROSE)
    doc.roundedRect(45, barY - 4, 130 * (pillar.internalScore / 5), 6, 2, 2, 'F')

    doc.setTextColor(...DARK)
    doc.text('External', 20, barY + 10)
    doc.setFillColor(229, 231, 235)
    doc.roundedRect(45, barY + 6, 130, 6, 2, 2, 'F')
    doc.setFillColor(14, 165, 233)
    doc.roundedRect(45, barY + 6, 130 * (pillar.externalScore / 5), 6, 2, 2, 'F')

    y = barY + 22
    hr()

    heading('Expert Analysis', 11)
    body(pillar.expertOpinion, 9.5)
    y += 3
    hr()

    heading('Key Themes', 11)
    doc.setFontSize(9)
    doc.setTextColor(...EMERALD)
    doc.setFont('helvetica', 'bold')
    doc.text('Positive:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(pillar.positiveThemes.join('  ·  '), 44, y)
    y += 7
    doc.setFontSize(9)
    doc.setTextColor(...ROSE)
    doc.setFont('helvetica', 'bold')
    doc.text('Gaps:', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(pillar.negativeThemes.join('  ·  '), 38, y)
    y += 10
    hr()

    if (pillar.quotes.length > 0 && y < 220) {
      heading('Employee Voice', 11)
      const quoteSlice = pillar.quotes.slice(0, 2)
      quoteSlice.forEach(q => {
        const isPos = q.sentiment === 'positive'
        const bgColor: [number, number, number] = isPos ? [240, 253, 244] : [255, 241, 245]
        const borderColor: [number, number, number] = isPos ? EMERALD : ROSE
        const lines = doc.splitTextToSize(`"${q.text}"`, W - 52)
        const boxH = lines.length * 4.5 + 10
        if (y + boxH > H - 25) return  // skip if no room
        doc.setFillColor(...bgColor)
        doc.roundedRect(20, y, W - 40, boxH, 2, 2, 'F')
        doc.setFillColor(...borderColor)
        doc.rect(20, y, 3, boxH, 'F')
        doc.setFontSize(8.5)
        doc.setTextColor(...DARK)
        doc.setFont('helvetica', 'italic')
        doc.text(lines, 27, y + 7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        doc.setFontSize(7.5)
        doc.text(`— ${q.source === 'internal' ? 'Internal Survey' : 'External Review'}`, 27, y + boxH - 2)
        y += boxH + 5
      })
    }

    footer(`Page ${i + 3} · ${pillar.label}`)
  })

  // ─── RECOMMENDATIONS PAGE ─────────────────────────────────────────
  addPage()
  heading('Priority Recommendations', 15)
  hr()

  const recs = [
    { pillar: 'Work-Life Balance', action: 'Implement structured shift rotation reform and mandate minimum 11-hour rest periods for nursing staff. Target: improve score from 3.1 to 3.7 within 2 quarters.' },
    { pillar: 'Employee Wellbeing', action: 'Launch a comprehensive mental health support programme including EAP access, in-hospital counselling, and peer support networks. Set quarterly wellbeing pulse surveys.' },
    { pillar: 'Compensation & Benefits', action: 'Commission a market compensation benchmarking study against top 5 Indian healthcare employers. Address allowance gaps for clinical staff at Tier 2 locations.' },
    { pillar: 'Leadership & Management', action: 'Deploy a frontline manager development programme focusing on empathetic leadership and feedback skills. Measure via 360-degree surveys.' },
    { pillar: 'Mission & Patient Purpose', action: 'Amplify existing EVP strength — build an employer brand campaign featuring authentic employee stories around patient impact and clinical purpose.' },
  ]

  recs.forEach((rec, i) => {
    const lines = doc.splitTextToSize(rec.action, W - 62)
    const boxH = lines.length * 4.5 + 18
    doc.setFillColor(255, 241, 245)
    doc.roundedRect(20, y, W - 40, boxH, 3, 3, 'F')
    doc.setFillColor(...ROSE)
    doc.circle(30, y + boxH / 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(String(i + 1), 28, y + boxH / 2 + 3.5)
    doc.setTextColor(...DARK)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(rec.pillar, 40, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text(lines, 40, y + 16)
    y += boxH + 6
  })
  footer(`Page ${includedPillars.length + 3} · Recommendations`)

  // ─── APPENDIX: RAW SCORES ─────────────────────────────────────────
  addPage()
  heading('Appendix: EVP Pillar Scores', 14)
  hr()

  // Table header
  const cols = [20, 105, 135, 158, 178]
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Pillar', cols[0], y)
  doc.text('Internal', cols[1], y)
  doc.text('External', cols[2], y)
  doc.text('Gap', cols[3], y)
  doc.text('Status', cols[4], y)
  y += 5
  doc.setFillColor(248, 250, 252)
  doc.rect(18, y - 3, W - 36, y + config.pillars.length * 8, 'F')
  hr()

  const statusColors: Record<string, [number, number, number]> = {
    'top-strength': EMERALD, 'strength': EMERALD, 'mixed': AMBER, 'gap': AMBER, 'critical': ROSE
  }

  config.pillars.forEach((p, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(18, y - 4, W - 36, 8, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...DARK)
    doc.text(p.label, cols[0], y)
    doc.text(p.internalScore.toFixed(1), cols[1], y)
    doc.text(p.externalScore.toFixed(1), cols[2], y)
    const gap = p.internalScore - p.externalScore
    const gapColor: [number, number, number] = gap >= 0 ? DARK : ROSE
    doc.setTextColor(...gapColor)
    doc.text((gap > 0 ? '+' : '') + gap.toFixed(1), cols[3], y)
    doc.setTextColor(...(statusColors[p.status] ?? DARK))
    doc.text(p.status.replace('-', ' '), cols[4], y)
    y += 8
  })
  footer('Appendix · Raw Scores')

  doc.save(`${config.org.name.replace(/\s+/g, '-')}-EVP-Report-Q1-2026.pdf`)
}
