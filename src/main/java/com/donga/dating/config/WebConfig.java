package com.donga.dating.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 업로드된 사진을 정적 리소스로 공개하지 않는다.
 * 사진은 전용 API를 통해서만 조회하도록 제한한다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
