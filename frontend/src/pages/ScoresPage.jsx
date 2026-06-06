import { useState } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { parseErrorMessage } from '../utils/errors';

const EMPTY_SCORE_FORM = { studentId: '', subjectId: '', examScore: '', caScore: '', id: null };

export default function ScoresPage() {
  const { authFetch } = useAuth();
  const { students, subjects, fetchBaselineData, setLoading, showToast } = useApp();
  const [scoreForm, setScoreForm] = useState(EMPTY_SCORE_FORM);
  const [selectedStudentScores, setSelectedStudentScores] = useState(null);

  const handleLoadStudentScores = async (studentId) => {
    if (!studentId) {
      setSelectedStudentScores(null);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/students/${studentId}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedStudentScores(detail);
        setScoreForm(prev => ({ ...prev, studentId }));
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!scoreForm.id;
    const url = isEdit ? `${API_BASE}/scores/${scoreForm.id}` : `${API_BASE}/scores`;
    const method = isEdit ? 'PUT' : 'POST';

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

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Score card updated successfully!' : 'Score recorded successfully!');
        const currentStudentId = scoreForm.studentId;
        setScoreForm(EMPTY_SCORE_FORM);
        fetchBaselineData();
        if (currentStudentId) {
          handleLoadStudentScores(currentStudentId);
        }
      } else {
        showToast(parseErrorMessage(data, 'Failed to record score'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Student Scoring Deck</h2>
      </div>

      <div className="card-grid">
        <div className="form-card">
          <h3>{scoreForm.id ? 'Edit Assessment Score' : 'Record Assessment Score'}</h3>
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
                disabled={!!scoreForm.id}
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
                disabled={!!scoreForm.id}
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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {scoreForm.id ? 'Update Score' : 'Submit Score'}
              </button>
              {scoreForm.id && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setScoreForm({ studentId: scoreForm.studentId, subjectId: '', examScore: '', caScore: '', id: null })}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {selectedStudentScores && (
          <div className="form-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Recorded Scores for {selectedStudentScores.name}</h3>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => handleLoadStudentScores(selectedStudentScores.id)}>Refresh</button>
            </div>
            {selectedStudentScores.scores.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No scores recorded for this student yet.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>CA (30)</th>
                      <th>Exam (70)</th>
                      <th>Total (100)</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentScores.scores.map(sc => (
                      <tr key={sc.id}>
                        <td><strong>{sc.subjectName}</strong></td>
                        <td><code>{sc.subjectCode}</code></td>
                        <td>{sc.caScore}</td>
                        <td>{sc.examScore}</td>
                        <td><strong>{sc.totalScore}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => {
                              setScoreForm({
                                id: sc.id,
                                studentId: sc.studentId,
                                subjectId: sc.subjectId,
                                caScore: sc.caScore.toString(),
                                examScore: sc.examScore.toString(),
                              });
                              showToast(`Loaded score for ${sc.subjectName} to edit.`);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
                      <button type="button" className="btn btn-primary btn-small" onClick={() => handleLoadStudentScores(st.id)}>
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
  );
}
