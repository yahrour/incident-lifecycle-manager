import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ActiveUserData } from "../interfaces/active-user.interface";
import type { Request } from "express";

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: ActiveUserData }>();
    const user = request.user;
    return field ? user?.[field] : user;
  }
);
