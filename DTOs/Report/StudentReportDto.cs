using System;
using System.Collections.Generic;

namespace IKONEX_Academy.DTOs.Report
{
    public class StudentReportDto
    {
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string RegNumber { get; set; } = string.Empty;
        public double TotalMarks { get; set; }
        public double AverageScore { get; set; }
        public string Grade { get; set; } = string.Empty;
        public int OverallPosition { get; set; }
        public List<SubjectReportScoreDto> SubjectScores { get; set; } = new();
    }

    public class SubjectReportScoreDto
    {
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public double ExamScore { get; set; }
        public double CAScore { get; set; }
        public double TotalScore { get; set; }
        public int SubjectPosition { get; set; }
    }
}
