using Microsoft.EntityFrameworkCore;
using Pigeon.Api.Data;

namespace Pigeon.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddOpenApi();

            // Allow our React frontend to access the API
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("ReactApp", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
            }

            app.UseHttpsRedirection();

            app.UseCors("ReactApp");

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
