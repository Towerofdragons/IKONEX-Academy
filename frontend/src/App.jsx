import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5178/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [streams, setStreams] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Selection / Detail states
  const [selectedStream, setSelectedStream] = useState(null);
  const [streamDetails, setStreamDetails] = useState(null);
  const [streamReport, setStreamReport] = useState(null);

  // Form states
  const [newStreamName, setNewStreamName] = useState('');
  const [studentForm, setStudentForm] = useState({ name: '', regNumber: '', streamId: '', id: null });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', id: null });
  const [scoreForm, setScoreForm] = useState({ studentId: '', subjectId: '', examScore: '', caScore: '', id: null });
  const [assignSubjectId, setAssignSubjectId] = useState('');

  // UI feedback states
  const [toast, setToast] = useState(null);
  const [backendStatus, setBackendStatus] = useState(true); // check if API is alive
  const [loading, setLoading] = useState(false);

  // Load baseline data on startup
  useEffect(() => {
    fetchBaselineData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBaselineData = async () => {
    setLoading(true);
    try {
      const sRes = await fetch(`${API_BASE}/streams`);
      const stRes = await fetch(`${API_BASE}/students`);
      const subRes = await fetch(`${API_BASE}/subjects`);

      if (sRes.ok && stRes.ok && subRes.ok) {
        setStreams(await sRes.json());
        setStudents(await stRes.json());
        setSubjects(await subRes.json());
        setBackendStatus(true);
      } else {
        setBackendStatus(false);
      }
    } catch (err) {
      console.error("Failed to fetch from backend API", err);
      setBackendStatus(false);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // STREAM ACTIONS
  // ----------------------------------------------------
  const handleCreateStream = async (e) => {
    e.preventDefault();
    if (!newStreamName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStreamName })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Stream "${data.name}" created successfully!`);
        setNewStreamName('');
        fetchBaselineData();
      } else {
        showToast(data.error || 'Failed to create stream', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  const loadStreamDetails = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/streams/${id}`);
      if (res.ok) {
        const details = await res.json();
        setStreamDetails(details);
        setSelectedStream(id);
        setStreamReport(null); // Reset report when changing stream details
      } else {
        showToast('Failed to load stream details', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadStreamReport = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/stream/${id}`);
      if (res.ok) {
        const report = await res.json();
        setStreamReport(report);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to load report', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // SUBJECT ASSIGNMENTS
  // ----------------------------------------------------
  const handleAssignSubject = async (e) => {
    e.preventDefault();
    if (!assignSubjectId || !selectedStream) return;

    try {
      const res = await fetch(`${API_BASE}/streams/${selectedStream}/subjects/${assignSubjectId}`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Subject assigned successfully!');
        setAssignSubjectId('');
        loadStreamDetails(selectedStream);
      } else {
        showToast(data.error || 'Failed to assign subject', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleUnassignSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to unassign this subject? This might affect calculations.')) return;
    try {
      const res = await fetch(`${API_BASE}/streams/${selectedStream}/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Subject unassigned successfully!');
        loadStreamDetails(selectedStream);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to unassign subject', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  // ----------------------------------------------------
  // STUDENT ACTIONS
  // ----------------------------------------------------
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!studentForm.id;
    const url = isEdit ? `${API_BASE}/students/${studentForm.id}` : `${API_BASE}/students`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentForm.name,
          regNumber: studentForm.regNumber,
          streamId: studentForm.streamId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Student updated successfully!' : 'Student registered successfully!');
        setStudentForm({ name: '', regNumber: '', streamId: '', id: null });
        fetchBaselineData();
      } else {
        showToast(data.error || 'Failed to submit student form', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleStudentDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student record? This deletes all associated scores.')) return;
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Student record deleted successfully.');
        fetchBaselineData();
      } else {
        showToast('Failed to delete student.', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  // ----------------------------------------------------
  // SUBJECT ACTIONS
  // ----------------------------------------------------
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!subjectForm.id;
    const url = isEdit ? `${API_BASE}/subjects/${subjectForm.id}` : `${API_BASE}/subjects`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subjectForm.name,
          code: subjectForm.code
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Subject details updated!' : 'Subject created successfully!');
        setSubjectForm({ name: '', code: '', id: null });
        fetchBaselineData();
      } else {
        showToast(data.error || 'Failed to submit subject form', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleSubjectDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject? It will be removed from all streams and score cards.')) return;
    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Subject deleted successfully.');
        fetchBaselineData();
      } else {
        showToast('Failed to delete subject.', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  // ----------------------------------------------------
  // SCORE ACTIONS
  // ----------------------------------------------------
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!scoreForm.id;
    const url = isEdit ? `${API_BASE}/scores/${scoreForm.id}` : `${API_BASE}/scores`;
    const method = isEdit ? 'PUT' : 'POST';

    // UI Validations before sending
    const exam = parseFloat(scoreForm.examScore);
    const ca = parseFloat(scoreForm.caScore);
    if (exam > 70 || exam < 0) {
      showToast('Exam score must be between 0 and 70', 'danger');
      return;
    }
    if (ca > 30 || ca < 0) {
      showToast('CA score must be between 0 and 30', 'danger');
      return;
    }

    try {
      const payload = isEdit 
        ? { examScore: exam, caScore: ca }
        : { studentId: scoreForm.studentId, subjectId: scoreForm.subjectId, examScore: exam, caScore: ca };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Score card updated successfully!' : 'Score recorded successfully!');
        setScoreForm({ studentId: '', subjectId: '', examScore: '', caScore: '', id: null });
        fetchBaselineData();
      } else {
        showToast(data.error || 'Failed to record score', 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  // Helper to load student details for score editing
  const handleLoadStudentScores = async (studentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/${studentId}`);
      if (res.ok) {
        const detail = await res.json();
        // Just populate the form with student selection
        setScoreForm(prev => ({ ...prev, studentId }));
        showToast(`Loaded score entries for ${detail.name}.`);
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`alert-popup alert-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">I</div>
          <h1 className="brand-name">Ikonex Academy</h1>
        </div>
        <nav>
          <ul className="nav-links">
            <li>
              <div onClick={() => { setActiveTab('dashboard'); fetchBaselineData(); }} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <span>Dashboard</span>
              </div>
            </li>
            <li>
              <div onClick={() => setActiveTab('streams')} className={`nav-item ${activeTab === 'streams' ? 'active' : ''}`}>
                <span>Stream Manager</span>
              </div>
            </li>
            <li>
              <div onClick={() => setActiveTab('students')} className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}>
                <span>Student Roster</span>
              </div>
            </li>
            <li>
              <div onClick={() => setActiveTab('subjects')} className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}>
                <span>Subject Deck</span>
              </div>
            </li>
            <li>
              <div onClick={() => setActiveTab('scores')} className={`nav-item ${activeTab === 'scores' ? 'active' : ''}`}>
                <span>Scoring Board</span>
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {!backendStatus && (
          <div className="form-card" style={{ borderLeft: '4px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem' }}>API Connection Offline</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Could not communicate with the backend at <strong>{API_BASE}</strong>. Ensure the ASP.NET Core API server is running on port 5178 and CORS is fully enabled.
            </p>
          </div>
        )}

        {loading && <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '1rem' }}>Processing database request...</div>}

        {/* ----------------- DASHBOARD TAB ----------------- */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="header-row">
              <h2 className="page-title">Operational Dashboard</h2>
              <button className="btn btn-secondary" onClick={fetchBaselineData}>Refresh Stats</button>
            </div>
            
            <div className="card-grid">
              <div className="stat-card">
                <div className="stat-icon">🏫</div>
                <div className="stat-info">
                  <h4>Class Streams</h4>
                  <p>{streams.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎓</div>
                <div className="stat-info">
                  <h4>Enrolled Students</h4>
                  <p>{students.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h4>Total Subjects</h4>
                  <p>{subjects.length}</p>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3 style={{ marginBottom: '1rem' }}>Welcome to Ikonex Academy SMS Portal</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Use the side-deck navigation to configure school streams, enroll new students, configure syllabus subjects, and record continuous assessment and final exam score sheets. The system processes Leaderboards and grades automatically on demand.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- STREAMS TAB ----------------- */}
        {activeTab === 'streams' && (
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
                          <tr key={s.id} style={{ background: selectedStream === s.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
                            <td><strong>{s.name}</strong></td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.id}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn btn-primary btn-small" onClick={() => loadStreamDetails(s.id)}>Manage</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Stream Detail Section */}
            {selectedStream && streamDetails && (
              <div className="form-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Stream Details: {streamDetails.name}</h3>
                  <button className="btn btn-primary" onClick={() => loadStreamReport(selectedStream)}>
                    📊 Process Leaderboard Report
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Assigned Subjects</h4>
                    <form onSubmit={handleAssignSubject} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <select 
                        className="form-input" 
                        value={assignSubjectId}
                        onChange={(e) => setAssignSubjectId(e.target.value)}
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
                                  <button className="btn btn-danger btn-small" onClick={() => handleUnassignSubject(sub.id)}>Unassign</button>
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

            {/* Generated Leaderboard Report */}
            {streamReport && (
              <div className="form-card" style={{ marginTop: '2rem', borderTop: '4px solid var(--primary-color)' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Leaderboard: {streamReport.streamName} Stream</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Averages are calculated as: <strong>Total Marks / Number of Stream-assigned subjects ({streamDetails.subjects.length})</strong>.
                </p>

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
                            <span className={`rank-badge rank-${st.overallPosition === 1 ? '1st' : st.overallPosition === 2 ? '2nd' : st.overallPosition === 3 ? '3rd' : 'other'}`}>
                              {st.overallPosition === 1 ? '1st' : st.overallPosition === 2 ? '2nd' : st.overallPosition === 3 ? '3rd' : `${st.overallPosition}th`}
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {st.subjectScores.map(ss => (
                                <span key={ss.subjectId} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                  <strong>{ss.subjectCode}</strong>: {ss.totalScore} ({ss.subjectPosition === 1 ? '1st' : ss.subjectPosition === 0 ? 'N/A' : `${ss.subjectPosition}th`})
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
        )}

        {/* ----------------- STUDENTS TAB ----------------- */}
        {activeTab === 'students' && (
          <div>
            <div className="header-row">
              <h2 className="page-title">Student Registration & Roster</h2>
            </div>

            <div className="card-grid">
              <div className="form-card">
                <h3>{studentForm.id ? 'Edit Student Details' : 'Register New Student'}</h3>
                <form onSubmit={handleStudentSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. John Doe" 
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Number (Unique)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. REG-001" 
                      value={studentForm.regNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, regNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Stream</label>
                    <select 
                      className="form-input"
                      value={studentForm.streamId}
                      onChange={(e) => setStudentForm({ ...studentForm, streamId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Class Stream --</option>
                      {streams.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {studentForm.id ? 'Save Updates' : 'Register Student'}
                    </button>
                    {studentForm.id && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setStudentForm({ name: '', regNumber: '', streamId: '', id: null })}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="form-card" style={{ gridColumn: 'span 2' }}>
                <h3>Active Student Directory</h3>
                <div className="table-container" style={{ marginTop: '1.25rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Reg Number</th>
                        <th>Stream ID</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(st => (
                        <tr key={st.id}>
                          <td><strong>{st.name}</strong></td>
                          <td><code>{st.regNumber}</code></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{st.streamId}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary btn-small" 
                              style={{ marginRight: '0.5rem' }}
                              onClick={() => setStudentForm({ name: st.name, regNumber: st.regNumber, streamId: st.streamId, id: st.id })}
                            >
                              Edit
                            </button>
                            <button className="btn btn-danger btn-small" onClick={() => handleStudentDelete(st.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUBJECTS TAB ----------------- */}
        {activeTab === 'subjects' && (
          <div>
            <div className="header-row">
              <h2 className="page-title">Syllabus Subject Registry</h2>
            </div>

            <div className="card-grid">
              <div className="form-card">
                <h3>{subjectForm.id ? 'Edit Subject Details' : 'Create New Subject'}</h3>
                <form onSubmit={handleSubjectSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Mathematics" 
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Code (Unique)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. MATH101" 
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {subjectForm.id ? 'Save Updates' : 'Create Subject'}
                    </button>
                    {subjectForm.id && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setSubjectForm({ name: '', code: '', id: null })}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="form-card" style={{ gridColumn: 'span 2' }}>
                <h3>Registered Subjects</h3>
                <div className="table-container" style={{ marginTop: '1.25rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Subject Code</th>
                        <th>Subject ID</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id}>
                          <td><strong>{sub.name}</strong></td>
                          <td><code>{sub.code}</code></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sub.id}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary btn-small" 
                              style={{ marginRight: '0.5rem' }}
                              onClick={() => setSubjectForm({ name: sub.name, code: sub.code, id: sub.id })}
                            >
                              Edit
                            </button>
                            <button className="btn btn-danger btn-small" onClick={() => handleSubjectDelete(sub.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SCORES TAB ----------------- */}
        {activeTab === 'scores' && (
          <div>
            <div className="header-row">
              <h2 className="page-title">Student Scoring Deck</h2>
            </div>

            <div className="card-grid">
              <div className="form-card">
                <h3>Record Assessment Score</h3>
                <form onSubmit={handleScoreSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Select Student</label>
                    <select 
                      className="form-input"
                      value={scoreForm.studentId}
                      onChange={(e) => {
                        setScoreForm({ ...scoreForm, studentId: e.target.value });
                        if (e.target.value) handleLoadStudentScores(e.target.value);
                      }}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(st => (
                        <option key={st.id} value={st.id}>{st.name} ({st.regNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Subject</label>
                    <select 
                      className="form-input"
                      value={scoreForm.subjectId}
                      onChange={(e) => setScoreForm({ ...scoreForm, subjectId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CA Score (Max 30)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      placeholder="0.0 - 30.0" 
                      value={scoreForm.caScore}
                      onChange={(e) => setScoreForm({ ...scoreForm, caScore: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exam Score (Max 70)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="form-input" 
                      placeholder="0.0 - 70.0" 
                      value={scoreForm.examScore}
                      onChange={(e) => setScoreForm({ ...scoreForm, examScore: e.target.value })}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Score Card</button>
                </form>
              </div>

              <div className="form-card" style={{ gridColumn: 'span 2' }}>
                <h3>Quick Roster Selection</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Choose a student to view or record assessments. Database composite indexes enforce one score entry per subject.
                </p>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Reg Number</th>
                        <th>Enrollment ID</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(st => (
                        <tr key={st.id}>
                          <td><strong>{st.name}</strong></td>
                          <td><code>{st.regNumber}</code></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{st.id}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-primary btn-small" onClick={() => setScoreForm(prev => ({ ...prev, studentId: st.id }))}>
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
