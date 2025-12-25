'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import InputField from '@/components/forms/InputField';
import { login } from '@/services/authService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SignIn = () => {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ISignInFormData>({
        defaultValues: { email: '', password: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ISignInFormData) => {
        try {
            const response = await login(data);

            if (response.success) {
                // Refresh user context after successful login
                await refreshUser();
                toast.success('Login successful!');
                router.push('/dashboard');
            } else {
                // Parse backend error message and map to form fields
                const errorMessage = response.message || 'Login failed';
                const lowerCaseError = errorMessage.toLowerCase();

                // Check if error is related to email field
                if (lowerCaseError.includes('email')) {
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
                // Check for invalid credentials (could be either field)
                else if (lowerCaseError.includes('invalid credentials') || lowerCaseError.includes('incorrect')) {
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
            // Only unexpected errors reach here (network issues, etc.)
            // Don't use console.error to avoid Next.js error overlay
            toast.error('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <>
            <div className='flex flex-col text-center max-w-sm mb-5 gap-1'>
                <h1 className='text-white text-xl'>Welcome to HMS</h1>

                <p className='text-xs lg:text-sm text-primary-100'>
                    Sign in to continue to your account.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5 w-full'>
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

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
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

                <div className="flex justify-between items-center text-sm text-primary-100">
                    <div className="flex items-center gap-2">
                        <Checkbox id="remember" defaultChecked className='cursor-pointer' />
                        <Label className='text-primary-200'>Remember me</Label>
                    </div>

                    <Link
                        href="/forgot-password"
                        className="text-primary-200 hover:text-primary-100 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className='main-button-gradient w-full'
                >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Redirect to Sign In */}
                <p className="text-sm text-center text-primary-100">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="text-primary-200 hover:text-primary-100 transition-colors"
                    >
                        Sign Up
                    </Link>
                </p>
            </form>
        </>
    );
};

export default SignIn;
