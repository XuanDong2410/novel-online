import express from "express";
import { signup, refreshToken, login, logout, authCheck } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

//signup
router.post("/signup", signup);
router.post('/refresh', refreshToken);
router.post("/login", login);
router.post("/logout", logout);

router.get("/authCheck", protectRoute, authCheck);

export default router;