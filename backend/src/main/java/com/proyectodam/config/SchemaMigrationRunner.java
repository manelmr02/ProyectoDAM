package com.proyectodam.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Applies column-type migrations that Hibernate's ddl-auto=update won't do automatically
 * (e.g. VARCHAR → LONGTEXT). Safe to run on every startup.
 */
@Component
@RequiredArgsConstructor
public class SchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE usuarios MODIFY COLUMN avatar_image LONGTEXT"
            );
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute(
                "ALTER TABLE sala_jugadores MODIFY COLUMN avatar_image LONGTEXT"
            );
        } catch (Exception ignored) {}
    }
}
