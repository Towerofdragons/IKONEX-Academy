using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Data;
using IKONEX_Academy.DTOs.Report;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IkonexDbContext _context;

        public ReportsController(IkonexDbContext context)
        {
            _context = context;
        }

        [HttpGet("stream/{streamId}")]
        public async Task<IActionResult> GetStreamReport(Guid streamId)
        {
            // Verify stream exists
            var stream = await _context.Streams.FindAsync(streamId);
            if (stream == null)
            {
                return NotFound(new { error = "Stream not found" });
            }

            // Get all subjects associated with this stream
            var subjectsInStream = await _context.StreamSubjects
                .Where(ss => ss.StreamId == streamId)
                .Include(ss => ss.Subject)
                .Select(ss => ss.Subject)
                .Where(s => s != null)
                .ToListAsync();

            int subjectsCount = subjectsInStream.Count;

            // Fetch all students in the stream, including all of their related Scores
            var students = await _context.Students
                .Where(s => s.StreamId == streamId)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Subject)
                .ToListAsync();

            // Create a set of subject IDs assigned to the stream for quick lookup
            var streamSubjectIds = new HashSet<Guid>(subjectsInStream.Select(s => s!.Id));

            // 1. Calculate Subject Positions
            var subjectRanks = new Dictionary<Guid, Dictionary<Guid, int>>();
            foreach (var subject in subjectsInStream)
            {
                if (subject == null) continue;

                // For each subject, grab student scores, sorting descending.
                // Missing score is treated as 0.
                var scoresForSubject = students
                    .Select(s => new
                    {
                        StudentId = s.Id,
                        TotalScore = s.Scores.FirstOrDefault(sc => sc.SubjectId == subject.Id)?.TotalScore ?? 0.0
                    })
                    .OrderByDescending(x => x.TotalScore)
                    .ToList();

                var ranks = new Dictionary<Guid, int>();
                int currentRank = 1;
                for (int i = 0; i < scoresForSubject.Count; i++)
                {
                    if (i > 0 && scoresForSubject[i].TotalScore < scoresForSubject[i - 1].TotalScore)
                    {
                        currentRank = i + 1;
                    }
                    ranks[scoresForSubject[i].StudentId] = currentRank;
                }
                subjectRanks[subject.Id] = ranks;
            }

            // 2. Build report data for each student
            var studentReports = new List<StudentReportDto>();
            foreach (var student in students)
            {
                // TotalMarks: Sum of all TotalScore values across their scores that belong to subjects in the stream
                double totalMarks = student.Scores
                    .Where(sc => streamSubjectIds.Contains(sc.SubjectId))
                    .Sum(sc => sc.TotalScore);

                // AverageScore: TotalMarks divided by the number of subjects associated with that stream
                double averageScore = subjectsCount > 0 ? totalMarks / subjectsCount : 0.0;

                // Determine Grade based on the scale:
                // Average >= 80 = 'A', >= 70 = 'B', >= 60 = 'C', >= 50 = 'D', < 50 = 'E'
                string grade = GetGrade(averageScore);

                // Build subject scores list
                var subjectScores = new List<SubjectReportScoreDto>();
                foreach (var subject in subjectsInStream)
                {
                    if (subject == null) continue;

                    var score = student.Scores.FirstOrDefault(sc => sc.SubjectId == subject.Id);
                    int position = subjectRanks.ContainsKey(subject.Id) && subjectRanks[subject.Id].ContainsKey(student.Id)
                        ? subjectRanks[subject.Id][student.Id]
                        : 0;

                    subjectScores.Add(new SubjectReportScoreDto
                    {
                        SubjectId = subject.Id,
                        SubjectName = subject.Name,
                        SubjectCode = subject.Code,
                        ExamScore = score?.ExamScore ?? 0.0,
                        CAScore = score?.CAScore ?? 0.0,
                        TotalScore = score?.TotalScore ?? 0.0,
                        SubjectPosition = position
                    });
                }

                studentReports.Add(new StudentReportDto
                {
                    StudentId = student.Id,
                    StudentName = student.Name,
                    RegNumber = student.RegNumber,
                    TotalMarks = totalMarks,
                    AverageScore = Math.Round(averageScore, 2),
                    Grade = grade,
                    SubjectScores = subjectScores
                });
            }

            // 3. Calculate Overall Class Position
            // Sort student reports by TotalMarks descending.
            // Apply standard competition ranking.
            var sortedLeaderboard = studentReports
                .OrderByDescending(s => s.TotalMarks)
                .ToList();

            int overallRank = 1;
            for (int i = 0; i < sortedLeaderboard.Count; i++)
            {
                if (i > 0 && sortedLeaderboard[i].TotalMarks < sortedLeaderboard[i - 1].TotalMarks)
                {
                    overallRank = i + 1;
                }
                sortedLeaderboard[i].OverallPosition = overallRank;
            }

            var reportResult = new StreamReportDto
            {
                StreamId = stream.Id,
                StreamName = stream.Name,
                TotalStudents = students.Count,
                Leaderboard = sortedLeaderboard
            };

            return Ok(reportResult);
        }

        private static string GetGrade(double average)
        {
            if (average >= 80) return "A";
            if (average >= 70) return "B";
            if (average >= 60) return "C";
            if (average >= 50) return "D";
            return "E";
        }
    }
}
