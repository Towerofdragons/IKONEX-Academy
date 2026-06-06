using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.DTOs.Student;
using IKONEX_Academy.DTOs.Score;

using Microsoft.AspNetCore.Authorization;
using Serilog;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly IkonexDbContext _context;

        public StudentsController(IkonexDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
        {
            var streamExists = await _context.Streams.AnyAsync(s => s.Id == dto.StreamId);
            if (!streamExists)
            {
                return BadRequest(new { error = "Assigned Stream does not exist" });
            }

            if (await _context.Students.AnyAsync(s => s.RegNumber.ToLower() == dto.RegNumber.ToLower()))
            {
                return BadRequest(new { error = "Registration number already exists" });
            }

            var student = new Student
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                RegNumber = dto.RegNumber,
                StreamId = dto.StreamId
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Registered student '{student.Name}' with RegNumber '{student.RegNumber}'",
                EntityId = student.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' registered student '{StudentName}' (RegNumber: {RegNumber}, StudentId: {StudentId})", adminUsername, student.Name, student.RegNumber, student.Id);

            var result = new StudentDto
            {
                Id = student.Id,
                Name = student.Name,
                RegNumber = student.RegNumber,
                StreamId = student.StreamId
            };

            return CreatedAtAction(nameof(GetStudentById), new { id = student.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditStudent(Guid id, [FromBody] UpdateStudentDto dto)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
            {
                return NotFound(new { error = "Student not found" });
            }

            var streamExists = await _context.Streams.AnyAsync(s => s.Id == dto.StreamId);
            if (!streamExists)
            {
                return BadRequest(new { error = "Assigned Stream does not exist" });
            }

            if (await _context.Students.AnyAsync(s => s.Id != id && s.RegNumber.ToLower() == dto.RegNumber.ToLower()))
            {
                return BadRequest(new { error = "Registration number already exists for another student" });
            }

            student.Name = dto.Name;
            student.RegNumber = dto.RegNumber;
            student.StreamId = dto.StreamId;

            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Updated student '{student.Name}' (RegNumber: {student.RegNumber})",
                EntityId = student.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' updated student '{StudentName}' (RegNumber: {RegNumber}, StudentId: {StudentId})", adminUsername, student.Name, student.RegNumber, student.Id);

            var result = new StudentDto
            {
                Id = student.Id,
                Name = student.Name,
                RegNumber = student.RegNumber,
                StreamId = student.StreamId
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(Guid id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null)
            {
                return NotFound(new { error = "Student not found" });
            }

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Deleted student '{student.Name}' (RegNumber: {student.RegNumber})",
                EntityId = student.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' deleted student '{StudentName}' (RegNumber: {RegNumber}, StudentId: {StudentId})", adminUsername, student.Name, student.RegNumber, student.Id);

            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStudentById(Guid id)
        {
            var student = await _context.Students
                .Include(s => s.Stream)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Subject)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
            {
                return NotFound(new { error = "Student not found" });
            }

            var result = new StudentDetailDto
            {
                Id = student.Id,
                Name = student.Name,
                RegNumber = student.RegNumber,
                StreamId = student.StreamId,
                StreamName = student.Stream?.Name ?? string.Empty,
                Scores = student.Scores.Select(sc => new ScoreDto
                {
                    Id = sc.Id,
                    StudentId = sc.StudentId,
                    SubjectId = sc.SubjectId,
                    SubjectName = sc.Subject?.Name ?? string.Empty,
                    SubjectCode = sc.Subject?.Code ?? string.Empty,
                    ExamScore = sc.ExamScore,
                    CAScore = sc.CAScore,
                    TotalScore = sc.TotalScore
                }).ToList()
            };

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllStudents()
        {
            var students = await _context.Students
                .OrderBy(s => s.Name)
                .Select(s => new StudentDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    RegNumber = s.RegNumber,
                    StreamId = s.StreamId
                })
                .ToListAsync();

            return Ok(students);
        }

        [HttpGet("stream/{streamId}")]
        public async Task<IActionResult> GetStudentsByStream(Guid streamId)
        {
            var streamExists = await _context.Streams.AnyAsync(s => s.Id == streamId);
            if (!streamExists)
            {
                return NotFound(new { error = "Stream not found" });
            }

            var students = await _context.Students
                .Where(s => s.StreamId == streamId)
                .OrderBy(s => s.Name)
                .Select(s => new StudentDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    RegNumber = s.RegNumber,
                    StreamId = s.StreamId
                })
                .ToListAsync();

            return Ok(students);
        }
    }
}
