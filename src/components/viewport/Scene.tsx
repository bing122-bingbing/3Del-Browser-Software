import React, { useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react';
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

function ObjectMesh({ obj, isSelected, children }: { obj: SceneObject; isSelected: boolean; children?: React.ReactNode }) {
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
          {children}
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
          {children}
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

  let mirrorX = false;
  let arrayCount = 1;
  let solidifyThick = 0;
  
  obj.modifiers?.forEach(m => {
    if (m.type === 'Mirror' && m.active) mirrorX = true;
    if (m.type === 'Array' && m.active) arrayCount = Math.max(1, (m.value || 1) + 1);
    if (m.type === 'Solidify' && m.active) solidifyThick = (m.value || 0) * 0.05;
  });

  const getGeometry = () => {
    let subDiv = 0;
    let hasSkin = false;
    let skinVal = 0;
    let bevel = 0;
    let decimate = 0;
    obj.modifiers?.forEach(m => {
      if (m.type === 'Subdivision' && m.active) subDiv += (m.value || 0);
      if (m.type === 'Skin' && m.active) { hasSkin = true; skinVal = m.value || 1; }
      if (m.type === 'Bevel' && m.active) bevel += (m.value || 0);
      if (m.type === 'Decimate' && m.active) decimate += (m.value || 0);
    });
    
    // Decimate reduces segments
    let segs = Math.pow(2, subDiv);
    let circSegs = Math.max(3, 32 + (subDiv * 16));
    
    if (decimate > 0) {
      segs = Math.max(1, Math.floor(segs / (decimate * 0.5 + 1)));
      circSegs = Math.max(3, Math.floor(circSegs / (decimate * 0.5 + 1)));
    }

    if (obj.type === 'Curve') {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)]);
      return <tubeGeometry args={[curve, 20 * segs, hasSkin ? 0.05 + skinVal * 0.02 : 0.05, Math.max(3, 8 - decimate), false]} />;
    }
    if (obj.type === 'Bone') return <coneGeometry args={[0.2, 1, 4 * segs]} />;
    if (obj.type === 'Parent') return <boxGeometry args={[0.5, 0.5, 0.5]} />;
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
  };

  const geomInstances = [];
  for (let i = 0; i < arrayCount; i++) {
    geomInstances.push(
      <group key={`array-${i}`} position={[i * 1.5, 0, 0]}>
        <mesh castShadow receiveShadow>
          {getGeometry()}
          <meshStandardMaterial 
            color={obj.type === 'Parent' ? '#ffaa00' : obj.color} 
            emissive={isSelected ? new THREE.Color(0x222222) : new THREE.Color(0x000000)}
            roughness={0.5}
            metalness={0.1}
            side={THREE.DoubleSide}
            wireframe={obj.type === 'Parent' || obj.modifiers?.some(m => m.type === 'Skin' && m.active && obj.type !== 'Curve')}
          />
          {isSelected && <Edges color="#ffa500" linewidth={2} />}
          {obj.modifiers?.some(m => m.type === 'Skin' && m.active && obj.type !== 'Curve') && <Edges color={obj.color} linewidth={3} />}
        </mesh>
        
        {mirrorX && (
          <mesh castShadow receiveShadow scale={[-1, 1, 1]}>
            {getGeometry()}
            <meshStandardMaterial color={obj.color} side={THREE.DoubleSide} />
          </mesh>
        )}

        {solidifyThick > 0 && (
          <mesh castShadow receiveShadow scale={[1 + solidifyThick, 1 + solidifyThick, 1 + solidifyThick]}>
            {getGeometry()}
            <meshStandardMaterial color={obj.color} side={THREE.BackSide} />
          </mesh>
        )}
      </group>
    );
  }

  // Effect for vertex modifiers
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const group = meshRef.current;
    
    // Process noise, twist, bend, taper, wave, lattice
    let twist = 0, bend = 0, taper = 0, noise = 0, wave = 0, lattice = 0;
    obj.modifiers?.forEach(m => {
      if (!m.active) return;
      if (m.type === 'Twist') twist = (m.value || 0) * 0.1;
      if (m.type === 'Bend') bend = (m.value || 0) * 0.1;
      if (m.type === 'Taper') taper = (m.value || 0) * 0.1;
      if (m.type === 'Noise') noise = (m.value || 0) * 0.05;
      if (m.type === 'Wave') wave = (m.value || 0) * 0.1;
      if (m.type === 'Lattice') lattice = (m.value || 0) * 0.1;
    });

    if (twist === 0 && bend === 0 && taper === 0 && noise === 0 && wave === 0 && lattice === 0) return;

    group.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        if (!child.userData.originalGeometry) {
          child.userData.originalGeometry = child.geometry.clone();
        }
        
        const geom = child.userData.originalGeometry.clone();
        const posAttribute = geom.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
          vertex.fromBufferAttribute(posAttribute, i);
          
          // Taper
          if (taper !== 0) {
            const scale = 1 + vertex.y * taper;
            vertex.x *= scale;
            vertex.z *= scale;
          }

          // Twist
          if (twist !== 0) {
            const angle = vertex.y * twist;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = vertex.x * cos - vertex.z * sin;
            const z = vertex.x * sin + vertex.z * cos;
            vertex.x = x;
            vertex.z = z;
          }

          // Bend (along Y based on X)
          if (bend !== 0) {
            const angle = vertex.x * bend;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = vertex.x * cos - vertex.y * sin;
            const y = vertex.x * sin + vertex.y * cos;
            vertex.x = x;
            vertex.y = y;
          }

          // Noise
          if (noise !== 0) {
            vertex.x += (Math.random() - 0.5) * noise;
            vertex.y += (Math.random() - 0.5) * noise;
            vertex.z += (Math.random() - 0.5) * noise;
          }

          // Wave
          if (wave !== 0) {
            vertex.y += Math.sin(vertex.x * 5) * wave;
          }

          // Lattice (simple bulge)
          if (lattice !== 0) {
            const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
            const scale = 1 + Math.max(0, (1 - dist)) * lattice;
            vertex.x *= scale;
            vertex.z *= scale;
          }

          posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geom.computeVertexNormals();
        child.geometry = geom;
      }
    });

    return () => {
      group.traverse((child: any) => {
        if (child.isMesh && child.userData.originalGeometry) {
          child.geometry = child.userData.originalGeometry;
        }
      });
    };
  }, [obj.modifiers, arrayCount, mirrorX, solidifyThick]);

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
        {geomInstances}
        {children}
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

function ObjectHierarchy({ parentId }: { parentId?: string }) {
  const { objects, selectedIds } = useStore();
  const children = Object.values(objects).filter(obj => obj.parentId === parentId);
  return (
    <>
      {children.map(obj => (
         <ObjectMesh key={obj.id} obj={obj} isSelected={selectedIds.includes(obj.id)}>
             <ObjectHierarchy parentId={obj.id} />
         </ObjectMesh>
      ))}
    </>
  );
}

export default function Scene() {
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
        <ObjectHierarchy parentId={undefined} />
      </group>

      <OrbitControls makeDefault />
    </>
  );
}
