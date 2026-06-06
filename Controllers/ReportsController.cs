using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using IKONEX_Academy.Services;

using Microsoft.AspNetCore.Authorization;

namespace IKONEX_Academy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("stream/{streamId}")]
        public async Task<IActionResult> GetStreamReport(Guid streamId, [FromQuery] Guid? subjectId = null)
        {
            try
            {
                var report = await _reportService.GenerateStreamReportAsync(streamId, subjectId);
                return Ok(report);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }
}
