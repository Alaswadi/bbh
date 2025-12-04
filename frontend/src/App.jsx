import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ScanForm from './components/ScanForm'
import ResultsTable from './components/ResultsTable'
import ScheduledScans from './components/ScheduledScans'
import StatsCards from './components/StatsCards'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [scans, setScans] = useState([])
    const [stats, setStats] = useState(null)
    const [selectedScan, setSelectedScan] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchScans = async () => {
        try {
            const res = await fetch(`${API_URL}/scans/`)
            const data = await res.json()
            setScans(data.scans || [])
        } catch (err) {
            console.error('Failed to fetch scans:', err)
        }
    }

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/results/stats`)
            const data = await res.json()
            setStats(data)
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        }
    }

    useEffect(() => {
        fetchScans()
        fetchStats()

        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            fetchScans()
            fetchStats()
        }, 10000)

        return () => clearInterval(interval)
    }, [])

    const startScan = async (domain) => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/scans/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            })
            const data = await res.json()
            setScans(prev => [data, ...prev])
            setActiveTab('scans')
        } catch (err) {
            console.error('Failed to start scan:', err)
        } finally {
            setLoading(false)
        }
    }

    const deleteScan = async (scanId) => {
        try {
            await fetch(`${API_URL}/scans/${scanId}`, { method: 'DELETE' })
            setScans(prev => prev.filter(s => s.id !== scanId))
            if (selectedScan === scanId) setSelectedScan(null)
        } catch (err) {
            console.error('Failed to delete scan:', err)
        }
    }

    return (
        <div className="app-container">
            <header className="header">
                <h1>Recon Framework</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-success">v1.0.0</span>
                    <span className="badge">
                        {scans.filter(s => s.status === 'running').length} running
                    </span>
                </div>
            </header>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={`tab ${activeTab === 'scans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scans')}
                >
                    Scans
                </button>
                <button
                    className={`tab ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Results
                </button>
                <button
                    className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scheduled')}
                >
                    Scheduled
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <Dashboard stats={stats} scans={scans} onStartScan={startScan} loading={loading} />
            )}

            {activeTab === 'scans' && (
                <div className="section fade-in">
                    <ScanForm onSubmit={startScan} loading={loading} />

                    <div className="card" style={{ marginTop: '1.5rem' }}>
                        <div className="card-header">
                            <h3 className="card-title">Recent Scans</h3>
                            <span className="badge">{scans.length} total</span>
                        </div>

                        {scans.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <p>No scans yet. Start your first reconnaissance!</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Domain</th>
                                            <th>Status</th>
                                            <th>Started</th>
                                            <th>Completed</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scans.map(scan => (
                                            <tr key={scan.id}>
                                                <td className="mono">{scan.domain}</td>
                                                <td>
                                                    <span className={`status status-${scan.status}`}>
                                                        {scan.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(scan.created_at).toLocaleString()}</td>
                                                <td>
                                                    {scan.completed_at
                                                        ? new Date(scan.completed_at).toLocaleString()
                                                        : '-'
                                                    }
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => {
                                                                setSelectedScan(scan.id)
                                                                setActiveTab('results')
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => deleteScan(scan.id)}
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
                </div>
            )}

            {activeTab === 'results' && (
                <ResultsTable
                    scanId={selectedScan}
                    onClearFilter={() => setSelectedScan(null)}
                    apiUrl={API_URL}
                />
            )}

            {activeTab === 'scheduled' && (
                <ScheduledScans apiUrl={API_URL} />
            )}
        </div>
    )
}

export default App
