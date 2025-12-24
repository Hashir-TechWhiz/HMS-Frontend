import { useState } from "react";
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Eye, EyeOff } from "lucide-react";

const InputField = ({
    name,
    label,
    placeholder,
    type = "text",
    register,
    error,
    validation,
    disabled,
    value,
    autoComplete = "on",
    height = "h-12",
    readonly = false
}: IFormInputProps) => {

    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";

    return (
        <div className='space-y-2'>

            <Label htmlFor={name} className="text-sm font-medium text-gray-400">
                {label}
            </Label>

            <div className="relative">
                <Input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    id={name}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value}
                    autoComplete={autoComplete}
                    readOnly={readonly}
                    className={cn(
                        "text-white text-base placeholder:text-gray-500 border border-gray-500/20 backdrop-blur-2xl rounded-lg pr-10",
                        { 'pointer-events-none disable-rings!': readonly },
                        { 'opacity-50 cursor-not-allowed': disabled },
                        height,
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...register(name, validation)}
                />

                {isPassword && !readonly && !disabled && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            {error && <p className="text-sm text-error-500">{error.message}</p>}
        </div>
    );
};

export default InputField;
