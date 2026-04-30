package lydiacharif.nutridzbackend.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .codecs(config -> config.defaultCodecs()
                        .maxInMemorySize(2 * 1024 * 1024))
                .build();
    }
}