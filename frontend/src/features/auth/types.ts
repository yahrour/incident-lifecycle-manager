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

export type ValidateInviteResponse = {
  email: string;
  isAlreadyRegistered: boolean;
};
