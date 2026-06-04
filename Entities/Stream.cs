using System;
using System.Collections.Generic;

namespace IKONEX_Academy.Entities
{
    public class Stream
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }

        // Navigation Properties
        public ICollection<Student> Students { get; set; } = new List<Student>();
        public ICollection<StreamSubject> StreamSubjects { get; set; } = new List<StreamSubject>();
    }
}
