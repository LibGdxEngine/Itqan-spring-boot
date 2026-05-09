package com.itqan.edu.features.students;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.students.dto.StudentRequest;
import com.itqan.edu.features.students.dto.StudentResponse;
import com.itqan.edu.features.students.mapper.StudentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final StudentMapper studentMapper;

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (studentRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Phone number already exists");
        }

        Student student = studentMapper.toEntity(request);
        student.setActive(true);
        student = studentRepository.save(student);
        return studentMapper.toResponse(student);
    }

    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        return studentMapper.toResponse(student);
    }

    public StudentResponse getStudentByEmail(String email) {
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        return studentMapper.toResponse(student);
    }

    public Optional<StudentResponse> findByEmail(String email) {
        return studentRepository.findByEmail(email).map(studentMapper::toResponse);
    }

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(studentMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<StudentResponse> getAllStudents(Pageable pageable) {
        return studentRepository.findAll(pageable)
                .map(studentMapper::toResponse);
    }

    public List<StudentResponse> getActiveStudents() {
        return studentRepository.findByActiveTrue().stream()
                .map(studentMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<StudentResponse> getActiveStudents(Pageable pageable) {
        return studentRepository.findByActiveTrue(pageable)
                .map(studentMapper::toResponse);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));

        // Check if email is being changed and if it's already taken
        if (!student.getEmail().equals(request.getEmail()) &&
                studentRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // Check if phone number is being changed and if it's already taken
        if (!student.getPhoneNumber().equals(request.getPhoneNumber()) &&
                studentRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Phone number already exists");
        }

        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setAddress(request.getAddress());

        student = studentRepository.save(student);
        return studentMapper.toResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        studentRepository.delete(student);
    }

    @Transactional
    public StudentResponse deactivateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STUDENT_NOT_FOUND));
        student.setActive(false);
        student = studentRepository.save(student);
        return studentMapper.toResponse(student);
    }
}
