package lydiacharif.nutridzbackend.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Dtos.request.auth.LoginRequest;
import lydiacharif.nutridzbackend.Dtos.request.auth.RegisterRequest;
import lydiacharif.nutridzbackend.Dtos.request.auth.UpdateProfileRequest;
import lydiacharif.nutridzbackend.Dtos.response.auth.AuthResponse;
import lydiacharif.nutridzbackend.Dtos.response.auth.UserResponse;
import lydiacharif.nutridzbackend.Security.CustomUserPrincipal;
import lydiacharif.nutridzbackend.Services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication and user profile endpoints")
public class AuthController {

    private final UserService userService;

    @Operation(summary = "Register a new user")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "409", description = "Email or username already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @Operation(summary = "Login")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());
        return ResponseEntity.ok(userService.login(request));
    }

    @Operation(summary = "Get current authenticated user")
    @SecurityRequirement(name = "bearer-jwt")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserPrincipal principal) {
        log.info("Get current user for ID: {}", principal.user().getId());
        return ResponseEntity.ok(userService.getCurrentUser(principal.user().getId()));
    }

    @Operation(summary = "Update user profile")
    @SecurityRequirement(name = "bearer-jwt")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        log.info("Update profile for user ID: {}", principal.user().getId());
        return ResponseEntity.ok(userService.updateProfile(principal.user().getId(), request));
    }
}