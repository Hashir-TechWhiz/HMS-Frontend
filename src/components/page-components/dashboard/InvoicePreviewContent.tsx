"use client";

import { IInvoice } from "@/services/invoiceService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, User, Calendar, DollarSign } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface InvoicePreviewContentProps {
    invoice: IInvoice;
}

const InvoicePreviewContent = ({ invoice }: InvoicePreviewContentProps) => {
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "partially_paid":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "pending":
                return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "refunded":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const formatPaymentStatus = (status: string) => {
        return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="space-y-5 py-4">
            {/* Invoice Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white">INVOICE</h2>
                    <p className="text-sm text-muted-foreground">
                        #{invoice.invoiceNumber}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                        {formatPaymentStatus(invoice.paymentStatus)}
                    </Badge>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Generated</p>
                        <p className="text-xs font-medium">
                            {formatDateTime(invoice.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Hotel & Guest Details */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-300">
                        <Building2 className="h-4 w-4" />
                        <h3 className="font-semibold">Hotel Details</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="font-medium text-white">
                            {invoice.hotelDetails.name}
                        </p>
                        <p className="text-muted-foreground">
                            {invoice.hotelDetails.address}
                        </p>
                        <p className="text-muted-foreground">
                            {invoice.hotelDetails.city}, {invoice.hotelDetails.country}
                        </p>
                        <p className="text-muted-foreground">
                            {invoice.hotelDetails.contactEmail}
                        </p>
                        <p className="text-muted-foreground">
                            {invoice.hotelDetails.contactPhone}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-300">
                        <User className="h-4 w-4" />
                        <h3 className="font-semibold">Guest Details</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="font-medium text-white">
                            {invoice.guestDetails.name}
                        </p>
                        {invoice.guestDetails.email && (
                            <p className="text-muted-foreground">
                                {invoice.guestDetails.email}
                            </p>
                        )}
                        {invoice.guestDetails.phone && (
                            <p className="text-muted-foreground">
                                {invoice.guestDetails.phone}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Stay Details */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-300">
                    <Calendar className="h-4 w-4" />
                    <h3 className="font-semibold">Stay Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Room</p>
                        <p className="font-medium">
                            {invoice.stayDetails.roomNumber} ({invoice.stayDetails.roomType})
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Number of Nights</p>
                        <p className="font-medium">{invoice.stayDetails.numberOfNights}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">
                            {new Date(invoice.stayDetails.checkInDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-medium">
                            {new Date(invoice.stayDetails.checkOutDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Room Charges */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary-300">
                    <DollarSign className="h-4 w-4" />
                    <h3 className="font-semibold">Room Charges</h3>
                </div>
                <div className="search-gradient rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per Night</span>
                        <span className="font-medium">
                            LKR {invoice.roomCharges.pricePerNight.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number of Nights</span>
                        <span className="font-medium">
                            {invoice.roomCharges.numberOfNights}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                        <span>Subtotal</span>
                        <span>LKR {invoice.roomCharges.subtotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Service Charges */}
            {invoice.serviceCharges.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-3">
                        <h3 className="font-semibold text-primary-300">Service Charges</h3>
                        <div className="search-gradient rounded-lg p-4 space-y-2">
                            {invoice.serviceCharges.map((service, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium">{service.serviceType}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {service.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {service.quantity} × LKR{" "}
                                            {service.unitPrice.toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="font-medium">
                                        LKR {service.total.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <Separator />

            {/* Summary */}
            <div className="space-y-3">
                <h3 className="font-semibold text-primary-300">Summary</h3>
                <div className="search-gradient rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room Charges Total</span>
                        <span className="font-medium">
                            LKR {invoice.summary.roomChargesTotal.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Charges Total</span>
                        <span className="font-medium">
                            LKR {invoice.summary.serviceChargesTotal.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                            LKR {invoice.summary.subtotal.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">
                            LKR {invoice.summary.tax.toLocaleString()}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total</span>
                        <span className="text-primary-300">
                            LKR {invoice.summary.grandTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Email Status */}
            {invoice.emailSent && invoice.emailSentAt && (
                <div className="text-xs text-muted-foreground text-center">
                    Email sent to {invoice.guestDetails.email} on{" "}
                    {formatDateTime(invoice.emailSentAt)}
                </div>
            )}
        </div>
    );
};

export default InvoicePreviewContent;
