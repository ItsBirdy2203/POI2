import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sendFriendRequest } from "../lib/api";
import { getLanguageFlag } from "../lib/utils";
import { UserPlus } from "lucide-react";

const UserCard = ({ user, isRequestSent }) => {
  const queryClient = useQueryClient();

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success("¡Solicitud de amistad enviada!");
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingRequests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "No se pudo enviar la solicitud.");
    },
  });

  const handleSendRequest = () => {
    sendRequestMutation(user._id);
  };

  return (
    <div className="card bg-base-200 shadow-md transition-all hover:shadow-lg">
      <div className="card-body p-4">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={user.profilePic} alt={`${user.fullName}'s avatar`} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="card-title text-lg">{user.fullName}</h2>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="badge badge-secondary badge-sm">
                {getLanguageFlag(user.nativeLanguage)}
                Nativo: {user.nativeLanguage}
              </span>
              <span className="badge badge-outline badge-sm">
                {getLanguageFlag(user.learningLanguage)}
                Aprende: {user.learningLanguage}
              </span>
            </div>
          </div>
        </div>
        <div className="card-actions justify-end mt-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSendRequest}
            disabled={isPending || isRequestSent}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : isRequestSent ? (
              "Solicitud Enviada"
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Agregar Amigo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
