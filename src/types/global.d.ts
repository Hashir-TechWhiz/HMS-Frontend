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
    type BookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';

    interface IBooking {
        _id: string;
        guest: IUser | string;
        room: IRoom | string;
        checkInDate: string;
        checkOutDate: string;
        totalPrice: number;
        status: BookingStatus;
        createdBy: IUser | string;
        createdAt: string;
        updatedAt: string;
    }

    // Service Request Types
    type ServiceType = 'housekeeping' | 'room-service' | 'maintenance' | 'concierge';
    type ServiceStatus = 'pending' | 'in-progress' | 'completed';

    interface IServiceRequest {
        _id: string;
        booking: IBooking | string;
        guest: IUser | string;
        room: IRoom | string;
        serviceType: ServiceType;
        status: ServiceStatus;
        assignedRole?: string;
        notes?: string;
        createdAt: string;
        updatedAt: string;
    }
}

export { };