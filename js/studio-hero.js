import * as THREE from "three";

const canvas = document.getElementById("studioHeroCanvas");

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.6, 8);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const group = new THREE.Group();
  scene.add(group);

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x12202a,
    roughness: 0.38,
    metalness: 0.42,
    emissive: 0x071014,
    emissiveIntensity: 0.35
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4b942,
    roughness: 0.28,
    metalness: 0.55,
    emissive: 0x6d4308,
    emissiveIntensity: 0.32
  });
  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x3dd6c8,
    roughness: 0.28,
    metalness: 0.48,
    emissive: 0x0b514d,
    emissiveIntensity: 0.5
  });

  function makePanel(x, y, z, w, h, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = x * -0.08;
    group.add(mesh);
    return mesh;
  }

  const panels = [
    makePanel(-2.7, 0.9, 0, 1.8, 1.05, panelMaterial),
    makePanel(-0.4, 1.35, -0.5, 2.1, 1.2, panelMaterial),
    makePanel(2.2, 0.55, -0.15, 1.75, 1.05, panelMaterial),
    makePanel(0.9, -1.1, 0.2, 2.35, 1.1, panelMaterial),
    makePanel(-2.0, -1.25, -0.35, 1.35, 0.9, panelMaterial)
  ];

  panels.forEach((panel, index) => {
    const barCount = index === 3 ? 5 : 3;
    for (let i = 0; i < barCount; i += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9 - i * 0.09, 0.035, 0.04), i === 0 ? accentMaterial : cyanMaterial);
      bar.position.set(panel.position.x - 0.25, panel.position.y + 0.25 - i * 0.18, panel.position.z + 0.08);
      bar.rotation.copy(panel.rotation);
      group.add(bar);
    }
  });

  const grid = new THREE.GridHelper(9, 18, 0x3dd6c8, 0x1b3b43);
  grid.position.y = -2.05;
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);

  const light = new THREE.DirectionalLight(0xffffff, 2.1);
  light.position.set(2, 5, 6);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x6f8e9c, 1.2));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }

  function animate(time) {
    const t = time * 0.001;
    group.rotation.y = Math.sin(t * 0.35) * 0.12;
    group.rotation.x = Math.sin(t * 0.24) * 0.04;
    panels.forEach((panel, index) => {
      panel.position.y += Math.sin(t + index) * 0.0009;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
}
