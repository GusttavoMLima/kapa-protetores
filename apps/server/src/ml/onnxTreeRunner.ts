import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface OnnxTreeEnsembleModel {
  nodesFalseNodeIds: number[];
  nodesFeatureIds: number[];
  nodesModes: string[];
  nodesNodeIds: number[];
  nodesTrueNodeIds: number[];
  nodesValues: number[];
  targetNodeIds: number[];
  targetWeights: number[];
  leafWeightsByNodeId: Map<number, number>;
}

function readVarint(
  buffer: Buffer,
  offset: number,
): { value: number; offset: number } {
  let result = 0n;
  let shift = 0n;
  let currentOffset = offset;

  while (currentOffset < buffer.length) {
    const byte = BigInt(buffer[currentOffset++]);
    result |= (byte & 0x7fn) << shift;
    if ((byte & 0x80n) === 0n) {
      return { value: Number(result), offset: currentOffset };
    }
    shift += 7n;
  }

  return { value: Number(result), offset: currentOffset };
}

function findAttributePosition(buffer: Buffer, attributeName: string): number {
  const nameBytes = Buffer.from(attributeName, 'utf8');
  const header = Buffer.concat([
    Buffer.from([0x0a, nameBytes.length]),
    nameBytes,
  ]);
  const index = buffer.indexOf(header);
  if (index === -1) {
    throw new Error(
      `ONNX TreeEnsembleRegressor attribute "${attributeName}" not found.`,
    );
  }
  return index + header.length;
}

function parseFloatAttribute(buffer: Buffer, attributeName: string): number[] {
  let pos = findAttributePosition(buffer, attributeName);
  const values: number[] = [];

  while (pos < buffer.length && buffer[pos] === 0x3d) {
    pos += 1;
    values.push(buffer.readFloatLE(pos));
    pos += 4;
  }

  return values;
}

function parseIntAttribute(buffer: Buffer, attributeName: string): number[] {
  let pos = findAttributePosition(buffer, attributeName);
  const values: number[] = [];

  while (pos < buffer.length && buffer[pos] === 0x40) {
    pos += 1;
    const parsed = readVarint(buffer, pos);
    values.push(parsed.value);
    pos = parsed.offset;
  }

  return values;
}

function parseStringAttribute(buffer: Buffer, attributeName: string): string[] {
  let pos = findAttributePosition(buffer, attributeName);
  const values: string[] = [];

  while (pos < buffer.length && buffer[pos] === 0x4a) {
    pos += 1;
    const lengthInfo = readVarint(buffer, pos);
    pos = lengthInfo.offset;
    values.push(
      buffer.subarray(pos, pos + lengthInfo.value).toString('utf8'),
    );
    pos += lengthInfo.value;
  }

  return values;
}

export function resolveDefaultOnnxModelPath(): string {
  const candidates = [
    resolve(__dirname, 'adopet_tree_model.onnx'),
    resolve(__dirname, '../../src/ml/adopet_tree_model.onnx'),
    resolve(process.cwd(), 'src/ml/adopet_tree_model.onnx'),
    resolve(process.cwd(), 'apps/server/src/ml/adopet_tree_model.onnx'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('ONNX model file "adopet_tree_model.onnx" was not found.');
}

export function loadOnnxTreeModel(modelPath?: string): OnnxTreeEnsembleModel {
  const resolvedPath = modelPath ?? resolveDefaultOnnxModelPath();
  const buffer = readFileSync(resolvedPath);

  const nodesFalseNodeIds = parseIntAttribute(buffer, 'nodes_falsenodeids');
  const nodesFeatureIds = parseIntAttribute(buffer, 'nodes_featureids');
  const nodesModes = parseStringAttribute(buffer, 'nodes_modes');
  const nodesNodeIds = parseIntAttribute(buffer, 'nodes_nodeids');
  const nodesTrueNodeIds = parseIntAttribute(buffer, 'nodes_truenodeids');
  const nodesValues = parseFloatAttribute(buffer, 'nodes_values');
  const targetNodeIds = parseIntAttribute(buffer, 'target_nodeids');
  const targetWeights = parseFloatAttribute(buffer, 'target_weights');

  const leafWeightsByNodeId = new Map<number, number>();
  for (let i = 0; i < targetNodeIds.length; i += 1) {
    const nodeId = targetNodeIds[i];
    const weight = targetWeights[i] ?? 0;
    leafWeightsByNodeId.set(
      nodeId,
      (leafWeightsByNodeId.get(nodeId) ?? 0) + weight,
    );
  }

  return {
    nodesFalseNodeIds,
    nodesFeatureIds,
    nodesModes,
    nodesNodeIds,
    nodesTrueNodeIds,
    nodesValues,
    targetNodeIds,
    targetWeights,
    leafWeightsByNodeId,
  };
}

export function evaluateOnnxTreeRow(
  model: OnnxTreeEnsembleModel,
  features: readonly number[],
): number {
  let nodeId = 0;
  let steps = 0;
  const maxSteps = model.nodesModes.length + 1;

  while (model.nodesModes[nodeId] !== 'LEAF' && steps < maxSteps) {
    const featureIndex = model.nodesFeatureIds[nodeId] ?? 0;
    const threshold = model.nodesValues[nodeId] ?? 0;
    const featureValue = features[featureIndex] ?? 0;

    nodeId =
      featureValue <= threshold
        ? (model.nodesTrueNodeIds[nodeId] ?? nodeId)
        : (model.nodesFalseNodeIds[nodeId] ?? nodeId);
    steps += 1;
  }

  const rawPrediction = model.leafWeightsByNodeId.get(nodeId) ?? 0;
  return Math.round(rawPrediction * 100) / 100;
}
