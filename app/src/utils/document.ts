const onlyDigits = (value: string): string => value.replace(/\D/g, "");

const isSameDigitSequence = (digits: string): boolean =>
  digits.length > 0 && digits.split("").every((digit) => digit === digits[0]);

const validateCpf = (digits: string): boolean => {
  if (digits.length !== 11 || isSameDigitSequence(digits)) {
    return false;
  }

  const calculateDigit = (size: number) => {
    const sum = digits
      .slice(0, size)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (size + 1 - index), 0);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };

  return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
};

const validateCnpj = (digits: string): boolean => {
  if (digits.length !== 14 || isSameDigitSequence(digits)) {
    return false;
  }

  const calculateDigit = (size: 12 | 13) => {
    const weights =
      size === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = digits
      .slice(0, size)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(digits[12]) && calculateDigit(13) === Number(digits[13]);
};

export const maskCpfCnpj = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
};

export const unmaskDocument = onlyDigits;

export const isValidCpfCnpj = (value: string): boolean => {
  const digits = onlyDigits(value);
  return validateCpf(digits) || validateCnpj(digits);
};
