import React, { useMemo } from 'react'
import { PageHeader } from './UI'

function getWeekKey(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

function getLast8Weeks() {
  const weeks = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    weeks.push(d.toISOString().split('T')[0])
  }
  return weeks
}

function formatWeekLabel(weekKey) {
  const d = new Date(weekKey)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const METRICS = [
  { key: 'scanned',   label: { fr: 'Scannées',    en: 'Scanned'   }, color: '#AFA9EC', bg: '#EEEDFE' },
  { key: 'qualified', label: { fr: 'Qualifiées',   en: 'Qualified' }, color: '#5DCAA5', bg: '#E1F5EE' },
  { key: 'applied',   label: { fr: 'Candidatures', en: 'Applied'   }, color: '#534AB7', bg: '#EEEDFE' },
]

export default function Timeline({ t, lang, jobs }) {
  const weeks = getLast8Weeks()

  const data = useMemo(() => {
    const map = {}
    weeks.forEach(w => { map[w] = { scanned: 0, qualified: 0, applied: 0 } })

    jobs.forEach(j => {
      // Scanned = createdAt
      if (j.createdAt) {
        const w = getWeekKey(j.createdAt)
        if (map[w]) map[w].scanned++
      }
      // Qualified = scoreDate
      if (j.scoreDate) {
        const w = getWeekKey(j.scoreDate)
        if (map[w]) map[w].qualified++
      }
      // Applied = lastAction when status is applied/inprocess/offer
      if (['applied', 'inprocess', 'offer', 'closed'].includes(j.status) && j.lastAction) {
        const w = getWeekKey(j.lastAction)
        if (map[w]) map[w].applied++
      }
    })
    return weeks.map(w => ({ week: w, ...map[w] }))
  }, [jobs])

  const maxVal = Math.max(1, ...data.flatMap(d => [d.scanned, d.qualified, d.applied]))

  // Totals
  const totals = {
    scanned: jobs.length,
    qualified: jobs.filter(j => j.score != null).length,
    applied: jobs.filter(j => ['applied', 'inprocess', 'offer', 'closed'].includes(j.status)).length,
    go: jobs.filter(j => j.recommendation === 'GO').length,
    investigate: jobs.filter(j => j.recommendation === 'INVESTIGATE').length,
    nogo: jobs.filter(j => j.recommendation === 'NO-GO').length,
  }

  const conversionRate = totals.scanned > 0
    ? Math.round((totals.applied / totals.scanned) * 100)
    : 0

  return (
    <div>
      <PageHeader
        title={lang === 'fr' ? 'Timeline de recherche' : 'Search Timeline'}
        subtitle={lang === 'fr' ? 'Activité hebdomadaire — 8 dernières semaines' : 'Weekly activity — last 8 weeks'}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: lang === 'fr' ? 'Offres scannées' : 'Jobs scanned', value: totals.scanned, sub: lang === 'fr' ? 'total' : 'total', color: '#534AB7' },
          { label: lang === 'fr' ? 'Qualifiées' : 'Qualified', value: totals.qualified, sub: `${totals.go} GO · ${totals.investigate} INV · ${totals.nogo} NO`, color: '#0F6E56' },
          { label: lang === 'fr' ? 'Candidatures' : 'Applied', value: totals.applied, sub: `${conversionRate}% conversion`, color: '#BA7517' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-[11px] text-gray-400 mb-1">{kpi.label}</div>
            <div className="text-[28px] font-medium" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="text-[13px] font-medium text-gray-700 mb-4">
          {lang === 'fr' ? 'Activité par semaine' : 'Activity per week'}
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">
            {lang === 'fr' ? 'Aucune donnée — scannez des offres pour voir la timeline.' : 'No data yet — scan jobs to populate the timeline.'}
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="flex items-end gap-2 h-40 mb-2">
              {data.map(d => (
                <div key={d.week} className="flex-1 flex items-end gap-0.5 justify-center">
                  {METRICS.map(m => {
                    const h = Math.round((d[m.key] / maxVal) * 100)
                    return (
                      <div key={m.key} className="flex-1 rounded-t-sm transition-all group relative"
                        style={{ height: `${Math.max(h, d[m.key] > 0 ? 4 : 0)}%`, background: m.color, opacity: d[m.key] === 0 ? 0.15 : 1 }}>
                        {d[m.key] > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {d[m.key]}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* X labels */}
            <div className="flex gap-2">
              {data.map(d => (
                <div key={d.week} className="flex-1 text-center text-[9px] text-gray-400">
                  {formatWeekLabel(d.week)}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 justify-center">
              {METRICS.map(m => (
                <div key={m.key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: m.color }} />
                  <span className="text-[11px] text-gray-500">{m.label[lang] || m.label.en}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Funnel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-[13px] font-medium text-gray-700 mb-4">
          {lang === 'fr' ? 'Entonnoir de conversion' : 'Conversion funnel'}
        </div>
        <div className="space-y-2">
          {[
            { label: lang === 'fr' ? 'Scannées' : 'Scanned', value: totals.scanned, pct: 100, color: '#AFA9EC' },
            { label: lang === 'fr' ? 'Qualifiées' : 'Qualified', value: totals.qualified, pct: totals.scanned ? Math.round(totals.qualified/totals.scanned*100) : 0, color: '#5DCAA5' },
            { label: 'GO', value: totals.go, pct: totals.scanned ? Math.round(totals.go/totals.scanned*100) : 0, color: '#639922' },
            { label: lang === 'fr' ? 'Candidatures' : 'Applied', value: totals.applied, pct: totals.scanned ? Math.round(totals.applied/totals.scanned*100) : 0, color: '#534AB7' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="text-[12px] text-gray-500 w-24 flex-shrink-0">{row.label}</div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
              </div>
              <div className="text-[12px] font-medium w-8 text-right">{row.value}</div>
              <div className="text-[11px] text-gray-400 w-8">{row.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
