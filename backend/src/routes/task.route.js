import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getTasksForChannel, createTask, toggleTaskStatus } from "../controllers/task.controller.js";

const router = express.Router();

// Proteger todas las rutas de tareas
router.use(protectRoute);

// Definir las rutas específicas
router.get("/:channelId", getTasksForChannel);
router.post("/", createTask);
router.patch("/:taskId/toggle", toggleTaskStatus);

export default router;