using System;
using System.Collections.Generic;

namespace IKONEX_Academy.Entities
{
    public class Subject
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Code { get; set; }

        // Navigation Properties
        public ICollection<StreamSubject> StreamSubjects { get; set; } = new List<StreamSubject>();
        public ICollection<Score> Scores { get; set; } = new List<Score>();
    }
}
