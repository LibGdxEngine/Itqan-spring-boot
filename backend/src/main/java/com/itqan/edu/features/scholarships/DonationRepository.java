package com.itqan.edu.features.scholarships;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long>, JpaSpecificationExecutor<Donation> {

    Optional<Donation> findByGatewayReference(String gatewayReference);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d " +
            "WHERE d.status = com.itqan.edu.features.scholarships.DonationStatus.COMPLETED")
    Double sumCompleted();

    @Query("SELECT COUNT(d) FROM Donation d " +
            "WHERE d.status = com.itqan.edu.features.scholarships.DonationStatus.COMPLETED")
    long countCompleted();
}
