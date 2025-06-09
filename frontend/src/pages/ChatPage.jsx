import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import TaskSidebar from "../components/TaskSidebar";
import MessageWithBadge from "../components/MessageWithBadge";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { channelId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authUser } = useAuthUser();

   const navigate = useNavigate();

  // Obtenemos no solo los datos, sino también el estado de la consulta del token
  const tokenQuery = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const handleSendMessage = async (channel, message) => {
    // ... (La lógica de envío de mensajes no cambia)
    if (!chatClient || !chatClient.user) return;
    const user = chatClient.user;
    const currentCount = user.messageCount || 0;
    const newCount = currentCount + 1;
    const currentLevel = user.rewardLevel || 'none';
    let newLevel = currentLevel;
    let levelUp = false;
    if (newCount === 10 && currentLevel === 'none') { newLevel = 'bronze'; levelUp = true; toast.success("¡Nivel Bronce alcanzado!", { icon: '🥉' }); }
    else if (newCount === 15 && currentLevel === 'bronze') { newLevel = 'silver'; levelUp = true; toast.success("¡Nivel Plata alcanzado!", { icon: '🥈' }); }
    else if (newCount === 20 && currentLevel === 'silver') { newLevel = 'gold'; levelUp = true; toast.success("¡Nivel Oro alcanzado!", { icon: '🥇' }); }
    const userDataToUpdate = { id: user.id, name: user.name, image: user.image, completedTasksCount: user.completedTasksCount || 0, messageCount: newCount };
    if (levelUp) { userDataToUpdate.rewardLevel = newLevel; }
    const response = await chatClient.upsertUser(userDataToUpdate);
    const updatedUserFromServer = response.users[user.id];
    if (updatedUserFromServer) { chatClient.user = { ...chatClient.user, ...updatedUserFromServer }; }
    await channel.sendMessage(message);
  };

  useEffect(() => {
    // Condición de seguridad más robusta al principio
    if (!authUser || !tokenQuery.isSuccess) {
      return;
    }

    const client = StreamChat.getInstance(STREAM_API_KEY);
    let isMounted = true; // Bandera para evitar actualizaciones en un componente desmontado

    const init = async () => {
      try {
        // Conectar solo si no está conectado o es un usuario diferente
        if (client.userID !== authUser._id) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
              completedTasksCount: authUser.completedTasksCount || 0,
            },
            tokenQuery.data.token
          );
        }
        if (!isMounted) return;
        setChatClient(client);

        // BUSCAR EL CANAL DESPUÉS DE ASEGURAR LA CONEXIÓN
        const [channel] = await client.queryChannels({ id: { $eq: channelId } });
        if (isMounted && channel) {
          await channel.watch();
          setChannel(channel);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        if (isMounted) {  
          setLoading(false);
        }
      }
    };
    
    init();

    return () => {
      isMounted = false;
      client.disconnectUser();
    };
  }, [authUser, tokenQuery.isSuccess, tokenQuery.data, channelId]); // Dependemos del estado 'isSuccess'

  const isGroupChat = channel?.data?.member_count > 2;
   const handleVideoCall = async () => {
    if (!channel || !chatClient) return;

    try {
        const callId = channel.id; // Usamos el ID del canal como ID único para la llamada
        const callLink = `${window.location.origin}/call/${callId}`;

        // Enviar un mensaje al chat con el enlace a la llamada
        await channel.sendMessage({
            text: `¡Llamada iniciada! Únete aquí: ${callLink}`,
        });

        // Navegar a la página de la llamada
        navigate(`/call/${callId}`);
    } catch (error) {
        console.error("Error creating video call:", error);
        toast.error("No se pudo iniciar la llamada.");
    }
  };

  if (loading) return <ChatLoader />;
  if (!channel) return <div className="text-center p-8">Cargando chat o canal no encontrado...</div>;

  return (
    <div className="flex h-[calc(100vh_-_4rem)]">
      <div className="flex-1">
        <Chat client={chatClient}>
          <Channel channel={channel} doSendMessage={handleSendMessage}>
            <div className="w-full relative h-full flex flex-col">
              <Window>
                <ChannelHeader />
                <MessageList Message={MessageWithBadge} />
                <MessageInput focus />
              </Window>
              {!isGroupChat && <CallButton handleVideoCall={handleVideoCall} />}
              <Thread />
            </div>
          </Channel>
        </Chat>
      </div>
      {isGroupChat && channel && <TaskSidebar channelId={channel.id} channel={channel} />}
    </div>
  );
};

export default ChatPage;
