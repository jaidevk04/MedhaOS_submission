/**
 * Service Map Generator
 * Creates visual representations of service dependencies and call patterns
 */

export interface ServiceNode {
  name: string;
  type: 'service' | 'database' | 'cache' | 'external';
  calls: number;
  errors: number;
  avgLatency: number;
}

export interface ServiceEdge {
  from: string;
  to: string;
  calls: number;
  errors: number;
  avgLatency: number;
}

export interface ServiceMap {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  timestamp: Date;
}

export class ServiceMapGenerator {
  private nodes: Map<string, ServiceNode>;
  private edges: Map<string, ServiceEdge>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * Record a service call
   */
  recordCall(
    from: string,
    to: string,
    latency: number,
    error: boolean = false,
    toType: ServiceNode['type'] = 'service'
  ): void {
    // Update or create source node
    if (!this.nodes.has(from)) {
      this.nodes.set(from, {
        name: from,
        type: 'service',
        calls: 0,
        errors: 0,
        avgLatency: 0,
      });
    }

    // Update or create destination node
    if (!this.nodes.has(to)) {
      this.nodes.set(to, {
        name: to,
        type: toType,
        calls: 0,
        errors: 0,
        avgLatency: 0,
      });
    }

    const toNode = this.nodes.get(to)!;
    toNode.calls++;
    if (error) toNode.errors++;
    toNode.avgLatency = (toNode.avgLatency * (toNode.calls - 1) + latency) / toNode.calls;

    // Update or create edge
    const edgeKey = `${from}->${to}`;
    if (!this.edges.has(edgeKey)) {
      this.edges.set(edgeKey, {
        from,
        to,
        calls: 0,
        errors: 0,
        avgLatency: 0,
      });
    }

    const edge = this.edges.get(edgeKey)!;
    edge.calls++;
    if (error) edge.errors++;
    edge.avgLatency = (edge.avgLatency * (edge.calls - 1) + latency) / edge.calls;
  }

  /**
   * Get current service map
   */
  getServiceMap(): ServiceMap {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      timestamp: new Date(),
    };
  }

  /**
   * Get service map in DOT format (for Graphviz)
   */
  toDotFormat(): string {
    let dot = 'digraph ServiceMap {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    for (const node of this.nodes.values()) {
      const color = node.type === 'service' ? 'lightblue' : 
                    node.type === 'database' ? 'lightgreen' :
                    node.type === 'cache' ? 'lightyellow' : 'lightgray';
      
      const errorRate = node.calls > 0 ? (node.errors / node.calls * 100).toFixed(1) : '0';
      
      dot += `  "${node.name}" [fillcolor="${color}", style="filled,rounded", `;
      dot += `label="${node.name}\\n${node.calls} calls\\n${errorRate}% errors\\n${node.avgLatency.toFixed(0)}ms avg"];\n`;
    }

    dot += '\n';

    // Add edges
    for (const edge of this.edges.values()) {
      const errorRate = edge.calls > 0 ? (edge.errors / edge.calls * 100).toFixed(1) : '0';
      const color = parseFloat(errorRate) > 5 ? 'red' : parseFloat(errorRate) > 1 ? 'orange' : 'black';
      
      dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.calls} calls\\n${errorRate}% errors\\n${edge.avgLatency.toFixed(0)}ms", color="${color}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Get service map in Mermaid format
   */
  toMermaidFormat(): string {
    let mermaid = 'graph LR\n';

    // Add nodes with styling
    for (const node of this.nodes.values()) {
      const nodeId = node.name.replace(/[^a-zA-Z0-9]/g, '_');
      const errorRate = node.calls > 0 ? (node.errors / node.calls * 100).toFixed(1) : '0';
      
      mermaid += `  ${nodeId}["${node.name}<br/>${node.calls} calls<br/>${errorRate}% errors<br/>${node.avgLatency.toFixed(0)}ms"]\n`;
      
      // Add styling based on type
      if (node.type === 'database') {
        mermaid += `  style ${nodeId} fill:#90EE90\n`;
      } else if (node.type === 'cache') {
        mermaid += `  style ${nodeId} fill:#FFFFE0\n`;
      } else if (node.type === 'external') {
        mermaid += `  style ${nodeId} fill:#D3D3D3\n`;
      }
    }

    mermaid += '\n';

    // Add edges
    for (const edge of this.edges.values()) {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
      const errorRate = edge.calls > 0 ? (edge.errors / edge.calls * 100).toFixed(1) : '0';
      
      mermaid += `  ${fromId} -->|${edge.calls} calls, ${errorRate}% errors| ${toId}\n`;
    }

    return mermaid;
  }

  /**
   * Reset the service map
   */
  reset(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  /**
   * Get critical path (highest latency chain)
   */
  getCriticalPath(): ServiceEdge[] {
    const edges = Array.from(this.edges.values());
    return edges.sort((a, b) => b.avgLatency - a.avgLatency).slice(0, 10);
  }

  /**
   * Get error hotspots
   */
  getErrorHotspots(): ServiceNode[] {
    const nodes = Array.from(this.nodes.values());
    return nodes
      .filter(n => n.calls > 0)
      .sort((a, b) => (b.errors / b.calls) - (a.errors / a.calls))
      .slice(0, 10);
  }

  /**
   * Get bottlenecks (highest latency services)
   */
  getBottlenecks(): ServiceNode[] {
    const nodes = Array.from(this.nodes.values());
    return nodes
      .filter(n => n.calls > 0)
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 10);
  }
}

/**
 * Create service map generator instance
 */
export function createServiceMapGenerator(): ServiceMapGenerator {
  return new ServiceMapGenerator();
}
