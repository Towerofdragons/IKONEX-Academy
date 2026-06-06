import { useState } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { parseErrorMessage } from '../utils/errors';

const EMPTY_SUBJECT_FORM = { name: '', code: '', id: null };

export default function SubjectsPage() {
  const { authFetch } = useAuth();
  const { subjects, fetchBaselineData, showToast } = useApp();
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT_FORM);

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!subjectForm.id;
    const url = isEdit ? `${API_BASE}/subjects/${subjectForm.id}` : `${API_BASE}/subjects`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subjectForm.name, code: subjectForm.code }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Subject details updated!' : 'Subject created successfully!');
        setSubjectForm(EMPTY_SUBJECT_FORM);
        fetchBaselineData();
      } else {
        showToast(parseErrorMessage(data, 'Failed to submit subject form'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleSubjectDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject? It will be removed from all streams and score cards.')) return;
    try {
      const res = await authFetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Subject deleted successfully.');
        fetchBaselineData();
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to delete subject.'), 'danger');
      }
    } catch {
      showToast('API Connection Error', 'danger');
    }
  };

  return (
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
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {subjectForm.id ? 'Save Updates' : 'Create Subject'}
              </button>
              {subjectForm.id && (
                <button type="button" className="btn btn-secondary" onClick={() => setSubjectForm(EMPTY_SUBJECT_FORM)}>
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
                      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setSubjectForm({ name: sub.name, code: sub.code, id: sub.id })}
                        >
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-small" onClick={() => handleSubjectDelete(sub.id)}>Delete</button>
                      </div>
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
