using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using IKONEX_Academy.Data;
using IKONEX_Academy.Entities;
using IKONEX_Academy.Services;

namespace IKONEX_Academy.Tests
{
    public class ReportServiceTests
    {
        private DbContextOptions<IkonexDbContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<IkonexDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task GenerateStreamReport_CalculatesAveragesAndGradesCorrectly()
        {
            // Arrange
            var options = CreateNewContextOptions();
            var streamId = Guid.NewGuid();
            var subject1Id = Guid.NewGuid();
            var subject2Id = Guid.NewGuid();
            var studentId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                context.Streams.Add(new Entities.Stream { Id = streamId, Name = "Form 1A" });
                context.Subjects.Add(new Subject { Id = subject1Id, Name = "Maths", Code = "MATH" });
                context.Subjects.Add(new Subject { Id = subject2Id, Name = "English", Code = "ENG" });
                
                context.StreamSubjects.Add(new StreamSubject { StreamId = streamId, SubjectId = subject1Id });
                context.StreamSubjects.Add(new StreamSubject { StreamId = streamId, SubjectId = subject2Id });

                context.Students.Add(new Student { Id = studentId, Name = "Alice", RegNumber = "ALICE-01", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = studentId, SubjectId = subject1Id, ExamScore = 60, CAScore = 25, TotalScore = 85 }); // MATH = 85
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = studentId, SubjectId = subject2Id, ExamScore = 50, CAScore = 25, TotalScore = 75 }); // ENG = 75
                
                await context.SaveChangesAsync();
            }

            // Act
            using (var context = new IkonexDbContext(options))
            {
                var service = new ReportService(context);
                var report = await service.GenerateStreamReportAsync(streamId);

                // Assert
                Assert.NotNull(report);
                Assert.Equal("Form 1A", report.StreamName);
                Assert.Single(report.Leaderboard);

                var studentReport = report.Leaderboard.First();
                Assert.Equal("Alice", studentReport.StudentName);
                Assert.Equal(160.0, studentReport.TotalMarks);
                Assert.Equal(80.0, studentReport.AverageScore); // 160 / 2
                Assert.Equal("A", studentReport.Grade); // >= 80 is A
            }
        }

        [Fact]
        public async Task GenerateStreamReport_Applies1224RankingRuleCorrectly()
        {
            // Arrange
            var options = CreateNewContextOptions();
            var streamId = Guid.NewGuid();
            var subjectId = Guid.NewGuid();

            var student1Id = Guid.NewGuid();
            var student2Id = Guid.NewGuid();
            var student3Id = Guid.NewGuid();
            var student4Id = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                context.Streams.Add(new Entities.Stream { Id = streamId, Name = "Form 1A" });
                context.Subjects.Add(new Subject { Id = subjectId, Name = "Maths", Code = "MATH" });
                context.StreamSubjects.Add(new StreamSubject { StreamId = streamId, SubjectId = subjectId });

                // Student 1 (90)
                context.Students.Add(new Student { Id = student1Id, Name = "Student 1", RegNumber = "REG-S1", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = student1Id, SubjectId = subjectId, ExamScore = 70, CAScore = 20, TotalScore = 90 });

                // Student 2 (90) - Tie
                context.Students.Add(new Student { Id = student2Id, Name = "Student 2", RegNumber = "REG-S2", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = student2Id, SubjectId = subjectId, ExamScore = 70, CAScore = 20, TotalScore = 90 });

                // Student 3 (80)
                context.Students.Add(new Student { Id = student3Id, Name = "Student 3", RegNumber = "REG-S3", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = student3Id, SubjectId = subjectId, ExamScore = 60, CAScore = 20, TotalScore = 80 });

                // Student 4 (70)
                context.Students.Add(new Student { Id = student4Id, Name = "Student 4", RegNumber = "REG-S4", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = student4Id, SubjectId = subjectId, ExamScore = 50, CAScore = 20, TotalScore = 70 });

                await context.SaveChangesAsync();
            }

            // Act
            using (var context = new IkonexDbContext(options))
            {
                var service = new ReportService(context);
                var report = await service.GenerateStreamReportAsync(streamId);

                // Assert
                Assert.NotNull(report);
                Assert.Equal(4, report.Leaderboard.Count);

                var st1 = report.Leaderboard.First(s => s.StudentId == student1Id);
                var st2 = report.Leaderboard.First(s => s.StudentId == student2Id);
                var st3 = report.Leaderboard.First(s => s.StudentId == student3Id);
                var st4 = report.Leaderboard.First(s => s.StudentId == student4Id);

                // Both top students must be 1st
                Assert.Equal(1, st1.OverallPosition);
                Assert.Equal(1, st2.OverallPosition);

                // 2nd position should be skipped, so next is 3rd
                Assert.Equal(3, st3.OverallPosition);
                
                // 4th position follows
                Assert.Equal(4, st4.OverallPosition);
            }
        }

        [Fact]
        public async Task GenerateStreamReport_SubjectSpecificFilterSorting_ReOrdersLeaderboard()
        {
            // Arrange
            var options = CreateNewContextOptions();
            var streamId = Guid.NewGuid();
            var mathId = Guid.NewGuid();
            var engId = Guid.NewGuid();

            var aliceId = Guid.NewGuid();
            var bobId = Guid.NewGuid();

            using (var context = new IkonexDbContext(options))
            {
                context.Streams.Add(new Entities.Stream { Id = streamId, Name = "Form 1A" });
                context.Subjects.Add(new Subject { Id = mathId, Name = "Maths", Code = "MATH" });
                context.Subjects.Add(new Subject { Id = engId, Name = "English", Code = "ENG" });

                context.StreamSubjects.Add(new StreamSubject { StreamId = streamId, SubjectId = mathId });
                context.StreamSubjects.Add(new StreamSubject { StreamId = streamId, SubjectId = engId });

                // Alice: Overall = 160, Math = 70, English = 90
                context.Students.Add(new Student { Id = aliceId, Name = "Alice", RegNumber = "ALICE-02", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = aliceId, SubjectId = mathId, ExamScore = 50, CAScore = 20, TotalScore = 70 });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = aliceId, SubjectId = engId, ExamScore = 70, CAScore = 20, TotalScore = 90 });

                // Bob: Overall = 170, Math = 95, English = 75
                context.Students.Add(new Student { Id = bobId, Name = "Bob", RegNumber = "BOB-02", StreamId = streamId });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = bobId, SubjectId = mathId, ExamScore = 75, CAScore = 20, TotalScore = 95 });
                context.Scores.Add(new Score { Id = Guid.NewGuid(), StudentId = bobId, SubjectId = engId, ExamScore = 55, CAScore = 20, TotalScore = 75 });

                await context.SaveChangesAsync();
            }

            // Act
            using (var context = new IkonexDbContext(options))
            {
                var service = new ReportService(context);

                // 1. Fetch overall leaderboard (Bob should be 1st because 170 > 160)
                var overallReport = await service.GenerateStreamReportAsync(streamId, subjectId: null);
                Assert.Equal(bobId, overallReport.Leaderboard[0].StudentId);
                Assert.Equal(aliceId, overallReport.Leaderboard[1].StudentId);
                Assert.Equal(1, overallReport.Leaderboard[0].OverallPosition);
                Assert.Equal(2, overallReport.Leaderboard[1].OverallPosition);

                // 2. Fetch English leaderboard (Alice should be 1st because 90 > 75)
                var engReport = await service.GenerateStreamReportAsync(streamId, subjectId: engId);
                Assert.Equal(aliceId, engReport.Leaderboard[0].StudentId);
                Assert.Equal(bobId, engReport.Leaderboard[1].StudentId);
                Assert.Equal(1, engReport.Leaderboard[0].OverallPosition);
                Assert.Equal(2, engReport.Leaderboard[1].OverallPosition);
            }
        }
    }
}
