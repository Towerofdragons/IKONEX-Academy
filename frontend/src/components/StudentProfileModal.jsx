import { formatRank, rankBadgeClass } from '../utils/formatters';
import { exportStudentReportCard } from '../utils/pdf';
import { useApp } from '../hooks/useApp';

export default function StudentProfileModal({ studentDetail, onClose }) {
  const { showToast } = useApp();

  if (!studentDetail) return null;

  const studentReport = studentDetail.reportData?.leaderboard?.find(
    l => l.studentId === studentDetail.detail.id
  );

  const handleExport = async () => {
    const message = await exportStudentReportCard(studentDetail);
    showToast(message);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Student Profile & Transcript</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Ikonex Academy SMS</p>
          </div>
          <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ margin: '0.35rem 0' }}><strong>Name:</strong> {studentDetail.detail.name}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Registration Number:</strong> <code>{studentDetail.detail.regNumber}</code></p>
            <p style={{ margin: '0.35rem 0' }}><strong>Class Stream:</strong> {studentDetail.detail.streamName}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {studentReport ? (
              <>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Overall Class Rank:</strong>{' '}
                  <span className={`rank-badge rank-${rankBadgeClass(studentReport.overallPosition)}`}>
                    {formatRank(studentReport.overallPosition)}
                  </span>
                </p>
                <p style={{ margin: '0.25rem 0' }}><strong>Average Score:</strong> {studentReport.averageScore}%</p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Overall Grade:</strong>{' '}
                  <span className={`badge-grade badge-${studentReport.grade.toLowerCase()}`}>{studentReport.grade}</span>
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No overall ranking processed yet. Add scores and click &quot;Process Leaderboard&quot; in Stream Manager.
              </p>
            )}
          </div>
        </div>

        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Subject-by-Subject Score Breakdown</h4>
        <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>CA (30)</th>
                <th>Exam (70)</th>
                <th>Total (100)</th>
                <th>Subject Rank</th>
              </tr>
            </thead>
            <tbody>
              {studentReport && studentReport.subjectScores.length > 0 ? (
                studentReport.subjectScores.map(ss => (
                  <tr key={ss.subjectId}>
                    <td>{ss.subjectName}</td>
                    <td><code>{ss.subjectCode}</code></td>
                    <td>{ss.caScore}</td>
                    <td>{ss.examScore}</td>
                    <td><strong>{ss.totalScore}</strong></td>
                    <td>
                      <span className="rank-badge other" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)' }}>
                        {formatRank(ss.subjectPosition)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : studentDetail.detail.scores?.length > 0 ? (
                studentDetail.detail.scores.map(sc => (
                  <tr key={sc.id}>
                    <td>{sc.subjectName}</td>
                    <td><code>{sc.subjectCode}</code></td>
                    <td>{sc.caScore}</td>
                    <td>{sc.examScore}</td>
                    <td><strong>{sc.totalScore}</strong></td>
                    <td><span className="rank-badge other">N/A</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No scores recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            📥 Download PDF Report Card
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
