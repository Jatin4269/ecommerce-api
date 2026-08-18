package com.jatin.ecommerce_api.controller;

import com.jatin.ecommerce_api.entity.*;
import com.jatin.ecommerce_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;

    private Cart getOrCreateCart(String email) {
        return cartRepository.findByUserEmail(email).orElseGet(() -> {
            User user = userRepository.findByEmail(email).orElseThrow();
            Cart cart = new Cart();
            cart.setUser(user);
            return cartRepository.save(cart);
        });
    }

    @GetMapping
    public ResponseEntity<Cart> viewCart(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(getOrCreateCart(email));
    }

    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(Authentication auth, @RequestParam Long productId, @RequestParam Integer quantity) {
        String email = auth.getName();
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(productId).orElseThrow();

        CartItem existingItem = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return ResponseEntity.ok(getOrCreateCart(email));
    }

    @Transactional
    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<Cart> removeFromCart(Authentication auth, @PathVariable Long itemId) {
        String email = auth.getName();
        Cart cart = getOrCreateCart(email);

        CartItem itemToRemove = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElse(null);

        if (itemToRemove == null) {
            return ResponseEntity.status(403).build();
        }

        cart.getItems().remove(itemToRemove);
        cartRepository.save(cart);

        return ResponseEntity.ok(cart);
    }
}