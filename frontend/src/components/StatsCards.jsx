function StatsCards({ stats }) {
    if (!stats) {
        return (
            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="stat-card">
                        <div className="stat-value">--</div>
                        <div className="stat-label">Loading...</div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
            <div className="stat-card">
                <div className="stat-value">{stats.scans?.total || 0}</div>
                <div className="stat-label">Total Scans</div>
            </div>
            <div className="stat-card info">
                <div className="stat-value">{stats.subdomains?.total || 0}</div>
                <div className="stat-label">Subdomains Found</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.subdomains?.alive || 0}</div>
                <div className="stat-label">Alive Hosts</div>
            </div>
            <div className="stat-card warning">
                <div className="stat-value">{stats.subdomains?.with_open_ports || 0}</div>
                <div className="stat-label">With Open Ports</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.scans?.completed || 0}</div>
                <div className="stat-label">Completed Scans</div>
            </div>
            <div className="stat-card danger">
                <div className="stat-value">{stats.scans?.running || 0}</div>
                <div className="stat-label">Running Now</div>
            </div>
        </div>
    )
}

export default StatsCards
