import { create } from "zustand";
import { Execution, ExecutionStep, ExecutionStatus, ExecutionQuery, CreateExecutionPayload, ExecutionState } from "@/types";
import { executionApi } from "@/utils/api";

const generateId = () => Math.random().toString(36).slice(2, 11);

const mapExecution = (payload: any): Execution => {
  const id = String(payload?._id ?? payload?.id ?? generateId());
  const workflowSource = payload?.workflow;
  const workflowId =
    typeof workflowSource === "string"
      ? workflowSource
      : workflowSource?.workflowId ?? workflowSource?._id ?? payload?.workflowId ?? "";

  const userSource = payload?.user;
  const userId = typeof userSource === "string" ? userSource : userSource?._id;

  return {
    id,
    workflowId: workflowId ?? "",
    userId: userId ?? undefined,
    status: (payload?.status ?? "PENDING") as ExecutionStatus,
    triggerNodeId: payload?.triggerNodeId ?? payload?.nodeId ?? undefined,
    triggerPayload: payload?.triggerPayload ?? payload?.payload ?? undefined,
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    updatedAt: payload?.updatedAt ?? payload?.createdAt ?? new Date().toISOString(),
    startedAt: payload?.startedAt ?? undefined,
    endedAt: payload?.endedAt ?? undefined,
    error: payload?.error ?? undefined,
  };
};

const mapExecutionStep = (payload: any): ExecutionStep => {
  const id = String(payload?._id ?? payload?.id ?? generateId());
  const executionSource = payload?.execution;
  const executionId =
    typeof executionSource === "string"
      ? executionSource
      : executionSource?._id ?? executionSource?.id ?? payload?.executionId ?? "";

  return {
    id,
    executionId: executionId ?? "",
    nodeId: payload?.nodeId ?? payload?.id ?? "",
    nodeType: payload?.nodeType ?? payload?.node?.type ?? payload?.type ?? undefined,
    status: payload?.status ?? "PENDING",
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    updatedAt: payload?.updatedAt ?? undefined,
    startedAt: payload?.startedAt ?? undefined,
    endedAt: payload?.endedAt ?? undefined,
    output: payload?.output ?? undefined,
    error: payload?.error ?? undefined,
  };
};


type ExecutionActions = {
  loadExecutions: (query?: ExecutionQuery) => Promise<void>;
  loadExecution: (id: string) => Promise<Execution | null>;
  selectExecution: (id: string | null) => Promise<void>;
  createExecution: (payload: CreateExecutionPayload) => Promise<Execution | null>;
  updateExecutionStatus: (id: string, status: ExecutionStatus) => Promise<Execution | null>;
  deleteExecution: (id: string) => Promise<boolean>;
  loadExecutionSteps: (executionId: string) => Promise<ExecutionStep[]>;
  loadExecutionStepDetail: (stepId: string) => Promise<ExecutionStep | null>;
  retryExecutionStep: (executionId: string, nodeId: string) => Promise<boolean>;
  clearError: () => void;
};

export const useExecutionsStore = create<ExecutionState & ExecutionActions>((set, get) => ({
  executions: [],
  executionSteps: [],
  stepDetails: {},
  selectedExecutionId: null,
  selectedStepId: null,
  total: 0,
  page: 1,
  limit: 20,
  isLoadingExecutions: false,
  isLoadingSteps: false,
  isMutatingExecution: false,
  isMutatingStep: false,
  error: null,

  clearError: () => set({ error: null }),

  loadExecutions: async (query = {}) => {
    set({ isLoadingExecutions: true, error: null });
    try {
      const response: any = await executionApi.listExecutions(query);
      const items = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : [];
      const executions = items.map(mapExecution);
      set({
        executions,
        total: typeof response?.total === "number" ? response.total : executions.length,
        page: typeof response?.page === "number" ? response.page : query.page ?? 1,
        limit: typeof response?.limit === "number" ? response.limit : query.limit ?? get().limit,
        isLoadingExecutions: false,
      });
    } catch (error) {
      console.error("Failed to load executions", error);
      const message = error instanceof Error ? error.message : "Failed to load executions";
      set({ isLoadingExecutions: false, error: message });
    }
  },

  loadExecution: async (id: string) => {
    try {
      const response: any = await executionApi.getExecution(id);
      const execution = mapExecution(response);
      set((state) => ({
        executions: state.executions.some((item) => item.id === execution.id)
          ? state.executions.map((item) => (item.id === execution.id ? execution : item))
          : [...state.executions, execution],
      }));
      return execution;
    } catch (error) {
      console.error("Failed to load execution", error);
      const message = error instanceof Error ? error.message : "Failed to load execution";
      set({ error: message });
      return null;
    }
  },

  selectExecution: async (id: string | null) => {
    set({ selectedExecutionId: id, selectedStepId: null });
    if (id) {
      await get().loadExecutionSteps(id);
      await get().loadExecution(id);
    } else {
      set({ executionSteps: [] });
    }
  },

  createExecution: async (payload) => {
    set({ isMutatingExecution: true, error: null });
    try {
      const response: any = await executionApi.createExecution(payload);
      const execution = mapExecution(response);
      set((state) => ({
        executions: [execution, ...state.executions.filter((item) => item.id !== execution.id)],
        isMutatingExecution: false,
      }));
      return execution;
    } catch (error) {
      console.error("Failed to create execution", error);
      const message = error instanceof Error ? error.message : "Failed to create execution";
      set({ isMutatingExecution: false, error: message });
      return null;
    }
  },

  updateExecutionStatus: async (id, status) => {
    set({ isMutatingExecution: true, error: null });
    try {
      const response: any = await executionApi.updateExecutionStatus(id, { status });
      const execution = mapExecution(response);
      set((state) => ({
        executions: state.executions.map((item) => (item.id === execution.id ? execution : item)),
        isMutatingExecution: false,
      }));
      if (get().selectedExecutionId === id) {
        await get().loadExecutionSteps(id);
      }
      return execution;
    } catch (error) {
      console.error("Failed to update execution", error);
      const message = error instanceof Error ? error.message : "Failed to update execution";
      set({ isMutatingExecution: false, error: message });
      return null;
    }
  },

  deleteExecution: async (id) => {
    set({ isMutatingExecution: true, error: null });
    try {
      await executionApi.deleteExecution(id);
      set((state) => ({
        executions: state.executions.filter((item) => item.id !== id),
        isMutatingExecution: false,
      }));
      if (get().selectedExecutionId === id) {
        set({ selectedExecutionId: null, executionSteps: [] });
      }
      return true;
    } catch (error) {
      console.error("Failed to delete execution", error);
      const message = error instanceof Error ? error.message : "Failed to delete execution";
      set({ isMutatingExecution: false, error: message });
      return false;
    }
  },

  loadExecutionSteps: async (executionId) => {
    set({ isLoadingSteps: true, error: null });
    try {
      const response: any = await executionApi.getExecutionSteps(executionId);
      const items = Array.isArray(response) ? response : [];
      const steps = items.map(mapExecutionStep);
      set({ executionSteps: steps, isLoadingSteps: false });
      return steps;
    } catch (error) {
      console.error("Failed to load execution steps", error);
      const message = error instanceof Error ? error.message : "Failed to load execution steps";
      set({ isLoadingSteps: false, error: message });
      return [];
    }
  },

  loadExecutionStepDetail: async (stepId) => {
    set({ isMutatingStep: true, error: null });
    try {
      const response: any = await executionApi.getExecutionStep(stepId);
      const step = mapExecutionStep(response);
      set((state) => ({
        stepDetails: { ...state.stepDetails, [step.id]: step },
        isMutatingStep: false,
        selectedStepId: step.id,
      }));
      return step;
    } catch (error) {
      console.error("Failed to load execution step", error);
      const message = error instanceof Error ? error.message : "Failed to load execution step";
      set({ isMutatingStep: false, error: message });
      return null;
    }
  },

  retryExecutionStep: async (executionId, nodeId) => {
    set({ isMutatingStep: true, error: null });
    try {
      await executionApi.retryExecutionStep(executionId, nodeId);
      await Promise.all([get().loadExecutionSteps(executionId), get().loadExecution(executionId)]);
      set({ isMutatingStep: false });
      return true;
    } catch (error) {
      console.error("Failed to retry execution step", error);
      const message = error instanceof Error ? error.message : "Failed to retry execution step";
      set({ isMutatingStep: false, error: message });
      return false;
    }
  },
}));