import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ZONE_ATMOSPHERE, PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Three.js Renderer, Bloom Pipeline, Isometric Camera Rig & Atmosphere Controller
 */
export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    const initAtmo = ZONE_ATMOSPHERE.cloister;
    this.scene.background = new THREE.Color(initAtmo.fogColor);
    this.scene.fog = new THREE.Fog(initAtmo.fogColor, initAtmo.fogNear, initAtmo.fogFar);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // Slight angled isometric 3/4 view for dramatic architectural depth
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.5, 160);
    this.cameraOffset = new THREE.Vector3(5.2, 20.5, 17.5);
    this.cameraTarget = new THREE.Vector3(0, 0.8, 43);
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);

    // Precompute screen-aligned XZ movement basis so W is always straight up-screen
    this.moveForward = new THREE.Vector3(-this.cameraOffset.x, 0, -this.cameraOffset.z).normalize();
    this.moveRight = new THREE.Vector3().crossVectors(this.moveForward, new THREE.Vector3(0, 1, 0)).normalize();

    this.trauma = 0;
    this.cutsceneOverride = null;

    // Post-processing with subtle selective Kintsugi Bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.52, // strength
      0.45, // radius
      0.72  // threshold — only emissive runes, gold seams, bolts & sparks bloom
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this._setupLights(initAtmo);
    this._setupReticle();

    // Atmosphere target state for smooth zone transitions
    this.targetFogColor = new THREE.Color(initAtmo.fogColor);
    this.targetAmbientColor = new THREE.Color(initAtmo.ambientColor);
    this.targetMoonColor = new THREE.Color(initAtmo.moonColor);
    this.targetFogNear = initAtmo.fogNear;
    this.targetFogFar = initAtmo.fogFar;
    this.targetAmbientInt = initAtmo.ambientIntensity;
    this.targetMoonInt = initAtmo.moonIntensity;

    // Ground plane for mouse raycasting
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.mouseNdc = new THREE.Vector2(0, 0);
    this.mouseWorld = new THREE.Vector3(0, 0, 40);

    window.addEventListener('resize', () => this.onResize());
  }

  _setupLights(atmo) {
    this.ambientLight = new THREE.HemisphereLight(atmo.ambientColor, 0x161219, atmo.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(atmo.moonColor, atmo.moonIntensity);
    this.moonLight.position.set(18, 32, 16);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.near = 4;
    this.moonLight.shadow.camera.far = 90;
    const d = 34;
    this.moonLight.shadow.camera.left = -d;
    this.moonLight.shadow.camera.right = d;
    this.moonLight.shadow.camera.top = d;
    this.moonLight.shadow.camera.bottom = -d;
    this.moonLight.shadow.bias = -0.0005;
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // Warm rim back-light for crisp silhouette separation against dark slate
    this.rimLight = new THREE.DirectionalLight(0xffba69, 0.45);
    this.rimLight.position.set(-16, 14, -22);
    this.scene.add(this.rimLight);
  }

  _setupReticle() {
    const ringGeo = new THREE.RingGeometry(0.32, 0.44, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PALETTE.kintsugiGold,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.reticle = new THREE.Mesh(ringGeo, ringMat);
    this.reticle.position.y = 0.06;
    this.scene.add(this.reticle);
  }

  setZoneAtmosphere(zoneId) {
    const atmo = ZONE_ATMOSPHERE[zoneId] || ZONE_ATMOSPHERE.cloister;
    this.targetFogColor.setHex(atmo.fogColor);
    this.targetAmbientColor.setHex(atmo.ambientColor);
    this.targetMoonColor.setHex(atmo.moonColor);
    this.targetFogNear = atmo.fogNear;
    this.targetFogFar = atmo.fogFar;
    this.targetAmbientInt = atmo.ambientIntensity;
    this.targetMoonInt = atmo.moonIntensity;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  updateMouse(clientX, clientY) {
    this.mouseNdc.x = (clientX / this.width) * 2 - 1;
    this.mouseNdc.y = -(clientY / this.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    this.raycaster.ray.intersectPlane(this.groundPlane, this.mouseWorld);
    this.reticle.position.set(this.mouseWorld.x, 0.06, this.mouseWorld.z);
  }

  setCutsceneCamera(pos, lookAt) {
    this.cutsceneOverride = { pos, lookAt };
    if (this.reticle) this.reticle.visible = false;
  }

  clearCutsceneCamera() {
    this.cutsceneOverride = null;
    if (this.reticle) this.reticle.visible = true;
  }

  updateCamera(playerPos, dt, elapsed) {
    if (this.cutsceneOverride) {
      this.camera.position.copy(this.cutsceneOverride.pos);
      this.camera.lookAt(this.cutsceneOverride.lookAt);
      this.moonLight.position.set(this.cutsceneOverride.lookAt.x + 18, 32, this.cutsceneOverride.lookAt.z + 16);
      this.moonLight.target.position.copy(this.cutsceneOverride.lookAt);
      const atmoLerp = Math.min(1, dt * 2.2);
      this.scene.fog.color.lerp(this.targetFogColor, atmoLerp);
      this.scene.background.lerp(this.targetFogColor, atmoLerp);
      this.ambientLight.color.lerp(this.targetAmbientColor, atmoLerp);
      this.moonLight.color.lerp(this.targetMoonColor, atmoLerp);
      return;
    }

    // Smooth follow with subtle mouse lead
    const leadX = THREE.MathUtils.clamp((this.mouseWorld.x - playerPos.x) * 0.1, -2.4, 2.4);
    const leadZ = THREE.MathUtils.clamp((this.mouseWorld.z - playerPos.z) * 0.1, -2.4, 2.4);

    const desiredTargetX = playerPos.x + leadX;
    const desiredTargetZ = playerPos.z + leadZ;
    const smooth = 1 - Math.exp(-7.5 * dt);
    this.cameraTarget.x += (desiredTargetX - this.cameraTarget.x) * smooth;
    this.cameraTarget.z += (desiredTargetZ - this.cameraTarget.z) * smooth;

    // Trauma shake
    this.trauma = Math.max(0, this.trauma - dt * 2.1);
    const shake = this.trauma * this.trauma * 0.72;
    const sx = (Math.sin(elapsed * 57) * 0.6 + Math.cos(elapsed * 89) * 0.4) * shake;
    const sy = (Math.cos(elapsed * 63) * 0.5 + Math.sin(elapsed * 97) * 0.5) * shake;

    this.camera.position.set(
      this.cameraTarget.x + this.cameraOffset.x + sx,
      this.cameraOffset.y + sy,
      this.cameraTarget.z + this.cameraOffset.z
    );
    this.camera.lookAt(this.cameraTarget.x, 0.9, this.cameraTarget.z);

    // Keep shadow frustum centered around player for sharp shadows everywhere
    this.moonLight.position.set(playerPos.x + 18, 32, playerPos.z + 16);
    this.moonLight.target.position.set(playerPos.x, 0, playerPos.z);

    // Pulse ground reticle subtly
    const pulse = 1 + Math.sin(elapsed * 5.2) * 0.08;
    this.reticle.scale.setScalar(pulse);

    // Interpolate atmosphere smoothly between zones
    const atmoLerp = Math.min(1, dt * 2.2);
    this.scene.fog.color.lerp(this.targetFogColor, atmoLerp);
    this.scene.background.lerp(this.targetFogColor, atmoLerp);
    this.scene.fog.near += (this.targetFogNear - this.scene.fog.near) * atmoLerp;
    this.scene.fog.far += (this.targetFogFar - this.scene.fog.far) * atmoLerp;
    this.ambientLight.color.lerp(this.targetAmbientColor, atmoLerp);
    this.ambientLight.intensity += (this.targetAmbientInt - this.ambientLight.intensity) * atmoLerp;
    this.moonLight.color.lerp(this.targetMoonColor, atmoLerp);
    this.moonLight.intensity += (this.targetMoonInt - this.moonLight.intensity) * atmoLerp;
  }

  projectToScreen(worldPos) {
    const v = worldPos.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * this.width,
      y: (-v.y * 0.5 + 0.5) * this.height,
      visible: v.z < 1,
    };
  }

  render() {
    this.composer.render();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.bloomPass.setSize(this.width, this.height);
  }
}
