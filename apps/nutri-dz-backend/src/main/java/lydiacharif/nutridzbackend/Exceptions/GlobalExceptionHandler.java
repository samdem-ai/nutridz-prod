package lydiacharif.nutridzbackend.Exceptions;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NutridzException.class)
    public ResponseEntity<ErrorResponse> handleNutridzException(
            NutridzException ex, HttpServletRequest request) {
        log.warn("[{}] {} - {}", ex.getStatus().value(), ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatus())
                .body(ErrorResponse.of(
                        ex.getStatus().value(),
                        ex.getErrorCode(),
                        ex.getMessage(),
                        request.getRequestURI()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.warn("[400] VALIDATION_ERROR - {} - {}", request.getRequestURI(), errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.ofValidation(request.getRequestURI(), errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception ex, HttpServletRequest request) {
        log.error("[500] INTERNAL_ERROR - {} - {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(
                        500,
                        "INTERNAL_ERROR",
                        "An unexpected error occurred. Please try again.",
                        request.getRequestURI()
                ));
    }
}