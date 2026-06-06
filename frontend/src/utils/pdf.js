import { formatRank } from './formatters';

export async function exportStudentReportCard(studentDetail) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const detail = studentDetail.detail;
  const studentReport = studentDetail.reportData?.leaderboard?.find(l => l.studentId === detail.id);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text('IKONEX ACADEMY', 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('Student Term Report Card', 105, 27, { align: 'center' });

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1);
  doc.line(15, 32, 195, 32);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT PROFILE', 15, 42);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Name: ${detail.name}`, 15, 49);
  doc.text(`Reg Number: ${detail.regNumber}`, 15, 55);
  doc.text(`Class Stream: ${detail.streamName}`, 15, 61);

  const statBoxX = 130;
  const statBoxY = 38;
  doc.setFillColor(248, 250, 252);
  doc.rect(statBoxX, statBoxY, 65, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(statBoxX, statBoxY, 65, 28, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ACADEMIC SUMMARY', statBoxX + 5, statBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  if (studentReport) {
    doc.text(`Class Rank: ${studentReport.overallPosition}`, statBoxX + 5, statBoxY + 13);
    doc.text(`Average score: ${studentReport.averageScore}%`, statBoxX + 5, statBoxY + 19);
    doc.text(`Final Grade: ${studentReport.grade}`, statBoxX + 5, statBoxY + 25);
  } else {
    doc.text('Rank: N/A', statBoxX + 5, statBoxY + 13);
    doc.text('Average: N/A', statBoxX + 5, statBoxY + 19);
    doc.text('Grade: N/A', statBoxX + 5, statBoxY + 25);
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SUBJECT SCORE SHEETS', 15, 75);

  const tableHeaders = [['Subject Name', 'Code', 'CA (30)', 'Exam (70)', 'Total (100)', 'Subject Position']];
  const tableRows = studentReport && studentReport.subjectScores.length > 0
    ? studentReport.subjectScores.map(ss => [
        ss.subjectName,
        ss.subjectCode,
        ss.caScore,
        ss.examScore,
        ss.totalScore,
        formatRank(ss.subjectPosition),
      ])
    : detail.scores && detail.scores.length > 0
      ? detail.scores.map(sc => [
          sc.subjectName,
          sc.subjectCode,
          sc.caScore,
          sc.examScore,
          sc.totalScore,
          'N/A',
        ])
      : [['No score records found', '', '', '', '', '']];

  autoTable(doc, {
    startY: 80,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, finalY, 75, finalY);
  doc.line(135, finalY, 195, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Class Teacher Signature', 45, finalY + 5, { align: 'center' });
  doc.text('Principal Signature', 165, finalY + 5, { align: 'center' });

  doc.save(`${detail.name.replace(/\s+/g, '_')}_ReportCard.pdf`);
  return `PDF Report Card generated for ${detail.name}!`;
}

export async function exportClassPerformanceReport(streamReport, streamDetails, leaderboardSubjectId) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text('IKONEX ACADEMY', 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Class Performance Report Summary: ${streamReport.streamName} Stream`, 105, 27, { align: 'center' });

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(15, 32, 195, 32);

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Students: ${streamReport.totalStudents}`, 15, 40);
  doc.text(`Assigned Stream Subjects: ${streamDetails?.subjects?.length ?? 0}`, 15, 46);

  const filterText = leaderboardSubjectId
    ? `Ranking Filter: ${streamDetails?.subjects?.find(s => s.id === leaderboardSubjectId)?.name} Only`
    : 'Ranking Filter: Overall Performance (Sum of Stream Subjects)';
  doc.text(filterText, 15, 52);

  const tableHeaders = [['Rank', 'Student Name', 'Reg Number', 'Total Marks', 'Avg Score', 'Grade']];
  const tableRows = streamReport.leaderboard.map(st => [
    formatRank(st.overallPosition),
    st.studentName,
    st.regNumber,
    st.totalMarks,
    `${st.averageScore}%`,
    st.grade,
  ]);

  autoTable(doc, {
    startY: 58,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Report Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} - Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  doc.save(`${streamReport.streamName.replace(/\s+/g, '_')}_PerformanceReport.pdf`);
  return 'Class Performance PDF generated!';
}
