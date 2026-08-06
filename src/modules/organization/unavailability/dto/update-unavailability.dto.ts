import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateUnavailabilityDto } from "./create-unavailability.dto";
import { IsTimeZone, ValidateIf } from "class-validator";

export class UpdateUnavailabilityDto extends PartialType(
  OmitType(CreateUnavailabilityDto, ["timezone"] as const)
) {
  @ValidateIf(
    (o: UpdateUnavailabilityDto) =>
      (o.startDate !== undefined && o.startDate !== null) ||
      (o.endDate !== undefined && o.endDate !== null)
  )
  @IsTimeZone()
  timezone: string;
}
