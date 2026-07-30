import { SORT_ORDER } from "src/common/constants";
import { SORT_FIELD } from "../constants";

export type Cursor = {
  id: string;
  sortField: SORT_FIELD;
  sortOrder: SORT_ORDER;
};
