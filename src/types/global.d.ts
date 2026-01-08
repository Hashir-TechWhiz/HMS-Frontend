declare global {
    // Auth
    interface ISignInFormData {
        email: string;
        password: string;
    }

    interface ISignUpFormData {
        name: string;
        email: string;
        password: string;
    }

    interface IForgotPasswordForm {
        email: string;
        otp: string;
        newPassword: string;
        confirmPassword: string;
    }

    // UI FORM TYPES
    type NavLink = {
        label: string;
        href: string;
        icon: string;
        roles: UserRole[];
    };

    type NavSection = {
        title: string;
        links: NavLink[];
    };

    type IFormInputProps = {
        name: string;
        label?: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister<any>;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
        autoComplete?: string;
        height?: string;
        readonly?: boolean;
        icon?: React.ReactNode;
        maxLength?: number;
    };

    type IFormTextareaProps = {
        name: string;
        label?: string;
        placeholder: string;
        register: UseFormRegister<any>;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
        rows?: number;
        maxWords?: number;
    };

    type ISelectFieldProps = {
        name?: string;
        label?: string;
        placeholder?: string;
        options: Option[];
        control?: any;
        error?: any;
        required?: boolean;
        value?: string;
        className?: string;
        iconColor?: string;
        width?: string;
        disabled?: boolean;
        onChange?: (value: string) => void;
    };

    type Option = {
        value: string;
        label: string;
    };

    // API Response Types (aligned with backend contract)
    interface ApiSuccessResponse<T = any> {
        success: true;
        message?: string;
        data: T;
    }

    interface ApiErrorResponse {
        success: false;
        message: string;
    }

    type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

    interface PaginationMeta {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    }

    interface PaginatedResponse<T> {
        items: T[];
        pagination: PaginationMeta;
    }

    // User Types
    type UserRole = 'guest' | 'receptionist' | 'housekeeping' | 'admin';

    interface IUser {
        _id: string;
        name: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }

    // Room Types (matches backend schema exactly)
    type RoomType = 'Single' | 'Double' | 'Suite' | 'Deluxe' | 'Presidential';
    type RoomStatus = 'available' | 'unavailable' | 'maintenance';

    interface IRoom {
        _id: string;
        roomNumber: string;
        roomType: RoomType;
        pricePerNight: number;
        capacity: number;
        status: RoomStatus;
        description: string;
        images: string[]; // Array of image URLs (1-4 images required)
        createdAt: string;
        updatedAt: string;
    }

    // Booking Types
    type BookingStatus = 'pending' | 'confirmed' | 'checkedin' | 'completed' | 'cancelled';

    interface IBooking {
        _id: string;
        guest?: IUser | string; // Optional - only for guest bookings
        customerDetails?: {
            name: string;
            phone: string;
            email?: string; // Optional
        }; // Optional - only for walk-in bookings
        createdBy?: IUser | string; // Optional - only for staff-created bookings
        room: IRoom | string;
        checkInDate: string;
        checkOutDate: string;
        status: BookingStatus;
        createdAt: string;
        updatedAt: string;
        // Cancellation penalty fields (for staff-managed cancellations)
        cancellationPenalty?: number;
        cancelledBy?: IUser | string;
        cancellationReason?: string;
        cancellationDate?: string;
    }

    // Date filter types for API queries
    interface IDateRangeFilter {
        from?: string; // ISO date string
        to?: string; // ISO date string
    }

    // Service Request Types
    type ServiceType = 'housekeeping' | 'room_service' | 'maintenance';
    type ServiceStatus = 'pending' | 'in_progress' | 'completed';

    interface IServiceRequest {
        _id: string;
        booking: IBooking | string;
        guest?: IUser | string;
        room: IRoom | string;
        requestedBy?: IUser | string;
        serviceType: ServiceType;
        status: ServiceStatus;
        assignedRole?: string;
        assignedTo?: IUser | string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
    }

    // Service Request filter types for API queries
    interface IServiceRequestFilters extends IDateRangeFilter {
        status?: ServiceStatus;
        serviceType?: ServiceType;
        assignedRole?: string;
        roomId?: string;
    }

    // Report Types (matching backend response structure)
    interface IBookingReport {
        totalBookings: number;
        byStatus: {
            pending: number;
            confirmed: number;
            checkedin: number;
            completed: number;
            cancelled: number;
        };
    }

    interface IRoomReport {
        totalRooms: number;
        byStatus: {
            available: number;
            unavailable: number;
            maintenance: number;
        };
    }

    interface IServiceRequestReport {
        totalServiceRequests: number;
        byStatus: {
            pending: number;
            in_progress: number;
            completed: number;
        };
        byAssignedRole: {
            housekeeping: number;
            maintenance: number;
        };
    }

    interface IReportOverview {
        bookings: IBookingReport;
        rooms: IRoomReport;
        serviceRequests: IServiceRequestReport;
    }

    // Detailed Report Types
    interface IDetailedBookingReport {
        _id: string;
        guest?: {
            _id: string;
            name: string;
            email: string;
        };
        customerDetails?: {
            name: string;
            phone: string;
            email?: string;
        };
        createdBy?: {
            _id: string;
            name: string;
        };
        room: {
            _id: string;
            roomNumber: string;
            roomType: string;
        };
        checkInDate: string;
        checkOutDate: string;
        status: BookingStatus;
        createdAt: string;
        updatedAt: string;
    }

    interface IPaymentReport {
        _id: string;
        bookingId: string;
        guestName: string;
        amount: number;
        paymentMethod: string;
        paymentStatus: string;
        createdAt: string;
    }

    interface IRoomUtilizationReport {
        _id: string;
        roomNumber: string;
        roomType: string;
        status: string;
        totalBookings: number;
    }

    interface IDetailedServiceRequestReport {
        _id: string;
        booking: string;
        room: {
            _id: string;
            roomNumber: string;
        };
        requestedBy?: {
            _id: string;
            name: string;
        };
        serviceType: ServiceType;
        status: ServiceStatus;
        assignedRole?: string;
        assignedTo?: {
            _id: string;
            name: string;
        };
        notes?: string;
        createdAt: string;
        updatedAt: string;
    }

    interface IGuestReport {
        _id: string;
        name: string;
        email: string;
        isActive: boolean;
        totalBookings: number;
        createdAt: string;
    }
}

export { };