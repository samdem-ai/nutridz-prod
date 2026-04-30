package lydiacharif.nutridzbackend.Security;

import lydiacharif.nutridzbackend.Models.User;
import lydiacharif.nutridzbackend.Repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof UsernamePasswordAuthenticationToken auth && auth.isAuthenticated()) {
            if (auth.getPrincipal() instanceof CustomUserPrincipal userPrincipal) {
                User user = userPrincipal.user();
                Long userId = user.getId();

                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isEmpty()) {
                    SecurityContextHolder.clearContext();
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }

                User dbUser = userOptional.get();
                if (!dbUser.getEmail().equals(auth.getName())) {
                    SecurityContextHolder.clearContext();
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}