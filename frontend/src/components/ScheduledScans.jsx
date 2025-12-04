import { useState, useEffect } from 'react'

function ScheduledScans({ apiUrl }) {
    const [schedules, setSchedules] = useState([])
    const [domain, setDomain] = useState('')
    const [cronExpression, setCronExpression] = useState('0 0 * * *')
    const [loading, setLoading] = useState(false)

    const fetchSchedules = async () => {
        try {
            const res = await fetch(`${apiUrl}/scans/scheduled/list`)
            const data = await res.json()
            setSchedules(data || [])
        } catch (err) {
            console.error('Failed to fetch schedules:', err)
        }
    }

    useEffect(() => {
        fetchSchedules()
    }, [])

    const createSchedule = async (e) => {
        e.preventDefault()
        if (!domain.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`${apiUrl}/scans/scheduled`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: domain.trim(),
                    cron_expression: cronExpression
                })
            })
            const data = await res.json()
            setSchedules(prev => [...prev, data])
            setDomain('')
        } catch (err) {
            console.error('Failed to create schedule:', err)
        } finally {
            setLoading(false)
        }
    }

    const deleteSchedule = async (id) => {
        try {
            await fetch(`${apiUrl}/scans/scheduled/${id}`, { method: 'DELETE' })
            setSchedules(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            console.error('Failed to delete schedule:', err)
        }
    }

    const toggleSchedule = async (id) => {
        try {
            const res = await fetch(`${apiUrl}/scans/scheduled/${id}/toggle`, { method: 'PATCH' })
            const data = await res.json()
            setSchedules(prev => prev.map(s => s.id === id ? data : s))
        } catch (err) {
            console.error('Failed to toggle schedule:', err)
        }
    }

    const cronPresets = [
        { label: 'Every hour', value: '0 * * * *' },
        { label: 'Daily at midnight', value: '0 0 * * *' },
        { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
        { label: 'Monthly', value: '0 0 1 * *' },
    ]

    return (
        <div className="section fade-in">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">⏰ Scheduled Reconnaissance</h3>
                </div>

                <form onSubmit={createSchedule} style={{ marginBottom: '1.5rem' }}>
                    <div className="grid-3">
                        <div className="form-group">
                            <label className="form-label">Target Domain</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., example.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Schedule (Cron)</label>
                            <select
                                className="form-input"
                                value={cronExpression}
                                onChange={(e) => setCronExpression(e.target.value)}
                            >
                                {cronPresets.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading || !domain.trim()}>
                                {loading ? 'Creating...' : '➕ Add Schedule'}
                            </button>
                        </div>
                    </div>
                </form>

                {schedules.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <p>No scheduled scans. Create one above!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Last Run</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(schedule => (
                                    <tr key={schedule.id}>
                                        <td className="mono">{schedule.domain}</td>
                                        <td className="mono">{schedule.cron_expression}</td>
                                        <td>
                                            <span className={`badge ${schedule.is_active ? 'badge-success' : ''}`}>
                                                {schedule.is_active ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td>
                                            {schedule.last_run
                                                ? new Date(schedule.last_run).toLocaleString()
                                                : 'Never'
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => toggleSchedule(schedule.id)}
                                                >
                                                    {schedule.is_active ? 'Pause' : 'Resume'}
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteSchedule(schedule.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">ℹ️ Cron Expression Guide</h3>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <pre style={{
                        background: 'var(--bg-tertiary)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'auto'
                    }}>
                        {`┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *

Examples:
  0 0 * * *     Daily at midnight
  0 */6 * * *   Every 6 hours
  0 0 * * 1     Weekly on Monday
  0 0 1 * *     Monthly on the 1st`}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default ScheduledScans
