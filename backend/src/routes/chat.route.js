import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

// Esta es la única línea que importa desde el controlador de chat
import {
  getStreamToken,
  createGroupChat,
  toggleMessageScramble,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Ruta original para obtener el token del chat 1 a 1
router.get("/token", protectRoute, getStreamToken);

// Nueva ruta para crear un chat grupal
router.post("/group", protectRoute, createGroupChat);

router.patch("/message/:messageId/toggle-scramble", protectRoute, toggleMessageScramble);
export default router;