import { useState, useEffect } from 'react'

function ResultsTable({ scanId, onClearFilter, apiUrl }) {
    const [results, setResults] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [aliveOnly, setAliveOnly] = useState(false)
    const [page, setPage] = useState(0)
    const pageSize = 50

    const fetchResults = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                skip: (page * pageSize).toString(),
                limit: pageSize.toString(),
                alive_only: aliveOnly.toString()
            })
            if (scanId) params.append('scan_id', scanId.toString())

            const res = await fetch(`${apiUrl}/results/?${params}`)
            const data = await res.json()
            setResults(data.results || [])
            setTotal(data.total || 0)
        } catch (err) {
            console.error('Failed to fetch results:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchResults()
    }, [scanId, aliveOnly, page])

    const exportResults = async () => {
        if (!scanId) {
            alert('Please select a specific scan to export')
            return
        }

        try {
            const res = await fetch(`${apiUrl}/results/export/${scanId}`)
            const data = await res.json()

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `recon_results_${scanId}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Export failed:', err)
        }
    }

    return (
        <div className="section fade-in">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        Reconnaissance Results
                        {scanId && (
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={onClearFilter}
                                style={{ marginLeft: '1rem' }}
                            >
                                Clear Filter
                            </button>
                        )}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={aliveOnly}
                                onChange={(e) => {
                                    setAliveOnly(e.target.checked)
                                    setPage(0)
                                }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Alive only
                            </span>
                        </label>
                        <button className="btn btn-secondary btn-sm" onClick={exportResults}>
                            📥 Export JSON
                        </button>
                        <span className="badge">{total} total</span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : results.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <p>No results found</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subdomain</th>
                                        <th>IP</th>
                                        <th>Status</th>
                                        <th>Ports</th>
                                        <th>Title</th>
                                        <th>Technologies</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map(r => (
                                        <tr key={r.id}>
                                            <td className="mono" style={{ maxWidth: '250px', wordBreak: 'break-all' }}>
                                                {r.subdomain}
                                            </td>
                                            <td className="mono">{r.ip_address || '-'}</td>
                                            <td>
                                                {r.is_alive ? (
                                                    <span className="badge badge-success">
                                                        {r.status_code || 'Live'}
                                                    </span>
                                                ) : (
                                                    <span className="badge">Dead</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="port-list">
                                                    {r.ports && r.ports.length > 0 ? (
                                                        r.ports.slice(0, 5).map(port => (
                                                            <span key={port} className="port-badge">{port}</span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                    )}
                                                    {r.ports && r.ports.length > 5 && (
                                                        <span className="badge">+{r.ports.length - 5}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: '200px' }}>
                                                <span className="url-truncate" title={r.title}>
                                                    {r.title || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="tech-tags">
                                                    {r.technologies && r.technologies.length > 0 ? (
                                                        r.technologies.slice(0, 3).map(tech => (
                                                            <span key={tech} className="badge badge-info">{tech}</span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                    )}
                                                    {r.technologies && r.technologies.length > 3 && (
                                                        <span className="badge">+{r.technologies.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {total > pageSize && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    Previous
                                </button>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 1rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Page {page + 1} of {Math.ceil(total / pageSize)}
                                </span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * pageSize >= total}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ResultsTable
