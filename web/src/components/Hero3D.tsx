"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function LandParcel() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group>
        {/* Land base */}
        <mesh ref={meshRef} position={[0, -0.3, 0]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[3.5, 0.4, 2.8]} />
          <meshStandardMaterial color="#4a6741" roughness={0.8} />
        </mesh>
        {/* Boundary posts */}
        {[
          [-1.6, 0.1, -1.2],
          [1.6, 0.1, -1.2],
          [1.6, 0.1, 1.2],
          [-1.6, 0.1, 1.2],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
            <meshStandardMaterial color="#C8F135" emissive="#C8F135" emissiveIntensity={0.3} />
          </mesh>
        ))}
        {/* Trust shield dome */}
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[1.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <MeshDistortMaterial
            color="#C8F135"
            transparent
            opacity={0.15}
            distort={0.1}
            speed={2}
            roughness={0.1}
          />
        </mesh>
        {/* Wheat stalks */}
        {[-0.8, 0, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 1.0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.6, 6]} />
            <meshStandardMaterial color="#D4A843" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 2, -3]} intensity={0.5} color="#C8F135" />
      <LandParcel />
      <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={8} blur={2} />
      <Environment preset="sunset" />
    </>
  );
}

export function Hero3D({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-lime border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 2, 6], fov: 45 }}
          style={{ background: "transparent" }}
          dpr={[1, 1.5]}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
