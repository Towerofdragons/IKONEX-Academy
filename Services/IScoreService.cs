using System;
using System.Threading.Tasks;
using IKONEX_Academy.DTOs.Score;

namespace IKONEX_Academy.Services
{
    public interface IScoreService
    {
        Task<ScoreDto> RecordScoreAsync(RecordScoreDto dto);
        Task<ScoreDto> EditScoreAsync(Guid id, UpdateScoreDto dto);
    }
}
