package com.jatin.ecommerce_api.controller;

import com.jatin.ecommerce_api.entity.*;
import com.jatin.ecommerce_api.repository.*;
import com.jatin.ecommerce_api.repository.UserRepository;
import com.jatin.ecommerce_api.repository.ProductRepository;
import com.razorpay.Order.*;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    @Autowired private CartRepository cartRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private RazorpayClient razorpayClient;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Transactional
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(Authentication auth, @RequestBody List<Map<String, Object>> items) throws Exception {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (items == null || items.isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        BigDecimal total = BigDecimal.ZERO;
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);

        for (Map<String, Object> item : items) {
            Long productId = Long.valueOf(item.get("productId").toString());
            Integer quantity = Integer.valueOf(item.get("quantity").toString());

            Product product = productRepository.findById(productId).orElseThrow();
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            total = total.add(lineTotal);

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQuantity(quantity);
            oi.setPriceAtPurchase(product.getPrice());
            order.getItems().add(oi);
        }

        order.setTotalAmount(total);

        int amountInPaise = total.multiply(BigDecimal.valueOf(100)).intValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "order_rcpt_" + System.currentTimeMillis());

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        order.setStripePaymentIntentId(razorpayOrder.get("id"));

        orderRepository.save(order);

        Map<String, Object> response = new HashMap<>();
        response.put("razorpayOrderId", razorpayOrder.get("id"));
        response.put("amount", amountInPaise);
        response.put("currency", "INR");
        response.put("internalOrderId", order.getId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) throws Exception {
        String razorpayOrderId = payload.get("razorpay_order_id");
        String razorpayPaymentId = payload.get("razorpay_payment_id");
        String razorpaySignature = payload.get("razorpay_signature");

        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", razorpayOrderId);
        options.put("razorpay_payment_id", razorpayPaymentId);
        options.put("razorpay_signature", razorpaySignature);

        boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

        Order order = orderRepository.findAll().stream()
                .filter(o -> razorpayOrderId.equals(o.getStripePaymentIntentId()))
                .findFirst()
                .orElseThrow();

        if (isValid) {
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            return ResponseEntity.ok("Payment verified, order marked PAID");
        } else {
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            return ResponseEntity.status(400).body("Payment verification failed");
        }
    }
}