import { useState } from 'react'

function ScanForm({ onSubmit, loading }) {
    const [domain, setDomain] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (domain.trim()) {
            onSubmit(domain.trim())
            setDomain('')
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">🎯 New Reconnaissance</h3>
            </div>
            <form onSubmit={handleSubmit} className="scan-form">
                <div className="form-group">
                    <label className="form-label">Target Domain</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !domain.trim()}>
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Scanning...
                        </>
                    ) : (
                        <>
                            🚀 Start Scan
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}

export default ScanForm
