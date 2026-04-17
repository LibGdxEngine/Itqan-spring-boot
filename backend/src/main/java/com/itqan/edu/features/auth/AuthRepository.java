package com.itqan.edu.features.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);
    Page<User> findByRole(User.Role role, Pageable pageable);
    Optional<User> findByIdAndRole(Long id, User.Role role);
    boolean existsBySuperAdminTrue();
    boolean existsBySuperAdminTrueAndEnabledTrue();
    long countBySuperAdminTrue();
    long countBySuperAdminTrueAndEnabledTrue();

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT u.role, COUNT(u) FROM User u GROUP BY u.role")
    List<Object[]> countByRoleGrouped();

    long countByLastLoginAtAfter(LocalDateTime since);
}
