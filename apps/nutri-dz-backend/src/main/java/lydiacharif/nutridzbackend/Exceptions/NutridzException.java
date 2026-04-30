package lydiacharif.nutridzbackend.Exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NutridzException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public NutridzException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

}