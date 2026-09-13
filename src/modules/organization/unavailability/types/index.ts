import { SORT_ORDER } from "src/common/constants";
import { SORT_FIELD } from "../constants";
import Joi from "joi";

export type Cursor = {
  id: number;
  sortField: SORT_FIELD;
  sortOrder: SORT_ORDER;
};

export const cursorSchema = Joi.object<Cursor>({
  id: Joi.number().integer().positive().required(),
  sortField: Joi.string()
    .valid(...Object.values(SORT_FIELD))
    .required(),
  sortOrder: Joi.string()
    .valid(...Object.values(SORT_ORDER))
    .required(),
});
