using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.DTOs.Subject;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

            return NoContent();
        }

        [HttpPost("/api/streams/{streamId}/subjects/{subjectId}")]
        public async Task<IActionResult> AssignSubjectToStream(Guid streamId, Guid subjectId)
        {
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

            _context.StreamSubjects.Add(streamSubject);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Subject assigned to stream successfully" });
        }
    }
}
