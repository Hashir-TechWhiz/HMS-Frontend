"use client";

import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onPaymentSuccess: () => void;
    onPaymentCancel: () => void;
}

const PaymentDialog = ({
    open,
    onOpenChange,
    totalAmount,
    onPaymentSuccess,
    onPaymentCancel,
}: PaymentDialogProps) => {
    const handlePaymentSuccess = () => {
        onPaymentSuccess();
    };

    const handlePaymentCancel = () => {
        onPaymentCancel();
        onOpenChange(false);
    };

    return (
        <DialogBox
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handlePaymentCancel();
                }
            }}
            title="Complete Payment"
            description={`Please enter your card details to complete the booking payment of LKR ${totalAmount.toLocaleString()}`}
            showFooter={false}
            widthClass="max-w-md"
            centerTitle={false}
        >
            <div className="py-4">
                <CardPayment
                    totalAmount={totalAmount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentCancel={handlePaymentCancel}
                    submitButtonText="Pay Now"
                    showTestModeNotice={true}
                />
            </div>
        </DialogBox>
    );
};

export default PaymentDialog;

