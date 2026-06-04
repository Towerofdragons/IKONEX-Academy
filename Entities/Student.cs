using System;
using System.Collections.Generic;

namespace IKONEX_Academy.Entities
{
    public class Student
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string RegNumber { get; set; }
        public Guid StreamId { get; set; }

        // Navigation Properties
        public Stream? Stream { get; set; }
        public ICollection<Score> Scores { get; set; } = new List<Score>();
    }
}
