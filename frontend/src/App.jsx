import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5178/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [streams, setStreams] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Security state
  const [token, setToken] = useState(localStorage.getItem('ikonex_admin_token') || '');
  const [adminUser, setAdminUser] = useState(localStorage.getItem('ikonex_admin_username') || '');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [inviteForm, setInviteForm] = useState({ username: '', password: '' });

  // Selection / Detail states
  const [selectedStream, setSelectedStream] = useState(null);
  const [streamDetails, setStreamDetails] = useState(null);
  const [streamReport, setStreamReport] = useState(null);
  const [leaderboardSubjectId, setLeaderboardSubjectId] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [selectedStudentScores, setSelectedStudentScores] = useState(null);

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

  // Authenticated fetch wrapper
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  // Load baseline data on startup / authentication
  useEffect(() => {
    if (token) {
      fetchBaselineData();
    }
  }, [token]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const parseErrorMessage = (data, defaultMsg = 'An error occurred') => {
    if (!data) return defaultMsg;
    if (data.error) return data.error;
    if (data.errors) {
      const messages = [];
      for (const key in data.errors) {
        if (Array.isArray(data.errors[key])) {
          messages.push(...data.errors[key]);
        } else {
          messages.push(data.errors[key]);
        }
      }
      if (messages.length > 0) return messages.join(', ');
    }
    if (data.title) return data.title;
    return defaultMsg;
  };

  const fetchBaselineData = async () => {
    setLoading(true);
    try {
      const sRes = await authFetch(`${API_BASE}/streams`);
      const stRes = await authFetch(`${API_BASE}/students`);
      const subRes = await authFetch(`${API_BASE}/subjects`);

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
  // SECURITY & SESSION ACTIONS
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setAdminUser(data.username);
        localStorage.setItem('ikonex_admin_token', data.token);
        localStorage.setItem('ikonex_admin_username', data.username);
        showToast(`Welcome back, ${data.username}!`);
      } else {
        showToast(parseErrorMessage(data, 'Invalid credentials'), 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setAdminUser('');
    localStorage.removeItem('ikonex_admin_token');
    localStorage.removeItem('ikonex_admin_username');
    showToast('Logged out successfully.');
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!inviteForm.username.trim() || !inviteForm.password) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Admin account "${data.username}" successfully registered!`);
        setInviteForm({ username: '', password: '' });
      } else {
        showToast(parseErrorMessage(data, 'Failed to register admin'), 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
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
      const res = await authFetch(`${API_BASE}/streams`, {
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
        showToast(parseErrorMessage(data, 'Failed to create stream'), 'danger');
      }
    } catch (err) {
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
        setStreamReport(null); // Reset report when changing stream details
        setLeaderboardSubjectId(''); // Reset subject filter when changing stream details
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to load stream details'), 'danger');
      }
    } catch (err) {
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
        const report = await res.json();
        setStreamReport(report);
      } else {
        const errData = await res.json();
        showToast(parseErrorMessage(errData, 'Failed to load report'), 'danger');
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
      const res = await authFetch(`${API_BASE}/streams/${selectedStream}/subjects/${assignSubjectId}`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Subject assigned successfully!');
        setAssignSubjectId('');
        loadStreamDetails(selectedStream);
      } else {
        showToast(parseErrorMessage(data, 'Failed to assign subject'), 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  const handleUnassignSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to unassign this subject? This might affect calculations.')) return;
    try {
      const res = await authFetch(`${API_BASE}/streams/${selectedStream}/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Subject unassigned successfully!');
        loadStreamDetails(selectedStream);
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to unassign subject'), 'danger');
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
      const res = await authFetch(url, {
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
        showToast(parseErrorMessage(data, 'Failed to submit student form'), 'danger');
      }
    } catch (err) {
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
      const res = await authFetch(url, {
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
        showToast(parseErrorMessage(data, 'Failed to submit subject form'), 'danger');
      }
    } catch (err) {
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

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Score card updated successfully!' : 'Score recorded successfully!');
        const currentStudentId = scoreForm.studentId;
        setScoreForm({ studentId: '', subjectId: '', examScore: '', caScore: '', id: null });
        fetchBaselineData();
        if (currentStudentId) {
          handleLoadStudentScores(currentStudentId);
        }
      } else {
        showToast(parseErrorMessage(data, 'Failed to record score'), 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    }
  };

  // Helper to load student details for score editing
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
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
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
            console.error("Failed to load stream leaderboard report for profile", e);
          }
        }
        setSelectedStudentDetail({ detail, reportData });
      } else {
        const data = await res.json();
        showToast(parseErrorMessage(data, 'Failed to fetch student details'), 'danger');
      }
    } catch (err) {
      showToast('API Connection Error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const exportStudentReportCard = async (studentDetail) => {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const detail = studentDetail.detail;
    const studentReport = studentDetail.reportData?.leaderboard?.find(l => l.studentId === detail.id);

    // Document header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Primary color (#6366f1)
    doc.text("IKONEX ACADEMY", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("Student Term Report Card", 105, 27, { align: "center" });

    // Header divider line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(15, 32, 195, 32);

    // Student Info
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT PROFILE", 15, 42);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Name: ${detail.name}`, 15, 49);
    doc.text(`Reg Number: ${detail.regNumber}`, 15, 55);
    doc.text(`Class Stream: ${detail.streamName}`, 15, 61);

    // Ranks and stats box
    const statBoxX = 130;
    const statBoxY = 38;
    doc.setFillColor(248, 250, 252);
    doc.rect(statBoxX, statBoxY, 65, 28, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(statBoxX, statBoxY, 65, 28, "S");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("ACADEMIC SUMMARY", statBoxX + 5, statBoxY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    if (studentReport) {
      doc.text(`Class Rank: ${studentReport.overallPosition}`, statBoxX + 5, statBoxY + 13);
      doc.text(`Average score: ${studentReport.averageScore}%`, statBoxX + 5, statBoxY + 19);
      doc.text(`Final Grade: ${studentReport.grade}`, statBoxX + 5, statBoxY + 25);
    } else {
      doc.text("Rank: N/A", statBoxX + 5, statBoxY + 13);
      doc.text("Average: N/A", statBoxX + 5, statBoxY + 19);
      doc.text("Grade: N/A", statBoxX + 5, statBoxY + 25);
    }

    // Score Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("SUBJECT SCORE SHEETS", 15, 75);

    // Build table rows
    const tableHeaders = [["Subject Name", "Code", "CA (30)", "Exam (70)", "Total (100)", "Subject Position"]];
    let tableRows = [];

    if (studentReport && studentReport.subjectScores.length > 0) {
      tableRows = studentReport.subjectScores.map(ss => [
        ss.subjectName,
        ss.subjectCode,
        ss.caScore,
        ss.examScore,
        ss.totalScore,
        ss.subjectPosition === 0 ? "N/A" : ss.subjectPosition === 1 ? "1st" : ss.subjectPosition === 2 ? "2nd" : ss.subjectPosition === 3 ? "3rd" : `${ss.subjectPosition}th`
      ]);
    } else if (detail.scores && detail.scores.length > 0) {
      tableRows = detail.scores.map(sc => [
        sc.subjectName,
        sc.subjectCode,
        sc.caScore,
        sc.examScore,
        sc.totalScore,
        "N/A"
      ]);
    } else {
      tableRows = [["No score records found", "", "", "", "", ""]];
    }

    autoTable(doc, {
      startY: 80,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 }
      }
    });

    // Signature Area
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, finalY, 75, finalY);
    doc.line(135, finalY, 195, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Class Teacher Signature", 45, finalY + 5, { align: "center" });
    doc.text("Principal Signature", 165, finalY + 5, { align: "center" });

    // Download PDF
    doc.save(`${detail.name.replace(/\s+/g, '_')}_ReportCard.pdf`);
    showToast(`PDF Report Card generated for ${detail.name}!`);
  };

  const exportClassPerformanceReport = async (streamReport, streamDetails) => {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    // Document header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Success color (#10b981)
    doc.text("IKONEX ACADEMY", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Class Performance Report Summary: ${streamReport.streamName} Stream`, 105, 27, { align: "center" });

    // Header divider line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(15, 32, 195, 32);

    // Meta details
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Students: ${streamReport.totalStudents}`, 15, 40);
    doc.text(`Assigned Stream Subjects: ${streamDetails?.subjects?.length ?? 0}`, 15, 46);

    const filterText = leaderboardSubjectId
      ? `Ranking Filter: ${streamDetails?.subjects?.find(s => s.id === leaderboardSubjectId)?.name} Only`
      : "Ranking Filter: Overall Performance (Sum of Stream Subjects)";
    doc.text(filterText, 15, 52);

    // Table Headers and Rows
    const tableHeaders = [["Rank", "Student Name", "Reg Number", "Total Marks", "Avg Score", "Grade"]];
    const tableRows = streamReport.leaderboard.map(st => [
      st.overallPosition === 1 ? "1st" : st.overallPosition === 2 ? "2nd" : st.overallPosition === 3 ? "3rd" : `${st.overallPosition}th`,
      st.studentName,
      st.regNumber,
      st.totalMarks,
      `${st.averageScore}%`,
      st.grade
    ]);

    autoTable(doc, {
      startY: 58,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      }
    });

    // Page footer / timestamp
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Report Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} - Page ${i} of ${pageCount}`, 105, 287, { align: "center" });
    }

    doc.save(`${streamReport.streamName.replace(/\s+/g, '_')}_PerformanceReport.pdf`);
    showToast(`Class Performance PDF generated!`);
  };

  if (!token) {
    return (
      <div className="login-overlay">
        {toast && (
          <div className={`alert-popup alert-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        )}
        <div className="login-card">
          <div className="login-header">
            <div className="brand-logo" style={{ margin: '0 auto 1rem auto' }}>I</div>
            <h2 className="brand-name" style={{ textAlign: 'center', fontSize: '1.75rem', background: 'linear-gradient(to right, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700' }}>Ikonex SMS Admin</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>Sign in to access school administration</p>
          </div>
          <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter admin username" 
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter password" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '46px', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            <li>
              <div onClick={() => setActiveTab('admin')} className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}>
                <span>Admin Deck</span>
              </div>
            </li>
            <li style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div onClick={handleLogout} className="nav-item" style={{ color: 'var(--danger-color)' }}>
                <span>Logout ({adminUser})</span>
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
              Could not communicate with the backend at <strong>{API_BASE}</strong>. Ensure the ASP.NET Core API server is running at the configured endpoint and CORS is fully enabled.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Leaderboard: {streamReport.streamName} Stream</h3>
                  <button className="btn btn-secondary btn-small" onClick={() => exportClassPerformanceReport(streamReport, streamDetails)}>
                    📥 Download Class PDF Report
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Averages are calculated as: <strong>Total Marks / Number of Stream-assigned subjects ({streamDetails?.subjects?.length ?? 0})</strong>.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: '500' }}>Rank By:</label>
                    <select
                      className="form-input"
                      style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', width: 'auto', margin: 0, height: '38px', borderRadius: '6px' }}
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
                              className="btn btn-primary btn-small" 
                              style={{ marginRight: '0.5rem' }}
                              onClick={() => handleViewStudentProfile(st.id)}
                            >
                              Profile
                            </button>
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

              {/* Recorded scores for selected student */}
              {selectedStudentScores && (
                <div className="form-card" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3>Recorded Scores for {selectedStudentScores.name}</h3>
                    <button className="btn btn-secondary btn-small" onClick={() => handleLoadStudentScores(selectedStudentScores.id)}>Refresh</button>
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
                                  className="btn btn-secondary btn-small" 
                                  onClick={() => {
                                    setScoreForm({
                                      id: sc.id,
                                      studentId: sc.studentId,
                                      subjectId: sc.subjectId,
                                      caScore: sc.caScore.toString(),
                                      examScore: sc.examScore.toString()
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
                            <button className="btn btn-primary btn-small" onClick={() => handleLoadStudentScores(st.id)}>
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

        {/* ----------------- ADMIN TAB ----------------- */}
        {activeTab === 'admin' && (
          <div>
            <div className="header-row">
              <h2 className="page-title">Admin Management Deck</h2>
            </div>

            <div className="card-grid">
              <div className="form-card">
                <h3>Invite / Register New Admin</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                  Register a new administrative account. Only authorized administrators can perform this action.
                </p>
                <form onSubmit={handleInviteAdmin}>
                  <div className="form-group">
                    <label className="form-label">New Username</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter username" 
                      value={inviteForm.username}
                      onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Enter password" 
                      value={inviteForm.password}
                      onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Register Admin'}
                  </button>
                </form>
              </div>

              <div className="form-card" style={{ gridColumn: 'span 2' }}>
                <h3>Security & Auditing Guidelines</h3>
                <div style={{ marginTop: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  <p style={{ marginBottom: '1rem' }}>
                    Welcome to the administrative control panel. Please ensure all modifications conform to school policies.
                  </p>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <li>All write actions (creating, editing, and deleting streams, students, subjects, and scores) are logged to the database audit logs.</li>
                    <li>Audit logs map the administrator's name, action timestamp, entity ID, and type.</li>
                    <li>Avoid creating generic accounts. Each administrator must have their own unique credentials.</li>
                    <li>Always use strong passwords containing letters, numbers, and special characters.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Student Transcript Modal */}
      {selectedStudentDetail && (
        <div className="modal-overlay" onClick={() => setSelectedStudentDetail(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Student Profile & Transcript</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Ikonex Academy SMS</p>
              </div>
              <button className="btn btn-secondary btn-small" onClick={() => setSelectedStudentDetail(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: '0.35rem 0' }}><strong>Name:</strong> {selectedStudentDetail.detail.name}</p>
                <p style={{ margin: '0.35rem 0' }}><strong>Registration Number:</strong> <code>{selectedStudentDetail.detail.regNumber}</code></p>
                <p style={{ margin: '0.35rem 0' }}><strong>Class Stream:</strong> {selectedStudentDetail.detail.streamName}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {(() => {
                  const studentReport = selectedStudentDetail.reportData?.leaderboard?.find(l => l.studentId === selectedStudentDetail.detail.id);
                  if (studentReport) {
                    return (
                      <>
                        <p style={{ margin: '0.25rem 0' }}><strong>Overall Class Rank:</strong> <span className={`rank-badge rank-${studentReport.overallPosition === 1 ? '1st' : studentReport.overallPosition === 2 ? '2nd' : studentReport.overallPosition === 3 ? '3rd' : 'other'}`}>{studentReport.overallPosition === 1 ? '1st' : studentReport.overallPosition === 2 ? '2nd' : studentReport.overallPosition === 3 ? '3rd' : `${studentReport.overallPosition}th`}</span></p>
                        <p style={{ margin: '0.25rem 0' }}><strong>Average Score:</strong> {studentReport.averageScore}%</p>
                        <p style={{ margin: '0.25rem 0' }}><strong>Overall Grade:</strong> <span className={`badge-grade badge-${studentReport.grade.toLowerCase()}`}>{studentReport.grade}</span></p>
                      </>
                    );
                  } else {
                    return <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No overall ranking processed yet. Add scores and click "Process Leaderboard" in Stream Manager.</p>;
                  }
                })()}
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
                  {(() => {
                    const studentReport = selectedStudentDetail.reportData?.leaderboard?.find(l => l.studentId === selectedStudentDetail.detail.id);
                    if (studentReport && studentReport.subjectScores.length > 0) {
                      return studentReport.subjectScores.map(ss => (
                        <tr key={ss.subjectId}>
                          <td>{ss.subjectName}</td>
                          <td><code>{ss.subjectCode}</code></td>
                          <td>{ss.caScore}</td>
                          <td>{ss.examScore}</td>
                          <td><strong>{ss.totalScore}</strong></td>
                          <td>
                            <span className="rank-badge other" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)' }}>
                              {ss.subjectPosition === 0 ? 'N/A' : ss.subjectPosition === 1 ? '1st' : ss.subjectPosition === 2 ? '2nd' : ss.subjectPosition === 3 ? '3rd' : `${ss.subjectPosition}th`}
                            </span>
                          </td>
                        </tr>
                      ));
                    } else if (selectedStudentDetail.detail.scores && selectedStudentDetail.detail.scores.length > 0) {
                      return selectedStudentDetail.detail.scores.map(sc => (
                        <tr key={sc.id}>
                          <td>{sc.subjectName}</td>
                          <td><code>{sc.subjectCode}</code></td>
                          <td>{sc.caScore}</td>
                          <td>{sc.examScore}</td>
                          <td><strong>{sc.totalScore}</strong></td>
                          <td><span className="rank-badge other">N/A</span></td>
                        </tr>
                      ));
                    } else {
                      return (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No scores recorded yet.</td>
                        </tr>
                      );
                    }
                  })()}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => exportStudentReportCard(selectedStudentDetail)}>
                📥 Download PDF Report Card
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedStudentDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
