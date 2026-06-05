package com.donga.dating.domain.user.controller;

import com.donga.dating.global.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
public class PreferencesController {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @GetMapping("/template")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTemplate() throws Exception {
        ClassPathResource res = new ClassPathResource("static/preferences.json");
        try (InputStream is = res.getInputStream()) {
            Map<String, Object> map = MAPPER.readValue(is, Map.class);
            return ResponseEntity.ok(ApiResponse.success(map));
        }
    }
}
