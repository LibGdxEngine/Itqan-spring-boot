package com.itqan.edu.features.landingpage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LandingPageRepository extends JpaRepository<LandingPageConfig, Long> {
}
