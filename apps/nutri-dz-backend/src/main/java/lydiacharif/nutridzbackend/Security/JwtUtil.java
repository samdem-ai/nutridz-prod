package lydiacharif.nutridzbackend.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import lydiacharif.nutridzbackend.Models.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expirationTime;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("username", user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        return extractClaims(token).get("userId", Long.class);
    }

    public boolean validateToken(String token, CustomUserPrincipal userPrincipal) {
        try {
            final String username = extractUsername(token);
            return username.equals(userPrincipal.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            log.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        try {
            final Date expiration = extractClaims(token).getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public long getExpirationTime() {
        return expirationTime;
    }
}