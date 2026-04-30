package lydiacharif.nutridzbackend.Exceptions;

import org.springframework.http.HttpStatus;

public class UnauthorizedActionException extends NutridzException {

    public UnauthorizedActionException(String action) {
        super("You are not authorized to " + action, HttpStatus.FORBIDDEN, "UNAUTHORIZED_ACTION");
    }
}