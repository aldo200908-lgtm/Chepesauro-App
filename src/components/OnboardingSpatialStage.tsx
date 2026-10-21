import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OnboardingStepNumber, UserRole } from '../utils/onboarding';

interface OnboardingSpatialStageProps {
  step: OnboardingStepNumber;
  selectedRole?: UserRole | null;
  activeServiceHover?: 'comprar' | 'enviar' | null;
}

/**
 * Real-time 3D WebGL Spatial City Stage (Three.js PBR)
 * Renders an interactive 3D architectural slice of Puno with:
 * - Multi-part extruded 3D urban blocks of varied heights & silhouettes
 * - Restricted pedestrian Plaza Mayor zone in warm amber
 * - Continuous glowing 3D emerald route tube + animated multi-part 3D motorizado
 * - Dynamic camera choreography across Steps 1, 2, and 3 + touch/mouse orbit
 */
export const OnboardingSpatialStage: React.FC<OnboardingSpatialStageProps> = ({
  step,
  selectedRole = null,
  activeServiceHover = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Store reactive props in refs for the 60fps animation loop
  const stepRef = useRef<OnboardingStepNumber>(step);
  const roleRef = useRef<UserRole | null | undefined>(selectedRole);
  const serviceHoverRef = useRef<'comprar' | 'enviar' | null | undefined>(
    activeServiceHover
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    roleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    serviceHoverRef.current = activeServiceHover;
  }, [activeServiceHover]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 380;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. SCENE & ATMOSPHERIC FOG
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c0a);
    scene.fog = new THREE.FogExp2(0x080c0a, 0.032);

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 120);
    camera.position.set(11.5, 11.0, 13.5);
    const currentLookAt = new THREE.Vector3(0, 0.4, 0);
    camera.lookAt(currentLookAt);

    // 3. STUDIO PBR LIGHTING RIG
    const hemiLight = new THREE.HemisphereLight(0xd8f3e8, 0x060908, 0.65);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xe6fff5, 1.65);
    dirLight.position.set(12, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 45;
    const d = 11;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle Emerald Rim Light & Amber Plaza Accent Light
    const emeraldPointLight = new THREE.PointLight(0x22c58b, 2.4, 14);
    emeraldPointLight.position.set(-3.2, 2.2, 2.5);
    scene.add(emeraldPointLight);

    const destPointLight = new THREE.PointLight(0x10b981, 2.6, 14);
    destPointLight.position.set(3.8, 2.4, -2.4);
    scene.add(destPointLight);

    const plazaAmberLight = new THREE.PointLight(0xf59e0b, 1.1, 7);
    plazaAmberLight.position.set(0.2, 1.4, -0.4);
    scene.add(plazaAmberLight);

    // Root city group for interactive user rotation
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // Disposables tracking
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    // 4. GROUND TERRAIN & ROAD CORRIDORS
    const groundMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0b100e,
        roughness: 0.92,
        metalness: 0.08,
      })
    );
    const groundMesh = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(60, 60)),
      groundMat
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    cityGroup.add(groundMesh);

    // Street Network Strips (Recessed dark slate avenues)
    const roadMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x121a16,
        roughness: 0.75,
        metalness: 0.18,
      })
    );

    const createRoadStrip = (
      x: number,
      z: number,
      w: number,
      l: number,
      rotY = 0
    ) => {
      const mesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(w, 0.03, l)),
        roadMat
      );
      mesh.position.set(x, 0.015, z);
      mesh.rotation.y = rotY;
      mesh.receiveShadow = true;
      cityGroup.add(mesh);
    };

    // Horizontal & Vertical Urban Arteries
    createRoadStrip(0, 2.5, 22, 1.15);
    createRoadStrip(0, -2.4, 22, 1.15);
    createRoadStrip(0, 0.1, 22, 0.95);
    createRoadStrip(-3.5, 0, 1.15, 22);
    createRoadStrip(0.2, 0, 1.1, 22);
    createRoadStrip(3.8, 0, 1.15, 22);

    // 5. RESTRICTED PEDESTRIAN PLAZA MAYOR ZONE (Subtle Amber Courtyard)
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(0.2, 0.03, -0.5);
    const plazaPadMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x261c0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.14,
        roughness: 0.6,
        metalness: 0.2,
      })
    );
    const plazaPad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.5, 0.04, 1.9)),
      plazaPadMat
    );
    plazaGroup.add(plazaPad);

    // Thin Amber Border Frame around Pedestrian Zone
    const borderGeo = trackGeo(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.55, 0.06, 1.95)));
    const borderMat = trackMat(
      new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.65,
      })
    );
    const plazaWire = new THREE.LineSegments(borderGeo, borderMat);
    plazaGroup.add(plazaWire);
    cityGroup.add(plazaGroup);

    // 6. COMPOSITE ARCHITECTURAL BUILDINGS (Varied heights, stepped silhouettes, podiums)
    const buildingMatDark = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x141d19,
        roughness: 0.65,
        metalness: 0.25,
      })
    );
    const buildingMatMid = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x192520,
        roughness: 0.45,
        metalness: 0.38,
      })
    );
    const buildingMatAccent = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1f2e28,
        roughness: 0.35,
        metalness: 0.48,
      })
    );
    const roofEdgeMat = trackMat(
      new THREE.LineBasicMaterial({
        color: 0x2e453b,
        transparent: true,
        opacity: 0.45,
      })
    );
    const emeraldSlitMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x22c58b,
      })
    );

    const addArchitecturalBlock = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      tierType: 'stepped' | 'tower' | 'podium' | 'hub' = 'stepped'
    ) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Primary volume
      const baseGeo = trackGeo(new THREE.BoxGeometry(w, h, d));
      const baseMesh = new THREE.Mesh(
        baseGeo,
        tierType === 'hub' ? buildingMatAccent : buildingMatDark
      );
      baseMesh.position.y = h / 2;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Subtle architectural wireframe edge on top
      const edges = new THREE.LineSegments(
        trackGeo(new THREE.EdgesGeometry(baseGeo)),
        roofEdgeMat
      );
      edges.position.y = h / 2;
      group.add(edges);

      // Secondary stepped tier or penthouse for realistic urban silhouette
      if (tierType === 'stepped' || tierType === 'tower') {
        const topW = w * 0.65;
        const topD = d * 0.65;
        const topH = tierType === 'tower' ? h * 0.55 : h * 0.35;
        const topGeo = trackGeo(new THREE.BoxGeometry(topW, topH, topD));
        const topMesh = new THREE.Mesh(topGeo, buildingMatMid);
        topMesh.position.set(w * 0.08, h + topH / 2, -d * 0.06);
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        group.add(topMesh);
      }

      // Highlighted Hub Roof Beacon (for Pickup Store & Dropoff Destination)
      if (tierType === 'hub') {
        const slitGeo = trackGeo(new THREE.BoxGeometry(w * 0.82, 0.06, d * 0.82));
        const slitMesh = new THREE.Mesh(slitGeo, emeraldSlitMat);
        slitMesh.position.y = h + 0.04;
        group.add(slitMesh);
      }

      cityGroup.add(group);
    };

    // Populate Puno 3D Urban Blocks around the avenues
    // Pickup Commercial Hub (SW)
    addArchitecturalBlock(-4.9, 1.3, 1.6, 1.45, 1.4, 'hub');
    // Dropoff Destination Block (NE)
    addArchitecturalBlock(5.2, -1.2, 1.7, 1.85, 1.5, 'hub');

    // Surrounding City Blocks (Varied heights & proportions)
    addArchitecturalBlock(-5.2, -1.2, 1.8, 2.3, 1.5, 'tower');
    addArchitecturalBlock(-1.8, -1.3, 1.7, 1.7, 1.3, 'stepped');
    addArchitecturalBlock(-1.8, 1.3, 1.6, 1.15, 1.3, 'podium');
    addArchitecturalBlock(2.0, 1.35, 1.7, 2.1, 1.4, 'tower');
    addArchitecturalBlock(2.1, -1.25, 1.6, 1.4, 1.3, 'stepped');

    // Outer Perimeter City Skyline
    addArchitecturalBlock(-1.7, -3.8, 2.1, 2.8, 1.6, 'tower');
    addArchitecturalBlock(1.8, -3.8, 2.2, 1.9, 1.5, 'stepped');
    addArchitecturalBlock(5.1, -3.7, 1.8, 2.5, 1.6, 'tower');
    addArchitecturalBlock(-5.0, -3.7, 1.8, 1.5, 1.5, 'podium');

    addArchitecturalBlock(-1.6, 3.9, 2.0, 1.3, 1.4, 'podium');
    addArchitecturalBlock(2.0, 3.9, 2.1, 1.75, 1.5, 'stepped');
    addArchitecturalBlock(5.2, 1.4, 1.7, 1.25, 1.4, 'podium');

    // 7. 3D CONTINUOUS EMERALD VEHICULAR ROUTE (Detouring around Plaza Mayor)
    const routeWaypoints = [
      new THREE.Vector3(-3.5, 0.08, 2.5), // Origin: Pickup Storefront
      new THREE.Vector3(-3.5, 0.08, 0.1),
      new THREE.Vector3(-1.1, 0.08, 0.1), // Detour corner before Plaza Mayor
      new THREE.Vector3(-1.1, 0.08, 2.5),
      new THREE.Vector3(3.8, 0.08, 2.5), // South avenue bypass
      new THREE.Vector3(3.8, 0.08, -2.4), // Destination: Dropoff
    ];

    const routeCurve = new THREE.CatmullRomCurve3(
      routeWaypoints,
      false,
      'catmullrom',
      0.12
    );

    // Primary Glowing Route Tube
    const routeTubeGeo = trackGeo(
      new THREE.TubeGeometry(routeCurve, 90, 0.095, 12, false)
    );
    const routeTubeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x22c58b,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.1,
      })
    );
    const routeTubeMesh = new THREE.Mesh(routeTubeGeo, routeTubeMat);
    cityGroup.add(routeTubeMesh);

    // Origin & Destination 3D Spatial Pins
    const createSpatialNode = (pos: THREE.Vector3, isDestination: boolean) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);

      // Ground Ring
      const ringGeo = trackGeo(new THREE.RingGeometry(0.22, 0.34, 32));
      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x22c58b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        })
      );
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.02;
      nodeGroup.add(ringMesh);

      // Floating Beacon Core
      const pinGeo = trackGeo(
        isDestination
          ? new THREE.OctahedronGeometry(0.22, 0)
          : new THREE.SphereGeometry(0.16, 20, 20)
      );
      const pinMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x22c58b,
          emissive: 0x22c58b,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.4,
        })
      );
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.y = isDestination ? 0.55 : 0.35;
      nodeGroup.add(pinMesh);

      cityGroup.add(nodeGroup);
      return { nodeGroup, pinMesh, ringMesh };
    };

    const originNode = createSpatialNode(routeWaypoints[0], false);
    const destNode = createSpatialNode(
      routeWaypoints[routeWaypoints.length - 1],
      true
    );

    // 8. COMPOSITE 5-PART 3D MOTORIZADO VEHICLE GLIDING ALONG ROUTE
    const bikeGroup = new THREE.Group();
    const bikeBodyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x16221d,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    const bikeCargoMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x22c58b,
        emissive: 0x10b981,
        emissiveIntensity: 0.65,
        roughness: 0.25,
        metalness: 0.3,
      })
    );
    const wheelMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x070a09,
        roughness: 0.85,
        metalness: 0.2,
      })
    );

    // Part 1: Aerodynamic Chassis
    const chassis = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.22, 0.16, 0.52)),
      bikeBodyMat
    );
    chassis.position.y = 0.16;
    bikeGroup.add(chassis);

    // Part 2: Emerald Delivery Cargo Box
    const cargoBox = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.26, 0.24, 0.26)),
      bikeCargoMat
    );
    cargoBox.position.set(0, 0.32, -0.12);
    bikeGroup.add(cargoBox);

    // Part 3 & 4: Front & Rear Wheels
    const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16));
    wheelGeo.rotateZ(Math.PI / 2);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.1, 0.2);
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.position.set(0, 0.1, -0.2);
    bikeGroup.add(frontWheel, rearWheel);

    // Part 5: Glowing Headlight Cone
    const headlight = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.14, 0.06, 0.04)),
      emeraldSlitMat
    );
    headlight.position.set(0, 0.22, 0.27);
    bikeGroup.add(headlight);

    cityGroup.add(bikeGroup);

    // 9. INTERACTIVE POINTER / TOUCH ORBIT DRAG
    let isDragging = false;
    let prevX = 0;
    let userRotationY = 0;
    let targetUserRotationY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      prevX = e.clientX;
      targetUserRotationY += deltaX * 0.0065;
      targetUserRotationY = Math.max(-0.55, Math.min(0.55, targetUserRotationY));
    };
    const handlePointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 10. RESIZE HANDLER
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. ANIMATION LOOP & CAMERA CHOREOGRAPHY
    const clock = new THREE.Clock();
    let animFrameId = 0;
    let routeProgress = 0.18;

    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Advance 3D Motorizado smoothly along the route
      routeProgress = (routeProgress + delta * 0.075) % 1;
      const bikePos = routeCurve.getPointAt(routeProgress);
      const bikeTangent = routeCurve.getTangentAt(routeProgress);
      bikeGroup.position.copy(bikePos);
      bikeGroup.lookAt(bikePos.clone().add(bikeTangent));

      // Subtle floating animation on Destination Beacon
      destNode.pinMesh.rotation.y = elapsed * 1.4;
      destNode.pinMesh.position.y = 0.55 + Math.sin(elapsed * 2.5) * 0.06;
      const pulseScale = 1 + Math.sin(elapsed * 3) * 0.12;
      originNode.ringMesh.scale.set(pulseScale, pulseScale, 1);
      destNode.ringMesh.scale.set(pulseScale, pulseScale, 1);

      // Camera Choreography based on Onboarding Step & User Selection
      const currentStep = stepRef.current;
      const currentRole = roleRef.current;
      const currentService = serviceHoverRef.current;

      if (currentStep === 1) {
        // Step 1: Grand Isometric Urban Corridor Overview
        targetCamPos.set(
          10.8 + Math.sin(elapsed * 0.25) * 0.6,
          9.6,
          12.4 + Math.cos(elapsed * 0.25) * 0.6
        );
        targetLookAt.set(0.2, 0.2, 0.2);
      } else if (currentStep === 2) {
        // Step 2: Services Focus (Zooms toward Commercial Hub or Express Corridor)
        if (currentService === 'comprar') {
          targetCamPos.set(-7.5, 6.2, 8.2);
          targetLookAt.set(-3.8, 0.8, 1.5);
        } else if (currentService === 'enviar') {
          targetCamPos.set(7.8, 6.4, 7.6);
          targetLookAt.set(3.2, 0.8, -1.2);
        } else {
          targetCamPos.set(0.4, 10.5, 11.2);
          targetLookAt.set(0.2, 0.3, 0.3);
        }
      } else {
        // Step 3: Profile Selection Focus
        if (currentRole === 'usuario') {
          // Focus on Destination Dropoff & Storefront Experience
          targetCamPos.set(7.4, 5.8, 5.8);
          targetLookAt.set(3.8, 0.7, -2.0);
        } else if (currentRole === 'motorizado') {
          // Dynamic Chase Focus toward the 3D Route & Motorizado
          targetCamPos.set(-5.8, 5.2, 8.5);
          targetLookAt.set(0.0, 0.4, 1.2);
        } else {
          targetCamPos.set(8.6, 7.8, 9.8);
          targetLookAt.set(0.4, 0.4, 0.2);
        }
      }

      // Smoothly interpolate camera & user drag rotation
      camera.position.lerp(targetCamPos, 0.045);
      currentLookAt.lerp(targetLookAt, 0.06);
      camera.lookAt(currentLookAt);

      userRotationY += (targetUserRotationY - userRotationY) * 0.08;
      cityGroup.rotation.y = userRotationY;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#080C0A]">
      {/* WebGL 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Escena urbana 3D interactiva de Puno con edificios volumétricos y ruta en vivo"
      />

      {/* Fallback only if headless browser has no WebGL */}
      {!webglSupported && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1814] to-[#080C0A]" />
      )}

      {/* Top Subtle Vignette so Header remains crisp */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080C0A]/90 via-[#080C0A]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Bottom Atmospheric Fade into the Architectural Sheet */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0A0D0C] via-[#0A0D0C]/80 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
};
