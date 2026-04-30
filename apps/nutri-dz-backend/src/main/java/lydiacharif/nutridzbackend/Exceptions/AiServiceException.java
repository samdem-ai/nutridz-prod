package lydiacharif.nutridzbackend.Exceptions;

import org.springframework.http.HttpStatus;

public class AiServiceException extends NutridzException {

    public AiServiceException(String reason) {
        super("AI service unavailable: " + reason, HttpStatus.SERVICE_UNAVAILABLE, "AI_SERVICE_ERROR");
    }
}