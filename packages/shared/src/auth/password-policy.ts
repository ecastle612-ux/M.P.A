/** Authoritative application password contract. Sign-in must not enforce this. */
export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_TOO_SHORT_MESSAGE = `Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`;

export function meetsMinPasswordLength(password: string | null | undefined): password is string {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}
