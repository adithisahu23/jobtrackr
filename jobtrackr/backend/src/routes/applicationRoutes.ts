import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applicationController";
import {
  listInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
} from "../controllers/interviewController";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listApplications));
router.post("/", asyncHandler(createApplication));
router.get("/:id", asyncHandler(getApplication));
router.patch("/:id", asyncHandler(updateApplication));
router.patch("/:id/status", asyncHandler(updateApplicationStatus));
router.delete("/:id", asyncHandler(deleteApplication));

// Nested interview routes: /api/applications/:applicationId/interviews
router.get("/:applicationId/interviews", asyncHandler(listInterviews));
router.post("/:applicationId/interviews", asyncHandler(createInterview));

export default router;

// Separate router for interview-level operations that aren't nested under an applicationId
export const interviewItemRouter = Router();
interviewItemRouter.use(requireAuth);
interviewItemRouter.patch("/:id", asyncHandler(updateInterview));
interviewItemRouter.delete("/:id", asyncHandler(deleteInterview));
