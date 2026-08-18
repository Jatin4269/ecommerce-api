package com.jatin.ecommerce_api.repository;

import com.jatin.ecommerce_api.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}