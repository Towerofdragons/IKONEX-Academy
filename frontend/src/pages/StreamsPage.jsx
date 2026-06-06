import { useState } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { parseErrorMessage } from '../utils/errors';
import { formatRank, rankBadgeClass } from '../utils/formatters';
import { exportClassPerformanceReport } from '../utils/pdf';

export default function StreamsPage() {
  const { authFetch } = useAuth();
  const { streams, subjects, fetchBaselineData, setLoading, showToast } = useApp();

  const [newStreamName, setNewStreamName] = useState('');
  const [selectedStream, setSelectedStream] = useState(null);
  const [streamDetails, setStreamDetails] = useState(null);
  const [streamReport, setStreamReport] = useState(null);
  const [leaderboardSubjectId, setLeaderboardSubjectId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const handleCreateStream = async (e) => {
    e.preventDefault();
    if (!newStreamName.trim()) return;

    try {
      const res = await authFetch(`${API_BASE}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStreamName }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Stream "${data.name}" created successfully!`);
        setNewStreamName('');
        fetchBaselineData();
      } else {
        showToast(parseErrorMessage(data, 'Failed to create stream'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const loadStreamDetails = async (id) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/streams/${id}`);
      if (res.ok) {
        const details = await res.json();
        setStreamDetails(details);
        setSelectedStream(id);
        setStreamReport(null);
        setLeaderboardSubjectId('');
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to load stream details'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadStreamReport = async (id, subId = '') => {
    setLoading(true);
    try {
      const url = subId
        ? `${API_BASE}/reports/stream/${id}?subjectId=${subId}`
        : `${API_BASE}/reports/stream/${id}`;
      const res = await authFetch(url);
      if (res.ok) {
        setStreamReport(await res.json());
      } else {
        const errData = await res.json();
        showToast(parseErrorMessage(errData, 'Failed to load report'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    if (!assignSubjectId || !selectedStream) return;

    try {
      const res = await authFetch(`${API_BASE}/streams/${selectedStream}/subjects/${assignSubjectId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Subject assigned successfully!');
        setAssignSubjectId('');
        loadStreamDetails(selectedStream);
      } else {
        showToast(parseErrorMessage(data, 'Failed to assign subject'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleUnassignSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to unassign this subject? This might affect calculations.')) return;
    try {
      const res = await authFetch(`${API_BASE}/streams/${selectedStream}/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Subject unassigned successfully!');
        loadStreamDetails(selectedStream);
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to unassign subject'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleExportClassReport = async () => {
    const message = await exportClassPerformanceReport(streamReport, streamDetails, leaderboardSubjectId);
    showToast(message);
  };

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Manage Class Streams</h2>
      </div>

      <div className="card-grid">
        <div className="form-card">
          <h3 style={{ marginBottom: '1.25rem' }}>Create New Stream</h3>
          <form onSubmit={handleCreateStream}>
            <div className="form-group">
              <label className="form-label">Stream Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Form 1A"
                value={newStreamName}
                onChange={(e) => setNewStreamName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Stream</button>
          </form>
        </div>

        <div className="form-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Registered Streams</h3>
          {streams.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No streams created yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Stream Name</th>
                    <th>Stream ID</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map(s => (
                    <tr key={s.id} style={{ background: selectedStream === s.id ? '#E0E7FF' : 'transparent' }}>
                      <td><strong>{s.name}</strong></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.id}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-primary btn-small" onClick={() => loadStreamDetails(s.id)}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedStream && streamDetails && (
        <div className="form-card" style={{ marginTop: '2rem' }}>
          <div className="header-row" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Stream Details: {streamDetails.name}</h3>
            <div className="btn-group">
              <button type="button" className="btn btn-primary" onClick={() => loadStreamReport(selectedStream)}>
                📊 Process Leaderboard Report
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Assigned Subjects</h4>
              <form onSubmit={handleAssignSubject} className="btn-group" style={{ marginBottom: '1rem' }}>
                <select
                  className="form-input"
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  <option value="">-- Choose Subject to Assign --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">Assign</button>
              </form>

              {streamDetails.subjects.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No subjects assigned to this stream.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamDetails.subjects.map(sub => (
                        <tr key={sub.id}>
                          <td>{sub.name}</td>
                          <td><code>{sub.code}</code></td>
                          <td>
                            <button type="button" className="btn btn-danger btn-small" onClick={() => handleUnassignSubject(sub.id)}>Unassign</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ marginBottom: '1rem', color: 'var(--success-color)' }}>Enrolled Students ({streamDetails.students.length})</h4>
              {streamDetails.students.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No students enrolled in this stream.</p>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Reg Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamDetails.students.map(st => (
                        <tr key={st.id}>
                          <td><strong>{st.name}</strong></td>
                          <td><code>{st.regNumber}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {streamReport && (
        <div className="form-card" style={{ marginTop: '2rem', borderTop: '4px solid var(--primary-color)' }}>
          <div className="header-row" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Leaderboard: {streamReport.streamName} Stream</h3>
            <div className="btn-group">
              <button type="button" className="btn btn-secondary btn-small" onClick={handleExportClassReport}>
                📥 Download Class PDF Report
              </button>
            </div>
          </div>
          <div className="header-row" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Averages are calculated as: <strong>Total Marks / Number of Stream-assigned subjects ({streamDetails?.subjects?.length ?? 0})</strong>.
            </p>
            <div className="btn-group">
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: '500', display: 'flex', alignItems: 'center' }}>Rank By:</label>
              <select
                className="form-input"
                style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', width: 'auto', margin: 0, height: '38px', borderRadius: '4px' }}
                value={leaderboardSubjectId}
                onChange={(e) => {
                  const subId = e.target.value;
                  setLeaderboardSubjectId(subId);
                  loadStreamReport(selectedStream, subId);
                }}
              >
                <option value="">-- Overall Class Performance --</option>
                {streamDetails?.subjects?.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Student Name</th>
                  <th>Reg Number</th>
                  <th>Total Score</th>
                  <th>Avg Score</th>
                  <th>Grade</th>
                  <th>Subject Breakdown (Score / Rank)</th>
                </tr>
              </thead>
              <tbody>
                {streamReport.leaderboard.map(st => (
                  <tr key={st.studentId}>
                    <td>
                      <span className={`rank-badge rank-${rankBadgeClass(st.overallPosition)}`}>
                        {formatRank(st.overallPosition)}
                      </span>
                    </td>
                    <td><strong>{st.studentName}</strong></td>
                    <td><code>{st.regNumber}</code></td>
                    <td><strong>{st.totalMarks}</strong></td>
                    <td>{st.averageScore}</td>
                    <td>
                      <span className={`badge-grade badge-${st.grade.toLowerCase()}`}>{st.grade}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div className="btn-group" style={{ justifyContent: 'flex-start' }}>
                        {st.subjectScores.map(ss => (
                          <span key={ss.subjectId} style={{ background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
                            <strong>{ss.subjectCode}</strong>: {ss.totalScore} ({formatRank(ss.subjectPosition)})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
