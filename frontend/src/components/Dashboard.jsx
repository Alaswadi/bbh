import { useState } from 'react'
import ScanForm from './ScanForm'
import StatsCards from './StatsCards'

function Dashboard({ stats, scans, onStartScan, loading }) {
    return (
        <div className="fade-in">
            <ScanForm onSubmit={onStartScan} loading={loading} />

            <StatsCards stats={stats} />

            {/* Recent Activity */}
            <div className="grid-2" style={{ marginTop: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Running Scans</h3>
                    </div>
                    {scans.filter(s => s.status === 'running').length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No active scans</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Domain</th>
                                        <th>Started</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scans.filter(s => s.status === 'running').map(scan => (
                                        <tr key={scan.id}>
                                            <td className="mono">{scan.domain}</td>
                                            <td>{new Date(scan.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Top Technologies</h3>
                    </div>
                    {stats?.top_technologies?.length > 0 ? (
                        <div className="tech-tags">
                            {stats.top_technologies.map(([tech, count]) => (
                                <span key={tech} className="badge badge-info">
                                    {tech} ({count})
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No data yet</p>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Top Open Ports</h3>
                    </div>
                    {stats?.top_ports?.length > 0 ? (
                        <div className="port-list">
                            {stats.top_ports.map(([port, count]) => (
                                <span key={port} className="port-badge">
                                    {port} ({count})
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>No data yet</p>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Completed</h3>
                    </div>
                    {scans.filter(s => s.status === 'completed').slice(0, 5).length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No completed scans</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Domain</th>
                                        <th>Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scans.filter(s => s.status === 'completed').slice(0, 5).map(scan => (
                                        <tr key={scan.id}>
                                            <td className="mono">{scan.domain}</td>
                                            <td>
                                                {scan.completed_at
                                                    ? new Date(scan.completed_at).toLocaleString()
                                                    : '-'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
