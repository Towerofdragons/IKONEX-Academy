using System;

namespace IKONEX_Academy.DTOs.Score
{
    public class ScoreDto
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public double ExamScore { get; set; }
        public double CAScore { get; set; }
        public double TotalScore { get; set; }
    }
}
