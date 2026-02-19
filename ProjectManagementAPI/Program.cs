using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Services;
using ProjectManagementAPI.Services.Implementations;
using ProjectManagementAPI.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============= 1. ADD DbContext =============
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ============= 2. ADD Authentication JWT =============
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// ============= 3. ADD CORS POLICY =============
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",      // ✅ React dev server (HTTP)
                "https://localhost:5173",     // ✅ React dev server (HTTPS)
                "http://localhost:3000",      // ✅ Alternative React port
                "https://localhost:3000"      // ✅ Alternative React port
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();              // ✅ IMPORTANT pour JWT
    });
});

// ============= 4. ADD HttpContextAccessor =============
builder.Services.AddHttpContextAccessor();

// ============= 5. ADD Controllers =============
builder.Services.AddControllers();

// ============= 6. ADD Swagger =============
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============= 7. ADD Services =============
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IEdbService, EdbService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, ProjectTaskService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();


var app = builder.Build();

// ============= CONFIGURE HTTP PIPELINE =============
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ============= SERVE UPLOADED FILES =============
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/Uploads"
});

// ============= USE CORS (UNE SEULE FOIS !) =============
app.UseCors("AllowAll");  // ✅ DOIT ÊTRE AVANT UseAuthentication

// ============= USE AUTHENTICATION & AUTHORIZATION =============
app.UseAuthentication();  // ✅ DOIT ÊTRE AVANT UseAuthorization
app.UseAuthorization();

// ============= MAP CONTROLLERS =============
app.MapControllers();

app.Run();
