USE ClinicManagementDB;
GO

SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @ExaminationId INT = 2;
DECLARE @CashierUserId INT;
DECLARE @InvoiceId INT;
DECLARE @PaymentId INT;
DECLARE @TotalAmount DECIMAL(18,2);

SELECT @CashierUserId = UserId
FROM Users
WHERE Username = 'thungan';


/* 1. Nếu ExaminationId = 2 đã có invoice thì xem invoice đó.
      Nếu chưa có thì tạo mới từ phiếu khám. */

SELECT @InvoiceId = InvoiceId
FROM Invoices
WHERE ExaminationId = @ExaminationId
  AND Status <> 'Cancelled';

IF @InvoiceId IS NULL
BEGIN
    EXEC dbo.sp_CreateInvoiceFromExamination
        @ExaminationId = @ExaminationId,
        @CreatedBy = @CashierUserId,
        @NewInvoiceId = @InvoiceId OUTPUT;
END

SELECT @InvoiceId AS InvoiceId;


/* 2. Xem chi tiết hóa đơn */
EXEC dbo.sp_GetInvoiceDetail
    @InvoiceId = @InvoiceId;


/* 3. Lấy danh sách hóa đơn chưa thanh toán */
EXEC dbo.sp_GetUnpaidInvoices;


/* 4. Lấy tổng tiền để thanh toán */
SELECT @TotalAmount = TotalAmount
FROM Invoices
WHERE InvoiceId = @InvoiceId;

SELECT @TotalAmount AS TotalAmount;


/* 5. Thanh toán hóa đơn */
EXEC dbo.sp_PayInvoice
    @InvoiceId = @InvoiceId,
    @Amount = @TotalAmount,
    @PaymentMethod = 'Cash',
    @PaidBy = @CashierUserId,
    @Note = N'Thanh toán tiền mặt tại quầy',
    @NewPaymentId = @PaymentId OUTPUT;

SELECT @PaymentId AS PaymentId;


/* 6. Kiểm tra lại hóa đơn */
EXEC dbo.sp_GetInvoiceDetail
    @InvoiceId = @InvoiceId;


/* 7. Kiểm tra doanh thu */
SELECT *
FROM vw_Manager_RevenueByDay
ORDER BY RevenueDate DESC;


/* 8. Test thanh toán lại cùng hóa đơn
   Đoạn này phải lỗi:
   Hóa đơn không còn ở trạng thái Unpaid.
*/
EXEC dbo.sp_PayInvoice
    @InvoiceId = @InvoiceId,
    @Amount = @TotalAmount,
    @PaymentMethod = 'Cash',
    @PaidBy = @CashierUserId,
    @Note = N'Test thanh toán lại',
    @NewPaymentId = @PaymentId OUTPUT;
GO