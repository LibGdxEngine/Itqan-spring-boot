package com.itqan.edu.features.students;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Resolves the student profile behind the signed-in account. */
@Service
@RequiredArgsConstructor
public class CurrentStudentService {

    private final StudentRepository studentRepository;

    public Optional<Student> find(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Optional.empty();
        }
        return studentRepository.findByEmail(authentication.getName());
    }

    public Student require(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
    }
}
