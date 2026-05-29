import * as THREE from "three";

const canvas = document.getElementById("studioHeroCanvas");

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.15, 8.6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const room = new THREE.Group();
  scene.add(room);

  const matScreen = new THREE.MeshStandardMaterial({
    color: 0x10242a,
    roughness: 0.26,
    metalness: 0.35,
    emissive: 0x0b655f,
    emissiveIntensity: 0.52
  });
  const matFrame = new THREE.MeshStandardMaterial({ color: 0x1c252e, roughness: 0.34, metalness: 0.65 });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xf4b942,
    roughness: 0.32,
    metalness: 0.52,
    emissive: 0x5a3706,
    emissiveIntensity: 0.36
  });
  const matCyan = new THREE.MeshStandardMaterial({
    color: 0x3dd6c8,
    roughness: 0.24,
    metalness: 0.5,
    emissive: 0x0c5852,
    emissiveIntensity: 0.6
  });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.5, metalness: 0.2 });

  const screen = new THREE.Mesh(new THREE.BoxGeometry(4.9, 2.75, 0.12), matScreen);
  screen.position.set(1.25, 0.95, -0.9);
  screen.rotation.y = -0.08;
  room.add(screen);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(5.18, 3.02, 0.08), matFrame);
  frame.position.copy(screen.position);
  frame.position.z -= 0.08;
  frame.rotation.copy(screen.rotation);
  room.add(frame);

  function screenBar(x, y, w, material) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, 0.04), material);
    bar.position.set(screen.position.x + x, screen.position.y + y, screen.position.z + 0.11);
    bar.rotation.copy(screen.rotation);
    room.add(bar);
    return bar;
  }

  const titleBar = screenBar(-0.78, 0.72, 2.5, matGold);
  const dataBars = [
    screenBar(-1.0, 0.28, 1.8, matCyan),
    screenBar(-1.0, 0.02, 1.35, matCyan),
    screenBar(-1.0, -0.24, 1.62, matCyan),
    screenBar(1.05, 0.2, 0.9, matGold),
    screenBar(1.05, -0.12, 1.16, matCyan),
    screenBar(1.05, -0.42, 0.72, matCyan)
  ];

  const presenter = new THREE.Group();
  presenter.position.set(-1.8, -0.9, 0.15);
  room.add(presenter);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 28, 18), matDark);
  head.position.set(0, 1.06, 0);
  presenter.add(head);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.72, 8, 18), matDark);
  torso.position.set(0, 0.52, 0);
  presenter.add(torso);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.06), matDark);
  arm.position.set(0.36, 0.72, 0);
  arm.rotation.z = -0.36;
  presenter.add(arm);
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.025), matGold);
  pointer.position.set(0.85, 0.87, 0);
  pointer.rotation.z = -0.22;
  presenter.add(pointer);

  const floor = new THREE.GridHelper(9, 18, 0x3dd6c8, 0x1d3339);
  floor.position.y = -1.7;
  floor.position.z = 0.7;
  room.add(floor);

  const audience = new THREE.Group();
  room.add(audience);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), row === 1 ? matGold : matCyan);
      dot.position.set(-3 + col * 0.55, -1.62, 2.1 + row * 0.38);
      audience.add(dot);
    }
  }

  const spot = new THREE.SpotLight(0x3dd6c8, 28, 12, 0.35, 0.55, 1.3);
  spot.position.set(-1.5, 4.2, 3.5);
  spot.target = presenter;
  scene.add(spot);
  scene.add(new THREE.AmbientLight(0x7895a0, 1.08));
  const warm = new THREE.DirectionalLight(0xffd08a, 1.5);
  warm.position.set(3, 2.8, 4);
  scene.add(warm);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }

  function animate(time) {
    const t = time * 0.001;
    room.rotation.y = Math.sin(t * 0.35) * 0.045;
    room.position.y = Math.sin(t * 0.55) * 0.025;
    titleBar.scale.x = 1 + Math.sin(t * 1.6) * 0.025;
    dataBars.forEach((bar, index) => {
      bar.scale.x = 1 + Math.sin(t * 1.25 + index) * 0.035;
    });
    presenter.rotation.y = Math.sin(t * 0.7) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
}
