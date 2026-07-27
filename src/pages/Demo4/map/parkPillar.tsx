import { useMemo, useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type ShaderMaterial,
  Vector2,
  Vector3,
} from "three";

const PillarMaterial = extend(
  shaderMaterial(
    {
      uColor: new Color(0x8fc2ff),
      uOpacity: 0.85,
      uTime: 0,
    },
    `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
        radial = pow(radial, 1.6);

        float rise = pow(1.0 - vUv.y, 0.55);
        float pulse = 0.82 + 0.18 * sin(uTime * 2.2 + vUv.y * 6.0);
        float band = 0.55 + 0.45 * sin((vUv.y + uTime * 0.35) * 12.0);

        float alpha = radial * rise * pulse * mix(0.75, 1.0, band) * uOpacity;
        vec3 col = uColor * (1.2 + radial * 1.4);
        gl_FragColor = vec4(col, alpha);
      }
    `
  )
);

export interface ParkPillarProps {
  data: {
    name: string;
    center: Vector3;
    points: Vector2[][];
  }[];
  height?: number;
}

export default function ParkPillar(props: ParkPillarProps) {
  const { data, height = 4.2 } = props;
  const groupRef = useRef<Group>(null!);

  const heights = useMemo(
    () => data.map((_, i) => height * (0.78 + ((i * 17) % 7) * 0.04)),
    [data, height]
  );

  useFrame((_, delta) => {
    groupRef.current?.traverse((obj) => {
      const mat = (obj as { material?: ShaderMaterial }).material;
      if (mat?.uniforms?.uTime) {
        mat.uniforms.uTime.value += delta;
      }
    });
  });

  return (
    <group ref={groupRef} position-z={1.05} renderOrder={8}>
      {data.map((region, i) => {
        const h = heights[i];
        return (
          <group
            key={`${region.name}-${i}`}
            position={[region.center.x, region.center.y, 0]}>
            {/* 外层光晕柱 */}
            <mesh
              rotation-x={-Math.PI / 2}
              position={[0, 0, h * 0.5]}
              raycast={() => null}>
              <cylinderGeometry args={[0.22, 0.38, h, 20, 1, true]} />
              <PillarMaterial
                transparent
                depthWrite={false}
                depthTest={false}
                side={DoubleSide}
                blending={AdditiveBlending}
                fog={false}
                uColor={0x4d7fff}
                uOpacity={0.35}
              />
            </mesh>
            {/* 核心光柱 */}
            <mesh
              rotation-x={-Math.PI / 2}
              position={[0, 0, h * 0.5]}
              raycast={() => null}>
              <cylinderGeometry args={[0.06, 0.12, h, 16, 1, true]} />
              <PillarMaterial
                transparent
                depthWrite={false}
                depthTest={false}
                side={DoubleSide}
                blending={AdditiveBlending}
                fog={false}
                uColor={0xbdcfff}
                uOpacity={0.95}
              />
            </mesh>
            {/* 底部光斑 */}
            <mesh position={[0, 0, 0.02]} raycast={() => null}>
              <circleGeometry args={[0.42, 24]} />
              <meshBasicMaterial
                transparent
                color={0x8fc2ff}
                opacity={0.35}
                depthWrite={false}
                blending={AdditiveBlending}
                fog={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
