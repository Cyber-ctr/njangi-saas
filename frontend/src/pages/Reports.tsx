import { useState } from 'react'
import { BarChart3, Download, FileText } from 'lucide-react'
import { api } from '../lib/api'

interface Group { id: number }
interface Organization { id: number }
type ReportRow = Record<string, string | number | boolean | null>
interface ReportDefinition { name: string; description: string; load: (groupId: number) => Promise<ReportRow[]> }

const reports: ReportDefinition[] = [
  { name: 'Contribution register', description: 'Recorded contribution amounts, methods and dates.', load: groupId => api('/api/contributions?group_id=' + groupId) },
  { name: 'Loan portfolio', description: 'Borrowers, principal, outstanding amounts and status.', load: groupId => api('/api/loans?group_id=' + groupId) },
  { name: 'Member participation', description: 'Current group members and assigned roles.', load: groupId => api('/api/groups/' + groupId + '/members') },
  { name: 'Income & expense', description: 'Recorded group expenses and accounting categories.', load: groupId => api('/api/expenses?group_id=' + groupId) },
  {
    name: 'Audit trail',
    description: 'Recent organization events, actors and affected records.',
    load: async () => {
      const organizations = await api<Organization[]>('/api/organizations')
      if (!organizations[0]) return []
      return api<ReportRow[]>('/api/audit?organization_id=' + organizations[0].id)
    },
  },
  {
    name: 'AI risk summary',
    description: 'Member risk estimates and the factors behind each score.',
    load: async groupId => {
      const result = await api<{ members: ReportRow[] }>('/api/ai/groups/' + groupId + '/risk')
      return result.members
    },
  },
]

function csvValue(value: unknown): string {
  const raw = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)
  const text = typeof value === 'string' && /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${text.replaceAll('"', '""')}"`
}

function downloadCsv(name: string, rows: ReportRow[]) {
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))]
  const content = [columns.map(csvValue).join(','), ...rows.map(row => columns.map(column => csvValue(row[column])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}.csv`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Reports() {
  const [loadingReport, setLoadingReport] = useState('')
  const [error, setError] = useState('')
  const [activeReport, setActiveReport] = useState<{ name: string; rows: ReportRow[] } | null>(null)

  const openReport = async (report: ReportDefinition) => {
    setLoadingReport(report.name)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      const rows = await report.load(groups[0]?.id ?? 0)
      setActiveReport({ name: report.name, rows })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to load ${report.name}`)
    } finally {
      setLoadingReport('')
    }
  }

  const columns = activeReport?.rows.length ? Object.keys(activeReport.rows[0]) : []

  return <>
    <div className="page-header"><div><h1>Reports</h1><p className="muted">Load live management data and export it as a CSV file.</p></div></div>
    {error && <div className="error-box" role="alert">{error}</div>}
    <div className="report-grid">{reports.map(report => <div className="report-card" key={report.name}><FileText size={24}/><h3>{report.name}</h3><p>{report.description}</p><button className="link-button" disabled={Boolean(loadingReport)} onClick={() => void openReport(report)}>{loadingReport === report.name ? 'Loading…' : 'Preview & export CSV'}</button></div>)}</div>
    <section className="panel note"><BarChart3 size={20}/><div><strong>Live report data</strong><p>Each report is loaded from the API when opened. Exports contain the returned records and are provided in CSV format.</p></div></section>
    {activeReport && <div className="dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) setActiveReport(null)
    }}><section className="panel action-dialog report-preview" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="panel-head"><div><h2 id="report-title">{activeReport.name}</h2><p className="muted">{activeReport.rows.length} records</p></div><button className="secondary-button" onClick={() => setActiveReport(null)}>Close</button></div>
      {activeReport.rows.length ? <div className="table-wrap preview-table"><table><thead><tr>{columns.map(column => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{activeReport.rows.map((row, index) => <tr key={String(row.id ?? row.member_id ?? index)}>{columns.map(column => <td key={column}>{typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div> : <div className="empty">No records are available for this report.</div>}
      <div className="dialog-actions"><button className="secondary-button" onClick={() => setActiveReport(null)}>Close</button><button className="primary-button" disabled={!activeReport.rows.length} onClick={() => downloadCsv(activeReport.name, activeReport.rows)}><Download size={17}/> Download CSV</button></div>
    </section></div>}
  </>
}
