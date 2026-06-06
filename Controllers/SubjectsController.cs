using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.DTOs.Subject;

using Microsoft.AspNetCore.Authorization;
using Serilog;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubjectsController : ControllerBase
    {
        private readonly IkonexDbContext _context;

        public SubjectsController(IkonexDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
        {
            // check if subject with this name or code already exists with anyasync
            if (await _context.Subjects.AnyAsync(s => s.Name.ToLower() == dto.Name.ToLower()))
            {
                return BadRequest(new { error = "Subject with this name already exists" });
            }

            if (await _context.Subjects.AnyAsync(s => s.Code.ToLower() == dto.Code.ToLower()))
            {
                return BadRequest(new { error = "Subject with this code already exists" });
            }

            var subject = new Subject
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code
            };

            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Created subject '{subject.Name}' ({subject.Code})",
                EntityId = subject.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' created subject '{SubjectName}' ({SubjectCode}, Id: {SubjectId})", adminUsername, subject.Name, subject.Code, subject.Id);

            var result = new SubjectDto
            {
                Id = subject.Id,
                Name = subject.Name,
                Code = subject.Code
            };

            return CreatedAtRoute(null, new { id = subject.Id }, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSubjects()
        {
            // retrieve all subjects and order by name
            // 
            var subjects = await _context.Subjects
                .OrderBy(s => s.Name)
                .Select(s => new SubjectDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code
                })
                .ToListAsync();

            return Ok(subjects);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditSubject(Guid id, [FromBody] UpdateSubjectDto dto)
        {
            // check if subject with this name or code already exists
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null)
            {
                return NotFound(new { error = "Subject not found" });
            }

            if (await _context.Subjects.AnyAsync(s => s.Id != id && s.Name.ToLower() == dto.Name.ToLower()))
            {
                return BadRequest(new { error = "Subject with this name already exists" });
            }

            if (await _context.Subjects.AnyAsync(s => s.Id != id && s.Code.ToLower() == dto.Code.ToLower()))
            {
                return BadRequest(new { error = "Subject with this code already exists" });
            }

            subject.Name = dto.Name;
            subject.Code = dto.Code;

            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Updated subject '{subject.Name}' ({subject.Code})",
                EntityId = subject.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' updated subject '{SubjectName}' ({SubjectCode}, Id: {SubjectId})", adminUsername, subject.Name, subject.Code, subject.Id);

            var result = new SubjectDto
            {
                Id = subject.Id,
                Name = subject.Name,
                Code = subject.Code
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubject(Guid id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null)
            {
                return NotFound(new { error = "Subject not found" });
            }

            _context.Subjects.Remove(subject);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Deleted subject '{subject.Name}' ({subject.Code})",
                EntityId = subject.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' deleted subject '{SubjectName}' ({SubjectCode}, Id: {SubjectId})", adminUsername, subject.Name, subject.Code, subject.Id);

            return NoContent();
        }

        [HttpPost("/api/streams/{streamId}/subjects/{subjectId}")]
        public async Task<IActionResult> AssignSubjectToStream(Guid streamId, Guid subjectId)
        {
            // check if stream and subject exists
            var streamExists = await _context.Streams.AnyAsync(s => s.Id == streamId);
            if (!streamExists)
            {
                return NotFound(new { error = "Stream not found" });
            }

            var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == subjectId);
            if (!subjectExists)
            {
                return NotFound(new { error = "Subject not found" });
            }
            // check if subject is already assigned to this stream
            var streamSubjectExists = await _context.StreamSubjects
                .AnyAsync(ss => ss.StreamId == streamId && ss.SubjectId == subjectId);

            if (streamSubjectExists)
            {
                return BadRequest(new { error = "Subject is already assigned to this stream" });
            }

            var streamSubject = new StreamSubject
            {
                StreamId = streamId,
                SubjectId = subjectId
            };

            // add to database
            _context.StreamSubjects.Add(streamSubject);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Assigned subject ID '{subjectId}' to stream ID '{streamId}'",
                EntityId = $"{streamId}_{subjectId}",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' assigned subject '{SubjectId}' to stream '{StreamId}'", adminUsername, subjectId, streamId);

            return Ok(new { message = "Subject assigned to stream successfully" });
        }

        [HttpDelete("/api/streams/{streamId}/subjects/{subjectId}")]
        public async Task<IActionResult> UnassignSubjectFromStream(Guid streamId, Guid subjectId)
        {
            var streamSubject = await _context.StreamSubjects
                .FirstOrDefaultAsync(ss => ss.StreamId == streamId && ss.SubjectId == subjectId);

            if (streamSubject == null)
            {
                return NotFound(new { error = "Subject is not assigned to this stream" });
            }

            _context.StreamSubjects.Remove(streamSubject);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Unassigned subject ID '{subjectId}' from stream ID '{streamId}'",
                EntityId = $"{streamId}_{subjectId}",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' unassigned subject '{SubjectId}' from stream '{StreamId}'", adminUsername, subjectId, streamId);

            return NoContent();
        }
    }
}
