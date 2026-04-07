package com.itqan.edu.features.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedStripeEventRepository extends JpaRepository<ProcessedStripeEvent, Long> {

    boolean existsByEventId(String eventId);
}
