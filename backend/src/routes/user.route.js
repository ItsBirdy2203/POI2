import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  getAllUsers, // Importamos la nueva función
} from "../controllers/user.controller.js";

// 1. Se crea el router
const router = express.Router();

// 2. Se aplica el middleware a todas las rutas siguientes
router.use(protectRoute);

// 3. Se definen todas las rutas
router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);
router.get("/all", getAllUsers); // <-- Nueva ruta para obtener todos los usuarios

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

// 4. Se exporta el router
export default router;