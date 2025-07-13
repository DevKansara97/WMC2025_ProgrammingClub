package com.au.cl.dto;

import com.au.cl.model.Transaction.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for handling payment requests from the admin dashboard.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    @NotBlank(message = "Recipient username cannot be blank.")
    private String recipientUsername;

    @NotNull(message = "Amount cannot be null.")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private Double amount; // Using Double to match HTML input type, consider BigDecimal

    @NotNull(message = "Transaction type cannot be null.")
    private TransactionType transactionType; // SEND_MONEY or SALARY

    // Optional for 'advanced' payment type
    private Double advancedAmount; // Only applicable if transactionType is 'ADVANCED' (or similar logic)
    private String description; // Optional description for the transaction
}
