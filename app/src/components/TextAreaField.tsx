import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ id, label, error, className = "", ...props }, ref) => {
  const inputId = id ?? props.name ?? label;
  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      <span>{label}</span>
      <textarea id={inputId} ref={ref} {...props} />
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  );
});

TextAreaField.displayName = "TextAreaField";
