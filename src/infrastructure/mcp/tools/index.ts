import type { McpServer } from "@modelcontextprotocol/server";
import type { ComputrabajoRepository } from "../../../domain/ports/computrabajo.repository";
import { register as applyToJob } from "./job/apply-to-job";
import { register as getApplicationQuestions } from "./job/get-application-questions";
import { register as getJobDetail } from "./job/get-job-detail";
import { register as searchJobs } from "./job/search-jobs";
import { register as getProfile } from "./profile/get-profile";
import { register as listAttachedCvs } from "./profile/list-attached-cvs";
import { register as sessionStatus } from "./session-status";

const tools = [
  searchJobs,
  getJobDetail,
  getApplicationQuestions,
  applyToJob,
  getProfile,
  listAttachedCvs,
  sessionStatus,
];

export function registerTools(
  server: McpServer,
  repository: ComputrabajoRepository,
): void {
  for (const register of tools) {
    register(server, repository);
  }
}
