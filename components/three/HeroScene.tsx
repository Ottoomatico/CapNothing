'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function CapsuleModel() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.3
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <capsuleGeometry args={[0.28, 0.6, 8, 32]} />
        <meshPhysicalMaterial
          color="#1A1A1A"
          roughness={0.15}
          metalness={0.9}
          reflectivity={1}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.08, 32]} />
        <meshPhysicalMaterial
          color="#2A2A2A"
          roughness={0.05}
          metalness={1}
        />
      </mesh>
    </group>
  )
}

function Particles({ count = 200 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#2A2A2A" sizeAttenuation />
    </points>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.03} />
        <pointLight position={[2, 2, 2]} intensity={2} color="#C0D0FF" />
        <pointLight position={[-2, -1, -2]} intensity={0.5} color="#8090CC" />

        <CapsuleModel />
        <Particles />

        <EffectComposer>
          <Bloom luminanceThreshold={0.6} intensity={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
