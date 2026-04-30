package lydiacharif.nutridzbackend.Exceptions;

import org.springframework.http.HttpStatus;

public class InvalidRequestException extends NutridzException {

    public InvalidRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
    }
}