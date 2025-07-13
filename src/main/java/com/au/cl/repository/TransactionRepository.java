package com.au.cl.repository;

import com.au.cl.model.Transaction;
import com.au.cl.model.Transaction.TransactionType; // Import the inner enum
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Find transactions by sender or receiver (for history)
    List<Transaction> findBySenderIdOrReceiverIdOrderByTransactionDateDesc(Long senderId, Long receiverId);

    // Find all transactions ordered by transaction date descending (for admin history)
    List<Transaction> findAllByOrderByTransactionDateDesc();

    // Find transactions by transaction type within a date range
    List<Transaction> findByTransactionTypeAndTransactionDateBetween(TransactionType type, LocalDateTime startDate, LocalDateTime endDate);

    // Count total payments for a given period and type (for dashboard stats)
    long countByTransactionTypeAndTransactionDateBetween(TransactionType type, LocalDateTime startDate, LocalDateTime endDate);
}
