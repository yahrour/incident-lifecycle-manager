import { SORT_ORDER } from "@/common/constants";
import { SORT_FIELD } from "../constants";
import Joi from "joi";

export type Cursor = {
  id: string;
  sortField: SORT_FIELD;
  sortOrder: SORT_ORDER;
};

export const cursorSchema = Joi.object<Cursor>({
  id: Joi.string().uuid().required(),
  sortField: Joi.string()
    .valid(...Object.values(SORT_FIELD))
    .required(),
  sortOrder: Joi.string()
    .valid(...Object.values(SORT_ORDER))
    .required(),
});
