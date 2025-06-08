import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getAllUsers, createGroupChat } from "../lib/api";
import { UsersIcon, XIcon, LoaderIcon } from "lucide-react";

const CreateGroupChatModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: getAllUsers,
  });

  const { mutate: createGroup, isPending } = useMutation({
    mutationFn: createGroupChat,
    onSuccess: () => {
      toast.success("¡Grupo creado con éxito!");
      queryClient.invalidateQueries(["channels"]); // Invalidaremos los canales para refrescar la lista
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al crear el grupo.");
    },
  });

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUsers.length < 2) {
      toast.error("Debes seleccionar al menos 2 otros miembros.");
      return;
    }
    createGroup({ name: groupName, members: selectedUsers });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost">
          <XIcon size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4">Crear un Nuevo Grupo</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Nombre del Grupo</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Grupo de estudio"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <h4 className="font-semibold mb-2">Seleccionar Miembros</h4>
          <div className="bg-base-200 p-3 rounded-lg max-h-60 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="text-center p-4">Cargando usuarios...</div>
            ) : (
              <ul className="space-y-2">
                {users?.map((user) => (
                  <li key={user._id}>
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserToggle(user._id)}
                      />
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>
                      </div>
                      <span className="font-medium">{user.fullName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending || !groupName}>
              {isPending ? <LoaderIcon className="animate-spin" /> : "Crear Grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupChatModal;