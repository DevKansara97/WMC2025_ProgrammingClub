package com.au.cl.dto;

import com.au.cl.model.Transaction.TransactionType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for displaying transaction details in the frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long id;
    private String senderUsername;
    private String receiverUsername;
    private Double amount;
    private TransactionType transactionType;
    private LocalDateTime transactionDate;
    private String description;
}
