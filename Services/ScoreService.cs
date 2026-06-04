using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.DTOs.Score;

namespace IKONEX_Academy.Services
{
    public class ScoreService : IScoreService
    {
        private readonly IkonexDbContext _context;

        public ScoreService(IkonexDbContext context)
        {
            _context = context;
        }

        public async Task<ScoreDto> RecordScoreAsync(RecordScoreDto dto)
        {
            // Validations
            if (dto.ExamScore > 70 || dto.ExamScore < 0)
            {
                throw new ArgumentException("ExamScore must be between 0 and 70");
            }

            if (dto.CAScore > 30 || dto.CAScore < 0)
            {
                throw new ArgumentException("CAScore must be between 0 and 30");
            }

            var student = await _context.Students.FindAsync(dto.StudentId);
            if (student == null)
            {
                throw new ArgumentException("Student not found");
            }

            var subject = await _context.Subjects.FindAsync(dto.SubjectId);
            if (subject == null)
            {
                throw new ArgumentException("Subject not found");
            }

            var scoreExists = await _context.Scores.AnyAsync(s => s.StudentId == dto.StudentId && s.SubjectId == dto.SubjectId);
            if (scoreExists)
            {
                throw new InvalidOperationException("Duplicate score submission prohibited");
            }

            var score = new Score
            {
                Id = Guid.NewGuid(),
                StudentId = dto.StudentId,
                SubjectId = dto.SubjectId,
                ExamScore = dto.ExamScore,
                CAScore = dto.CAScore,
                TotalScore = dto.ExamScore + dto.CAScore
            };

            _context.Scores.Add(score);
            await _context.SaveChangesAsync();

            return new ScoreDto
            {
                Id = score.Id,
                StudentId = score.StudentId,
                SubjectId = score.SubjectId,
                SubjectName = subject.Name,
                SubjectCode = subject.Code,
                ExamScore = score.ExamScore,
                CAScore = score.CAScore,
                TotalScore = score.TotalScore
            };
        }

        public async Task<ScoreDto> EditScoreAsync(Guid id, UpdateScoreDto dto)
        {
            if (dto.ExamScore > 70 || dto.ExamScore < 0)
            {
                throw new ArgumentException("ExamScore must be between 0 and 70");
            }

            if (dto.CAScore > 30 || dto.CAScore < 0)
            {
                throw new ArgumentException("CAScore must be between 0 and 30");
            }

            var score = await _context.Scores
                .Include(s => s.Subject)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (score == null)
            {
                throw new KeyNotFoundException("Score record not found");
            }

            score.ExamScore = dto.ExamScore;
            score.CAScore = dto.CAScore;
            score.TotalScore = dto.ExamScore + dto.CAScore;

            await _context.SaveChangesAsync();

            return new ScoreDto
            {
                Id = score.Id,
                StudentId = score.StudentId,
                SubjectId = score.SubjectId,
                SubjectName = score.Subject?.Name ?? string.Empty,
                SubjectCode = score.Subject?.Code ?? string.Empty,
                ExamScore = score.ExamScore,
                CAScore = score.CAScore,
                TotalScore = score.TotalScore
            };
        }
    }
}
