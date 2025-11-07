import { GridPosition } from '../core/GridPosition.js';

export interface RoadNode {
  id: string;
  position: GridPosition;
  connections: string[]; // IDs of connected nodes
  roadType: RoadType;
}

export interface RoadEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  length: number;
  capacity: number;
  currentTraffic: number;
  roadType: RoadType;
  speedLimit: number;
}

export enum RoadType {
  STREET = 'street',
  AVENUE = 'avenue',
  HIGHWAY = 'highway'
}

export interface Route {
  nodes: string[];
  edges: string[];
  totalDistance: number;
  estimatedTime: number;
}

export class RoadNetwork {
  private nodes: Map<string, RoadNode> = new Map();
  private edges: Map<string, RoadEdge> = new Map();
  private nodeIdCounter: number = 1;
  private edgeIdCounter: number = 1;

  addRoadNode(position: GridPosition, roadType: RoadType = RoadType.STREET): RoadNode {
    const id = `node_${this.nodeIdCounter++}`;
    const node: RoadNode = {
      id,
      position: { ...position },
      connections: [],
      roadType
    };
    
    this.nodes.set(id, node);
    
    // Auto-connect to nearby nodes
    this.autoConnectNode(node);
    
    return node;
  }

  private autoConnectNode(newNode: RoadNode): void {
    const maxConnectionDistance = 2; // Grid units
    
    for (const [nodeId, existingNode] of this.nodes) {
      if (nodeId === newNode.id) continue;
      
      const distance = this.calculateDistance(newNode.position, existingNode.position);
      
      if (distance <= maxConnectionDistance && this.canConnect(newNode, existingNode)) {
        this.connectNodes(newNode.id, nodeId);
      }
    }
  }

  private canConnect(node1: RoadNode, node2: RoadNode): boolean {
    // Check if nodes are aligned (horizontal, vertical, or diagonal)
    const dx = Math.abs(node1.position.x - node2.position.x);
    const dy = Math.abs(node1.position.y - node2.position.y);
    
    // Allow connections if nodes are aligned or diagonal
    return dx === 0 || dy === 0 || dx === dy;
  }

  connectNodes(nodeId1: string, nodeId2: string): RoadEdge | null {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    
    if (!node1 || !node2) return null;
    
    // Check if already connected
    if (node1.connections.includes(nodeId2)) return null;
    
    const edgeId = `edge_${this.edgeIdCounter++}`;
    const distance = this.calculateDistance(node1.position, node2.position);
    const roadType = this.getBestRoadType(node1.roadType, node2.roadType);
    
    const edge: RoadEdge = {
      id: edgeId,
      startNodeId: nodeId1,
      endNodeId: nodeId2,
      length: distance,
      capacity: this.getRoadCapacity(roadType),
      currentTraffic: 0,
      roadType,
      speedLimit: this.getSpeedLimit(roadType)
    };
    
    this.edges.set(edgeId, edge);
    
    // Update node connections (bidirectional)
    node1.connections.push(nodeId2);
    node2.connections.push(nodeId1);
    
    return edge;
  }

  private getBestRoadType(type1: RoadType, type2: RoadType): RoadType {
    // Use the higher capacity road type
    const hierarchy = [RoadType.STREET, RoadType.AVENUE, RoadType.HIGHWAY];
    const index1 = hierarchy.indexOf(type1);
    const index2 = hierarchy.indexOf(type2);
    return hierarchy[Math.max(index1, index2)];
  }

  private getRoadCapacity(roadType: RoadType): number {
    switch (roadType) {
      case RoadType.STREET: return 100;
      case RoadType.AVENUE: return 300;
      case RoadType.HIGHWAY: return 800;
      default: return 100;
    }
  }

  private getSpeedLimit(roadType: RoadType): number {
    switch (roadType) {
      case RoadType.STREET: return 25;
      case RoadType.AVENUE: return 35;
      case RoadType.HIGHWAY: return 65;
      default: return 25;
    }
  }

  private calculateDistance(pos1: GridPosition, pos2: GridPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  findPath(startNodeId: string, endNodeId: string): Route | null {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return null;
    }

    // Dijkstra's algorithm implementation
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Initialize distances
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, nodeId === startNodeId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (!currentNode || minDistance === Infinity) break;
      
      unvisited.delete(currentNode);

      if (currentNode === endNodeId) break;

      // Check neighbors
      const node = this.nodes.get(currentNode)!;
      for (const neighborId of node.connections) {
        if (!unvisited.has(neighborId)) continue;

        const edge = this.findEdgeBetweenNodes(currentNode, neighborId);
        if (!edge) continue;

        const alt = distances.get(currentNode)! + edge.length;
        if (alt < distances.get(neighborId)!) {
          distances.set(neighborId, alt);
          previous.set(neighborId, currentNode);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endNodeId;
    
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current)!;
    }

    if (path[0] !== startNodeId) {
      return null; // No path found
    }

    // Build route with edges
    const edges: string[] = [];
    let totalDistance = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const edge = this.findEdgeBetweenNodes(path[i], path[i + 1]);
      if (edge) {
        edges.push(edge.id);
        totalDistance += edge.length;
      }
    }

    return {
      nodes: path,
      edges,
      totalDistance,
      estimatedTime: this.calculateTravelTime(edges)
    };
  }

  private findEdgeBetweenNodes(nodeId1: string, nodeId2: string): RoadEdge | null {
    for (const edge of this.edges.values()) {
      if ((edge.startNodeId === nodeId1 && edge.endNodeId === nodeId2) ||
          (edge.startNodeId === nodeId2 && edge.endNodeId === nodeId1)) {
        return edge;
      }
    }
    return null;
  }

  private calculateTravelTime(edgeIds: string[]): number {
    let totalTime = 0;
    
    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const congestionFactor = Math.min(2.0, 1.0 + (edge.currentTraffic / edge.capacity));
        const speed = edge.speedLimit / congestionFactor;
        totalTime += (edge.length / speed) * 60; // Convert to minutes
      }
    }
    
    return totalTime;
  }

  updateTraffic(edgeId: string, trafficChange: number): void {
    const edge = this.edges.get(edgeId);
    if (edge) {
      edge.currentTraffic = Math.max(0, edge.currentTraffic + trafficChange);
    }
  }

  getTrafficDensity(edgeId: string): number {
    const edge = this.edges.get(edgeId);
    return edge ? edge.currentTraffic / edge.capacity : 0;
  }

  clearTraffic(): void {
    for (const edge of this.edges.values()) {
      edge.currentTraffic = 0;
    }
  }

  getNodes(): Map<string, RoadNode> {
    return new Map(this.nodes);
  }

  getEdges(): Map<string, RoadEdge> {
    return new Map(this.edges);
  }

  getNode(nodeId: string): RoadNode | undefined {
    return this.nodes.get(nodeId);
  }

  getEdge(edgeId: string): RoadEdge | undefined {
    return this.edges.get(edgeId);
  }

  removeNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all edges connected to this node
    const edgesToRemove: string[] = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.startNodeId === nodeId || edge.endNodeId === nodeId) {
        edgesToRemove.push(edgeId);
      }
    }

    edgesToRemove.forEach(edgeId => this.edges.delete(edgeId));

    // Remove connections from other nodes
    for (const connectedNodeId of node.connections) {
      const connectedNode = this.nodes.get(connectedNodeId);
      if (connectedNode) {
        connectedNode.connections = connectedNode.connections.filter(id => id !== nodeId);
      }
    }

    return this.nodes.delete(nodeId);
  }

  getNetworkStatistics() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      totalCapacity: Array.from(this.edges.values()).reduce((sum, edge) => sum + edge.capacity, 0),
      totalTraffic: Array.from(this.edges.values()).reduce((sum, edge) => sum + edge.currentTraffic, 0),
      averageTrafficDensity: this.calculateAverageTrafficDensity()
    };
  }

  private calculateAverageTrafficDensity(): number {
    if (this.edges.size === 0) return 0;
    
    let totalDensity = 0;
    for (const edge of this.edges.values()) {
      totalDensity += edge.currentTraffic / edge.capacity;
    }
    
    return totalDensity / this.edges.size;
  }
}