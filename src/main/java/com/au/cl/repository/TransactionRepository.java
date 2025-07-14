package com.au.cl.repository;

import com.au.cl.model.Transaction;
import com.au.cl.model.Transaction.TransactionType;
import com.au.cl.model.User; // Import User
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

    // New: Find transactions where the current user is either sender or receiver
    List<Transaction> findBySenderOrReceiverOrderByTransactionDateDesc(User sender, User receiver);

    // New: Find the last transaction for a user (either sender or receiver)
    List<Transaction> findTop1BySenderOrReceiverOrderByTransactionDateDesc(User sender, User receiver);

    // New: Sum of amounts where the user is the receiver within a date range
    // This is for calculating monthly earnings
    List<Transaction> findByReceiverAndTransactionDateBetween(User receiver, LocalDateTime startDate, LocalDateTime endDate);
}
