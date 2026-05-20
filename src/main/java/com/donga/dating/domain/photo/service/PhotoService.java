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
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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
     * - 대표사진(isPrimary=true) 삭제 시 남은 사진 중 첫 번째를 자동으로 대표사진으로 설정
     * - 삭제 후 나머지 사진의 photoOrder를 0부터 재정렬
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

        boolean wasPrimary = photo.getIsPrimary();
        photoRepository.delete(photo);

        // 남은 사진들 재정렬
        List<UserPhoto> remainingPhotos = photoRepository.findByUser_UserIdOrderByPhotoOrderAsc(userId);
        for (int i = 0; i < remainingPhotos.size(); i++) {
            remainingPhotos.get(i).updateOrder((byte) i);
        }

        // 대표사진이 삭제됐고 남은 사진이 있으면, 첫 번째 사진을 대표로 설정
        if (wasPrimary && !remainingPhotos.isEmpty()) {
            remainingPhotos.get(0).markAsPrimary();
        }
    }

    /**
     * 사진 목록 조회 (대표사진 우선).
     * 대표사진(isPrimary=true)을 먼저 반환, 나머지는 photoOrder 순서로 정렬
     */
    public List<UserPhoto> getPhotos(Long userId) {
        List<UserPhoto> photos = photoRepository.findByUser_UserIdOrderByPhotoOrderAsc(userId);
        // 대표사진 우선으로 정렬
        return photos.stream()
                .sorted((p1, p2) -> {
                    // isPrimary가 true인 것 우선 (true > false, 따라서 역순)
                    if (Boolean.TRUE.equals(p1.getIsPrimary()) && !Boolean.TRUE.equals(p2.getIsPrimary())) {
                        return -1; // p1이 먼저
                    }
                    if (!Boolean.TRUE.equals(p1.getIsPrimary()) && Boolean.TRUE.equals(p2.getIsPrimary())) {
                        return 1; // p2가 먼저
                    }
                    // isPrimary가 같으면 photoOrder 순서
                    return Byte.compare(p1.getPhotoOrder(), p2.getPhotoOrder());
                })
                .toList();
    }

    // ── private ─────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new CustomException(ErrorCode.EMPTY_FILE);

        // 파일 크기 검증 (5MB 제한)
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

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
