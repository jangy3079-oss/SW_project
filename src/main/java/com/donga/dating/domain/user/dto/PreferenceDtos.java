package com.donga.dating.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

public final class PreferenceDtos {

    private PreferenceDtos() {
    }

    public record PreferencesUpdateRequest(Map<String, String> preferences) {
    }

    @Getter
    @Builder
    public static class PreferencesResponse {
        private Map<String, String> preferences;

        public static PreferencesResponse from(Map<String, String> prefs) {
            return PreferencesResponse.builder()
                    .preferences(prefs)
                    .build();
        }
    }
}
