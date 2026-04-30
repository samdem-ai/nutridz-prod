package lydiacharif.nutridzbackend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Smoke test — verifies the main application class is reachable.
 * Full Spring context test is skipped in CI because it requires MySQL/RabbitMQ.
 * Use service-level unit tests (FoodServiceTest, UserServiceTest, etc.) for coverage.
 */
class NutriDzBackendApplicationTests {

    @Test
    void mainClassIsReachable() {
        assertNotNull(NutriDzBackendApplication.class);
    }
}
