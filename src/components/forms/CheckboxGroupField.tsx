import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

interface CheckboxGroupFieldProps {
    name: string;
    label: string;
    options: string[];
    value: string[];
    onChange: (value: string[]) => void;
    error?: string;
}

const CheckboxGroupField = ({
    name,
    label,
    options,
    value,
    onChange,
    error,
}: CheckboxGroupFieldProps) => {
    const handleCheckboxChange = (option: string, checked: boolean) => {
        if (checked) {
            onChange([...value, option]);
        } else {
            onChange(value.filter((item) => item !== option));
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-sm font-medium text-gray-400">
                {label}
            </Label>
            <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${name}-${option}`}
                            checked={value.includes(option)}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange(option, checked as boolean)
                            }
                            className="border-gray-500/50 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                        />
                        <label
                            htmlFor={`${name}-${option}`}
                            className="text-sm text-gray-300 cursor-pointer select-none"
                        >
                            {option}
                        </label>
                    </div>
                ))}
            </div>
            {error && <p className="text-sm text-error-500">{error}</p>}
        </div>
    );
};

export default CheckboxGroupField;
