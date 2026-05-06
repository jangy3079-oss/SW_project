package com.donga.dating.domain.photo.repository;

import com.donga.dating.domain.photo.entity.UserPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {

    List<UserPhoto> findByUser_UserIdOrderByPhotoOrderAsc(Long userId);

    Optional<UserPhoto> findByUser_UserIdAndIsPrimaryTrue(Long userId);

    int countByUser_UserId(Long userId);

    @Modifying
    @Query("UPDATE UserPhoto p SET p.isPrimary = false WHERE p.user.userId = :userId")
    void clearPrimaryByUserId(Long userId);
}
