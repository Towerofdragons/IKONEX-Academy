using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using Stream = IKONEX_Academy.Entities.Stream;
using IKONEX_Academy.DTOs.Stream;
using IKONEX_Academy.DTOs.Student;
using IKONEX_Academy.DTOs.Subject;

using Microsoft.AspNetCore.Authorization;
using Serilog;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StreamsController : ControllerBase
    {
        private readonly IkonexDbContext _context;

        public StreamsController(IkonexDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateStream([FromBody] CreateStreamDto dto)
        {
            if (await _context.Streams.AnyAsync(s => s.Name.ToLower() == dto.Name.ToLower()))
            {
                return BadRequest(new { error = "Stream with this name already exists" });
            }

            var stream = new Stream
            {
                Id = Guid.NewGuid(),
                Name = dto.Name
            };

            _context.Streams.Add(stream);
            await _context.SaveChangesAsync();

            var adminUsername = User.Identity?.Name ?? "system";
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                AdminUsername = adminUsername,
                Action = $"Created stream '{stream.Name}'",
                EntityId = stream.Id.ToString(),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            Log.Information("Admin '{AdminUsername}' created stream '{StreamName}' (Id: {StreamId})", adminUsername, stream.Name, stream.Id);

            var result = new StreamDto
            {
                Id = stream.Id,
                Name = stream.Name
            };

            return CreatedAtAction(nameof(GetStreamById), new { id = stream.Id }, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllStreams()
        {
            var streams = await _context.Streams
                .OrderBy(s => s.Name)
                .Select(s => new StreamDto
                {
                    Id = s.Id,
                    Name = s.Name
                })
                .ToListAsync();

            return Ok(streams);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStreamById(Guid id)
        {
            var stream = await _context.Streams
                .Include(s => s.Students)
                .Include(s => s.StreamSubjects)
                    .ThenInclude(ss => ss.Subject)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (stream == null)
            {
                return NotFound(new { error = "Stream not found" });
            }

            var result = new StreamDetailDto
            {
                Id = stream.Id,
                Name = stream.Name,
                Students = stream.Students.Select(st => new StudentDto
                {
                    Id = st.Id,
                    Name = st.Name,
                    RegNumber = st.RegNumber,
                    StreamId = st.StreamId
                }).ToList(),
                Subjects = stream.StreamSubjects.Select(ss => new SubjectDto
                {
                    Id = ss.Subject!.Id,
                    Name = ss.Subject.Name,
                    Code = ss.Subject.Code
                }).ToList()
            };

            return Ok(result);
        }
    }
}
