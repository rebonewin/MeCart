export function passwordStrength(value: string): {
  score: number;
  label: string;
  checks: { uppercase: boolean; lowercase: boolean; number: boolean; special: boolean; length: boolean };
} {
  const checks = {
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
    length: value.length >= 8,
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  return { score, label, checks };
}
