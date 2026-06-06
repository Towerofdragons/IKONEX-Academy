import { useApp } from '../hooks/useApp';

export default function DashboardPage() {
  const { streams, students, subjects, fetchBaselineData } = useApp();

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Operational Dashboard</h2>
        <button type="button" className="btn btn-secondary" onClick={fetchBaselineData}>Refresh Stats</button>
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
  );
}
