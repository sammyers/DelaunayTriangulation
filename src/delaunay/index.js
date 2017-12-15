import _ from 'lodash';

const edgeSize = 1;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateRandomPoints(numPoints, size) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    let x = getRandomInt(size);
    let y = getRandomInt(size);
    while (points.some(p => p.x === x && p.y === y)) {
      x = getRandomInt(size);
      y = getRandomInt(size);
    }
    points.push({ x, y });
  }
  return points.sort((a, b) => {
    if (a.x === b.x) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}

function pointsToGraph(points) {
  return {
    nodes: points.map((point, idx) => ({
      ...point,
      id: String(idx),
      label: `${idx}: (${point.x}, ${point.y})`,
      size: 1,
    })),
    edges: [],
  };
}

export function generateGraph(numNodes, size) {
  return pointsToGraph(generateRandomPoints(numNodes, size));
}

function getSlope(a, b) {
  return (a.y - b.y) / (a.x - b.x);
}

function checkCollinear(a, b, c) {
  return (b.y - a.y) * (c.x - b.x) === (c.y - b.y) * (b.x - a.x);
}

export function checkIntersection([a, b], [c, d]) {
  function ccw(a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  }
  return (ccw(a, c, d) !== ccw(b, c, d)) && (ccw(a, b, c) !== ccw(a, b, d));
}

function findEdge(targetId, edges) {
  return edges.find(({ id }) => id === targetId);
}

function findNode(targetId, nodes) {
  return nodes.find(({ id }) => id === targetId);
}

function getLineSegment({ source, target }, nodes) {
  return [findNode(source, nodes), findNode(target, nodes)];
}

export function scanTriangulate({ nodes, edges }) {
  let m = 2;
  let edgeId = 0;

  // Choose pm, such that m is minimal and p1...pm are not collinear
  while (checkCollinear(nodes[m-2], nodes[m-1], nodes[m])) {
    m++;
  }
  // connect pm to all p1...pm-1
  for (let i = m - 1; i >= 0; i--) {
    edges.push({
      id: String(edgeId),
      source: nodes[i].id,
      target: nodes[m].id,
      size: edgeSize,
    });
    edgeId++;
    if (i > 0) {
      edges.push({
        id: String(edgeId),
        source: nodes[i].id,
        target: nodes[i - 1].id,
        size: edgeSize,
      });
      edgeId++;
    }
  }
  for (let i = m + 1; i < nodes.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = nodes[i];
      const b = nodes[j];
      // Check if an edge between these nodes would cross any other edges
      if (edges.every(e => {
        // If two edges share a vertex, they don't cross
        if (e.source === a.id || e.target === a.id || e.source === b.id || e.target === b.id) {
          return true;
        }
        return !checkIntersection([a, b], getLineSegment(e, nodes));
      })) {
        // If not, add that edge
        edges.push({
          id: String(edgeId),
          source: a.id,
          target: b.id,
          size: edgeSize,
        });
        edgeId++;
      }
    }
  }
  return { nodes, edges };
}

function pointInTriangle(p, a, b, c) {
  const area = 1/2 * (-b.y * c.x + a.y * (-b.x + c.x) + a.x * (b.y - c.y) + b.x * c.y);
  const sign = area < 0 ? -1 : 1;
  const s = (a.y * c.x - a.x * c.y + (c.y - a.y) * p.x + (a.x - c.x) * p.y) * sign;
  const t = (a.x * b.y - a.y * b.x + (a.y - b.y) * p.x + (b.x - a.x) * p.y) * sign;
  return s > 0 && t > 0 && (s + t) < 2 * area * sign;
}

function getQuadrilateralEdges({ id, source, target }, edgeMap, nodeMap) {
  const targetAdjacent = _.without(nodeMap[target].edges, id);
  const sourceAdjacent = _.without(nodeMap[source].edges, id);

  const edgePairs = [];
  for (let a of targetAdjacent) {
    for (let b of sourceAdjacent) {
      const edgeA = edgeMap[a];
      const edgeB = edgeMap[b];
      const maybeVertex = _.intersection(
        [edgeA.source, edgeA.target], [edgeB.source, edgeB.target]
      );
      if (maybeVertex.length) {
        edgePairs.push({
          vertex: maybeVertex[0],
          edges: [edgeA, edgeB]
        });
      }
    }
  }
  if (edgePairs.length > 2) {
    for (let i = 0; i < edgePairs.length; i++) {
      const triangle = [nodeMap[source], nodeMap[edgePairs[i].vertex], nodeMap[target]];
      const otherPairs = [...edgePairs];
      otherPairs.splice(i, 1);
      if (edgePairs.some(({ vertex }) => pointInTriangle(nodeMap[vertex], ...triangle))) {
        edgePairs.splice(i, 1);
      }
    }
  }
  return edgePairs;
}

window.getQuadrilateralEdges = getQuadrilateralEdges;

function getDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function calculateAngle(a, b, c) {
  const ab = getDistance(a, b);
  const bc = getDistance(b, c);
  const ac = getDistance(a, c);
  return Math.acos(
    (Math.pow(ab, 2) + Math.pow(bc, 2) - Math.pow(ac, 2)) /
    (2 * ab * bc)
  ) * 180 / Math.PI;
}

window.calculateAngle = calculateAngle;

function isLocallyDelaunay({ source, target }, [pairA, pairB], nodeMap) {
  const triangleA = [nodeMap[source], nodeMap[pairA.vertex], nodeMap[target]];
  const triangleB = [nodeMap[source], nodeMap[pairB.vertex], nodeMap[target]];
  return (calculateAngle(...triangleA) + calculateAngle(...triangleB) <= 180);
}

function flipEdge({ id, source, target }, [pairA, pairB], edgeMap, nodeMap) {
  // Remove edge
  edgeMap[id] = undefined;
  // Remove nodeMap references
  console.log(`Flipping edge between ${source} and ${target} to ${pairA.vertex} and ${pairB.vertex}`);
  _.pull(nodeMap[source].edges, id);
  _.pull(nodeMap[target].edges, id);
  // Add new edge
  edgeMap[id] = {
    id,
    source: pairA.vertex,
    target: pairB.vertex,
    marked: false,
    size: edgeSize,
    color: "#9B59B6",
  };
  // Add nodeMap references
  nodeMap[pairA.vertex].edges.push(id);
  nodeMap[pairB.vertex].edges.push(id);
}

function processEdge(diagonal, edgeMap, nodeMap, stack) {
  const quadEdges = getQuadrilateralEdges(diagonal, edgeMap, nodeMap);
  if (quadEdges.length < 2) return;
  if (!isLocallyDelaunay(diagonal, quadEdges, nodeMap)) {
    flipEdge(diagonal, quadEdges, edgeMap, nodeMap);
    for (let edge of _.flatten(_.map(quadEdges, 'edges'))) {
      if (!edge.marked) {
        const newQuadEdges = getQuadrilateralEdges(edge, edgeMap, nodeMap);
        if (newQuadEdges.length === 2 && !isLocallyDelaunay(edge, newQuadEdges, nodeMap)) {
          edge.marked = true;
          stack.push(edge);
        }
      }
    }
  }
}

export function delaunayTriangulate(graph) {
  const { nodes, edges } = graph;
  const nodeMap = nodes.reduce((map, node) => ({
    ...map,
    [node.id]: {
      ...node,
      edges: []
    }
  }), {});
  for (let { id, source, target } of edges) {
    nodeMap[source].edges.push(id);
    nodeMap[target].edges.push(id);
  }
  const edgeMap = edges.reduce((map, edge) => ({ ...map, [edge.id]: edge }), {});
  window.nodeMap = nodeMap;
  window.edgeMap = edgeMap;

  const stack = [];
  for (let edge of edges) {
    edge.marked = true;
    stack.push(edge);
  }
  while (stack.length) {
    const diagonal = stack.pop();
    diagonal.marked = false;
    processEdge(diagonal, edgeMap, nodeMap, stack);
  }
  return {
    nodes: _.values(nodeMap),
    edges: _.values(edgeMap)
  };
}
