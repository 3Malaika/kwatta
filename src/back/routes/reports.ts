import { route } from "../handler";
import * as reports from "../services/reports";
import { formToObject, readPhoto } from "../upload";

export const listReportsRoute = route(async ({ user }) => reports.listReports(user));

export const createReportRoute = route(
  async ({ req, user }) => {
    const form = await req.formData();
    const report = await reports.createReport(user, formToObject(form), await readPhoto(form));
    return Response.json({ data: report }, { status: 201 });
  },
  ["client"],
);

export const getReportRoute = route(async ({ user, params }) => reports.getReport(user, params.id));
export const acceptReportRoute = route(async ({ user, params }) => reports.acceptReport(user, params.id), ["collector"]);

export const collectReportRoute = route(
  async ({ req, user, params }) => reports.collectReport(user, params.id, await readPhoto(await req.formData())),
  ["collector"],
);

export const payReportRoute = route(
  async ({ req, user, params }) => {
    const body = (await req.json().catch(() => ({}))) as { method?: "cash" };
    return reports.payReport(user, params.id, body.method ?? "cash");
  },
  ["collector"],
);

export const cancelReportRoute = route(async ({ user, params }) => reports.cancelReport(user, params.id), ["client", "admin"]);

export const createClaimRoute = route(
  async ({ req, user, params }) => reports.createClaim(user, params.id, await req.json().catch(() => ({}))),
  ["client"],
);
