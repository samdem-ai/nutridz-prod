package lydiacharif.nutridzbackend.Exceptions;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends NutridzException {

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String resource, String field, String value) {
        super(resource + " not found with " + field + ": " + value, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }
}