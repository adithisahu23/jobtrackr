import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { getAnalytics } from "../controllers/analyticsController";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(getAnalytics));

export default router;
