'use client';

import React from 'react';

interface StepperProps {
    steps: string[];
    currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({
    steps,
    currentStep,
}) => {
    return (
        <div className="flex flex-col items-center justify-between max-w-sm w-full select-none">
            <div className="flex items-center justify-between w-full">
                {steps.map((_, index) => (
                    <React.Fragment key={index}>
                        {/* Step Circle */}
                        <div
                            className={`relative rounded-full w-10 h-10 mx-2 flex items-center justify-center
                                ${currentStep === index + 1
                                    ? 'stepper-gradient text-black-500 font-bold'
                                    : currentStep > index + 1
                                        ? 'stepper-gradient text-black-500 font-bold'
                                        : 'border border-white text-white'}
                            `}
                        >
                            {/* Step number instead of dot */}
                            <span className="text-[10px] md:text-sm">{index + 1}</span>
                        </div>

                        {/* Connecting line */}
                        {index !== steps.length - 1 && (
                            <div
                                className={`flex-grow h-[0.5px]
                                    ${currentStep > index + 1 ? 'bg-primary-100' : 'bg-gray-200'}
                                `}
                            ></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Stepper;
