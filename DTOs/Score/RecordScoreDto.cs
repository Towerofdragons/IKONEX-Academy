using System;
using System.ComponentModel.DataAnnotations;

namespace IKONEX_Academy.DTOs.Score
{
    public class RecordScoreDto
    {
        [Required(ErrorMessage = "Student ID is required")]
        public Guid StudentId { get; set; }

        [Required(ErrorMessage = "Subject ID is required")]
        public Guid SubjectId { get; set; }

        [Range(0, 70, ErrorMessage = "Exam score must be between 0 and 70")]
        public double ExamScore { get; set; }

        [Range(0, 30, ErrorMessage = "CA score must be between 0 and 30")]
        public double CAScore { get; set; }
    }
}
