import * as THREE from 'three';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type ViewportMode = 'perspective' | 'orthographic';
export type ShadingMode = 'wireframe' | 'solid' | 'material' | 'rendered';

export type ModifierType = 'Subdivision' | 'Bevel' | 'Skin';

export interface Modifier {
  id: string;
  type: ModifierType;
  active: boolean;
  value?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'Mesh' | 'Light' | 'Camera' | 'Empty' | 'Curve' | 'Bone';
  geometryType?: 'Box' | 'Sphere' | 'Cylinder' | 'Plane' | 'Cone' | 'Torus' | 'Text' | 'Imported';
  fileUrl?: string;
  fileExt?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  color?: string;
  text?: string;
  modifiers: Modifier[];
  children: string[];
  parentId?: string;
}

export interface AppState {
  objects: Record<string, SceneObject>;
  selectedIds: string[];
  transformMode: TransformMode | null;
  viewportMode: ViewportMode;
  shadingMode: ShadingMode;
  isSnapEnabled: boolean;
  snapDistance: number;
  
  clipboard: SceneObject[];
  
  history: Record<string, SceneObject>[];
  historyIndex: number;

  // Actions
  saveHistory: (newObjects: Record<string, SceneObject>) => void;
  undo: () => void;
  redo: () => void;
  setObjects: (objects: Record<string, SceneObject>) => void;
  copy: () => void;
  paste: () => void;

  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  selectObject: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  setTransformMode: (mode: TransformMode | null) => void;
  setViewportMode: (mode: ViewportMode) => void;
  setShadingMode: (mode: ShadingMode) => void;
  setIsSnapEnabled: (enabled: boolean) => void;
  setSnapDistance: (dist: number) => void;
}
