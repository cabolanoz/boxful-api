import { PublicUser } from 'src/users/users.service';

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
}
