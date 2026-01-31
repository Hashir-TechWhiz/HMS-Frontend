"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Calendar, User, Hash } from "lucide-react";
import { format } from "date-fns";

interface PaymentHistoryCardProps {
    payments: IPayment[];
    totalAmount: number;
    totalPaid: number;
    balance: number;
}

const PaymentHistoryCard = ({
    payments,
    totalAmount,
    totalPaid,
    balance,
}: PaymentHistoryCardProps) => {
    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    const getPaymentMethodIcon = (method: PaymentMethod) => {
        return method === "card" ? CreditCard : Banknote;
    };

    const getPaymentMethodColor = (method: PaymentMethod) => {
        return method === "card"
            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
            : "bg-green-500/10 text-green-500 border-green-500/20";
    };

    return (
        <Card className="overflow-hidden transition-all duration-500 group table-bg-gradient border border-white/20">
            <CardHeader className="border-b border-white/10">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Financial Summary */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-muted-foreground">Total Amount</span>
                        <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                        <span className="font-semibold text-green-500">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-foreground">Balance Due</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(balance)}</span>
                    </div>
                </div>

                {/* Payment History */}
                {payments.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Payment History
                        </h4>
                        <div className="space-y-2">
                            {payments.map((payment, index) => {
                                const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                                return (
                                    <div
                                        key={payment._id || index}
                                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={`${getPaymentMethodColor(payment.paymentMethod)} flex items-center gap-1.5 px-2 py-0.5`}
                                                    >
                                                        <PaymentIcon className="h-3 w-3" />
                                                        <span className="text-xs font-medium capitalize">
                                                            {payment.paymentMethod}
                                                        </span>
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(payment.paymentDate), "MMM dd, yyyy 'at' hh:mm a")}
                                                    </span>
                                                </div>
                                                {payment.transactionId && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Hash className="h-3 w-3" />
                                                        <span>Transaction: {payment.transactionId}</span>
                                                    </div>
                                                )}
                                                {payment.processedBy && typeof payment.processedBy === "object" && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        <span>Processed by: {payment.processedBy.name}</span>
                                                    </div>
                                                )}
                                                {payment.notes && (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {payment.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-green-500">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No Payments Message */}
                {payments.length === 0 && (
                    <div className="text-center py-6">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No payments made yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PaymentHistoryCard;
