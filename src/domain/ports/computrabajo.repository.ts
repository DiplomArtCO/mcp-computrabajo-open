import type { CountryCode } from "../../config/api";
import type {
  ApplicationResult,
  AttachedCv,
  JobDetail,
  JobListing,
  Profile,
} from "../models/computrabajo.model";

export interface ComputrabajoRepository {
  getSessionStatus(): Promise<"authenticated" | "missing">;

  searchJobs(params: {
    keyword: string;
    location?: string;
    country?: CountryCode;
    page?: number;
  }): Promise<JobListing[]>;

  getJobDetail(params: {
    offerId: string;
    country?: CountryCode;
  }): Promise<JobDetail>;

  applyToJob(params: {
    offerId: string;
    country?: CountryCode;
    answers?: Array<{ questionId: string; answer: string | string[] }>;
  }): Promise<ApplicationResult>;

  getApplicationForm(params: {
    offerId: string;
    country?: CountryCode;
  }): Promise<import("../models/computrabajo.model").ApplicationForm>;

  getProfile(params: { country?: CountryCode }): Promise<Profile>;

  listAttachedCvs(params: { country?: CountryCode }): Promise<AttachedCv[]>;
}
