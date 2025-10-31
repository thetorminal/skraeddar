import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const SkadisGenerator = () => {
  const [width, setWidth] = useState(280);
  const [height, setHeight] = useState(280);
  const [thickness, setThickness] = useState(5);
  const [withMountingHoles, setWithMountingHoles] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const HOLE_WIDTH = 5;
  const HOLE_HEIGHT = 15;
  const HOLE_SPACING_X = 40;
  const HOLE_SPACING_Y = 20;
  const EDGE_MARGIN = 20;
  const BOARD_RADIUS = 8;
  const SCREW_HOLE_DIAMETER = 5;
  const SCREW_HOLE_INSET = 10;
  const COUNTERSINK_DEPTH = 10;

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      3000
    );
    const maxDim = Math.max(width, height);
    camera.position.set(maxDim * 0.7, maxDim * 0.7, maxDim * 1.5);
    camera.lookAt(width / 2, height / 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
      
      const maxDim = Math.max(width, height);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const aspect = newWidth / newHeight;
      const distance = Math.max(
        maxDim / (2 * Math.tan(fov / 2)),
        maxDim / (2 * Math.tan(fov / 2) * aspect)
      ) * 1.3;
      
      cameraRef.current.position.set(
        maxDim * 0.5,
        maxDim * 0.5,
        distance
      );
      cameraRef.current.lookAt(width / 2, height / 2, 0);
    };
    window.addEventListener('resize', handleResize);
    
    handleResize();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      
      const target = new THREE.Vector3(width / 2, height / 2, 0);
      const direction = new THREE.Vector3();
      direction.subVectors(cameraRef.current.position, target).normalize();
      
      const distance = cameraRef.current.position.distanceTo(target);
      const newDistance = Math.max(100, Math.min(3000, distance + e.deltaY * 0.5));
      
      cameraRef.current.position.copy(target).add(direction.multiplyScalar(newDistance));
    };

    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.children = sceneRef.current.children.filter(
      (child: THREE.Object3D) => child.type === 'AmbientLight' || 
               child.type === 'DirectionalLight'
    );

    const holesX = Math.floor((width - 2 * EDGE_MARGIN) / HOLE_SPACING_X) + 1;
    const holesY = Math.floor((height - 2 * EDGE_MARGIN) / HOLE_SPACING_Y) + 1;
    const startX = (width - (holesX - 1) * HOLE_SPACING_X) / 2;
    const startY = (height - (holesY - 1) * HOLE_SPACING_Y) / 2;

    const screwPositions = withMountingHoles ? [
      { x: -width/2 + SCREW_HOLE_INSET, y: -height/2 + SCREW_HOLE_INSET },
      { x: width/2 - SCREW_HOLE_INSET, y: -height/2 + SCREW_HOLE_INSET },
      { x: -width/2 + SCREW_HOLE_INSET, y: height/2 - SCREW_HOLE_INSET },
      { x: width/2 - SCREW_HOLE_INSET, y: height/2 - SCREW_HOLE_INSET }
    ] : [];

    const shape = new THREE.Shape();
    const r = BOARD_RADIUS;
    shape.moveTo(-width/2 + r, -height/2);
    shape.lineTo(width/2 - r, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + r);
    shape.lineTo(width/2, height/2 - r);
    shape.quadraticCurveTo(width/2, height/2, width/2 - r, height/2);
    shape.lineTo(-width/2 + r, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - r);
    shape.lineTo(-width/2, -height/2 + r);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + r, -height/2);

    let totalHoles = 0;
    for (let i = 0; i < holesX; i++) {
      for (let j = 0; j < holesY; j++) {
        const offsetX = (j % 2) * (HOLE_SPACING_X / 2);
        const xPos = startX + i * HOLE_SPACING_X + offsetX - width/2;
        const yPos = startY + j * HOLE_SPACING_Y - height/2;
        
        if (startX + i * HOLE_SPACING_X + offsetX < EDGE_MARGIN || 
            startX + i * HOLE_SPACING_X + offsetX > width - EDGE_MARGIN) continue;
        
        totalHoles++;
        
        const holePath = new THREE.Path();
        const hw = HOLE_WIDTH / 2;
        const hh = HOLE_HEIGHT / 2;
        
        holePath.moveTo(xPos - hw, yPos - hh + hw);
        holePath.lineTo(xPos - hw, yPos + hh - hw);
        holePath.quadraticCurveTo(xPos - hw, yPos + hh, xPos, yPos + hh);
        holePath.quadraticCurveTo(xPos + hw, yPos + hh, xPos + hw, yPos + hh - hw);
        holePath.lineTo(xPos + hw, yPos - hh + hw);
        holePath.quadraticCurveTo(xPos + hw, yPos - hh, xPos, yPos - hh);
        holePath.quadraticCurveTo(xPos - hw, yPos - hh, xPos - hw, yPos - hh + hw);
        
        shape.holes.push(holePath);
      }
    }

    screwPositions.forEach(pos => {
      const screwHole = new THREE.Path();
      const radius = SCREW_HOLE_DIAMETER / 2;
      screwHole.absarc(pos.x, pos.y, radius, 0, Math.PI * 2, false);
      shape.holes.push(screwHole);
    });

    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false
    };

    const boardGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const boardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x595959,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.FrontSide
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(width / 2, height / 2, 0);
    board.rotation.x = 0; // No rotation - spacers will be behind
    board.userData = { totalHoles };
    sceneRef.current.add(board);

    const outlinePoints = [];
    const outlineRadius = BOARD_RADIUS;
    const segments = 16;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      outlinePoints.push(new THREE.Vector3(-width/2 + outlineRadius + t * (width - 2*outlineRadius), -height/2, 0));
    }
    for (let i = 0; i <= segments; i++) {
      const angle = -Math.PI/2 + (i / segments) * Math.PI/2;
      outlinePoints.push(new THREE.Vector3(
        width/2 - outlineRadius + Math.cos(angle) * outlineRadius,
        -height/2 + outlineRadius + Math.sin(angle) * outlineRadius,
        0
      ));
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      outlinePoints.push(new THREE.Vector3(width/2, -height/2 + outlineRadius + t * (height - 2*outlineRadius), 0));
    }
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI/2;
      outlinePoints.push(new THREE.Vector3(
        width/2 - outlineRadius + Math.cos(angle) * outlineRadius,
        height/2 - outlineRadius + Math.sin(angle) * outlineRadius,
        0
      ));
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      outlinePoints.push(new THREE.Vector3(width/2 - outlineRadius - t * (width - 2*outlineRadius), height/2, 0));
    }
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI/2 + (i / segments) * Math.PI/2;
      outlinePoints.push(new THREE.Vector3(
        -width/2 + outlineRadius + Math.cos(angle) * outlineRadius,
        height/2 - outlineRadius + Math.sin(angle) * outlineRadius,
        0
      ));
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      outlinePoints.push(new THREE.Vector3(-width/2, height/2 - outlineRadius - t * (height - 2*outlineRadius), 0));
    }
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI + (i / segments) * Math.PI/2;
      outlinePoints.push(new THREE.Vector3(
        -width/2 + outlineRadius + Math.cos(angle) * outlineRadius,
        -height/2 + outlineRadius + Math.sin(angle) * outlineRadius,
        0
      ));
    }
    
    outlinePoints.push(outlinePoints[0].clone());
    
    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const outline = new THREE.Line(outlineGeometry, outlineMaterial);
    outline.position.set(width / 2, height / 2, -thickness);
    sceneRef.current.add(outline);



    if (cameraRef.current) {
      const containerWidth = mountRef.current?.clientWidth || window.innerWidth;
      const containerHeight = mountRef.current?.clientHeight || window.innerHeight;
      const maxDim = Math.max(width, height);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const aspect = containerWidth / containerHeight;
      
      const distance = Math.max(
        maxDim / (2 * Math.tan(fov / 2)),
        maxDim / (2 * Math.tan(fov / 2) * aspect)
      ) * 1.3;
      
      cameraRef.current.position.set(
        maxDim * 0.5,
        maxDim * 0.5,
        distance
      );
      cameraRef.current.lookAt(width / 2, height / 2, 0);
    }
  }, [width, height, thickness, withMountingHoles]);

  const Logo = () => (
    <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <path fill="#000000" d="M392.438232,73.929527 C334.905548,93.546967 286.036163,126.159508 246.429581,172.262344 C206.917343,218.255417 182.346451,271.288300 172.786514,331.283081 C168.351852,359.113495 168.731567,387.052765 169.776123,415.036591 C169.844788,416.876617 171.137177,419.092743 172.542816,420.400421 C238.180176,481.463989 303.889435,542.450317 369.626587,603.406494 C370.929260,604.614502 372.661163,605.359680 374.277649,606.373962 C307.950836,674.987122 242.808014,742.375427 177.545914,809.887085 C201.769104,833.315979 225.534866,856.302490 249.414154,879.398804 C338.609680,787.136658 427.395538,695.298279 516.320862,603.315674 C514.781616,601.858154 513.591064,600.711182 512.379761,599.586548 C432.513092,525.440063 352.653107,451.286377 272.737183,377.192963 C270.267731,374.903442 268.855957,372.768372 269.104279,369.148895 C270.558716,347.950836 273.752167,327.022552 281.606842,307.248505 C317.356354,217.249481 384.353333,167.247208 479.933746,157.249390 C547.889343,150.141159 608.473389,170.658203 659.339478,216.489380 C706.815613,259.266144 732.323669,313.197113 732.775269,377.378265 C733.508057,481.526398 732.988586,585.683350 733.008301,689.836548 C733.008545,691.264343 733.145081,692.692200 733.209656,693.957397 C766.637146,693.957397 799.586670,693.957397 832.969727,693.957397 C832.969727,691.950134 832.970093,690.161438 832.969604,688.372681 C832.944397,586.884888 832.740723,485.396698 832.974976,383.909546 C833.080261,338.323608 824.710999,294.599365 806.351379,252.886627 C737.474060,96.398132 557.358276,18.474409 392.438232,73.929527 M833.000000,829.500000 C833.000000,815.915710 833.000000,802.331360 833.000000,788.378418 C710.282898,788.378418 588.244751,788.378418 466.294617,788.378418 C466.294617,821.658081 466.294617,854.728088 466.294617,887.713501 C588.653015,887.713501 710.716553,887.713501 833.000000,887.713501 C833.000000,868.451904 833.000000,849.475952 833.000000,829.500000 z"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  const generateSTL = () => {
    const holesX = Math.floor((width - 2 * EDGE_MARGIN) / HOLE_SPACING_X) + 1;
    const holesY = Math.floor((height - 2 * EDGE_MARGIN) / HOLE_SPACING_Y) + 1;
    const startX = (width - (holesX - 1) * HOLE_SPACING_X) / 2;
    const startY = (height - (holesY - 1) * HOLE_SPACING_Y) / 2;

    let stl = 'solid skadis_pegboard\n';

    const addTriangle = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) => {
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v2, v1),
          new THREE.Vector3().subVectors(v3, v1)
        )
        .normalize();
      
      stl += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
      stl += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
      stl += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    };

    const shape = new THREE.Shape();
    const r = BOARD_RADIUS;
    shape.moveTo(-width/2 + r, -height/2);
    shape.lineTo(width/2 - r, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + r);
    shape.lineTo(width/2, height/2 - r);
    shape.quadraticCurveTo(width/2, height/2, width/2 - r, height/2);
    shape.lineTo(-width/2 + r, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - r);
    shape.lineTo(-width/2, -height/2 + r);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + r, -height/2);

    for (let i = 0; i < holesX; i++) {
      for (let j = 0; j < holesY; j++) {
        const offsetX = (j % 2) * (HOLE_SPACING_X / 2);
        const xPos = startX + i * HOLE_SPACING_X + offsetX - width/2;
        const yPos = startY + j * HOLE_SPACING_Y - height/2;
        
        if (startX + i * HOLE_SPACING_X + offsetX < EDGE_MARGIN || 
            startX + i * HOLE_SPACING_X + offsetX > width - EDGE_MARGIN) continue;
        
        const holePath = new THREE.Path();
        const hw = HOLE_WIDTH / 2;
        const hh = HOLE_HEIGHT / 2;
        
        holePath.moveTo(xPos - hw, yPos - hh + hw);
        holePath.lineTo(xPos - hw, yPos + hh - hw);
        holePath.quadraticCurveTo(xPos - hw, yPos + hh, xPos, yPos + hh);
        holePath.quadraticCurveTo(xPos + hw, yPos + hh, xPos + hw, yPos + hh - hw);
        holePath.lineTo(xPos + hw, yPos - hh + hw);
        holePath.quadraticCurveTo(xPos + hw, yPos - hh, xPos, yPos - hh);
        holePath.quadraticCurveTo(xPos - hw, yPos - hh, xPos - hw, yPos - hh + hw);
        
        shape.holes.push(holePath);
      }
    }

    // CRITICAL: Only add mounting holes if explicitly enabled
    if (withMountingHoles === true) {
      const mountingHolePositions = [
        { x: -width/2 + SCREW_HOLE_INSET, y: -height/2 + SCREW_HOLE_INSET },
        { x: width/2 - SCREW_HOLE_INSET, y: -height/2 + SCREW_HOLE_INSET },
        { x: -width/2 + SCREW_HOLE_INSET, y: height/2 - SCREW_HOLE_INSET },
        { x: width/2 - SCREW_HOLE_INSET, y: height/2 - SCREW_HOLE_INSET }
      ];

      mountingHolePositions.forEach(pos => {
        const screwHole = new THREE.Path();
        const radius = SCREW_HOLE_DIAMETER / 2;
        screwHole.absarc(pos.x, pos.y, radius, 0, Math.PI * 2, false);
        shape.holes.push(screwHole);
      });
    }

    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const v1 = new THREE.Vector3(
          positions[indices[i] * 3],
          positions[indices[i] * 3 + 1],
          positions[indices[i] * 3 + 2]
        );
        const v2 = new THREE.Vector3(
          positions[indices[i + 1] * 3],
          positions[indices[i + 1] * 3 + 1],
          positions[indices[i + 1] * 3 + 2]
        );
        const v3 = new THREE.Vector3(
          positions[indices[i + 2] * 3],
          positions[indices[i + 2] * 3 + 1],
          positions[indices[i + 2] * 3 + 2]
        );
        addTriangle(v1, v2, v3);
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
        addTriangle(v1, v2, v3);
      }
    }

    stl += 'endsolid skadis_pegboard\n';

    const blob = new Blob([stl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skadis_${width}x${height}x${thickness}mm.stl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSpacerSTL = () => {
    const innerRadius = SCREW_HOLE_DIAMETER / 2;
    const outerRadius = SCREW_HOLE_DIAMETER / 2 + 3;
    
    let stl = 'solid spacer_10mm\n';

    const addTriangle = (v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) => {
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v2, v1),
          new THREE.Vector3().subVectors(v3, v1)
        )
        .normalize();
      
      stl += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
      stl += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
      stl += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    };

    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    ringShape.holes.push(holePath);
    
    const extrudeSettings = {
      steps: 1,
      depth: COUNTERSINK_DEPTH,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(ringShape, extrudeSettings);
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const v1 = new THREE.Vector3(
          positions[indices[i] * 3],
          positions[indices[i] * 3 + 1],
          positions[indices[i] * 3 + 2]
        );
        const v2 = new THREE.Vector3(
          positions[indices[i + 1] * 3],
          positions[indices[i + 1] * 3 + 1],
          positions[indices[i + 1] * 3 + 2]
        );
        const v3 = new THREE.Vector3(
          positions[indices[i + 2] * 3],
          positions[indices[i + 2] * 3 + 1],
          positions[indices[i + 2] * 3 + 2]
        );
        addTriangle(v1, v2, v3);
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
        addTriangle(v1, v2, v3);
      }
    }

    stl += 'endsolid spacer_10mm\n';

    const blob = new Blob([stl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spacer_10mm.stl';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Logo />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Skräddar: IKEA SKÅDIS Pegboard Generator</h1>
              <p className="text-xs md:text-sm text-gray-600">Create your own IKEA SKÅDIS pegboard for 3D printing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row min-h-0">
        <div className="w-full md:w-80 md:flex-shrink-0 bg-white border-b md:border-r md:border-b-0 border-gray-200 p-4 md:p-6 overflow-y-auto max-h-[40vh] md:max-h-none">
          <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900">Settings</h2>
          
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width: {width}mm
              </label>
              <input
                type="range"
                min="80"
                max="800"
                step="40"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, #000 0%, #000 ${((width - 80) / (800 - 80)) * 100}%, #e5e7eb ${((width - 80) / (800 - 80)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>80mm</span>
                <span>800mm</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height: {height}mm
              </label>
              <input
                type="range"
                min="80"
                max="800"
                step="40"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, #000 0%, #000 ${((height - 80) / (800 - 80)) * 100}%, #e5e7eb ${((height - 80) / (800 - 80)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>80mm</span>
                <span>800mm</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thickness: {thickness}mm
              </label>
              <input
                type="range"
                min="2"
                max="8"
                step="0.5"
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                style={{
                  background: `linear-gradient(to right, #000 0%, #000 ${((thickness - 2) / (8 - 2)) * 100}%, #e5e7eb ${((thickness - 2) / (8 - 2)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2mm</span>
                <span>8mm</span>
              </div>
              {thickness !== 5 && (
                <p className="mt-2 text-xs text-gray-500 italic">
                  ⚠️ Recommended: 5mm (standard thickness). Deviation may affect hook compatibility.
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withMountingHoles}
                  onChange={(e) => setWithMountingHoles(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-black cursor-pointer flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 block">Add 4 corner holes for mounting</span>
                </div>
              </label>
            </div>

            <button
              onClick={generateSTL}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <DownloadIcon />
              Download Pegboard STL
            </button>

            <button
              onClick={generateSpacerSTL}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <DownloadIcon />
              Download 10mm Spacer STL
            </button>

            <p className="text-xs text-gray-500 text-center">
              Print 4 spacers separately if you added mounting holes.
            </p>
          </div>
        </div>

        <div className="flex-1 relative min-h-[300px] md:min-h-0">
          <div ref={mountRef} className="w-full h-full min-h-[300px]" />
        </div>
      </div>
    </div>
  );
};

export default SkadisGenerator;
