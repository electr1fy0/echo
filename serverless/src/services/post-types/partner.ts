import type { PostTypeHandler } from "./handler";

export const partnerHandler: PostTypeHandler = {
  type: "partner",
  getCreateValues(body) {
    return {
      postType: "partner",
      partnerTargetGrade: body.partnerTargetGrade ?? null,
      partnerWorkstyle: body.partnerWorkstyle ?? null,
      partnerSlotsNeeded: body.partnerSlotsNeeded ?? null,
      partnerStatus: "open",
      acceptsAnswers: false,
    };
  },
  getUpdateValues(body) {
    const values: Record<string, unknown> = {};
    if (body.partnerSlotsNeeded !== undefined) values.partnerSlotsNeeded = body.partnerSlotsNeeded;
    if (body.partnerTargetGrade !== undefined) values.partnerTargetGrade = body.partnerTargetGrade;
    if (body.partnerWorkstyle !== undefined) values.partnerWorkstyle = body.partnerWorkstyle;
    if (body.partnerStatus !== undefined) values.partnerStatus = body.partnerStatus;
    return values;
  },
  getMetadata(row) {
    return {
      partnerTargetGrade: row.partnerTargetGrade ?? null,
      partnerWorkstyle: row.partnerWorkstyle ?? null,
      partnerSlotsNeeded: row.partnerSlotsNeeded ?? null,
      partnerStatus: row.partnerStatus ?? null,
    };
  },
};
