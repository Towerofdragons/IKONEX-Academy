using System;

namespace IKONEX_Academy.DTOs.Student
{
    public class StudentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegNumber { get; set; } = string.Empty;
        public Guid StreamId { get; set; }
    }
}
