package com.itqan.edu.features.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    List<Payment> findByStudentId(Long studentId);

    List<Payment> findByStudentIdAndStatus(Long studentId, PaymentStatus status);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

    Optional<Payment> findFirstByStripePaymentIntentId(String stripePaymentIntentId);

    @Query("SELECT p.course.id, p.course.title, p.currency, SUM(p.amount), COUNT(p) FROM Payment p " +
           "WHERE p.status = :status AND p.createdAt BETWEEN :from AND :to " +
           "GROUP BY p.course.id, p.course.title, p.currency ORDER BY SUM(p.amount) DESC")
    List<Object[]> sumRevenueByCourse(@Param("status") PaymentStatus status,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);

    @Query("SELECT p FROM Payment p WHERE p.student.id = :studentId AND p.course.id = :courseId")
    List<Payment> findByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Payment p " +
            "WHERE p.student.id = :studentId AND p.course.id = :courseId AND p.status = 'COMPLETED'")
    boolean hasCompletedPayment(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.student.id = :studentId ORDER BY p.createdAt DESC")
    List<Payment> findHistoryForStudent(@Param("studentId") Long studentId);

    @Query("SELECT p.currency, SUM(p.amount) FROM Payment p WHERE p.status = :status AND p.createdAt BETWEEN :from AND :to GROUP BY p.currency")
    List<Object[]> sumRevenueByCurrency(@Param("status") PaymentStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT p.course.id, p.course.title, SUM(p.amount), COUNT(p) FROM Payment p WHERE p.status = :status GROUP BY p.course.id, p.course.title ORDER BY SUM(p.amount) DESC")
    List<Object[]> findRevenueByCourseSorted(@Param("status") PaymentStatus status);

    @Query("SELECT CAST(p.createdAt AS date), SUM(p.amount), p.currency FROM Payment p WHERE p.status = :status AND p.createdAt BETWEEN :from AND :to GROUP BY CAST(p.createdAt AS date), p.currency ORDER BY CAST(p.createdAt AS date) ASC")
    List<Object[]> findRevenueTrend(@Param("status") PaymentStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT CAST(p.createdAt AS date), p.currency, SUM(p.amount) FROM Payment p " +
           "WHERE p.status = :status AND p.course.id IN :courseIds AND p.createdAt BETWEEN :from AND :to " +
           "GROUP BY CAST(p.createdAt AS date), p.currency")
    List<Object[]> revenuePerDayForCourses(@Param("status") PaymentStatus status,
                                           @Param("courseIds") java.util.Collection<Long> courseIds,
                                           @Param("from") LocalDateTime from,
                                           @Param("to") LocalDateTime to);

    @Query("SELECT p.course.id, p.currency, SUM(p.amount) FROM Payment p " +
           "WHERE p.status = :status AND p.course.id IN :courseIds AND p.createdAt BETWEEN :from AND :to " +
           "GROUP BY p.course.id, p.currency")
    List<Object[]> revenuePerCourse(@Param("status") PaymentStatus status,
                                    @Param("courseIds") java.util.Collection<Long> courseIds,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);
}
