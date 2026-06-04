using Microsoft.EntityFrameworkCore;
using IKONEX_Academy.Entities;
using Stream = IKONEX_Academy.Entities.Stream;

namespace IKONEX_Academy.Data
{
    public class IkonexDbContext : DbContext
    {
        public IkonexDbContext(DbContextOptions<IkonexDbContext> options) : base(options)
        {
        }

        public DbSet<Stream> Streams => Set<Stream>();
        public DbSet<Student> Students => Set<Student>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<StreamSubject> StreamSubjects => Set<StreamSubject>();
        public DbSet<Score> Scores => Set<Score>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Stream configurations
            modelBuilder.Entity<Stream>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            });

            // Student configurations
            modelBuilder.Entity<Student>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.RegNumber).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.RegNumber).IsRequired().HasMaxLength(50);

                entity.HasOne(e => e.Stream)
                    .WithMany(s => s.Students)
                    .HasForeignKey(e => e.StreamId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Subject configurations
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            });

            // StreamSubject configuration (Composite primary key and relations)
            modelBuilder.Entity<StreamSubject>(entity =>
            {
                entity.HasKey(e => new { e.StreamId, e.SubjectId });

                entity.HasOne(e => e.Stream)
                    .WithMany(s => s.StreamSubjects)
                    .HasForeignKey(e => e.StreamId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Subject)
                    .WithMany(s => s.StreamSubjects)
                    .HasForeignKey(e => e.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Score configurations
            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Enforce StudentId + SubjectId database-level uniqueness
                entity.HasIndex(e => new { e.StudentId, e.SubjectId }).IsUnique();

                entity.HasOne(e => e.Student)
                    .WithMany(s => s.Scores)
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Subject)
                    .WithMany(s => s.Scores)
                    .HasForeignKey(e => e.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
