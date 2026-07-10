import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useThree, useLoader, extend } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Text3D, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useStore } from '../../store/useStore';
import { SceneObject } from '../../types';

extend({ RoundedBoxGeometry });

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedBoxGeometry: any;
  }
}

function ImportedModel({ obj }: { obj: SceneObject }) {
  const [model, setModel] = React.useState<THREE.Object3D | null>(null);
  
  useEffect(() => {
    if (!obj.fileUrl || !obj.fileExt) return;
    const url = obj.fileUrl;
    const ext = obj.fileExt;
    
    let loader: any;
    if (ext === 'obj') loader = new OBJLoader();
    else if (ext === 'stl') loader = new STLLoader();
    else if (ext === 'glb' || ext === 'gltf') loader = new GLTFLoader();
    else if (ext === 'fbx') loader = new FBXLoader();
    
    if (loader) {
      loader.load(url, (data: any) => {
        if (ext === 'stl') {
           const mesh = new THREE.Mesh(data, new THREE.MeshStandardMaterial({ color: obj.color || '#808080' }));
           setModel(mesh);
        } else if (ext === 'glb' || ext === 'gltf') {
           setModel(data.scene);
        } else {
           setModel(data);
        }
      });
    }
  }, [obj.fileUrl, obj.fileExt, obj.color]);

  if (!model) return <mesh><boxGeometry args={[1,1,1]}/><meshBasicMaterial wireframe color="gray" /></mesh>;

  return <primitive object={model} />;
}

function ObjectMesh({ obj, isSelected }: { obj: SceneObject; isSelected: boolean }) {
  const { selectObject, updateObject, transformMode, selectedIds, isSnapEnabled, snapDistance } = useStore();
  const meshRef = useRef<any>(null);
  const transformRef = useRef<any>(null);

  // We need to sync back to Zustand only on mouse up (dragging-changed) to avoid massive re-renders
  // But we want the visual update immediately.
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      
      const callback = (event: any) => {
        if (!event.value && meshRef.current) {
          // Finished dragging, update store
          const m = meshRef.current;
          updateObject(obj.id, {
            position: [m.position.x, m.position.y, m.position.z],
            rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
            scale: [m.scale.x, m.scale.y, m.scale.z],
          });
        }
      };
      
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [obj.id, updateObject]);

  // Sync external state changes to the mesh (if changed from Properties panel)
  // We only do this if NOT currently dragging.
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...obj.position);
      meshRef.current.rotation.set(...obj.rotation);
      meshRef.current.scale.set(...obj.scale);
    }
  }, [obj.position, obj.rotation, obj.scale]);

  const showTransform = isSelected && selectedIds.length === 1;

  if (obj.geometryType === 'Imported') {
    return (
      <group>
        <group
          ref={meshRef}
          position={obj.position}
          rotation={obj.rotation as [number, number, number]}
          scale={obj.scale}
          onClick={(e) => {
            e.stopPropagation();
            selectObject(obj.id, e.ctrlKey || e.metaKey || e.shiftKey);
          }}
        >
          <ImportedModel obj={obj} />
          {isSelected && <Edges color="#ffa500" linewidth={2} />}
        </group>
        {showTransform && transformMode !== null && (
          <TransformControls 
            ref={transformRef}
            object={meshRef}
            mode={transformMode}
            size={0.6}
            translationSnap={isSnapEnabled ? snapDistance : null}
            rotationSnap={isSnapEnabled ? THREE.MathUtils.degToRad(15) : null}
            scaleSnap={isSnapEnabled ? snapDistance : null}
          />
        )}
      </group>
    );
  }

  if (obj.geometryType === 'Text') {
    return (
      <group>
        <Text3D
          ref={meshRef}
          position={obj.position}
          rotation={obj.rotation as [number, number, number]}
          scale={obj.scale}
          onClick={(e) => {
            e.stopPropagation();
            selectObject(obj.id, e.ctrlKey || e.metaKey || e.shiftKey);
          }}
          castShadow
          receiveShadow
          font="https://unpkg.com/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.1}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {obj.text || 'Text'}
          <meshStandardMaterial 
            color={obj.color} 
            emissive={isSelected ? new THREE.Color(0x222222) : new THREE.Color(0x000000)}
            roughness={0.5}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
          {isSelected && <Edges color="#ffa500" linewidth={2} />}
        </Text3D>
        {showTransform && transformMode !== null && (
          <TransformControls 
            ref={transformRef}
            object={meshRef}
            mode={transformMode}
            size={0.6}
            translationSnap={isSnapEnabled ? snapDistance : null}
            rotationSnap={isSnapEnabled ? THREE.MathUtils.degToRad(15) : null}
            scaleSnap={isSnapEnabled ? snapDistance : null}
          />
        )}
      </group>
    );
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={obj.position}
        rotation={obj.rotation as [number, number, number]}
        scale={obj.scale}
        onClick={(e) => {
          e.stopPropagation();
          selectObject(obj.id, e.ctrlKey || e.metaKey || e.shiftKey);
        }}
        castShadow
        receiveShadow
      >
        {(() => {
          let subDiv = 0;
          let hasSkin = false;
          let skinVal = 0;
          let bevel = 0;
          obj.modifiers?.forEach(m => {
            if (m.type === 'Subdivision' && m.active) subDiv += (m.value || 0);
            if (m.type === 'Skin' && m.active) { hasSkin = true; skinVal = m.value || 1; }
            if (m.type === 'Bevel' && m.active) bevel += (m.value || 0);
          });
          const segs = Math.pow(2, subDiv);
          const circSegs = Math.max(8, 32 + (subDiv * 16));

          if (obj.type === 'Curve') {
            const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)]);
            return <tubeGeometry args={[curve, 20 * segs, hasSkin ? 0.05 + skinVal * 0.02 : 0.05, 8, false]} />;
          }
          if (obj.type === 'Bone') return <coneGeometry args={[0.2, 1, 4 * segs]} />;
          switch (obj.geometryType) {
            case 'Box': 
              if (bevel > 0) return <roundedBoxGeometry args={[1, 1, 1, Math.max(2, segs), bevel * 0.02]} />;
              return <boxGeometry args={[1, 1, 1, segs, segs, segs]} />;
            case 'Sphere': return <sphereGeometry args={[0.5, circSegs, circSegs/2]} />;
            case 'Cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, circSegs]} />;
            case 'Plane': return <planeGeometry args={[1, 1, segs, segs]} />;
            case 'Cone': return <coneGeometry args={[0.5, 1, circSegs]} />;
            case 'Torus': return <torusGeometry args={[0.4, 0.1, 16 + subDiv*8, circSegs]} />;
            default: return <boxGeometry args={[1, 1, 1]} />;
          }
        })()}
        <meshStandardMaterial 
          color={obj.color} 
          emissive={isSelected ? new THREE.Color(0x222222) : new THREE.Color(0x000000)}
          roughness={0.5}
          metalness={0.1}
          side={THREE.DoubleSide}
          wireframe={obj.modifiers?.some(m => m.type === 'Skin' && m.active && obj.type !== 'Curve')}
        />
        {isSelected && <Edges color="#ffa500" linewidth={2} />}
        {obj.modifiers?.some(m => m.type === 'Skin' && m.active && obj.type !== 'Curve') && <Edges color={obj.color} linewidth={3} />}
      </mesh>
      
      {showTransform && transformMode !== null && (
        <TransformControls 
          ref={transformRef}
          object={meshRef}
          mode={transformMode}
          size={0.6}
          translationSnap={isSnapEnabled ? snapDistance : null}
          rotationSnap={isSnapEnabled ? THREE.MathUtils.degToRad(15) : null}
          scaleSnap={isSnapEnabled ? snapDistance : null}
        />
      )}
    </group>
  );
}

export default function Scene() {
  const { objects, selectedIds } = useStore();

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionColor="#444" 
        cellColor="#222" 
        cellSize={1} 
        sectionSize={5}
      />
      <axesHelper args={[5]} />

      <group>
        {Object.values(objects).map((obj) => (
          <ObjectMesh key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)} />
        ))}
      </group>

      <OrbitControls makeDefault />
    </>
  );
}
