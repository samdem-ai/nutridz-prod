package lydiacharif.nutridzbackend.Exceptions;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String errorCode;
    private String message;
    private String path;
    private Map<String, String> validationErrors;

    private ErrorResponse() {}

    public static ErrorResponse of(int status, String errorCode, String message, String path) {
        ErrorResponse r = new ErrorResponse();
        r.timestamp = LocalDateTime.now();
        r.status = status;
        r.errorCode = errorCode;
        r.message = message;
        r.path = path;
        return r;
    }

    public static ErrorResponse ofValidation(String path, Map<String, String> validationErrors) {
        ErrorResponse r = new ErrorResponse();
        r.timestamp = LocalDateTime.now();
        r.status = 400;
        r.errorCode = "VALIDATION_ERROR";
        r.message = "Request validation failed";
        r.path = path;
        r.validationErrors = validationErrors;
        return r;
    }

}