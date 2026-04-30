package lydiacharif.nutridzbackend.Dtos.response.auth;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private long expiresIn;
}