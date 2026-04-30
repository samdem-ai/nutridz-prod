package lydiacharif.nutridzbackend.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class ActuatorSecurityConfig {

    @Bean
    @Order(30)
    public SecurityFilterChain actuatorFilterChain(final HttpSecurity http) throws Exception {
        return http.securityMatcher("/actuator/**")
                .cors(withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize.anyRequest().hasAuthority("HEALTH"))
                .httpBasic(basic -> basic.realmName("actuator realm"))
                .build();
    }
}