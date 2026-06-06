using System;

namespace IKONEX_Academy.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        public required string AdminUsername { get; set; }
        public required string Action { get; set; }
        public string? EntityId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
