'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';

const SignUp = () => {
    const {
        register,
        formState: { errors, isSubmitting },
    } = useForm<ISignUpFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

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

            <form className="space-y-5 w-full">
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
                    type="button"
                    disabled={isSubmitting}
                    className="main-button-gradient w-full"
                >
                    Create Account
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
