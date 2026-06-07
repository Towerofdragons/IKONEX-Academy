import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { parseErrorMessage } from '../utils/errors';
import StudentProfileModal from '../components/StudentProfileModal';

const EMPTY_STUDENT_FORM = { name: '', regNumber: '', streamId: '', id: null };

export default function StudentsPage() {
  useEffect(() => {
    document.title = 'Students - IKONEX Academy';
  }, []);
  const { authFetch } = useAuth();
  const { streams, students, fetchBaselineData, setLoading, showToast } = useApp();
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT_FORM);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!studentForm.id;
    const url = isEdit ? `${API_BASE}/students/${studentForm.id}` : `${API_BASE}/students`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentForm.name,
          regNumber: studentForm.regNumber,
          streamId: studentForm.streamId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Student updated successfully!' : 'Student registered successfully!');
        setStudentForm(EMPTY_STUDENT_FORM);
        fetchBaselineData();
      } else {
        showToast(parseErrorMessage(data, 'Failed to submit student form'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleStudentDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student record? This deletes all associated scores.')) return;
    try {
      const res = await authFetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Student record deleted successfully.');
        fetchBaselineData();
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to delete student.'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleViewStudentProfile = async (studentId) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/students/${studentId}`);
      if (res.ok) {
        const detail = await res.json();
        let reportData = null;
        if (detail.streamId) {
          try {
            const repRes = await authFetch(`${API_BASE}/reports/stream/${detail.streamId}`);
            if (repRes.ok) {
              reportData = await repRes.json();
            }
          } catch (e) {
            console.error('Failed to load stream leaderboard report for profile', e);
          }
        }
        setSelectedStudentDetail({ detail, reportData });
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to fetch student details'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Students</h2>
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
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {studentForm.id ? 'Save Updates' : 'Register Student'}
              </button>
              {studentForm.id && (
                <button type="button" className="btn btn-secondary" onClick={() => setStudentForm(EMPTY_STUDENT_FORM)}>
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
                  <th>Stream</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const stream = streams.find(s => s.id === st.streamId);
                  return (
                    <tr key={st.id}>
                      <td><strong>{st.name}</strong></td>
                      <td><code>{st.regNumber}</code></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{stream ? stream.name : st.streamId}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-small"
                            onClick={() => handleViewStudentProfile(st.id)}
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => setStudentForm({ name: st.name, regNumber: st.regNumber, streamId: st.streamId, id: st.id })}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-small" onClick={() => handleStudentDelete(st.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StudentProfileModal
        studentDetail={selectedStudentDetail}
        onClose={() => setSelectedStudentDetail(null)}
      />
    </div>
  );
}
