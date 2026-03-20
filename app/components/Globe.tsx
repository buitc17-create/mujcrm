'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Sphere geometry for wireframe globe
    const radius = 1.2;
    const geometry = new THREE.SphereGeometry(radius, 36, 24);

    // Wireframe
    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00bfff,
      transparent: true,
      opacity: 0.18,
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    scene.add(wireframe);

    // Latitude/longitude grid lines for a cleaner globe look
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00bfff,
      transparent: true,
      opacity: 0.12,
    });

    // Latitude circles
    const latCount = 10;
    for (let i = 0; i <= latCount; i++) {
      const phi = (Math.PI * i) / latCount;
      const r = radius * Math.sin(phi);
      const y = radius * Math.cos(phi);
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const theta = (2 * Math.PI * j) / segments;
        points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    // Longitude circles
    const lonCount = 12;
    for (let i = 0; i < lonCount; i++) {
      const theta = (2 * Math.PI * i) / lonCount;
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const phi = (Math.PI * j) / segments;
        points.push(
          new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          )
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    // Dots on sphere surface (random points simulating cities/nodes)
    const dotCount = 80;
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions: number[] = [];
    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = radius + 0.01;
      dotPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x00bfff,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(dotGeo, dotMat));


    // Animation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      wireframe.rotation.y += 0.0018;
      wireframe.rotation.x += 0.0004;
      scene.children.forEach((child) => {
        if (child !== wireframe) {
          child.rotation.y += 0.0018;
          child.rotation.x += 0.0004;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
