import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UsersIcon, MessageSquarePlus } from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser.js";
import { StreamChat } from "stream-chat";
import CreateGroupChatModal from "../components/CreateGroupChatModal";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const HomePage = () => {
	const { authUser } = useAuthUser();
	const [channels, setChannels] = useState([]);
	const [loadingChannels, setLoadingChannels] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		if (!authUser) return;

		const client = StreamChat.getInstance(STREAM_API_KEY);

		const connectAndFetch = async () => {
			try {
				if (!client.userID) {
					const tokenData = await getStreamToken();
					const userToConnect = {
                        id: authUser._id,
                        name: authUser.fullName,
                        image: authUser.profilePic,
                        completedTasksCount: authUser.completedTasksCount || 0,
                    };
					await client.connectUser(userToConnect, tokenData.token);
				}

				const userChannels = await client.queryChannels({ members: { $in: [authUser._id] } }, { last_message_at: -1 });
				setChannels(userChannels);
			} catch (error) {
				console.error("Error connecting or fetching channels:", error);
				toast.error("No se pudieron cargar los chats.");
			} finally {
				setLoadingChannels(false);
			}
		};

		connectAndFetch();
	}, [authUser]);

	const directMessages = channels.filter((c) => c.type === "messaging" && c.data.member_count === 2);
	const groupChats = channels.filter((c) => c.type === "messaging" && c.data.member_count > 2);

	const getDirectMessagePartner = (channel) => {
		if (!authUser) return null;
		const partner = Object.values(channel.state.members).find((member) => member.user_id !== authUser._id);
		return partner?.user;
	};

	return (
		<div className='p-4 sm:p-6 lg:p-8'>
			{isModalOpen && <CreateGroupChatModal onClose={() => setIsModalOpen(false)} />}
			<div className='container mx-auto space-y-10'>
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Mis Chats</h1>
					<div className='flex gap-2'>
						{/* Ya no necesitamos el botón de "Encontrar Amigos" aquí si lo prefieres */}
						<button className='btn btn-primary btn-sm' onClick={() => setIsModalOpen(true)}>
							<MessageSquarePlus className='mr-2 size-4' />
							Crear Chat Grupal
						</button>
					</div>
				</div>

				{loadingChannels ? (
					<div className='flex justify-center py-12'>
						<span className='loading loading-spinner loading-lg' />
					</div>
				) : (
					<>
						{groupChats.length > 0 && (
							<section>
								<h2 className='text-xl font-semibold mb-4'>Chats Grupales</h2>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
									{groupChats.map((channel) => (
										<Link
											key={channel.id}
											to={`/chat/${channel.id}`}
											className='card bg-base-200 hover:shadow-md transition-shadow p-4'
										>
											<div className='flex items-center gap-3'>
												<div className='avatar placeholder'>
													<div className='bg-neutral-focus text-neutral-content rounded-full w-12'>
														<span>{channel.data.name?.substring(0, 2).toUpperCase() || "G"}</span>
													</div>
												</div>
												<div>
													<h3 className='font-semibold truncate'>
														{channel.data.name || "Grupo sin nombre"}
													</h3>
													<p className='text-xs opacity-70'>{channel.data.member_count} miembros</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							</section>
						)}

						{directMessages.length > 0 && (
							<section>
								<h2 className='text-xl font-semibold mb-4'>Mensajes Directos</h2>
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
									{directMessages.map((channel) => {
										const partner = getDirectMessagePartner(channel);
										if (!partner) return null;
										return (
											<Link
												key={channel.id}
												to={`/chat/${channel.id}`}
												className='card bg-base-200 hover:shadow-md transition-shadow p-4'
											>
												<div className='flex items-center gap-3'>
													<div className='avatar'>
														<div className='w-12 rounded-full'>
															<img
																src={
																	partner.image ||
																	`https://avatar.iran.liara.run/public/boy?username=${partner.id}`
																}
																alt={partner.name}
															/>
														</div>
													</div>
													<div>
														<h3 className='font-semibold truncate'>{partner.name || "Usuario"}</h3>
													</div>
												</div>
											</Link>
										);
									})}
								</div>
							</section>
						)}

						{channels.length === 0 && !loadingChannels && (
							<div className='text-center py-10'>No tienes chats aún. ¡Crea un grupo o agrega amigos!</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default HomePage;