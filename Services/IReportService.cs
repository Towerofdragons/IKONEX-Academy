using System;
using System.Threading.Tasks;
using IKONEX_Academy.DTOs.Report;

namespace IKONEX_Academy.Services
{
    public interface IReportService
    {
        Task<StreamReportDto> GenerateStreamReportAsync(Guid streamId);
    }
}
