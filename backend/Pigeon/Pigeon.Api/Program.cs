using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pigeon.Api.Data;
using System.Threading.RateLimiting;

namespace Pigeon.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddOpenApi();

            var jwtSettings = builder.Configuration.GetSection("Jwt");
            var jwtKey = Convert.FromBase64String(jwtSettings["Key"]!);

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtSettings["Issuer"],
                        ValidateAudience = true,
                        ValidAudience = jwtSettings["Audience"],
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
                        ClockSkew = TimeSpan.Zero
                    };
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var cookieJwt = context.Request.Cookies["pigeon_auth"];
                            if (string.IsNullOrEmpty(cookieJwt))
                                context.NoResult(); // Do not fall back to JS-supplied Bearer tokens
                            else
                                context.Token = cookieJwt;
                            return Task.CompletedTask;
                        }
                    };
                });
            builder.Services.AddAuthorization();

            // The development frontend uses HTTP while the API uses HTTPS.
            // Secure + SameSite=None is required for this cross-site local setup.
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("ReactApp", policy =>
                    policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials());
            });

            builder.Services.AddAntiforgery(options =>
            {
                options.HeaderName = "X-CSRF-TOKEN";
                options.Cookie.Name = "pigeon_csrf";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.None;
                options.Cookie.Path = "/api";
            });

            builder.Services.AddRateLimiter(options =>
            {
                options.AddPolicy("login", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        }));
                options.AddPolicy("register", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(10),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        }));
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            });

            var app = builder.Build();
            if (app.Environment.IsDevelopment()) app.MapOpenApi();

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCors("ReactApp");
            app.UseAuthentication();

            // Validate the antiforgery token for every API write, including Login and Logout.
            app.Use(async (context, next) =>
            {
                var isApiWrite = context.Request.Path.StartsWithSegments("/api") &&
                    !HttpMethods.IsGet(context.Request.Method) &&
                    !HttpMethods.IsHead(context.Request.Method) &&
                    !HttpMethods.IsOptions(context.Request.Method);

                if (isApiWrite)
                {
                    try
                    {
                        await context.RequestServices.GetRequiredService<IAntiforgery>()
                            .ValidateRequestAsync(context);
                    }
                    catch (AntiforgeryValidationException)
                    {
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await context.Response.WriteAsJsonAsync(new { message = "Invalid CSRF token." });
                        return;
                    }
                }
                await next();
            });

            app.UseRateLimiter();
            app.UseAuthorization();
            app.MapControllers();
            app.Run();
        }
    }
}
