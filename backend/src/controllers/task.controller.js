import Task from "../models/Task.js";
import { streamClient } from "../lib/stream.js";
import User from "../models/User.js"; // Importa el modelo de Usuario

const sendTaskUpdateEvent = async (channelId, userId) => {
  try {
    const channel = streamClient.channel("messaging", channelId);
    await channel.sendEvent({
      type: "task-updated",
      user_id: userId,
    });
  } catch (error) {
    console.error("Error sending Stream event:", error);
  }
};

export const getTasksForChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const tasks = await Task.find({ channelId }).populate("createdBy", "fullName profilePic").sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { text, channelId } = req.body;
    const createdBy = req.user.id;
    if (!text || !channelId) {
        return res.status(400).json({ message: "El texto y el ID del canal son requeridos." });
    }
    const newTask = new Task({ text, channelId, createdBy });
    await newTask.save();
    await sendTaskUpdateEvent(channelId, createdBy.toString());
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error)
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- FUNCIÓN CORREGIDA ---
export const toggleTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const wasCompleted = task.isCompleted;
    task.isCompleted = !task.isCompleted;

    if (task.isCompleted) {
      task.completedBy = req.user.id;

      if (!wasCompleted) {
        // 1. Incrementamos el contador y obtenemos el documento COMPLETO del usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $inc: { completedTasksCount: 1 } },
            { new: true }
        );

        // 2. Creamos un objeto con TODOS los datos del usuario para Stream
        const userDataForStream = {
            id: updatedUser._id.toString(),
            name: updatedUser.fullName,       // <-- DATO CLAVE: Se vuelve a enviar el nombre
            image: updatedUser.profilePic,    // <-- DATO CLAVE: Se vuelve a enviar la imagen
            completedTasksCount: updatedUser.completedTasksCount,
        };
        console.log("Enviando estos datos a Stream:", userDataForStream);


        // 3. Sincronizamos el objeto COMPLETO para no borrar datos
        await streamClient.upsertUser(userDataForStream);
      }
    } else {
      task.completedBy = undefined;
      // Si se desmarca, podríamos reducir el contador si quisiéramos
      const updatedUser = await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasksCount: -1 } }, { new: true });
      await streamClient.upsertUser({ id: req.user.id.toString(), completedTasksCount: updatedUser.completedTasksCount, name: updatedUser.fullName, image: updatedUser.profilePic });
    }

    await task.save();
    await sendTaskUpdateEvent(task.channelId, req.user.id.toString());
    res.status(200).json(task);
  } catch (error) {
    console.error("Error toggling task:", error)
    res.status(500).json({ message: "Internal Server Error" });
  }
};