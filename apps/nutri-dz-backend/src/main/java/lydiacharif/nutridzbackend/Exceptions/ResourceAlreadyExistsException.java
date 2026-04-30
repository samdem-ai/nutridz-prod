package lydiacharif.nutridzbackend.Exceptions;

import org.springframework.http.HttpStatus;

public class ResourceAlreadyExistsException extends NutridzException {

    public ResourceAlreadyExistsException(String resource, String field, String value) {
        super(resource + " already exists with " + field + ": " + value, HttpStatus.CONFLICT, "RESOURCE_ALREADY_EXISTS");
    }
}