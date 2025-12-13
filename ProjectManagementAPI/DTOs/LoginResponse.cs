namespace ProjectManagementAPI.DTOs
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public UserResponse User { get; set; }
    }
}
