import { useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Building2, GraduationCap, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const { streams, students, subjects, fetchBaselineData } = useApp();

  useEffect(() => {
    document.title = 'Overview - IKONEX Academy';
  }, []);

  return (
    <div>
      <div className="header-row">
        <h2 className="page-title">Overview</h2>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary" onClick={fetchBaselineData}>Refresh Stats</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon"><Building2 size={20} /></div>
          <div className="stat-info">
            <h4>Class Streams</h4>
            <p>{streams.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><GraduationCap size={20} /></div>
          <div className="stat-info">
            <h4>Enrolled Students</h4>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BookOpen size={20} /></div>
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
