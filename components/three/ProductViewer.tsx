'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function CapsuleProduct() {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.03
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.35, 0.75, 8, 32]} />
        <meshPhysicalMaterial
          color="#1A1A1A"
          roughness={0.1}
          metalness={0.95}
          reflectivity={1}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.355, 0.355, 0.1, 32]} />
        <meshPhysicalMaterial color="#2A2A2A" roughness={0.02} metalness={1} />
      </mesh>
    </group>
  )
}

interface ProductViewerProps {
  rotateLabel: string
}

export default function ProductViewer({ rotateLabel }: ProductViewerProps) {
  const [interacted, setInteracted] = useState(false)

  return (
    <div className="relative w-full h-full" onPointerDown={() => setInteracted(true)}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.05} />
        <pointLight position={[3, 3, 3]} intensity={3} color="#C0D0FF" />
        <pointLight position={[-3, -2, -3]} intensity={0.8} color="#8090CC" />
        <spotLight position={[0, 5, 0]} intensity={1} color="#FFFFFF" angle={0.3} />

        <CapsuleProduct />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
          autoRotate={!interacted}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {!interacted && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[8px] uppercase pointer-events-none"
          style={{ letterSpacing: '0.3em', color: '#666666' }}
        >
          {rotateLabel}
        </div>
      )}
    </div>
  )
}
