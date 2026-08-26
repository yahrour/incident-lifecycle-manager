import { CommonAlert } from "./common-alert";

export abstract class AlertAdapter<TPayload = unknown> {
  abstract normalize(payload: TPayload): CommonAlert;
}
