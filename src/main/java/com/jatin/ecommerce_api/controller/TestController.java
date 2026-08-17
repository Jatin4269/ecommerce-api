package com.jatin.ecommerce_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test-protected")
    public String testProtected() {
        return "You are authenticated!";
    }
}