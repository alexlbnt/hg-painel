import { useCallback, useEffect, useState } from 'react';
import { TaskData } from '@/lib/mockData';
import { TaskAction } from '@/lib/taskRules';
import { ApiService } from '@/services/api';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

function upsert(list: TaskData[], task: TaskData): TaskData[] {
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx === -1) return [task, ...list];
  const next = [...list];
  next[idx] = { ...next[idx], ...task };
  return next;
}

const errorMessage = (e: unknown) =>
  e instanceof Error && e.message ? e.message : 'Algo deu errado. Tente novamente.';

/**
 * Estado do quadro de tasks. Cada ação aplica a resposta do servidor direto na lista
 * (sem recarregar tudo) e os eventos em tempo real com dados também são mesclados localmente.
 * As funções de ação lançam o erro para que modais possam continuar abertos com o texto digitado.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setTasks(await ApiService.getTasks());
    } catch (e) {
      if (!silent) setError(errorMessage(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeSync((event) => {
    if (!event.type.startsWith('TASK_')) return;
    if (event.type === 'TASK_DELETED' && event.id) {
      setTasks((list) => list.filter((t) => t.id !== event.id));
    } else if (event.data?.id) {
      setTasks((list) => upsert(list, event.data));
    } else {
      // Aviso genérico do polling: não traz os dados, então recarrega em silêncio
      reload(true);
    }
  });

  const withBusy = async <T,>(id: string, fn: () => Promise<T>): Promise<T> => {
    setBusyIds((b) => ({ ...b, [id]: true }));
    try {
      return await fn();
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  /** Erros de conflito indicam que o quadro local está desatualizado: recarrega. */
  const handleFailure = (e: unknown) => {
    if (e instanceof Error && /mudou de etapa/.test(e.message)) reload(true);
    throw e;
  };

  const createTask = async (data: Parameters<typeof ApiService.createTask>[0]) => {
    const created = await ApiService.createTask(data);
    setTasks((list) => upsert(list, created));
    return created;
  };

  const updateTask = (id: string, updates: Parameters<typeof ApiService.updateTask>[1]) =>
    withBusy(id, async () => {
      try {
        const updated = await ApiService.updateTask(id, updates);
        setTasks((list) => upsert(list, updated));
        return updated;
      } catch (e) {
        return handleFailure(e);
      }
    });

  const runAction = (id: string, action: TaskAction, input?: { note?: string; resolution?: string }) =>
    withBusy(id, async () => {
      try {
        const updated = await ApiService.runTaskAction(id, action, input);
        setTasks((list) => upsert(list, updated));
        return updated;
      } catch (e) {
        return handleFailure(e);
      }
    });

  const deleteTask = (id: string) =>
    withBusy(id, async () => {
      await ApiService.deleteTask(id);
      setTasks((list) => list.filter((t) => t.id !== id));
    });

  return {
    tasks,
    loading,
    error,
    setError,
    busyIds,
    reload,
    createTask,
    updateTask,
    runAction,
    deleteTask,
    errorMessage,
  };
}
