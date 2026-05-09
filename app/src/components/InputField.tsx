import { forwardRef, type InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ id, label, error, className = "", ...props }, ref) => {
    const inputId = id ?? props.name ?? label;
    return (
      <label className={`field ${className}`.trim()} htmlFor={inputId}>
        <span>{label}</span>
        <input id={inputId} ref={ref} {...props} />
        {error ? <em className="field-error">{error}</em> : null}
      </label>
    );
  },
);

InputField.displayName = "InputField";
