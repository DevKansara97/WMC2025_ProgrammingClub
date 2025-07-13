package com.au.cl.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime; // Use java.time for modern date/time handling

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User sender; // User who sent the money

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_user_id", nullable = false)
    private User receiver; // User who received the money

    @Column(nullable = false)
    private Double amount; // Using Double for simplicity, but BigDecimal is recommended for currency

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType; // Enum for transaction type (SEND_MONEY, SALARY)

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now(); // Default to current timestamp

    @Column(length = 500)
    private String description;

    // Enum for Transaction Types
    public enum TransactionType {
        SEND_MONEY,
        SALARY
    }
}
