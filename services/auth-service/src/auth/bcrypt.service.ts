// auth/hashing/bcrypt.service.ts
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class BcryptService {
  async hash(data: string | Buffer): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(data, salt);
  }

  async compare(data: string | Buffer, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }
}
