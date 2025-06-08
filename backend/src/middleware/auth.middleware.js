import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("--- Entrando a protectRoute ---");
    console.log("Cookies recibidas del navegador:", req.cookies); // LOG 1: ¿Llegan las cookies?

    const token = req.cookies.jwt;

    if (!token) {
      console.log("Error: No se encontró el token 'jwt' en las cookies."); // LOG 2
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    console.log("Token encontrado:", token); // LOG 3

    // Este bloque intentará verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Token decodificado exitosamente:", decoded); // LOG 4

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("Error: Usuario no encontrado en la base de datos."); // LOG 5
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;
    next();
    
  } catch (error) {
    // ESTE LOG ES EL MÁS IMPORTANTE SI HAY UN ERROR
    console.error("Error en protectRoute middleware:", error.message); // LOG 6
    
    // Si el error es por un token inválido o expirado, devolvemos 401
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};