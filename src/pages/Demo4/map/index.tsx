import { Suspense } from "react";
import styled from "styled-components";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Lights from "./lights";
import Mirror from "./mirror";
import Base from "./base";
import Bottom from "./bottom";
import BeamLight from "./beamLight";
import type { CityGeoJSON } from "@/types/map";

import parkMapData from "@/assets/park_areas.json";
import parkOutlineData from "@/assets/park_outline.json";

const mapData = parkMapData as CityGeoJSON,
  outlineData = parkOutlineData as CityGeoJSON;

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

export default function Map() {
  return (
    <CanvasWrapper>
      <Canvas
        camera={{
          fov: 70,
          position: [3, 20, 10],
        }}
        dpr={[1, 2]}>
        <fog attach="fog" args={["#000000", 10, 30]} />
        <color attach="background" args={["#000000"]} />
        <Lights />
        <Suspense fallback={null}>
          <Base data={mapData} outlineData={outlineData} />
        </Suspense>
        <Bottom />
        <Mirror />
        <BeamLight />
        <OrbitControls
          enableDamping
          zoomSpeed={0.3}
          minDistance={8}
          maxDistance={20}
          maxPolarAngle={1.5}
        />
      </Canvas>
    </CanvasWrapper>
  );
}
