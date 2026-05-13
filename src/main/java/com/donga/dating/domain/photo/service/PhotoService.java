package com.donga.dating.domain.photo.service;

import com.donga.dating.domain.photo.entity.UserPhoto;
import com.donga.dating.domain.photo.repository.UserPhotoRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhotoService {

    private static final int MAX_PHOTOS = 5;
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "webp");

    private final UserPhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 사진 업로드.
     * 첫 번째 사진이면 자동으로 대표 사진(isPrimary=true) 으로 설정.
     */
    @Transactional
    public UserPhoto uploadPhoto(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        validateFile(file);

        int currentCount = photoRepository.countByUser_UserId(userId);
        if (currentCount >= MAX_PHOTOS) {
            throw new CustomException(ErrorCode.PHOTO_LIMIT_EXCEEDED);
        }

        String savedFileName = saveFile(file);
        String filePath = Paths.get(uploadDir, savedFileName).toString();
        boolean isFirst = (currentCount == 0);

        UserPhoto photo = UserPhoto.builder()
                .user(user)
                .fileName(savedFileName)
                .filePath(filePath)
                .originalName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .isPrimary(isFirst)
                .photoOrder((byte) currentCount)
                .build();

        return photoRepository.save(photo);
    }

    /**
     * 대표 사진 변경.
     */
    @Transactional
    public void setPrimaryPhoto(Long userId, Long photoId) {
        UserPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new CustomException(ErrorCode.PHOTO_NOT_FOUND));

        if (!photo.getUser().getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        photoRepository.clearPrimaryByUserId(userId);
        photo.markAsPrimary();
    }

    /**
     * 사진 삭제.
     */
    @Transactional
    public void deletePhoto(Long userId, Long photoId) {
        UserPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new CustomException(ErrorCode.PHOTO_NOT_FOUND));

        if (!photo.getUser().getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        // 파일 시스템에서 삭제
        try {
            Files.deleteIfExists(Paths.get(photo.getFilePath()));
        } catch (IOException e) {
            // 파일 삭제 실패는 로그만 남기고 DB 삭제는 진행
        }

        photoRepository.delete(photo);
    }

    public List<UserPhoto> getPhotos(Long userId) {
        return photoRepository.findByUser_UserIdOrderByPhotoOrderAsc(userId);
    }

    // ── private ─────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new CustomException(ErrorCode.EMPTY_FILE);

        String originalName = file.getOriginalFilename();
        if (originalName == null) throw new CustomException(ErrorCode.INVALID_FILE);

        String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new CustomException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }

    private String saveFile(MultipartFile file) {
        String ext = file.getOriginalFilename()
                .substring(file.getOriginalFilename().lastIndexOf('.') + 1).toLowerCase();
        String savedName = UUID.randomUUID() + "." + ext;

        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            file.transferTo(dir.resolve(savedName));
        } catch (IOException e) {
            throw new CustomException(ErrorCode.FILE_SAVE_FAILED);
        }
        return savedName;
    }
}
