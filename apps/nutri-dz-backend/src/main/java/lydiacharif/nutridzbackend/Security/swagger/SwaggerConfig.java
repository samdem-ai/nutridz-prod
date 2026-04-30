package lydiacharif.nutridzbackend.Security.swagger;


import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openApiSpec() {
        return new OpenAPI()
                .info(new io.swagger.v3.oas.models.info.Info()
                        .title("nutri-dz API")
                        .description("REST API for the nutri-dz application.")
                        .version("1.0.0")
                        .contact(new io.swagger.v3.oas.models.info.Contact()
                                .name("nutri-dz")
                                .email("lydiacharif02@gmail.com"))
                )
                .components(new Components()
                        .addSchemas("ApiErrorResponse", new ObjectSchema()
                                .addProperty("status", new IntegerSchema())
                                .addProperty("code", new StringSchema())
                                .addProperty("message", new StringSchema())
                                .addProperty("fieldErrors", new ArraySchema().items(
                                        new Schema<ArraySchema>().$ref("ApiFieldError"))))
                        .addSchemas("ApiFieldError", new ObjectSchema()
                                .addProperty("code", new StringSchema())
                                .addProperty("message", new StringSchema())
                                .addProperty("property", new StringSchema())
                                .addProperty("rejectedValue", new ObjectSchema())
                                .addProperty("path", new StringSchema()))
                        .addSecuritySchemes("bearer-jwt",
                                new io.swagger.v3.oas.models.security.SecurityScheme()
                                        .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description(
                                                """
                                                        JWT Authentication. Enter the JWT token in the format: Bearer {token}
                                                        
                                                        How to obtain a token:
                                                        1. Use the /api/auth/login endpoint with your username and password
                                                        2. Copy the token from the response
                                                        Token information:
                                                        - The token contains user information and roles
                                                        - Tokens expire after a certain period
                                                        - Use the /api/auth/refresh endpoint to get a new token using your current token"""
                                        )
                        ))
                .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList("bearer-jwt"));
    }

    @Bean
    public OperationCustomizer operationCustomizer() {
        return (operation, handlerMethod) -> {
            operation.getResponses().addApiResponse("4xx/5xx", new ApiResponse()
                    .description("Error")
                    .content(new Content().addMediaType("*/*", new MediaType().schema(
                            new Schema<MediaType>().$ref("ApiErrorResponse")))));
            return operation;
        };
    }
}