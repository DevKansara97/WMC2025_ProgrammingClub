package com.au.cl.service;

import com.au.cl.dto.PaymentRequest;
import com.au.cl.dto.TransactionDTO;
import com.au.cl.model.Transaction;
import com.au.cl.model.Transaction.TransactionType;
import com.au.cl.model.User;
import com.au.cl.repository.TransactionRepository;
import com.au.cl.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Handles sending money/salary from one user to another.
     * Updates balances and records the transaction.
     * @param sender The user initiating the transaction (Admin).
     * @param request The payment request details.
     * @return The created TransactionDTO.
     * @throws IllegalArgumentException if recipient not found or amount is invalid.
     */
    @Transactional
    public TransactionDTO sendPayment(User sender, PaymentRequest request) {
        if (request.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be positive.");
        }

        User receiver = userRepository.findByUsername(request.getRecipientUsername())
                .orElseThrow(() -> new IllegalArgumentException("Recipient user not found: " + request.getRecipientUsername()));

        // Update balances (assuming sender is admin and doesn't have a balance deducted)
        // If sender balance should be deducted, add logic here.
        receiver.setBalance(receiver.getBalance() + request.getAmount());
        userRepository.save(receiver); // Save updated receiver balance

        Transaction transaction = new Transaction();
        transaction.setSender(sender);
        transaction.setReceiver(receiver);
        transaction.setAmount(request.getAmount());
        transaction.setTransactionType(request.getTransactionType());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(LocalDateTime.now()); // Ensure timestamp is set

        Transaction savedTransaction = transactionRepository.save(transaction);
        logger.info("Payment of {} {} from {} to {} recorded successfully. Receiver new balance: {}",
                request.getAmount(), request.getTransactionType(), sender.getUsername(), receiver.getUsername(), receiver.getBalance());

        return convertToDto(savedTransaction);
    }

    /**
     * Retrieves all transactions, ordered by date descending (for admin).
     * @return List of TransactionDTOs.
     */
    public List<TransactionDTO> getAllTransactions() {
        return transactionRepository.findAllByOrderByTransactionDateDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the total amount of transactions of a specific type within a date range.
     * @param type The type of transaction (e.g., SALARY).
     * @param startDate The start date (inclusive).
     * @param endDate The end date (inclusive).
     * @return The total amount.
     */
    public double getTotalPaymentsBetween(TransactionType type, LocalDateTime startDate, LocalDateTime endDate) {
        return transactionRepository.findByTransactionTypeAndTransactionDateBetween(type, startDate, endDate)
                .stream()
                .mapToDouble(Transaction::getAmount)
                .sum();
    }

    /**
     * Retrieves transaction history for a specific Avenger (where they are sender or receiver).
     * @param avengerUser The Avenger user.
     * @return List of TransactionDTOs for the given Avenger.
     */
    public List<TransactionDTO> getTransactionsForAvenger(User avengerUser) {
        // Find transactions where the user is either the sender or the receiver
        return transactionRepository.findBySenderOrReceiverOrderByTransactionDateDesc(avengerUser, avengerUser).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves the last transaction for a specific Avenger.
     * @param avengerUser The Avenger user.
     * @return Optional of TransactionDTO for the last transaction.
     */
    public Optional<TransactionDTO> getLastTransactionForAvenger(User avengerUser) {
        // findTop1 will return a list, so get the first element if present
        List<Transaction> lastTransactions = transactionRepository.findTop1BySenderOrReceiverOrderByTransactionDateDesc(avengerUser, avengerUser);
        return lastTransactions.stream().findFirst().map(this::convertToDto);
    }

    /**
     * Calculates total earnings for an Avenger within a given month.
     * Earnings are defined as transactions where the Avenger is the receiver.
     * @param avengerUser The Avenger user.
     * @param startOfMonth Start of the month.
     * @param endOfMonth End of the month.
     * @return Total amount received.
     */
    public double getMonthlyEarningsForAvenger(User avengerUser, LocalDateTime startOfMonth, LocalDateTime endOfMonth) {
        return transactionRepository.findByReceiverAndTransactionDateBetween(avengerUser, startOfMonth, endOfMonth)
                .stream()
                .mapToDouble(Transaction::getAmount)
                .sum();
    }

    /**
     * Converts a Transaction entity to a TransactionDTO.
     * @param transaction The Transaction entity.
     * @return The corresponding TransactionDTO.
     */
    private TransactionDTO convertToDto(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setSenderUsername(transaction.getSender().getUsername());
        dto.setReceiverUsername(transaction.getReceiver().getUsername());
        dto.setAmount(transaction.getAmount());
        dto.setTransactionType(transaction.getTransactionType());
        dto.setTransactionDate(transaction.getTransactionDate());
        dto.setDescription(transaction.getDescription());
        return dto;
    }
}
