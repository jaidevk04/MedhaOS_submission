/**
 * Simplified LangGraph types for workflow orchestration
 * This is a minimal implementation for the supervisor agent
 */

export const END = '__end__';

export interface StateGraphConfig<T> {
  channels: Record<string, {
    value: (left: T, right: T) => T;
    default: () => T;
  }>;
}

export class StateGraph<T> {
  private nodes: Map<string, (state: T) => Promise<T>> = new Map();
  private edges: Map<string, string> = new Map();
  private entryPoint: string | null = null;
  private config: StateGraphConfig<T>;

  constructor(config: StateGraphConfig<T>) {
    this.config = config;
  }

  addNode(name: string, fn: (state: T) => Promise<T>): void {
    this.nodes.set(name, fn);
  }

  addEdge(from: string, to: string): void {
    this.edges.set(from, to);
  }

  setEntryPoint(name: string): void {
    this.entryPoint = name;
  }

  compile(): CompiledGraph<T> {
    return new CompiledGraph(this.nodes, this.edges, this.entryPoint);
  }
}

class CompiledGraph<T> {
  constructor(
    private nodes: Map<string, (state: T) => Promise<T>>,
    private edges: Map<string, string>,
    private entryPoint: string | null
  ) {}

  async invoke(initialState: T): Promise<T> {
    if (!this.entryPoint) {
      throw new Error('No entry point set');
    }

    let currentNode = this.entryPoint;
    let state = initialState;

    while (currentNode !== END) {
      const nodeFn = this.nodes.get(currentNode);
      if (!nodeFn) {
        throw new Error(`Node ${currentNode} not found`);
      }

      // Execute node
      state = await nodeFn(state);

      // Get next node
      const nextNode = this.edges.get(currentNode);
      if (!nextNode) {
        break;
      }

      currentNode = nextNode;
    }

    return state;
  }
}
