import * as THREE from 'three';
import { WORLD_LAYOUT } from './config/worldLayout.js';
import { PALETTE, ZONE_ATMOSPHERE } from './config/palette.js';
import { CHAPTER_PRESETS, DIALOGUES, DIFFICULTY_PRESETS, ENDINGS, LORE_ENTRIES, RELICS, SPELLS } from './config/gameData.js';
import { createTextureLibrary } from './engine/textures.js';
import { SoundEngine } from './engine/audio.js';
import { GameRenderer } from './engine/renderer.js';
import { ParticleSystem } from './engine/particles.js';
import { CutsceneDirector } from './engine/cutscenes.js';
import { RoguelikeManager } from './modes/RoguelikeManager.js';
import { WEAPONS } from './config/gameData.js';
import { CollisionWorld } from './world/Collision.js';
import { WorldBuilder } from './world/WorldBuilder.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Boss } from './entities/Boss.js';
import {
  TwinArchCensersBoss,
  ArchivistPelagiusBoss,
  ArchPrelateAureliusBoss,
} from './entities/LaterBosses.js';
import { InteractablesManager } from './entities/Interactables.js';
import { HUD } from './ui/HUD.js';
import { Minimap } from './ui/Minimap.js';
import { Overlays } from './ui/Overlays.js';

const SAVE_KEY = 'kilnward_save_v2';

/**
 * KILNWARD — Elegy of the Porcelain Saint (Full 4-Act Campaign)
 */
class KilnwardGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gameState = 'TITLE';
    this.elapsed = 0;
    this.playtime = 0;
    this.hitStopTimer = 0;
    this.currentZoneId = 'cloister';
    this.difficulty = 'pilgrim';

    this.questState = {
      talkedToOren: false,
      westCrystalHit: false,
      westBell: false,
      eastGauntletStarted: false,
      eastGauntletWave: 0,
      eastGauntletCleared: false,
      eastBell: false,
      sanctumOpened: false,
      bossDefeated: false,
      act2Unlocked: false,
      talkedToMaren: false,
      viaductBridgeOpen: false,
      act2BossDefeated: false,
      mirrorPuzzleSolved: false,
      act3BossDefeated: false,
      act4BossDefeated: false,
      campaignCompleted: false,
      chosenEnding: null,
      resonance: 0,
      cinder: 0,
      cassianChoice: null,
      marenChoice: null,
      vesperChoice: null,
      openingPlayed: false,
      aureliusIntroPlayed: false,
    };
    this.discoveredLore = new Set();
    this.metrics = { enemiesDefeated: 0, urnsBroken: 0 };

    this.ventTimer = 3.2;
    this.ventPending = null;

    this.keys = new Set();
    this.mouseDownLeft = false;
    this.lastMouseActive = false;

    // Core systems
    this.textures = createTextureLibrary();
    this.sound = new SoundEngine();
    this.renderer = new GameRenderer(this.canvas);
    this.particles = new ParticleSystem(this.renderer.scene, this.textures);
    this.collision = new CollisionWorld();
    this.world = new WorldBuilder(this.renderer.scene, this.textures, this.collision);
    this.world.build();

    this.interactables = new InteractablesManager(this.renderer.scene, this.textures, this.collision);
    this.interactables.buildAll();

    this.player = new Player(this.renderer.scene, this.textures, WORLD_LAYOUT.playerSpawn);
    this.enemies = [];
    this._spawnInitialEnemies();

    // All 4 Act Bosses!
    this.boss = new Boss(this.renderer.scene, this.textures, WORLD_LAYOUT.boss.x, WORLD_LAYOUT.boss.z);
    this.act2Boss = new TwinArchCensersBoss(
      this.renderer.scene,
      this.textures,
      WORLD_LAYOUT.act2Boss.vael,
      WORLD_LAYOUT.act2Boss.soren
    );
    this.act3Boss = new ArchivistPelagiusBoss(
      this.renderer.scene,
      this.textures,
      WORLD_LAYOUT.act3Boss.x,
      WORLD_LAYOUT.act3Boss.z
    );
    this.act4Boss = new ArchPrelateAureliusBoss(
      this.renderer.scene,
      this.textures,
      WORLD_LAYOUT.act4Boss.x,
      WORLD_LAYOUT.act4Boss.z
    );
    this.allBosses = [this.boss, this.act2Boss, this.act3Boss, this.act4Boss];

    this.hud = new HUD();
    this.minimap = new Minimap();
    this.cutscenes = new CutsceneDirector(this.renderer, this.particles, this.sound);
    this.roguelike = new RoguelikeManager(this);
    this.overlays = new Overlays({
      onStart: (actNum) => {
        this.roguelike.active = false;
        this.startChapter(actNum || 1);
      },
      onSetDifficulty: (diff) => this.setDifficulty(diff),
      onContinueSave: () => {
        this.roguelike.active = false;
        this.continueFromSave();
      },
      onOpenRoguelikeLobby: () => {
        this.clearInputState();
        this.gameState = 'TITLE';
        this.hud.setVisible(false);
        this.overlays.showRoguelikeLobby(this.roguelike.meta);
      },
      onBackToTitle: () => {
        this.roguelike.active = false;
        this.gameState = 'TITLE';
        this.overlays.showTitle(this.hasSavedGame());
      },
      onBuyMetaUpgrade: (id) => {
        const ok = this.roguelike.buyMetaUpgrade(id);
        if (ok) this.sound.playChime(true);
        return ok;
      },
      onStartRoguelike: (weaponId) => {
        this.sound.unlock();
        this.roguelike.startNewRun(weaponId);
      },
      onPickBoon: (boonId) => {
        this.roguelike.grantBoon(boonId);
        this.roguelike.openNextRoomChoice();
      },
      onRerollBoons: () => {
        if (this.roguelike.rerollsLeft <= 0) return;
        this.roguelike.rerollsLeft -= 1;
        this.sound.playChime(false);
        const high = this.roguelike.currentRoomType === 'elite' || this.roguelike.currentRoomType === 'boss';
        this.overlays.showBoonDraft(
          this.roguelike.floor,
          this.roguelike.rollBoonChoices(high),
          this.roguelike.rerollsLeft,
          high
        );
      },
      onPickNextRoom: (roomType) => {
        this.roguelike.advanceToFloor(roomType);
      },
      onShopBuyBoon: (b) => {
        if (this.player.gold < b.cost) return false;
        this.player.gold -= b.cost;
        this.roguelike.grantBoon(b.id);
        return true;
      },
      onShopBuyHeal: () => {
        if (this.player.gold < 40) return false;
        this.player.gold -= 40;
        this.player.hp = this.player.stats.maxHp;
        this.player.flasks = this.player.stats.maxFlasks;
        this.sound.playChime(true);
        return true;
      },
      onShopBuyWeapon: (wId) => {
        if (this.player.gold < 45 || this.player.weaponId === wId) return false;
        this.player.gold -= 45;
        this.player.setWeapon(wId);
        this.sound.playBellToll(261.63, 1.4);
        return true;
      },
      onLeaveShop: () => {
        this.roguelike.openNextRoomChoice();
      },
      onCloseModal: () => this.resumeGameplay(),
      onRestart: (clearSave) => {
        if (clearSave) localStorage.removeItem(SAVE_KEY);
        window.location.reload();
      },
      onRespawn: () => this.respawnPlayer(),
      onToggleCodex: () => this.toggleCodex(),
      onTogglePause: () => this.togglePause(),
      onToggleMute: () => this.sound.toggleMute(),
      onDialogueChoice: (ch) => this.handleDialogueChoice(ch),
      onBuyUpgrade: (id) => {
        const ok = this.player.upgradeForge(id);
        if (ok) {
          this.sound.playChime(true);
          this.saveProgress();
        }
        return ok;
      },
      onFastTravel: (shrine) => this.fastTravelToShrine(shrine),
    });

    this.nearestInteractable = null;
    this._bindInput();

    this.overlays.showTitle(this.hasSavedGame());
    this.hud.setVisible(false);
    this.hud.updateQuest(this.questState);

    this._lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _spawnInitialEnemies() {
    for (const spec of WORLD_LAYOUT.enemies) {
      this.enemies.push(
        new Enemy(this.renderer.scene, this.textures, spec.type, spec.x, spec.z, { zone: spec.zone })
      );
    }
  }

  hasSavedGame() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  saveProgress() {
    try {
      const payload = {
        playtime: this.playtime,
        questState: this.questState,
        discoveredLore: Array.from(this.discoveredLore),
        discoveredShrines: Array.from(this.interactables.discoveredShrines),
        metrics: this.metrics,
        player: {
          level: this.player.level,
          xp: this.player.xp,
          gold: this.player.gold,
          relics: this.player.relics,
          forgeTiers: this.player.forgeTiers,
          unlockedSpells: this.player.unlockedSpells,
          unlockedHammer: this.player.unlockedHammer,
          weaponId: this.player.weaponId,
          respawnPos: { x: this.player.respawnPos.x, z: this.player.respawnPos.z },
        },
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }

  continueFromSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.startChapter(1);
      const data = JSON.parse(raw);

      this.playtime = data.playtime || 0;
      Object.assign(this.questState, data.questState || {});
      this.discoveredLore = new Set(data.discoveredLore || []);
      this.interactables.discoveredShrines = new Set(data.discoveredShrines || ['cloister_shrine']);
      this.metrics = data.metrics || { enemiesDefeated: 0, urnsBroken: 0 };

      const p = data.player;
      if (p) {
        this.player.level = p.level || 1;
        this.player.xp = p.xp || 0;
        this.player.gold = p.gold || 0;
        this.player.relics = p.relics || [];
        this.player.forgeTiers = p.forgeTiers || { edge_temper: 0, porcelain_vessel: 0, ember_core: 0 };
        this.player.unlockedSpells = { bolt: true, nova: false, aegis: false, tether: false, ...(p.unlockedSpells || {}) };
        this.player.unlockedHammer = !!p.unlockedHammer;
        this.player.weaponId = p.weaponId || 'claymore';
        this.player.recomputeStats(false);
        const rp = p.respawnPos || WORLD_LAYOUT.playerSpawn;
        this.player.pos.set(rp.x, 0, rp.z);
        this.player.respawnPos.set(rp.x, 0, rp.z);
        this.player.restAtShrine(rp);
      }

      this._syncWorldFromQuestState();
      this._enterGameplayAtPlayerPos();
    } catch {
      this.startChapter(1);
    }
  }

  setDifficulty(diffId) {
    this.difficulty = DIFFICULTY_PRESETS[diffId] ? diffId : 'pilgrim';
  }

  _applyDifficultyScaling() {
    const d = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.pilgrim;
    if (d.enemyHpMult === 1.0) return;
    for (const e of this.enemies) {
      if (!e._scaled) {
        e._scaled = true;
        e.maxHp = Math.round(e.maxHp * d.enemyHpMult);
        e.hp = e.maxHp;
      }
    }
    for (const b of this.allBosses) {
      if (!b._scaled) {
        b._scaled = true;
        if (b.units) {
          for (const u of b.units) {
            u.maxHp = Math.round(u.maxHp * d.enemyHpMult);
            u.hp = u.maxHp;
          }
          b.maxHp = b.units[0].maxHp + b.units[1].maxHp;
        } else {
          b.maxHp = Math.round(b.maxHp * d.enemyHpMult);
          b.hp = b.maxHp;
        }
      }
    }
  }

  startChapter(actNum = 1) {
    const preset = CHAPTER_PRESETS[actNum] || CHAPTER_PRESETS[1];
    this.player.level = preset.level;
    this.player.xp = 0;
    this.player.gold = preset.gold;
    this.player.unlockedSpells = { ...preset.spells };
    this.player.relics = [...preset.relics];
    this.player.forgeTiers = { ...preset.forgeTiers };
    this.player.unlockedHammer = !!preset.unlockedHammer;
    this.player.recomputeStats(false);
    this.player.pos.set(preset.spawn.x, 0, preset.spawn.z);
    this.player.respawnPos.set(preset.spawn.x, 0, preset.spawn.z);
    this.player.restAtShrine(preset.spawn);

    Object.assign(this.questState, preset.questFlags);
    this.player.setAlignmentAura(this.questState.resonance || 0, this.questState.cinder || 0);
    this._applyDifficultyScaling();

    if (actNum >= 2) this.interactables.discoveredShrines.add('viaduct_shrine');
    if (actNum >= 3) this.interactables.discoveredShrines.add('cistern_shrine');
    if (actNum >= 4) this.interactables.discoveredShrines.add('dawn_shrine');

    this._syncWorldFromQuestState();
    this._enterGameplayAtPlayerPos();

    if (actNum === 1 && !this.questState.openingPlayed) {
      this.questState.openingPlayed = true;
      this.playOpeningCutscene();
    }
  }

  _syncWorldFromQuestState() {
    const q = this.questState;
    if (q.westCrystalHit) this.world.activateCrystalSwitch();
    if (q.westBell) this.world.lightSanctumSigil('west');
    if (q.eastBell) this.world.lightSanctumSigil('east');
    if (q.sanctumOpened) this.world.setGateOpen('sanctumGate', true);
    if (q.bossDefeated) {
      this.boss.alive = false;
      this.boss.group.visible = false;
      this.world.igniteGreatBell();
    }
    if (q.act2Unlocked) this.world.setGateOpen('viaductGate', true);
    if (q.viaductBridgeOpen) {
      for (const cw of this.world.counterweightBells) this.world.activateCounterweightBell(cw);
      this.world.setGateOpen('viaductBridgeGate', true);
    }
    if (q.act2BossDefeated) {
      this.act2Boss.alive = false;
      for (const u of this.act2Boss.units) {
        u.alive = false;
        u.group.visible = false;
      }
      this.world.setGateOpen('cisternGate', true);
    }
    if (q.mirrorPuzzleSolved) {
      this.world.solveMirrorPuzzleImmediate();
    }
    if (q.act3BossDefeated) {
      this.act3Boss.alive = false;
      this.act3Boss.group.visible = false;
      this.world.setGateOpen('belfryGate', true);
    }
    if (q.act4BossDefeated) {
      this.act4Boss.alive = false;
      this.act4Boss.group.visible = false;
      this.interactables.spawnKilnHeart(WORLD_LAYOUT.act4Boss.kilnHeartPos.x, WORLD_LAYOUT.act4Boss.kilnHeartPos.z);
    }
    this.hud.updateQuest(this.questState);
  }

  _enterGameplayAtPlayerPos() {
    this.sound.unlock();
    this.overlays.hideAll();
    this.hud.setVisible(true);
    this.gameState = 'PLAYING';
    this.clearInputState();
    this.renderer.cameraTarget.set(this.player.pos.x, 0.8, this.player.pos.z);

    // Sync zone immediately
    this.currentZoneId = '';
    this._updateZoneAtmosphere();
  }

  clearInputState() {
    this.keys.clear();
    this.mouseDownLeft = false;
    if (this.player) {
      this.player.knockback.set(0, 0, 0);
      this.player.dashTimer = 0;
    }
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }

  fastTravelToShrine(shrine) {
    this.player.pos.set(shrine.respawn.x, 0, shrine.respawn.z);
    this.player.restAtShrine(shrine.respawn);
    this.renderer.cameraTarget.set(shrine.respawn.x, 0.8, shrine.respawn.z);
    this.particles.clearDynamic();
    this.sound.playTether();
    this.resumeGameplay();
    this.currentZoneId = '';
    this._updateZoneAtmosphere();
    this.saveProgress();
  }

  _normalizeMoveCode(e) {
    if (e.code) return e.code;
    const k = (e.key || '').toLowerCase();
    if (k === 'w' || k === 'ㅈ') return 'KeyW';
    if (k === 's' || k === 'ㄴ') return 'KeyS';
    if (k === 'a' || k === 'ㅁ') return 'KeyA';
    if (k === 'd' || k === 'ㅇ') return 'KeyD';
    return '';
  }

  _bindInput() {
    // Always clear stuck keys/mouse if window loses focus, tab hides, or IME finishes composition
    window.addEventListener('blur', () => this.clearInputState());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clearInputState();
    });
    window.addEventListener('compositionend', () => this.keys.clear());

    window.addEventListener('keydown', (e) => {
      const code = this._normalizeMoveCode(e);

      if (this.gameState === 'CUTSCENE' && (code === 'Space' || code === 'Escape' || code === 'Enter')) {
        e.preventDefault();
        this.cutscenes.skip();
        return;
      }

      if (this.gameState === 'TITLE' && (code === 'Enter' || code === 'Space')) {
        this.startChapter(1);
        return;
      }
      if (code === 'Escape') {
        if (this.gameState === 'MODAL' || this.gameState === 'PAUSED') {
          this.resumeGameplay();
        } else if (this.gameState === 'PLAYING') {
          this.togglePause();
        }
        return;
      }
      if (code === 'Tab') {
        e.preventDefault();
        if (this.gameState === 'PLAYING' || this.gameState === 'MODAL') {
          this.toggleCodex();
        }
        return;
      }
      if (code === 'KeyM' && this.gameState === 'PLAYING') {
        const muted = this.sound.toggleMute();
        document.getElementById('btn-mute').textContent = muted ? '✕ Muted' : '♪ Sound';
        return;
      }

      if (this.gameState !== 'PLAYING') return;

      // Ignore browser/OS shortcuts (Ctrl/Alt/Meta combos) so movement keys never stick
      if (e.ctrlKey || e.metaKey || e.altKey) {
        this.keys.clear();
        return;
      }

      if (code) this.keys.add(code);

      if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight') {
        e.preventDefault();
      }

      if (code === 'KeyJ') {
        this._performMelee(false);
      } else if (code === 'KeyE' || code === 'KeyK') {
        this._performBolt(false);
      } else if (code === 'KeyQ') {
        this._performNova();
      } else if (code === 'KeyR') {
        this._performAegis();
      } else if (code === 'KeyC' || code === 'KeyT') {
        this._performTether(true);
      } else if (code === 'KeyV') {
        if (this.player.toggleWeapon(this.sound)) {
          this.hud.spawnFloatingText(
            new THREE.Vector3(this.player.pos.x, 2.3, this.player.pos.z),
            this.player.weaponId === 'hammer' ? 'BELL-HAMMER' : 'CLAYMORE',
            'crit',
            this.renderer
          );
        }
      } else if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
        e.preventDefault();
        const origin = this.player.pos.clone();
        if (this.player.tryDash(this._getMoveVector(), this.sound)) {
          this.roguelike.onDash(origin);
        }
      } else if (code === 'Digit1') {
        const healed = this.player.tryFlask(this.particles, this.sound);
        if (healed > 0) {
          this.hud.spawnFloatingText(
            new THREE.Vector3(this.player.pos.x, 2.3, this.player.pos.z),
            `+${healed}`,
            'heal',
            this.renderer
          );
          this.hud.flashScreen('rgba(110, 240, 180, 0.25)');
        }
      } else if (code === 'KeyF') {
        this._tryInteract();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = this._normalizeMoveCode(e);
      if (code) {
        this.keys.delete(code);
      }
      // Defensive: if an IME/OS swallows e.code on keyup, release all movement keys
      if (!e.code || e.key === 'Process' || e.key === 'Unidentified') {
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach((k) =>
          this.keys.delete(k)
        );
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.lastMouseActive = true;
      if ((e.buttons & 1) === 0) this.mouseDownLeft = false;
      this.renderer.updateMouse(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.sound.unlock();
      if (this.gameState !== 'PLAYING') return;
      this.renderer.updateMouse(e.clientX, e.clientY);
      if (e.button === 0) {
        this.mouseDownLeft = true;
        this._performMelee(true);
      } else if (e.button === 2) {
        this._performBolt(true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownLeft = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.mouseDownLeft = false;
    });
  }

  resumeGameplay() {
    this.overlays.hideAll();
    this.gameState = 'PLAYING';
    this.clearInputState();
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.clearInputState();
      this.gameState = 'PAUSED';
      this.overlays.showPause();
    } else if (this.gameState === 'PAUSED') {
      this.resumeGameplay();
    }
  }

  toggleCodex() {
    if (this.gameState === 'PLAYING') {
      this.clearInputState();
      this.gameState = 'MODAL';
      this.overlays.showCodex(this.player, this.discoveredLore, this.roguelike.active ? this.roguelike.boonList : []);
    } else if (this.gameState === 'MODAL') {
      this.resumeGameplay();
    }
  }

  respawnPlayer() {
    this.player.respawn();
    this.particles.clearDynamic();
    // Reset any currently active boss & clear boss mist gates
    if (this.boss.active && this.boss.alive) {
      this.boss.reset();
      this.world.setGateOpen('bossMist', true);
    }
    if (this.act2Boss.active && this.act2Boss.alive) {
      this.act2Boss.reset();
      this.world.setGateOpen('act2BossMist', true);
    }
    if (this.act3Boss.active && this.act3Boss.alive) {
      this.act3Boss.reset();
      this.world.setGateOpen('act3BossMist', true);
    }
    if (this.act4Boss.active && this.act4Boss.alive) {
      this.act4Boss.reset();
      this.world.setGateOpen('act4BossMist', true);
    }
    if (this.questState.eastGauntletStarted && !this.questState.eastGauntletCleared) {
      this.world.setGateOpen('eastSeal', true);
      this.questState.eastGauntletStarted = false;
      this.questState.eastGauntletWave = 0;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (this.enemies[i].gauntletWave) {
          this.renderer.scene.remove(this.enemies[i].group);
          this.enemies.splice(i, 1);
        }
      }
    }
    this.overlays.hideAll();
    this.gameState = 'PLAYING';
    this.clearInputState();
    this.hud.showToast('VESSEL RE-FIRED', 'Awakened at Kiln Shrine', 'All flasks restored.');
  }

  _getMoveVector() {
    let f = 0;
    let r = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) f += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) f -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) r += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) r -= 1;

    const v = new THREE.Vector3();
    if (f !== 0 || r !== 0) {
      v.addScaledVector(this.renderer.moveForward, f);
      v.addScaledVector(this.renderer.moveRight, r);
      v.normalize();
    }
    return v;
  }

  _getActiveBoss() {
    for (const b of this.allBosses) {
      if (b.active && b.alive) return b;
    }
    return null;
  }

  _performMelee(useMouse) {
    const aim = useMouse ? this.renderer.mouseWorld : null;
    const slash = this.player.tryAttack(aim, this.particles, this.sound);
    if (!slash) return;

    let hitAny = false;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this._inSlashCone(slash, e.pos, e.radius)) {
        this._damageEnemy(e, slash.damage, slash.origin, slash.knockback, slash.heavy);
        this.roguelike.onMeleeHit(e.pos, slash.damage, slash.step, e, null);
        hitAny = true;
      }
    }

    // Check active boss hit targets (works for single bosses AND Twin Arch-Censers!)
    const activeBoss = this._getActiveBoss();
    if (activeBoss) {
      const targets = activeBoss.getHitTargets ? activeBoss.getHitTargets() : [activeBoss];
      for (const t of targets) {
        if (this._inSlashCone(slash, t.pos, t.radius)) {
          this._damageActiveBoss(activeBoss, t, slash.damage, slash.heavy);
          this.roguelike.onMeleeHit(t.pos, slash.damage, slash.step, t, activeBoss);
          hitAny = true;
        }
      }
    }

    // Also allow melee strikes to rotate Act III Bronze Mirrors!
    if (this.world.mirrorState && !this.world.mirrorState.solved) {
      for (const m of this.world.mirrorState.mirrors) {
        if (this._inSlashCone(slash, m, 1.0)) {
          this._rotateMirror(m.id);
          hitAny = true;
          break;
        }
      }
    }

    for (const u of this.interactables.urns) {
      if (!u.alive) continue;
      if (this._inSlashCone(slash, u, u.radius + 0.35)) {
        if (this.interactables.breakUrn(u, this.particles, this.sound)) {
          this.metrics.urnsBroken += 1;
        }
      }
    }

    if (hitAny) {
      this.player.onMeleeHitLanded();
      this.sound.playHit(slash.heavy);
      this.renderer.addTrauma(slash.heavy ? 0.32 : 0.14);
      if (slash.heavy) this.hitStopTimer = 0.036;
    }
  }

  _inSlashCone(slash, targetPos, targetRadius) {
    const dx = targetPos.x - slash.origin.x;
    const dz = targetPos.z - slash.origin.z;
    const dist = Math.hypot(dx, dz);
    if (dist > slash.range + targetRadius) return false;
    if (dist < 1.15) return true;
    const ang = Math.atan2(dx, dz);
    let diff = Math.abs(ang - slash.yaw);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff <= slash.arcHalf;
  }

  _performBolt(useMouse) {
    const aim = useMouse || this.lastMouseActive ? this.renderer.mouseWorld : null;
    this.player.tryCastBolt(aim, this.particles, this.sound, this.roguelike.hasBoon('splintering_bolts'));
  }

  _performNova() {
    const nova = this.player.tryCastNova(this.particles, this.sound);
    if (!nova) return;
    this.renderer.addTrauma(0.38);
    this.roguelike.onNovaCast(nova.origin, nova.damage, nova.radius);

    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.pos.x - nova.origin.x, e.pos.z - nova.origin.z) <= nova.radius + e.radius) {
        this._damageEnemy(e, nova.damage, nova.origin, 11.5, true);
      }
    }

    const activeBoss = this._getActiveBoss();
    if (activeBoss) {
      const targets = activeBoss.getHitTargets ? activeBoss.getHitTargets() : [activeBoss];
      for (const t of targets) {
        if (Math.hypot(t.pos.x - nova.origin.x, t.pos.z - nova.origin.z) <= nova.radius + t.radius) {
          this._damageActiveBoss(activeBoss, t, nova.damage, true);
        }
      }
    }

    for (const u of this.interactables.urns) {
      if (u.alive && Math.hypot(u.x - nova.origin.x, u.z - nova.origin.z) <= nova.radius) {
        if (this.interactables.breakUrn(u, this.particles, this.sound)) {
          this.metrics.urnsBroken += 1;
        }
      }
    }
  }

  _performAegis() {
    if (this.player.tryCastAegis(this.particles, this.sound)) {
      this.hud.spawnFloatingText(
        new THREE.Vector3(this.player.pos.x, 2.3, this.player.pos.z),
        'AEGIS',
        'crit',
        this.renderer
      );
    }
  }

  /**
   * Act II Unlockable Spell 4 — Verdigris Tether [C / T]
   * Hooks enemies (warping Vesper in for a heavy strike) or rings distant Counterweight Bells & Crystal!
   */
  _performTether(useMouse) {
    const aim = useMouse || this.lastMouseActive ? this.renderer.mouseWorld : null;
    const t = this.player.tryCastTether(aim, this.sound);
    if (!t) return;

    // 1. Check Act II Counterweight Bells along ray
    for (const cw of this.world.counterweightBells) {
      if (cw.activated) continue;
      const dx = cw.x - t.origin.x;
      const dz = cw.z - t.origin.z;
      const proj = dx * t.dir.x + dz * t.dir.z;
      const perp = Math.abs(dx * -t.dir.z + dz * t.dir.x);
      if (proj > 0 && proj <= t.range && perp <= 3.2) {
        this.particles.spawnTetherBeam(t.origin, cw, PALETTE.stormCyan);
        this._triggerCounterweightBell(cw);
        return;
      }
    }

    // 2. Check Act I Crystal Switch
    const sw = this.world.crystalSwitch;
    if (sw && !sw.activated) {
      const dx = sw.x - t.origin.x;
      const dz = sw.z - t.origin.z;
      const proj = dx * t.dir.x + dz * t.dir.z;
      const perp = Math.abs(dx * -t.dir.z + dz * t.dir.x);
      if (proj > 0 && proj <= t.range && perp <= 2.8) {
        this.particles.spawnTetherBeam(t.origin, sw, PALETTE.verdigrisGlow);
        this._triggerCrystalSwitch();
        return;
      }
    }

    // 3. Find closest enemy or boss unit along ray -> zip Vesper right next to them & strike!
    let bestTarget = null;
    let bestKind = null;
    let bestBoss = null;
    let bestProj = t.range;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.pos.x - t.origin.x;
      const dz = e.pos.z - t.origin.z;
      const proj = dx * t.dir.x + dz * t.dir.z;
      const perp = Math.abs(dx * -t.dir.z + dz * t.dir.x);
      if (proj > 0.5 && proj < bestProj && perp <= 2.4) {
        bestProj = proj;
        bestTarget = e;
        bestKind = 'enemy';
      }
    }

    const activeBoss = this._getActiveBoss();
    if (activeBoss) {
      const targets = activeBoss.getHitTargets ? activeBoss.getHitTargets() : [activeBoss];
      for (const u of targets) {
        const dx = u.pos.x - t.origin.x;
        const dz = u.pos.z - t.origin.z;
        const proj = dx * t.dir.x + dz * t.dir.z;
        const perp = Math.abs(dx * -t.dir.z + dz * t.dir.x);
        if (proj > 0.5 && proj < bestProj && perp <= 2.8) {
          bestProj = proj;
          bestTarget = u;
          bestKind = 'boss';
          bestBoss = activeBoss;
        }
      }
    }

    if (bestTarget) {
      const targetPos = bestTarget.pos;
      this.particles.spawnTetherBeam(t.origin, targetPos, PALETTE.verdigrisGlow);
      // Blink Vesper safely in front of target
      const stopDist = (bestTarget.radius || 0.8) + this.player.radius + 0.6;
      const destX = targetPos.x - t.dir.x * stopDist;
      const destZ = targetPos.z - t.dir.z * stopDist;
      this.player.pos.set(destX, 0, destZ);
      this.collision.resolveCircle(this.player.pos, this.player.radius);
      this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.35);

      this.particles.spawnRingWave(targetPos, 3.8, PALETTE.verdigrisGlow, 0.4);
      this.sound.playHit(true);
      this.renderer.addTrauma(0.28);

      if (bestKind === 'enemy') {
        this._damageEnemy(bestTarget, t.damage, this.player.pos, 6.0, true, false, true);
      } else {
        this._damageActiveBoss(bestBoss, bestTarget, t.damage, true);
      }
      if (this.roguelike.hasBoon('tether_cascade')) {
        this.particles.spawnRingWave(targetPos, 5.5, PALETTE.verdigrisGlow, 0.45);
        for (const e of this.enemies) {
          if (e.alive && e !== bestTarget && Math.hypot(e.pos.x - targetPos.x, e.pos.z - targetPos.z) <= 5.5) {
            this._damageEnemy(e, Math.round(t.damage * 0.8), targetPos, 7, true, true, true);
          }
        }
      }
    } else {
      // Visual cast fizzle
      const endPos = t.origin.clone().addScaledVector(t.dir, 9);
      this.particles.spawnTetherBeam(t.origin, endPos, PALETTE.verdigrisGlow);
    }
  }

  _damageEnemy(enemy, amount, sourcePos, knockback, heavy, fromProc = false, fromTether = false) {
    const wCrit = (WEAPONS[this.player.weaponId]?.critBonus) || 0;
    const isCrit = heavy || Math.random() < (this.player.stats.critChance + wCrit);
    const boonMult = this.roguelike.getDamageMultiplier(enemy.hp, enemy.maxHp);
    const dmg = Math.max(1, Math.round(amount * boonMult * (isCrit ? 1.25 : 1.0)));
    enemy.takeDamage(dmg, sourcePos, knockback, heavy);

    if (isCrit && !fromProc) this.roguelike.onCrit(enemy.pos);
    if (!fromProc && this.roguelike.hasBoon('cinder_bleed')) this.roguelike.applyBurn(enemy, null);

    this.particles.spawnBurst(
      new THREE.Vector3(enemy.pos.x, 1.2, enemy.pos.z),
      isCrit ? PALETTE.kintsugiBright : PALETTE.porcelainWhite,
      isCrit ? 10 : 6,
      7
    );
    this.hud.spawnFloatingText(
      new THREE.Vector3(enemy.pos.x, enemy.def.height + 0.5, enemy.pos.z),
      String(dmg),
      isCrit ? 'crit' : 'normal',
      this.renderer
    );

    if (!enemy.alive) {
      this.metrics.enemiesDefeated += 1;
      this.roguelike.onEnemyKilled(fromTether);
      this.particles.spawnBurst(
        new THREE.Vector3(enemy.pos.x, 1.1, enemy.pos.z),
        PALETTE.porcelainWhite,
        14,
        8.5,
        true
      );
      this.sound.playShatter();
      const [gMin, gMax] = enemy.def.gold;
      const goldMult = this.roguelike.active && this.roguelike.currentMutator.id === 'overfired' ? 1.4 : 1.0;
      const goldVal = Math.round((gMin + Math.floor(Math.random() * (gMax - gMin + 1))) * goldMult);
      this.interactables.spawnLoot(enemy.pos.x, enemy.pos.z, 'gold', goldVal);
      this.interactables.spawnLoot(enemy.pos.x, enemy.pos.z, 'xp', enemy.def.xp);
      if (Math.random() < 0.22) {
        this.interactables.spawnLoot(enemy.pos.x, enemy.pos.z, 'heal', 24);
      }
    }
  }

  _damageActiveBoss(bossObj, targetUnit, amount, heavy) {
    const wCrit = (WEAPONS[this.player.weaponId]?.critBonus) || 0;
    const isCrit = heavy || Math.random() < (this.player.stats.critChance + wCrit);
    const boonMult = this.roguelike.getDamageMultiplier(targetUnit.hp, targetUnit.maxHp);
    const dmg = Math.max(1, Math.round(amount * boonMult * (isCrit ? 1.2 : 1.0)));
    if (isCrit) this.roguelike.onCrit(targetUnit.pos);

    if (bossObj === this.boss) {
      this.boss.takeDamage(dmg, this.particles, this.sound, () => {
        this.renderer.addTrauma(0.75);
        this.hud.showToast(
          'PHASE II · THE GLAZE SHATTERS',
          'Saint Cassian Ignites!',
          'Watch for his Kiln Dash Charge and radial Bell-Toll shockwaves.'
        );
        if (!this.boss.summonedAdds) {
          this.boss.summonedAdds = true;
          const bx = this.boss.pos.x;
          const bz = this.boss.pos.z;
          const zone = this.roguelike.active ? this.roguelike.currentArena.zoneId : 'crucible';
          this.enemies.push(
            new Enemy(this.renderer.scene, this.textures, 'skitterer', bx - 8, bz, { zone, gauntletWave: true }),
            new Enemy(this.renderer.scene, this.textures, 'skitterer', bx + 8, bz, { zone, gauntletWave: true })
          );
        }
      });
    } else if (bossObj === this.act2Boss) {
      this.act2Boss.damageUnit(targetUnit, dmg, this.particles, this.sound, (survivorName) => {
        this.renderer.addTrauma(0.65);
        this.hud.showToast(
          'KINTSUGI RESONANCE',
          `${survivorName} Absorbs the Fallen Seam!`,
          'The surviving Arch-Censer heals and ignites with storm lightning.'
        );
      });
    } else if (bossObj === this.act3Boss) {
      this.act3Boss.damageUnit(targetUnit, dmg, this.particles, this.sound, () => {
        this.renderer.addTrauma(0.7);
        this.hud.showToast(
          'PHASE II · THE MEMORY UNSPINS',
          'Pelagius Accelerates!',
          'The celestial sweeper beams spin faster—watch the glowing mosaic quadrants.'
        );
      });
    } else if (bossObj === this.act4Boss) {
      this.act4Boss.damageUnit(targetUnit, dmg, this.particles, this.sound, (newPhase) => {
        this.renderer.addTrauma(0.8);
        if (newPhase === 2) {
          this.hud.showToast('PHASE II · THE FIRST KILN AWAKES', 'Aurelius Spreads Blazing Wings!', 'Watch for his Winged Dash and double Bell-Ring Nova.');
        } else {
          this.hud.showToast('PHASE III · UNFIRED ASH', 'Aurelius Sheds His Throne!', 'End the firing once and for all!');
        }
      });
    }

    const hitPos = targetUnit.pos;
    this.particles.spawnBurst(
      new THREE.Vector3(hitPos.x, 2.0, hitPos.z),
      isCrit ? PALETTE.kintsugiBright : PALETTE.kilnAmber,
      10,
      8
    );
    this.hud.spawnFloatingText(
      new THREE.Vector3(hitPos.x, 3.6, hitPos.z),
      String(dmg),
      isCrit ? 'crit' : 'normal',
      this.renderer
    );

    // Check Boss Defeats! (Story Mode handles story progression; Roguelike handles boss clear in RoguelikeManager)
    if (this.roguelike.active) return;
    if (bossObj === this.boss && !this.boss.alive && !this.questState.bossDefeated) {
      this.questState.bossDefeated = true;
      this.metrics.enemiesDefeated += 1;
      this.renderer.addTrauma(0.9);
      this.world.setGateOpen('bossMist', true);
      this.world.igniteGreatBell();
      this.interactables.spawnCassianEcho(this.boss.pos.x, this.boss.pos.z);
      this.interactables.spawnLoot(this.boss.pos.x, this.boss.pos.z, 'xp', 200);
      this.interactables.spawnLoot(this.boss.pos.x, this.boss.pos.z, 'gold', 85);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.hud.showToast('ACT I BOSS QUIETED', 'Saint Cassian Defeated', 'Commune with his Mended Echo [F] to open Act II: The Salt Viaduct.', 5.2);
    } else if (bossObj === this.act2Boss && !this.act2Boss.alive && !this.questState.act2BossDefeated) {
      this.questState.act2BossDefeated = true;
      this.metrics.enemiesDefeated += 2;
      this.renderer.addTrauma(0.9);
      this.world.setGateOpen('act2BossMist', true);
      this.world.setGateOpen('cisternGate', true);
      this.interactables.spawnLoot(hitPos.x, hitPos.z, 'xp', 320);
      this.interactables.spawnLoot(hitPos.x, hitPos.z, 'gold', 120);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      // Trigger Act II Moral Reckoning with Sister Maren!
      setTimeout(() => {
        if (this.gameState === 'PLAYING' && !this.questState.marenChoice) {
          this._openDialogue('maren_reckoning');
        }
      }, 950);
    } else if (bossObj === this.act3Boss && !this.act3Boss.alive && !this.questState.act3BossDefeated) {
      this.questState.act3BossDefeated = true;
      this.metrics.enemiesDefeated += 1;
      this.renderer.addTrauma(0.9);
      this.world.setGateOpen('act3BossMist', true);
      this.world.setGateOpen('belfryGate', true);
      this.interactables.spawnLoot(hitPos.x, hitPos.z, 'xp', 420);
      this.interactables.spawnLoot(hitPos.x, hitPos.z, 'gold', 160);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      // Play Act III Identity Revelation Cutscene -> leads into Identity Reckoning!
      setTimeout(() => {
        if (this.gameState === 'PLAYING' && !this.questState.vesperChoice) {
          this.playAct3RevelationCutscene();
        }
      }, 750);
    } else if (bossObj === this.act4Boss && !this.act4Boss.alive && !this.questState.act4BossDefeated) {
      this.questState.act4BossDefeated = true;
      this.metrics.enemiesDefeated += 1;
      this.renderer.addTrauma(1.0);
      this.world.setGateOpen('act4BossMist', true);
      this.interactables.spawnKilnHeart(WORLD_LAYOUT.act4Boss.kilnHeartPos.x, WORLD_LAYOUT.act4Boss.kilnHeartPos.z);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.hud.showToast('ARCH-PRELATE FALLEN', 'The First Kiln Lies Open', 'Approach the Heart of the First Kiln [F] to choose Orrery’s fate.', 6.0);
    }
  }

  _onPlayerHit(damage, sourcePos) {
    const diffMult = (DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.pilgrim).enemyDmgMult;
    const rlMult = this.roguelike.getIncomingDamageMultiplier();
    const scaledDmg = Math.round(damage * diffMult * rlMult);
    const taken = this.player.takeDamage(scaledDmg, sourcePos, this.sound);
    if (taken <= 0) return;
    this.roguelike.onPlayerDamaged();
    this.renderer.addTrauma(0.42);
    this.hud.flashScreen('rgba(217, 56, 58, 0.42)');
    this.hud.spawnFloatingText(
      new THREE.Vector3(this.player.pos.x, 2.2, this.player.pos.z),
      `-${taken}`,
      'player-hit',
      this.renderer
    );
    if (!this.player.alive) {
      if (this.roguelike.tryDeathDefiance()) return;
      this.particles.spawnBurst(
        new THREE.Vector3(this.player.pos.x, 1.1, this.player.pos.z),
        PALETTE.porcelainWhite,
        18,
        8,
        true
      );
      if (this.roguelike.active) {
        this.roguelike.onRunEnded();
      } else {
        this.clearInputState();
        this.gameState = 'DEAD';
        this.overlays.showDeath();
      }
    }
  }

  _tryInteract() {
    const it = this.nearestInteractable;
    if (!it) return;

    if (it.kind === 'npc') {
      if (it.id === 'sister_maren') {
        this._openDialogue('maren_intro');
      } else {
        const dlgId = this.questState.talkedToOren ? 'oren_progress' : 'oren_intro';
        this._openDialogue(dlgId);
      }
    } else if (it.kind === 'echo') {
      this._openDialogue('cassian_echo');
    } else if (it.kind === 'kiln_heart') {
      this._openDialogue('kiln_heart_choice');
    } else if (it.kind === 'shrine') {
      this.interactables.discoveredShrines.add(it.id);
      this.player.restAtShrine(it.respawn);
      this.sound.playChime(true);
      this.particles.spawnRingWave(this.player.pos, 3.8, PALETTE.kintsugiBright, 0.6);
      this.saveProgress();
      this.clearInputState();
      this.gameState = 'MODAL';
      this.overlays.showForge(this.player, this.interactables.discoveredShrines);
    } else if (it.kind === 'stele') {
      const entry = LORE_ENTRIES[it.id];
      if (!entry) return;
      it.read = true;
      this.discoveredLore.add(entry.id);
      this.sound.playChime(false);
      this.saveProgress();
      this.clearInputState();
      this.gameState = 'MODAL';
      this.overlays.showDialogue({
        kicker: entry.kicker,
        speaker: entry.title,
        body: entry.text,
        choices: [{ label: 'Record in Vesper’s Ledger', action: 'close' }],
      });
    } else if (it.kind === 'bell') {
      this._ringBell(it);
    } else if (it.kind === 'chest') {
      this._openChest(it);
    } else if (it.kind === 'weapon_pedestal') {
      it.claimed = true;
      if (it.marker) it.marker.visible = false;
      this.player.unlockedHammer = true;
      this.player.weaponId = 'hammer';
      this.player.syncWeaponVisual();
      this.sound.playBellToll(196, 2.2);
      this.particles.spawnRingWave(new THREE.Vector3(it.x, 0, it.z), 5.5, PALETTE.kintsugiBright, 0.7);
      this.saveProgress();
      this.hud.showToast(
        'WEAPON STANCE UNLOCKED',
        'Resonance Bell-Hammer Claimed!',
        'Press [V] anytime to switch between Crescent Claymore and Bell-Hammer.',
        5.4
      );
    } else if (it.kind === 'mirror') {
      this._rotateMirror(it.id);
    }
  }

  _rotateMirror(mirrorId) {
    this.sound.playChime(false);
    const solvedNow = this.world.rotateMirror(mirrorId);
    if (solvedNow && !this.questState.mirrorPuzzleSolved) {
      this.questState.mirrorPuzzleSolved = true;
      this.sound.playBellToll(329.63, 2.8);
      this.renderer.addTrauma(0.5);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.hud.showToast(
        'MOSAIC BEAM ALIGNED',
        'The Library Gate Unseals!',
        'Proceed north into the Orrery Rotunda to face Archivist Pelagius.',
        5.0
      );
    }
  }

  _openDialogue(id) {
    const d = DIALOGUES[id];
    if (!d) return;
    const loreCount = this.discoveredLore.size;
    const bodyText = typeof d.body === 'function' ? d.body(this.questState, loreCount) : d.body;
    const choicesList = typeof d.choices === 'function' ? d.choices(this.questState, loreCount) : d.choices;
    this.clearInputState();
    this.gameState = 'MODAL';
    this.overlays.showDialogue({
      kicker: d.kicker,
      speaker: d.speaker,
      body: bodyText,
      choices: choicesList,
    });
  }

  handleDialogueChoice(choice) {
    if (choice.next) {
      this._openDialogue(choice.next);
      return;
    }
    if (choice.action === 'accept_quest') {
      this.questState.talkedToOren = true;
      this.hud.updateQuest(this.questState);
      this.sound.playChime(true);
      this.resumeGameplay();
    } else if (choice.action === 'talk_maren') {
      this.questState.talkedToMaren = true;
      this.hud.updateQuest(this.questState);
      this.sound.playChime(true);
      this.resumeGameplay();
    } else if (choice.action === 'open_forge') {
      this.player.restAtShrine(WORLD_LAYOUT.shrines[0].respawn);
      this.overlays.showForge(this.player, this.interactables.discoveredShrines);
    } else if (choice.action === 'reckoning_cassian_mend' || choice.action === 'reckoning_cassian_cinder') {
      const isMend = choice.action === 'reckoning_cassian_mend';
      this.questState.act2Unlocked = true;
      this.questState.cassianChoice = isMend ? 'resonance' : 'cinder';
      if (isMend) {
        this.questState.resonance += 1;
        this.player.addRelic('cassian_forgiveness');
        this.player.flasks = this.player.stats.maxFlasks;
      } else {
        this.questState.cinder += 1;
        this.player.addRelic('cassian_furnace_brand');
      }
      this.player.setAlignmentAura(this.questState.resonance, this.questState.cinder);
      this.world.setGateOpen('viaductGate', true);
      this.sound.playBellToll(isMend ? 220 : 146.8, 3.2);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.resumeGameplay();
      this.hud.showToast(
        isMend ? 'RESONANCE · CASSIAN MENDED' : 'CINDER · FURNACE CLAIMED',
        'Act II: The Salt Viaduct Unsealed!',
        isMend
          ? 'Cassian’s Forgiveness warms your lantern. Ascend north past the Great Bell.'
          : 'Cassian’s furnace ignites your blade. Brother Oren will feel what you did.',
        5.8
      );
    } else if (choice.action === 'reckoning_maren_mend' || choice.action === 'reckoning_maren_cinder') {
      const isMend = choice.action === 'reckoning_maren_mend';
      this.questState.marenChoice = isMend ? 'resonance' : 'cinder';
      if (isMend) {
        this.questState.resonance += 1;
        this.player.addRelic('maren_harmony');
      } else {
        this.questState.cinder += 1;
        this.player.addRelic('storm_cracked_edge');
      }
      this.player.setAlignmentAura(this.questState.resonance, this.questState.cinder);
      this.sound.playBellToll(isMend ? 261.6 : 164.8, 2.8);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.resumeGameplay();
      this.hud.showToast(
        isMend ? 'RESONANCE · OATH OF TRUTH' : 'CINDER · OATH OF ASH',
        'Act III: The Cobalt Cisterns Open!',
        'Descend north into the blue archive to uncover Brother Oren’s secret.',
        5.4
      );
    } else if (choice.action === 'reckoning_vesper_mend' || choice.action === 'reckoning_vesper_cinder') {
      const isMend = choice.action === 'reckoning_vesper_mend';
      this.questState.vesperChoice = isMend ? 'resonance' : 'cinder';
      if (isMend) {
        this.questState.resonance += 1;
        this.player.addRelic('three_voices_chorus');
      } else {
        this.questState.cinder += 1;
        this.player.addRelic('severed_porcelain');
      }
      this.player.setAlignmentAura(this.questState.resonance, this.questState.cinder);
      this.sound.playBellToll(isMend ? 293.66 : 174.6, 3.0);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.resumeGameplay();
      this.hud.showToast(
        isMend ? 'RESONANCE · THREE VOICES AS ONE' : 'CINDER · UNOWNED BLADE',
        'Act IV: The Dawn Belfry Awaits!',
        'Climb north into the sunrise to confront Arch-Prelate Aurelius.',
        5.6
      );
    } else if (
      choice.action === 'ending_golden_seam' ||
      choice.action === 'ending_silent_ash' ||
      choice.action === 'ending_eternal_choir'
    ) {
      const endKey = choice.action.replace('ending_', '');
      this.questState.campaignCompleted = true;
      this.questState.chosenEnding = endKey;
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.overlays.hideAll();
      // Launch the Grand 3D Post-Fight Finale Cutscene before showing the Epilogue Card!
      this.playFinaleEndingCutscene(endKey);
    } else {
      this.resumeGameplay();
    }
  }

  // ============================================================================
  // IN-ENGINE 3D CUTSCENES
  // ============================================================================
  _startCutscene(shots, onDone) {
    this.clearInputState();
    this.gameState = 'CUTSCENE';
    this.hud.setVisible(false);
    this.cutscenes.play(shots, () => {
      if (onDone) onDone();
    });
  }

  playOpeningCutscene() {
    this._startCutscene(
      [
        {
          duration: 3.4,
          fromPos: [14, 18, 56],
          toPos: [6, 7.5, 48.5],
          fromLook: [0, 1.5, 36],
          toLook: [0, 1.4, 43],
          kicker: 'ACT I · THE SUNKEN KILN',
          caption: 'Seven years after the First Kiln split, a three-seamed porcelain vessel wakes beneath the flooded abbey of Orrery.',
          onStart: () => {
            this.sound.playBellToll(110, 3.2);
            this.particles.spawnRingWave(this.player.pos, 5.0, PALETTE.kintsugiBright, 1.2);
          },
        },
        {
          duration: 3.0,
          fromPos: [6, 7.5, 48.5],
          toPos: [-2, 6.5, 44.5],
          fromLook: [0, 1.4, 43],
          toLook: [-6.2, 1.8, 38.5],
          kicker: 'BROTHER OREN',
          caption: '“Vesper… your gold seams held. Saint Cassian still burns behind the northern gate. Come—speak with me.”',
          onStart: () => {
            this.sound.playChime(true);
          },
        },
      ],
      () => {
        this.hud.setVisible(true);
        this.resumeGameplay();
        this.hud.showZoneBanner('The Sunken Cloister', 'ACT I · SANCTUARY OF THE BELL-KEEPERS');
      }
    );
  }

  playAct3RevelationCutscene() {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    const orbs = [];
    this._startCutscene(
      [
        {
          duration: 3.6,
          fromPos: [px + 10, 9.5, pz + 10],
          toPos: [px + 4.5, 4.5, pz + 6.5],
          fromLook: [0, 2.2, -216],
          toLook: [px, 1.8, pz],
          kicker: 'ARCHIVE MEMORY · RECORD 409',
          caption: 'As Pelagius shatters, three luminous echoes rise from the blue water—the three drowned Bell-Makers Brother Oren fused into your body.',
          onStart: (dir) => {
            this.sound.playBellToll(220, 3.4);
            for (let i = 0; i < 3; i++) {
              const m = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.42, 1),
                new THREE.MeshBasicMaterial({ color: i === 1 ? PALETTE.aetherCyan : PALETTE.kintsugiBright })
              );
              dir.addTempObject(m);
              orbs.push(m);
            }
          },
          onUpdate: (t) => {
            orbs.forEach((m, i) => {
              const a = t * Math.PI * 3.5 + (i * Math.PI * 2) / 3;
              m.position.set(px + Math.cos(a) * 2.8, 1.0 + t * 2.4, pz + Math.sin(a) * 2.8);
            });
          },
        },
        {
          duration: 3.4,
          fromPos: [px + 4.5, 4.5, pz + 6.5],
          toPos: [0, 12, -220],
          fromLook: [px, 1.8, pz],
          toLook: [0, 4.5, -234],
          kicker: 'THE TRUTH OF VESPER',
          caption: 'You were Saint Cassian’s own apprentice, shattered on the viaduct stair. Beyond this northern arch waits the dawn—and Arch-Prelate Aurelius.',
          onStart: () => {
            this.sound.playChime(true);
            this.particles.spawnRingWave(this.player.pos, 9, PALETTE.laserGold, 1.0);
          },
          onUpdate: (t) => {
            orbs.forEach((m, i) => {
              const a = (1 + t) * Math.PI * 3.5 + (i * Math.PI * 2) / 3;
              m.position.set(px + Math.cos(a) * (2.8 - t * 2.0), 3.4 + t * 1.5, pz + Math.sin(a) * (2.8 - t * 2.0));
            });
          },
        },
      ],
      () => {
        this.hud.setVisible(true);
        this._openDialogue('pelagius_reckoning');
      }
    );
  }

  playAureliusSummitCutscene() {
    const q = this.questState;
    const personalLine =
      q.cassianChoice === 'cinder'
        ? '“You drained Cassian’s own furnace, little apprentice. You think ash is kinder than my fire?”'
        : '“Cassian’s apprentice—mended with three stolen voices. Even after you cooled him, you still climb to erase my daughter’s last echo?”';

    this._startCutscene(
      [
        {
          duration: 3.2,
          fromPos: [-16, 13, -256],
          toPos: [-8, 6.2, -268],
          fromLook: [0, 3.2, -282],
          toLook: [0, 3.4, -282],
          kicker: 'ACT IV · THE BELFRY OF UNFIRED ASH',
          caption: 'Above the clouds of Orrery, sunrise breaks across pale alabaster—and Arch-Prelate Aurelius rises from his throne.',
          onStart: () => {
            this.sound.playBellToll(146.83, 3.2);
          },
        },
        {
          duration: 3.8,
          fromPos: [-8, 6.2, -268],
          toPos: [7.5, 5.2, -271],
          fromLook: [0, 3.4, -282],
          toLook: [0, 3.6, -282],
          kicker: 'ARCH-PRELATE AURELIUS, THE UNCOOLED',
          caption: personalLine,
          onStart: () => {
            this.sound.playBossHorn();
            this.particles.spawnRingWave(this.act4Boss.pos, 15, PALETTE.dawnSun, 1.1);
            this.particles.spawnBurst(new THREE.Vector3(0, 3.2, -282), PALETTE.kintsugiBright, 26, 10);
          },
        },
      ],
      () => {
        this.hud.setVisible(true);
        this.resumeGameplay();
        this.world.setGateOpen('act4BossMist', false);
        this.act4Boss.awaken(this.sound, this.particles);
        this.renderer.addTrauma(0.65);
        this.hud.showZoneBanner('ARCH-PRELATE AURELIUS', 'THE UNCOOLED');
      }
    );
  }

  playFinaleEndingCutscene(endKey) {
    const heartPos = WORLD_LAYOUT.act4Boss.kilnHeartPos;
    const hx = heartPos.x;
    const hz = heartPos.z;
    this.player.pos.set(hx, 0, hz + 5.2);
    this.player.yaw = Math.PI;
    this.player.group.position.copy(this.player.pos);
    this.player.group.rotation.y = this.player.yaw;

    const beamMeshes = [];
    const spiritGroup = [];

    const shot2Caption =
      endKey === 'eternal_choir'
        ? 'You raise Cassian’s Shard into the dawn. A soaring pillar of gold-and-verdigris resonance pierces the clouds—waking every bell in Orrery!'
        : endKey === 'silent_ash'
          ? 'Your blade splits the First Kiln down its oldest fracture. Cinder-Ichor dissolves into quiet sunrise ash, and Vesper’s three seams finally unfasten.'
          : 'You lay your blade across the furnace heart, cooling seven years of fever down to gentle golden hearth-warmth.';

    const shot3Caption =
      endKey === 'eternal_choir'
        ? 'Across the Cobalt Cisterns, Salt Viaduct, and Sunken Cloister, Orrery answers in living polyphony. No soul is trapped; no song is lost.'
        : endKey === 'silent_ash'
          ? 'For the first time in three centuries, the bells of Orrery fall silent—and every tired spirit passes freely into cool morning air.'
          : 'Honoring what broke, and letting what must pass go free—the morning wind carries a single clear bell across the cliffs.';

    this._startCutscene(
      [
        // Shot 1: Low-angle approach to the pulsing Heart of the First Kiln
        {
          duration: 3.6,
          fromPos: [hx + 7.5, 3.6, hz + 11.5],
          toPos: [hx + 3.2, 2.8, hz + 7.2],
          fromLook: [hx, 2.2, hz],
          toLook: [hx, 2.4, hz],
          kicker: ENDINGS[endKey].kicker,
          caption: 'Aurelius’s over-fired crown crumbles to warm white dust. Before you pulses the Heart of the First Kiln.',
          onStart: () => {
            this.sound.playBellToll(196, 3.4);
            this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 10, PALETTE.dawnSun, 1.3);
          },
        },
        // Shot 2: Ending-specific climax choreography!
        {
          duration: 4.8,
          fromPos: [hx + 3.2, 2.8, hz + 7.2],
          toPos: [hx - 9.5, 6.2, hz + 9.5],
          fromLook: [hx, 2.4, hz],
          toLook: [hx, 4.8, hz],
          kicker: ENDINGS[endKey].title,
          caption: shot2Caption,
          onStart: (dir) => {
            if (endKey === 'eternal_choir') {
              // Soaring heavenward Resonance Pillar + triumphant cathedral chord!
              this.sound.playBellToll(220, 4.2);
              setTimeout(() => this.sound.playBellToll(277.18, 4.0), 260);
              setTimeout(() => this.sound.playBellToll(329.63, 4.2), 520);
              setTimeout(() => this.sound.playBellToll(440, 4.5), 780);
              const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(1.1, 2.4, 52, 20, 1, true),
                new THREE.MeshBasicMaterial({
                  color: PALETTE.kintsugiBright,
                  transparent: true,
                  opacity: 0.78,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                })
              );
              pillar.position.set(hx, 26, hz);
              dir.addTempObject(pillar);
              beamMeshes.push(pillar);
              this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 22, PALETTE.aetherCyan, 1.6);
              this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 18, PALETTE.kintsugiBright, 1.3);
            } else if (endKey === 'silent_ash') {
              // Shattering the Kiln Heart -> cool silent blue-white sky & rising soul sparks
              this.sound.playShatter();
              this.sound.playNova();
              this.particles.spawnBurst(new THREE.Vector3(hx, 2.4, hz), PALETTE.dawnAlabaster, 45, 14, true);
              this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 22, PALETTE.saltWhite, 1.4);
              this.renderer.targetFogColor.setHex(0x1b2436);
              // Vesper's three soul sparks drift skyward
              for (let i = 0; i < 3; i++) {
                const orb = new THREE.Mesh(
                  new THREE.SphereGeometry(0.32, 10, 10),
                  new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
                );
                orb.position.set(hx + (i - 1) * 1.1, 1.6, hz + 5.2);
                dir.addTempObject(orb);
                spiritGroup.push(orb);
              }
            } else {
              // The Golden Seam -> warm golden rings + Cassian's spirit appears if mended!
              this.sound.playBellToll(246.94, 4.0);
              setTimeout(() => this.sound.playBellToll(329.63, 4.0), 450);
              this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 20, PALETTE.kintsugiGold, 1.5);
              this.particles.spawnBurst(new THREE.Vector3(hx, 2.2, hz), PALETTE.kintsugiBright, 30, 9);
              if (this.questState.cassianChoice === 'resonance') {
                const ghost = new THREE.Mesh(
                  new THREE.CylinderGeometry(0.45, 0.72, 2.4, 12),
                  new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright, transparent: true, opacity: 0.72 })
                );
                ghost.position.set(hx - 3.6, 1.2, hz + 3.2);
                dir.addTempObject(ghost);
              }
            }
          },
          onUpdate: (t, dt) => {
            for (const p of beamMeshes) {
              p.rotation.y += dt * 1.6;
              p.scale.x = 1 + Math.sin(t * 14) * 0.08;
              p.scale.z = 1 + Math.sin(t * 14) * 0.08;
            }
            for (const s of spiritGroup) {
              s.position.y += dt * 2.8;
            }
          },
        },
        // Shot 3: Sweeping Dawn Panorama Pullback above the Summit Belfry!
        {
          duration: 4.5,
          fromPos: [hx - 9.5, 6.2, hz + 9.5],
          toPos: [hx + 16, 22, hz + 24],
          fromLook: [hx, 4.8, hz],
          toLook: [hx, 2.5, hz - 4],
          kicker: 'EPILOGUE · KILNWARD',
          caption: shot3Caption,
          onStart: () => {
            this.sound.playBellToll(293.66, 4.5);
            this.particles.spawnRingWave(new THREE.Vector3(hx, 0, hz), 24, PALETTE.dawnSun, 1.8);
          },
          onUpdate: (_t, dt) => {
            for (const s of spiritGroup) s.position.y += dt * 3.2;
          },
        },
      ],
      () => {
        const q = this.questState;
        const alignLabel =
          q.resonance > q.cinder
            ? `Resonance (${q.resonance})`
            : q.cinder > q.resonance
              ? `Cinder (${q.cinder})`
              : `Balanced (${q.resonance}/${q.cinder})`;
        this.gameState = 'VICTORY';
        this.overlays.showVictory(ENDINGS[endKey], {
          elapsed: this.playtime,
          alignmentLabel: alignLabel,
          level: this.player.level,
          enemiesDefeated: this.metrics.enemiesDefeated,
          loreFound: this.discoveredLore.size,
          urnsBroken: this.metrics.urnsBroken,
          relicsCount: this.player.relics.length,
        });
      }
    );
  }

  _triggerCrystalSwitch() {
    if (this.world.activateCrystalSwitch()) {
      this.questState.westCrystalHit = true;
      this.sound.playBellToll(392.0, 2.0);
      const sw = this.world.crystalSwitch;
      this.particles.spawnRingWave(new THREE.Vector3(sw.x, 0, sw.z), 6.5, PALETTE.kintsugiBright, 0.7);
      this.renderer.addTrauma(0.35);
      this.hud.showToast('RUNE BARRIER LOWERED', 'Resonance Crystal Activated', 'The Verdigris Nave bridge is now open!', 4.2);
    }
  }

  _triggerCounterweightBell(cw) {
    if (!this.world.activateCounterweightBell(cw)) return;
    this.sound.playBellToll(329.63, 2.2);
    this.particles.spawnRingWave(new THREE.Vector3(cw.x, 0, cw.z), 6.5, PALETTE.kintsugiBright, 0.7);
    this.renderer.addTrauma(0.35);

    if (this.world.allCounterweightsActive() && !this.questState.viaductBridgeOpen) {
      this.questState.viaductBridgeOpen = true;
      this.world.setGateOpen('viaductBridgeGate', true);
      this.hud.updateQuest(this.questState);
      this.saveProgress();
      this.hud.showToast(
        'VIADUCT BRIDGE UNLOCKED',
        'Both Counterweight Bells Struck!',
        'Proceed north onto the Span to confront the Twin Arch-Censers.',
        5.0
      );
    } else {
      this.hud.showToast('COUNTERWEIGHT BELL STRUCK', '1 of 2 Bells Activated', 'Strike the opposite flanking bell across the viaduct!', 3.8);
    }
  }

  _ringBell(bellIt) {
    if (bellIt.rung) return;
    bellIt.rung = true;
    bellIt.bellMat.emissiveIntensity = 1.9;
    bellIt.light.intensity = 12;

    this.sound.playBellToll(bellIt.side === 'west' ? 246.94 : 293.66, 3.0);
    this.renderer.addTrauma(0.55);
    this.particles.spawnRingWave(new THREE.Vector3(bellIt.x, 0, bellIt.z), 10, bellIt.color, 0.9);
    this.particles.spawnBellSkyBeam(
      new THREE.Vector3(bellIt.x, 0, bellIt.z),
      new THREE.Vector3(bellIt.side === 'west' ? -2.2 : 2.2, 0, -14.2),
      bellIt.color
    );
    this.world.lightSanctumSigil(bellIt.side);

    if (bellIt.side === 'west') this.questState.westBell = true;
    if (bellIt.side === 'east') this.questState.eastBell = true;
    this.questState.talkedToOren = true;

    if (this.questState.westBell && this.questState.eastBell && !this.questState.sanctumOpened) {
      this.questState.sanctumOpened = true;
      this.world.setGateOpen('sanctumGate', true);
      setTimeout(() => this.sound.playBellToll(164.81, 3.2), 450);
      this.hud.showToast(
        'THE SANCTUM GATE UNSEALS',
        'Both Resonance Bells Answered!',
        'Return to the Bell-Crossroads and cross the North Bridge into the Crown Crucible.',
        5.5
      );
    } else {
      this.hud.showToast(
        'RESONANCE BELL RUNG',
        bellIt.side === 'west' ? 'West Bell Awakened' : 'East Bell Awakened',
        'A golden resonance beam arcs toward the Sanctum Gate. Seek the second bell!',
        4.6
      );
    }
    this.hud.updateQuest(this.questState);
    this.saveProgress();
  }

  _openChest(chestIt) {
    if (chestIt.opened || chestIt.locked) return;
    chestIt.opened = true;
    chestIt.lid.rotation.x = -0.85;
    chestIt.lid.position.y = 1.02;
    chestIt.lid.position.z = -0.35;
    chestIt.aura.visible = false;
    chestIt.light.intensity = 1.2;

    const data = chestIt.data;
    this.sound.playChime(true);
    this.particles.spawnRingWave(new THREE.Vector3(chestIt.x, 0, chestIt.z), 5.5, PALETTE.kintsugiBright, 0.7);
    this.particles.spawnBurst(new THREE.Vector3(chestIt.x, 1.1, chestIt.z), PALETTE.kintsugiGold, 16, 7);

    const spell = data.spellUnlock ? SPELLS[data.spellUnlock] : null;
    const relic = data.relicId ? RELICS[data.relicId] : null;
    if (spell) this.player.unlockedSpells[spell.id] = true;
    if (relic) this.player.addRelic(relic.id);
    this.player.gold += data.gold;
    this.saveProgress();

    if (spell && relic) {
      const keyLabel = spell.id === 'nova' ? 'Q' : spell.id === 'aegis' ? 'R' : 'C';
      this.hud.showToast(
        `RELIQUARY CLAIMED · +${data.gold} ✦`,
        `${spell.name} [${keyLabel}] & ${relic.name}`,
        `${spell.desc} (${relic.summary})`,
        5.6
      );
    } else if (relic) {
      this.hud.showToast(
        `RELIQUARY CLAIMED · +${data.gold} ✦`,
        relic.name,
        `${relic.summary} — ${relic.flavor}`,
        5.2
      );
    }
  }

  _updateProjectiles(dt) {
    const projs = this.particles.projectiles;
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i];
      const step = p.speed * dt;
      p.pos.addScaledVector(p.dir, step);
      p.traveled += step;
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.y += dt * 9;

      let hit = false;

      if (p.traveled >= p.maxDist || this.collision.hitsSolid(p.pos.x, p.pos.z, p.radius * 0.5)) {
        hit = true;
      }

      if (!hit && p.owner === 'player') {
        // Act I Crystal Switch
        const sw = this.world.crystalSwitch;
        if (sw && !sw.activated && Math.hypot(p.pos.x - sw.x, p.pos.z - sw.z) <= sw.radius + p.radius) {
          hit = true;
          this._triggerCrystalSwitch();
        }

        // Act II Counterweight Bells
        if (!hit) {
          for (const cw of this.world.counterweightBells) {
            if (!cw.activated && Math.hypot(p.pos.x - cw.x, p.pos.z - cw.z) <= cw.radius + p.radius) {
              hit = true;
              this._triggerCounterweightBell(cw);
              break;
            }
          }
        }

        // Enemies
        if (!hit) {
          for (const e of this.enemies) {
            if (!e.alive) continue;
            if (Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z) <= e.radius + p.radius) {
              hit = true;
              this._damageEnemy(e, p.damage, p.pos, 4.5, false);
              this.sound.playHit(false);
              break;
            }
          }
        }

        // Active Boss targets
        const activeBoss = this._getActiveBoss();
        if (!hit && activeBoss) {
          const targets = activeBoss.getHitTargets ? activeBoss.getHitTargets() : [activeBoss];
          for (const t of targets) {
            if (Math.hypot(p.pos.x - t.pos.x, p.pos.z - t.pos.z) <= t.radius + p.radius) {
              hit = true;
              this._damageActiveBoss(activeBoss, t, p.damage, false);
              this.sound.playHit(false);
              break;
            }
          }
        }

        // Urns
        if (!hit) {
          for (const u of this.interactables.urns) {
            if (!u.alive) continue;
            if (Math.hypot(p.pos.x - u.x, p.pos.z - u.z) <= u.radius + p.radius) {
              hit = true;
              if (this.interactables.breakUrn(u, this.particles, this.sound)) {
                this.metrics.urnsBroken += 1;
              }
              break;
            }
          }
        }
      } else if (!hit && p.owner === 'enemy') {
        if (
          this.player.alive &&
          Math.hypot(p.pos.x - this.player.pos.x, p.pos.z - this.player.pos.z) <= this.player.radius + p.radius
        ) {
          hit = true;
          this._onPlayerHit(p.damage, p.pos);
        }
      }

      if (hit) {
        this.particles.spawnBurst(p.pos, p.color, 7, 5.5);
        this.renderer.scene.remove(p.mesh);
        projs.splice(i, 1);
      }
    }
  }

  _updateZoneAtmosphere() {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;
    for (const z of WORLD_LAYOUT.zones) {
      if (px >= z.minX && px <= z.maxX && pz >= z.minZ && pz <= z.maxZ) {
        if (this.currentZoneId !== z.id) {
          this.currentZoneId = z.id;
          const atmo = ZONE_ATMOSPHERE[z.id];
          this.renderer.setZoneAtmosphere(z.id);
          this.sound.setZoneDrone(atmo.droneFreq);
          this.hud.showZoneBanner(atmo.name, atmo.subtitle);
          this.minimap.setZoneLabel(atmo.name);
          // Shift drifting particle ash color per act biome!
          if (z.id === 'salt_viaduct') this.particles.setAshColor(PALETTE.saltWhite);
          else if (z.id === 'cobalt_cisterns') this.particles.setAshColor(PALETTE.aetherCyan);
          else if (z.id === 'dawn_belfry') this.particles.setAshColor(PALETTE.dawnSun);
          else this.particles.setAshColor(PALETTE.kintsugiBright);
        }
        break;
      }
    }
  }

  _updateTriggers(dt) {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;

    this._updateZoneAtmosphere();

    // Act I East Ossuary Gauntlet
    const g = WORLD_LAYOUT.eastGauntlet;
    if (
      !this.questState.eastGauntletStarted &&
      !this.questState.eastGauntletCleared &&
      px > g.triggerX &&
      pz >= g.triggerMinZ &&
      pz <= g.triggerMaxZ
    ) {
      this.questState.eastGauntletStarted = true;
      this.questState.eastGauntletWave = 1;
      this.world.setGateOpen('eastSeal', false);
      this._spawnGauntletWave(0);
      this.sound.playBossHorn();
      this.hud.showToast('OSSUARY WARD SEALED', 'Crucible Ambush — Wave 1 of 2', 'Defeat the kiln guardians and watch the floor ember vents!', 4.2);
    }

    if (this.questState.eastGauntletStarted && !this.questState.eastGauntletCleared) {
      this.ventTimer -= dt;
      if (this.ventTimer <= 0 && !this.ventPending) {
        const vent = g.emberVents[Math.floor(Math.random() * g.emberVents.length)];
        this.ventPending = { x: vent.x, z: vent.z, timer: 1.05 };
        this.particles.spawnTelegraphCircle(vent.x, vent.z, 3.2, 1.05, PALETTE.kilnAmber);
      }
      if (this.ventPending) {
        this.ventPending.timer -= dt;
        if (this.ventPending.timer <= 0) {
          const vp = this.ventPending;
          this.ventPending = null;
          this.ventTimer = 3.4;
          this.particles.spawnRingWave(new THREE.Vector3(vp.x, 0, vp.z), 3.4, PALETTE.moltenGold, 0.45);
          this.particles.spawnBurst(new THREE.Vector3(vp.x, 0.5, vp.z), PALETTE.kilnAmber, 12, 7);
          this.sound.playNova();
          if (Math.hypot(px - vp.x, pz - vp.z) <= 3.2) {
            this._onPlayerHit(18, vp);
          }
        }
      }

      const remaining = this.enemies.filter((e) => e.alive && e.gauntletWave).length;
      if (remaining === 0) {
        if (this.questState.eastGauntletWave === 1) {
          this.questState.eastGauntletWave = 2;
          this._spawnGauntletWave(1);
          this.sound.playBossHorn();
          this.hud.showToast('CRUCIBLE AMBUSH', 'Wave 2 of 2', 'A Reliquary Sentinel enters the chamber!', 3.8);
        } else {
          this.questState.eastGauntletCleared = true;
          this.world.setGateOpen('eastSeal', true);
          this.interactables.unlockGauntletChest();
          this.sound.playChime(true);
          this.hud.showToast('OSSUARY CLEARED', 'Reliquary & East Bell Unsealed!', 'Claim the Reliquary chest to the north and ring the East Resonance Bell.', 5.0);
        }
      }
    }

    // Act I Boss Trigger
    if (!this.boss.active && this.boss.alive && pz < WORLD_LAYOUT.boss.triggerZ && pz > -73) {
      this.world.setGateOpen('bossMist', false);
      this.boss.awaken(this.sound, this.particles);
      this.renderer.addTrauma(0.5);
      this.hud.showZoneBanner('SAINT CASSIAN', 'THE FRACTURED KILN');
    }

    // Act II Boss Trigger
    if (!this.act2Boss.active && this.act2Boss.alive && pz < WORLD_LAYOUT.act2Boss.triggerZ && pz > -152) {
      this.world.setGateOpen('act2BossMist', false);
      this.act2Boss.awaken(this.sound, this.particles);
      this.renderer.addTrauma(0.5);
      this.hud.showZoneBanner('VAEL & SOREN', 'THE TWIN ARCH-CENSERS');
    }

    // Act III Boss Trigger
    if (!this.act3Boss.active && this.act3Boss.alive && pz < WORLD_LAYOUT.act3Boss.triggerZ && pz > -230) {
      this.world.setGateOpen('act3BossMist', false);
      this.act3Boss.awaken(this.sound, this.particles);
      this.renderer.addTrauma(0.55);
      this.hud.showZoneBanner('ARCHIVIST PELAGIUS', 'THE KILN-ORRERY');
    }

    // Act IV Final Boss Trigger (plays Summit Confrontation Cutscene first!)
    if (!this.act4Boss.active && this.act4Boss.alive && pz < WORLD_LAYOUT.act4Boss.triggerZ) {
      if (!this.questState.aureliusIntroPlayed) {
        this.questState.aureliusIntroPlayed = true;
        this.playAureliusSummitCutscene();
      } else {
        this.world.setGateOpen('act4BossMist', false);
        this.act4Boss.awaken(this.sound, this.particles);
        this.renderer.addTrauma(0.65);
        this.hud.showZoneBanner('ARCH-PRELATE AURELIUS', 'THE UNCOOLED');
      }
    }
  }

  _spawnGauntletWave(waveIdx) {
    const wave = WORLD_LAYOUT.eastGauntlet.waves[waveIdx];
    for (const s of wave) {
      this.particles.spawnRingWave(new THREE.Vector3(s.x, 0, s.z), 2.5, PALETTE.kilnAmber, 0.55);
      this.enemies.push(
        new Enemy(this.renderer.scene, this.textures, s.type, s.x, s.z, {
          zone: 'east_ossuary',
          gauntletWave: true,
        })
      );
    }
  }

  _onLootCollected(l) {
    if (l.kind === 'gold') {
      this.player.gold += l.value;
      this.sound.playChime(false);
      this.hud.spawnFloatingText(new THREE.Vector3(this.player.pos.x, 2.1, this.player.pos.z), `+${l.value} ✦`, 'gold', this.renderer);
    } else if (l.kind === 'heal') {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + l.value);
      this.hud.spawnFloatingText(new THREE.Vector3(this.player.pos.x, 2.2, this.player.pos.z), `+${l.value} HP`, 'heal', this.renderer);
    } else if (l.kind === 'xp') {
      const leveled = this.player.gainXp(l.value);
      this.hud.spawnFloatingText(new THREE.Vector3(this.player.pos.x, 2.0, this.player.pos.z), `+${l.value} XP`, 'xp', this.renderer);
      if (leveled) {
        this.sound.playBellToll(329.63, 2.2);
        this.particles.spawnRingWave(this.player.pos, 5.2, PALETTE.kintsugiBright, 0.75);
        this.hud.showToast('RESONANCE ASCENDED', `Level ${this.player.level} Reached!`, 'Vitality & Aether restored. Attack & Max HP increased.', 3.8);
      }
    }
  }

  _loop(now) {
    const rawDt = Math.min(0.05, (now - this._lastTime) / 1000);
    this._lastTime = now;
    this.elapsed += rawDt;

    if (this.gameState === 'PLAYING') {
      this.playtime += rawDt;

      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= rawDt;
      } else {
        const dt = rawDt;
        const moveVec = this._getMoveVector();

        if (this.mouseDownLeft && this.player.attackCooldown <= 0) {
          this._performMelee(true);
        }

        this.player.update(dt, this.elapsed, moveVec, this.collision, this.particles);

        for (const e of this.enemies) {
          if (!e.alive) continue;
          // Skip distant off-act enemies for crisp performance
          if (Math.abs(e.pos.z - this.player.pos.z) > 65) continue;
          e.update(
            dt,
            this.elapsed,
            this.player,
            this.collision,
            this.particles,
            this.sound,
            this.renderer.camera,
            (dmg, src) => this._onPlayerHit(dmg, src)
          );
        }

        for (const b of this.allBosses) {
          b.update(
            dt,
            this.elapsed,
            this.player,
            this.collision,
            this.particles,
            this.sound,
            (dmg, src) => this._onPlayerHit(dmg, src),
            (t) => this.renderer.addTrauma(t)
          );
        }

        this._updateProjectiles(dt);
        if (this.roguelike.active) {
          this.roguelike.update(dt);
        } else {
          this._updateTriggers(dt);
        }

        this.interactables.update(dt, this.elapsed, this.player, (l) => this._onLootCollected(l));
        if (this.roguelike.active) {
          this.nearestInteractable = null;
          this.hud.updateInteractPrompt(null, null);
        } else {
          this.nearestInteractable = this.interactables.findNearestInteractable(
            this.player.pos,
            this.questState.mirrorPuzzleSolved
          );
          const gateHint = this.nearestInteractable ? null : this.world.findNearbyLockedGateHint(this.player.pos);
          this.hud.updateInteractPrompt(this.nearestInteractable, gateHint);
        }

        this.world.update(dt, this.elapsed);
        this.particles.update(dt, this.elapsed, this.player.pos);
        this.renderer.updateCamera(this.player.pos, dt, this.elapsed);

        this.hud.update(dt, this.player, this.renderer);
        this.hud.updateBossBar(this._getActiveBoss());
        this.minimap.render(this.player, this.enemies, this.allBosses, this.world, this.interactables);
      }
    } else if (this.gameState === 'CUTSCENE') {
      this.cutscenes.update(rawDt);
      this.world.update(rawDt, this.elapsed);
      this.particles.update(rawDt, this.elapsed, this.player.pos);
      this.renderer.updateCamera(this.player.pos, rawDt, this.elapsed);
    } else {
      this.world.update(rawDt, this.elapsed);
      this.particles.update(rawDt, this.elapsed, this.player.pos);
      this.renderer.updateCamera(this.player.pos, rawDt, this.elapsed);
    }

    this.renderer.render();
    requestAnimationFrame((t) => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__KILNWARD__ = new KilnwardGame();
});
