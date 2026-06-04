using System;
using System.Collections.Generic;

namespace IKONEX_Academy.DTOs.Report
{
    public class StreamReportDto
    {
        public Guid StreamId { get; set; }
        public string StreamName { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public List<StudentReportDto> Leaderboard { get; set; } = new();
    }
}
