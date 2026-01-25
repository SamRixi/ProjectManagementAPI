namespace ProjectManagementAPI.DTOs
{
    public class AuthResponse
    {
     
        public string Message { get; set; } = string.Empty;  //  string.Empty
        public string Token { get; set; } = string.Empty;    // string.Empty
        public UserDTO? User { get; set; } //  Uses your existing UserDTO
    }
}