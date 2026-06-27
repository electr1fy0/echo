import type { PostTypeHandler } from "./handler";

export const taxiHandler: PostTypeHandler = {
  type: "taxi",
  getCreateValues(body) {
    return {
      postType: "taxi",
      taxiDeparture: body.taxiDeparture ?? null,
      taxiDestination: body.taxiDestination ?? null,
      taxiDatetime: body.taxiDatetime ?? null,
      taxiSeatsAvailable: body.taxiSeatsAvailable ?? null,
      taxiStatus: "open",
      acceptsAnswers: false,
    };
  },
  getUpdateValues(body) {
    const values: Record<string, unknown> = {};
    if (body.taxiDeparture !== undefined) values.taxiDeparture = body.taxiDeparture;
    if (body.taxiDestination !== undefined) values.taxiDestination = body.taxiDestination;
    if (body.taxiDatetime !== undefined) values.taxiDatetime = body.taxiDatetime;
    if (body.taxiSeatsAvailable !== undefined) values.taxiSeatsAvailable = body.taxiSeatsAvailable;
    if (body.taxiStatus !== undefined) values.taxiStatus = body.taxiStatus;
    return values;
  },
  getMetadata(row) {
    return {
      taxiDeparture: row.taxiDeparture ?? null,
      taxiDestination: row.taxiDestination ?? null,
      taxiDatetime: row.taxiDatetime ?? null,
      taxiSeatsAvailable: row.taxiSeatsAvailable ?? null,
      taxiStatus: row.taxiStatus ?? null,
    };
  },
};
