import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getTasks, createTask, toggleTask } from "../lib/api";
import { CheckCircle2, Circle, Plus, LoaderIcon, ListTodo } from "lucide-react";

const TaskSidebar = ({ channelId, channel }) => {
    const queryClient = useQueryClient();
    const [newTaskText, setNewTaskText] = useState("");

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["tasks", channelId],
        queryFn: () => getTasks(channelId),
    });

    const { mutate: addTask, isPending: isAdding } = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            setNewTaskText("");
        },
        onError: () => toast.error("Error al añadir la tarea."),
    });

    // Ya no necesitamos la lógica de onSuccess aquí, el backend se encarga de todo.
    const { mutate: toggleTaskStatus } = useMutation({
        mutationFn: toggleTask,
        onError: () => toast.error("Error al actualizar la tarea."),
    });

    useEffect(() => {
        if (!channel) return;
        const listener = channel.on("task-updated", () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", channelId] });
        });
        return () => {
            listener.unsubscribe();
        };
    }, [channel, channelId, queryClient]);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            addTask({ text: newTaskText, channelId });
        }
    };

    const pendingTasks = tasks?.filter(t => !t.isCompleted);
    const completedTasks = tasks?.filter(t => t.isCompleted);

    return (
        <aside className="w-80 bg-base-200 border-l border-base-300 flex flex-col h-full">
            <div className="p-4 border-b border-base-300 flex items-center gap-2">
                <ListTodo className="size-5" />
                <h2 className="font-semibold text-lg">Tareas del Grupo</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="font-bold mb-2">Pendientes</h3>
                {isLoading ? <p>Cargando...</p> : (
                    <ul className="space-y-2">
                        {pendingTasks?.map(task => (
                            <li key={task._id} className="flex items-center gap-3 p-2 bg-base-100 rounded-md">
                                <button onClick={() => toggleTaskStatus(task._id)}>
                                    <Circle className="size-5 text-gray-400" />
                                </button>
                                <span className="flex-1">{task.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <h3 className="font-bold mt-6 mb-2">Completadas</h3>
                 {isLoading ? <p>Cargando...</p> : (
                    <ul className="space-y-2">
                         {completedTasks?.map(task => (
                            <li key={task._id} className="flex items-center gap-3 p-2 bg-base-100 rounded-md opacity-60">
                                <button onClick={() => toggleTaskStatus(task._id)}>
                                    <CheckCircle2 className="size-5 text-success" />
                                </button>
                                <span className="flex-1 line-through">{task.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <form onSubmit={handleAddTask} className="p-4 border-t border-base-300">
                <div className="form-control">
                    <div className="join">
                        <input
                            type="text"
                            placeholder="Añadir nueva tarea..."
                            className="input input-bordered join-item w-full"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary join-item" disabled={isAdding}>
                            {isAdding ? <LoaderIcon className="animate-spin" /> : <Plus />}
                        </button>
                    </div>
                </div>
            </form>
        </aside>
    );
};

export default TaskSidebar;