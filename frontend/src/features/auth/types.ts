export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type SignUpResponse = { message: string };

export type VerifyEmailResponse = {
  message: string;
  alreadyVerified: boolean;
};
