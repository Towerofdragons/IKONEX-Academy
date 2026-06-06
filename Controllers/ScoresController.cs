using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using IKONEX_Academy.Services;
using IKONEX_Academy.DTOs.Score;
using Microsoft.AspNetCore.Authorization;
using Serilog;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ScoresController : ControllerBase
    {
        private readonly IScoreService _scoreService;
        private readonly IkonexDbContext _context;

        public ScoresController(IScoreService scoreService, IkonexDbContext context)
        {
            _scoreService = scoreService;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> RecordScore([FromBody] RecordScoreDto dto)
        {
            try
            {
                var result = await _scoreService.RecordScoreAsync(dto);

                var adminUsername = User.Identity?.Name ?? "system";
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    AdminUsername = adminUsername,
                    Action = $"Recorded score: CA={dto.CAScore}, Exam={dto.ExamScore} for student ID '{dto.StudentId}' on subject ID '{dto.SubjectId}'",
                    EntityId = result.Id.ToString(),
                    Timestamp = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                Log.Information("Admin '{AdminUsername}' recorded score for student '{StudentId}' on subject '{SubjectId}' (ScoreId: {ScoreId})", adminUsername, dto.StudentId, dto.SubjectId, result.Id);

                return CreatedAtRoute(null, new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditScore(Guid id, [FromBody] UpdateScoreDto dto)
        {
            try
            {
                var result = await _scoreService.EditScoreAsync(id, dto);

                var adminUsername = User.Identity?.Name ?? "system";
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    AdminUsername = adminUsername,
                    Action = $"Updated score: CA={dto.CAScore}, Exam={dto.ExamScore} for score ID '{id}'",
                    EntityId = id.ToString(),
                    Timestamp = DateTime.UtcNow
                };
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                Log.Information("Admin '{AdminUsername}' updated score ID '{ScoreId}'", adminUsername, id);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }
}
