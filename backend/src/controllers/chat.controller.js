import { generateStreamToken, streamClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// --- FUNCIÓN AÑADIDA PARA CREAR GRUPOS ---
export async function createGroupChat(req, res) {
  try {
    const { name, members } = req.body;
    const creatorId = req.user.id.toString();

    if (!name || !members || members.length < 2) {
      return res.status(400).json({ message: "El nombre del grupo y al menos 2 miembros son requeridos." });
    }

    const allMembers = [...new Set([creatorId, ...members])];

    if (allMembers.length < 3) {
       return res.status(400).json({ message: "Un grupo debe tener al menos 3 miembros." });
    }

    const channel = streamClient.channel("messaging", {
      name: name,
      members: allMembers,
      created_by_id: creatorId,
    });

    await channel.create();

    res.status(201).json({ message: "Grupo creado exitosamente", channel });
  } catch (error) {
    console.log("Error in createGroupChat controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// --- FUNCIÓN AÑADIDA PARA ENCRIPTAR/DESENCRIPTAR MENSAJES ---
export async function toggleMessageScramble(req, res) {
  try {
    const { messageId } = req.params;
    const { message } = await streamClient.getMessage(messageId);

    if (!message) {
      return res.status(404).json({ message: "Mensaje no encontrado" });
    }

    const currentScrambledState = message.customData?.isScrambled || false;
    const newScrambledState = !currentScrambledState;

    const updatedMessage = {
      id: message.id,
      customData: {
        ...message.customData,
        isScrambled: newScrambledState,
      },
    };

    await streamClient.updateMessage(updatedMessage);

    res.status(200).json({ success: true, message: "Mensaje actualizado" });
  } catch (error) {
    console.error("Error toggling message scramble state:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}