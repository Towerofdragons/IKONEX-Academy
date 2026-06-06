using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.Services;
using IKONEX_Academy.DTOs.Score;

namespace IKONEX_Academy.Tests
{
    public class ScoreServiceTests
    {
        private DbContextOptions<IkonexDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<IkonexDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task RecordScore_ValidInputs_SavesSuccessfully()
        {
            // Arrange
            var options = CreateNewContextOptions();
            var studentId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                context.Students.Add(new Student { Id = studentId, Name = "Test Student", RegNumber = "REG-001" });
                context.Subjects.Add(new Subject { Id = subjectId, Name = "Test Subject", Code = "SUB-001" });
                await context.SaveChangesAsync();
            }

            // Act
            using (var context = new IkonexDbContext(options))
            {
                var service = new ScoreService(context);
                var dto = new RecordScoreDto
                {
                    StudentId = studentId,
                    SubjectId = subjectId,
                    ExamScore = 55.5,
                    CAScore = 24.0
                };

                var result = await service.RecordScoreAsync(dto);

                // Assert
                Assert.NotNull(result);
                Assert.Equal(79.5, result.TotalScore);
            }

            using (var context = new IkonexDbContext(options))
            {
                var savedScore = await context.Scores.FirstOrDefaultAsync(s => s.StudentId == studentId && s.SubjectId == subjectId);
                Assert.NotNull(savedScore);
                Assert.Equal(55.5, savedScore.ExamScore);
                Assert.Equal(24.0, savedScore.CAScore);
                Assert.Equal(79.5, savedScore.TotalScore);
            }
        }

        [Theory]
        [InlineData(-1.0, 20.0)]
        [InlineData(71.0, 20.0)]
        public async Task RecordScore_InvalidExamScore_ThrowsArgumentException(double examScore, double caScore)
        {
            // Arrange
            var options = CreateNewContextOptions();
            var studentId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                var service = new ScoreService(context);
                var dto = new RecordScoreDto
                {
                    StudentId = studentId,
                    SubjectId = subjectId,
                    ExamScore = examScore,
                    CAScore = caScore
                };

                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.RecordScoreAsync(dto));
                Assert.Contains("ExamScore must be between 0 and 70", ex.Message);
            }
        }

        [Theory]
        [InlineData(50.0, -1.0)]
        [InlineData(50.0, 31.0)]
        public async Task RecordScore_InvalidCAScore_ThrowsArgumentException(double examScore, double caScore)
        {
            // Arrange
            var options = CreateNewContextOptions();
            var studentId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                var service = new ScoreService(context);
                var dto = new RecordScoreDto
                {
                    StudentId = studentId,
                    SubjectId = subjectId,
                    ExamScore = examScore,
                    CAScore = caScore
                };

                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.RecordScoreAsync(dto));
                Assert.Contains("CAScore must be between 0 and 30", ex.Message);
            }
        }

        [Fact]
        public async Task RecordScore_DuplicateSubmission_ThrowsInvalidOperationException()
        {
            // Arrange
            var options = CreateNewContextOptions();
            var studentId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                context.Students.Add(new Student { Id = studentId, Name = "Test Student", RegNumber = "REG-001" });
                context.Subjects.Add(new Subject { Id = subjectId, Name = "Test Subject", Code = "SUB-001" });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = studentId, SubjectId = subjectId, ExamScore = 40, CAScore = 20, TotalScore = 60 });
                await context.SaveChangesAsync();
            }

            // Act & Assert
            using (var context = new IkonexDbContext(options))
            {
                var service = new ScoreService(context);
                var dto = new RecordScoreDto
                {
                    StudentId = studentId,
                    SubjectId = subjectId,
                    ExamScore = 50.0,
                    CAScore = 20.0
                };

                var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.RecordScoreAsync(dto));
                Assert.Contains("Duplicate score submission prohibited", ex.Message);
            }
        }
    }
}
