using System;

namespace IKONEX_Academy.Entities
{
    public class Score
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public Student? Student { get; set; }

        public Guid SubjectId { get; set; }
        public Subject? Subject { get; set; }

        public double ExamScore { get; set; }
        public double CAScore { get; set; }
        public double TotalScore { get; set; }
    }
}
