using System;

namespace IKONEX_Academy.Entities
{
    public class StreamSubject
    {
        public Guid StreamId { get; set; }
        public Stream? Stream { get; set; }

        public Guid SubjectId { get; set; }
        public Subject? Subject { get; set; }
    }
}
