using System;
using System.Collections.Generic;
using IKONEX_Academy.DTOs.Score;

namespace IKONEX_Academy.DTOs.Student
{
    public class StudentDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegNumber { get; set; } = string.Empty;
        public Guid StreamId { get; set; }
        public string StreamName { get; set; } = string.Empty;
        public List<ScoreDto> Scores { get; set; } = new();
    }
}
