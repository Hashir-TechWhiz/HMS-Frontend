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
}

export { };