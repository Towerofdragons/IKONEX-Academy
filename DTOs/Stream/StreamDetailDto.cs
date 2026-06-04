using System;
using System.Collections.Generic;
using IKONEX_Academy.DTOs.Student;
using IKONEX_Academy.DTOs.Subject;

namespace IKONEX_Academy.DTOs.Stream
{
    public class StreamDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<StudentDto> Students { get; set; } = new();
        public List<SubjectDto> Subjects { get; set; } = new();
    }
}
