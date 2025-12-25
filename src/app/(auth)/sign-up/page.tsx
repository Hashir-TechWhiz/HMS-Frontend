'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import { registerGuest } from '@/services/authService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SignUp = () => {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ISignUpFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ISignUpFormData) => {
        try {
            const response = await registerGuest(data);

            if (response.success) {
                await refreshUser();
                toast.success('Account created successfully!');
                router.push('/dashboard');
            } else {
                // Parse backend error message and map to form fields
                const errorMessage = response.message || 'Registration failed';
                const lowerCaseError = errorMessage.toLowerCase();

                // Check if error is related to name field
                if (lowerCaseError.includes('name')) {
                    setError('name', {
                        type: 'manual',
                        message: errorMessage,
                    });
                }
                // Check if error is related to email field
                else if (lowerCaseError.includes('email')) {
                    setError('email', {
                        type: 'manual',
                        message: errorMessage,
                    });
                }
                // Check if error is related to password field
                else if (lowerCaseError.includes('password')) {
                    setError('password', {
                        type: 'manual',
                        message: errorMessage,
                    });
                }
                // For general errors, show toast notification
                else {
                    toast.error(errorMessage);
                }
            }
        } catch {
            toast.error('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <>
            <div className="flex flex-col text-center max-w-sm mb-5 gap-1">
                <h1 className="text-white text-xl">
                    Create your HMS account
                </h1>

                <p className="text-xs lg:text-sm text-primary-100">
                    Sign up to access and manage hotel operations efficiently.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
                {/* Name */}
                <InputField
                    name="name"
                    label="Full Name"
                    placeholder="Enter your full name"
                    register={register}
                    error={errors.name}
                    validation={{
                        required: "Full name is required",
                        minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters long",
                        },
                    }}
                />

                {/* Email */}
                <InputField
                    name="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address",
                        },
                    }}
                />

                {/* Password */}
                <InputField
                    name="password"
                    label="Password"
                    placeholder="Create a password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: "Password is required",
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters long",
                        },
                    }}
                />

                {/* Button */}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="main-button-gradient w-full"
                >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                {/* Redirect to Sign In */}
                <p className="text-sm text-center text-primary-100">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primary-200 hover:text-primary-100 transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </form>
        </>
    );
};

export default SignUp;
