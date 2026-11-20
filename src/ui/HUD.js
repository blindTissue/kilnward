import { SPELLS, WEAPONS } from '../config/gameData.js';

/**
 * KILNWARD — HUD Controller (Full 4-Act Campaign)
 */
export class HUD {
  constructor() {
    this.root = document.getElementById('hud');
    this.floatingLayer = document.getElementById('floating-layer');
    this.screenFlash = document.getElementById('screen-flash');

    this.hpFill = document.getElementById('hp-orb-fill');
    this.hpText = document.getElementById('hp-orb-text');
    this.mpFill = document.getElementById('mp-orb-fill');
    this.mpText = document.getElementById('mp-orb-text');

    this.xpFill = document.getElementById('xp-bar-fill');
    this.xpText = document.getElementById('xp-bar-text');
    this.goldEl = document.getElementById('hud-gold');
    this.levelEl = document.getElementById('hud-level');
    this.relicCountEl = document.getElementById('hud-relic-count');
    this.alignTextEl = document.getElementById('hud-align-text');
    this.flaskCountEl = document.getElementById('flask-count');

    this.weaponGlyphEl = document.getElementById('weapon-glyph');
    this.weaponNameEl = document.getElementById('weapon-name');

    this.questActEl = document.getElementById('quest-act-eyebrow');
    this.questTitleEl = document.getElementById('quest-title');
    this.questObjEl = document.getElementById('quest-objective');
    this.bellsTracker = document.getElementById('bells-tracker');
    this.westBellPip = document.getElementById('bell-west-pip');
    this.eastBellPip = document.getElementById('bell-east-pip');

    this.interactPrompt = document.getElementById('interact-prompt');
    this.interactKeyBadge = document.getElementById('interact-key-badge');
    this.interactLabel = document.getElementById('interact-label');

    this.zoneBanner = document.getElementById('zone-banner');
    this.zoneSub = document.getElementById('zone-banner-sub');
    this.zoneTitle = document.getElementById('zone-banner-title');
    this.zoneBannerTimer = 0;

    this.toastBanner = document.getElementById('toast-banner');
    this.toastKicker = document.getElementById('toast-kicker');
    this.toastTitle = document.getElementById('toast-title');
    this.toastDesc = document.getElementById('toast-desc');
    this.toastTimer = 0;

    this.bossWrap = document.getElementById('boss-bar-wrap');
    this.bossName = document.getElementById('boss-name');
    this.bossPhase = document.getElementById('boss-phase');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossHpTrail = document.getElementById('boss-hp-trail');

    this.slots = {
      bolt: document.getElementById('slot-bolt'),
      nova: document.getElementById('slot-nova'),
      aegis: document.getElementById('slot-aegis'),
      tether: document.getElementById('slot-tether'),
      dash: document.getElementById('slot-dash'),
      flask: document.getElementById('slot-flask'),
    };

    this.floatingNums = [];
  }

  setVisible(visible) {
    this.root.classList.toggle('hidden', !visible);
  }

  flashScreen(colorCss = 'rgba(220, 48, 56, 0.34)') {
    this.screenFlash.style.background = `radial-gradient(circle, transparent 42%, ${colorCss} 100%)`;
    this.screenFlash.style.opacity = '1';
    clearTimeout(this._flashTimeout);
    this._flashTimeout = setTimeout(() => {
      this.screenFlash.style.opacity = '0';
    }, 120);
  }

  showZoneBanner(title, subtitle) {
    this.zoneTitle.textContent = title;
    this.zoneSub.textContent = subtitle;
    this.zoneBanner.classList.remove('hidden');
    this.zoneBannerTimer = 3.2;
  }

  showToast(kicker, title, desc, duration = 4.4) {
    this.toastKicker.textContent = kicker;
    this.toastTitle.textContent = title;
    this.toastDesc.textContent = desc;
    this.toastBanner.classList.remove('hidden');
    this.toastTimer = duration;
  }

  spawnFloatingText(worldPos, text, kind = 'normal', renderer) {
    const el = document.createElement('div');
    el.className = `float-num ${kind}`;
    el.textContent = text;
    this.floatingLayer.appendChild(el);

    const item = {
      el,
      worldPos: worldPos.clone(),
      age: 0,
      life: kind === 'crit' ? 1.05 : 0.85,
      offsetX: (Math.random() - 0.5) * 28,
    };
    this.floatingNums.push(item);

    if (renderer) {
      const p = renderer.projectToScreen(item.worldPos);
      el.style.left = `${p.x + item.offsetX}px`;
      el.style.top = `${p.y}px`;
    }
  }

  updateQuest(q) {
    this.westBellPip.classList.toggle('lit', !!q.westBell);
    this.eastBellPip.classList.toggle('lit', !!q.eastBell);
    this.bellsTracker.classList.toggle('hidden', !!q.act2Unlocked);

    if (this.alignTextEl) {
      const res = q.resonance || 0;
      const cin = q.cinder || 0;
      if (res === 0 && cin === 0) {
        this.alignTextEl.textContent = '◈ Unbound';
        this.alignTextEl.style.color = '#b6aa94';
      } else if (res > cin) {
        this.alignTextEl.textContent = `◈ Resonance (${res})`;
        this.alignTextEl.style.color = '#52e0cf';
      } else if (cin > res) {
        this.alignTextEl.textContent = `✹ Cinder (${cin})`;
        this.alignTextEl.style.color = '#ff7052';
      } else {
        this.alignTextEl.textContent = `✦ Balanced (${res}/${cin})`;
        this.alignTextEl.style.color = '#ffe08a';
      }
    }

    if (q.campaignCompleted) {
      this.questActEl.textContent = 'CAMPAIGN COMPLETE · ORRERY MENDED';
      this.questTitleEl.textContent = 'Pilgrimage Fulfilled';
      this.questObjEl.textContent = 'Explore Orrery, recover remaining steles, or begin a new pilgrimage.';
    } else if (q.act4BossDefeated) {
      this.questActEl.textContent = 'ACT IV · THE BELFRY OF UNFIRED ASH';
      this.questTitleEl.textContent = 'Decide the Fate of the First Kiln';
      this.questObjEl.textContent = 'Approach the Heart of the First Kiln [F] at the center of the belfry.';
    } else if (q.act3BossDefeated) {
      this.questActEl.textContent = 'ACT IV · THE BELFRY OF UNFIRED ASH';
      this.questTitleEl.textContent = 'Confront Arch-Prelate Aurelius';
      this.questObjEl.textContent = 'Cross the sunlit Dawn Processional north into the Summit Belfry.';
    } else if (q.mirrorPuzzleSolved) {
      this.questActEl.textContent = 'ACT III · THE COBALT CISTERNS';
      this.questTitleEl.textContent = 'Enter the Orrery Rotunda';
      this.questObjEl.textContent = 'The Library Gate is open—defeat Archivist Pelagius to reach the dawn summit.';
    } else if (q.act2BossDefeated) {
      this.questActEl.textContent = 'ACT III · THE COBALT CISTERNS';
      this.questTitleEl.textContent = 'Align the Mosaic Mirrors';
      this.questObjEl.textContent = 'Claim the Bell-Hammer [V] and rotate the 3 Bronze Mirrors [F] to guide the golden sun-beam.';
    } else if (q.viaductBridgeOpen) {
      this.questActEl.textContent = 'ACT II · THE SALT VIADUCT';
      this.questTitleEl.textContent = 'Face the Twin Arch-Censers';
      this.questObjEl.textContent = 'Cross north onto the Viaduct Span and defeat Vael & Soren.';
    } else if (q.act2Unlocked) {
      this.questActEl.textContent = 'ACT II · THE SALT VIADUCT';
      this.questTitleEl.textContent = 'Cross the Salt Viaduct';
      this.questObjEl.textContent = 'Speak with Sister Maren, claim Verdigris Tether [C], and strike both flanking Counterweight Bells.';
    } else if (q.bossDefeated) {
      this.questActEl.textContent = 'ACT I · THE SUNKEN KILN';
      this.questTitleEl.textContent = 'Quiet the Crucible';
      this.questObjEl.textContent = 'Commune with the Mended Echo of Saint Cassian [F] to unseal Act II.';
    } else if (q.westBell && q.eastBell) {
      this.questActEl.textContent = 'ACT I · THE SUNKEN KILN';
      this.questTitleEl.textContent = 'The Sanctum Gate Stands Open';
      this.questObjEl.textContent = 'Cross the North Bridge from the Crossroads into the Crown Crucible.';
    } else if (q.talkedToOren) {
      const remaining = [];
      if (!q.westBell) remaining.push('West (Verdigris Nave)');
      if (!q.eastBell) remaining.push('East (Glaze Ossuary)');
      this.questActEl.textContent = 'ACT I · THE SUNKEN KILN';
      this.questTitleEl.textContent = 'Sound the Twin Resonance Bells';
      this.questObjEl.textContent = `Ring the bell in ${remaining.join(' and ')}.`;
    } else {
      this.questActEl.textContent = 'ACT I · THE SUNKEN KILN';
      this.questTitleEl.textContent = 'Awaken at the Cloister';
      this.questObjEl.textContent = 'Speak with Brother Oren [F] beside the brazier, or head north.';
    }
  }

  updateRoguelikeHeader({ floor, arenaName, mutator, remaining, wavesLeft, boonsCount, hasUndying }) {
    this.bellsTracker.classList.add('hidden');
    this.questActEl.textContent = `ENDLESS KILN · FLOOR ${floor}`;
    this.questTitleEl.textContent = arenaName;
    const waveStr = wavesLeft > 0 ? ` (+${wavesLeft} wave)` : '';
    this.questObjEl.textContent = `${mutator.name} · ${remaining} Foes Remaining${waveStr}`;
    if (this.alignTextEl) {
      this.alignTextEl.textContent = hasUndying
        ? `☥ ${boonsCount} Boons · Undying`
        : `🔥 ${boonsCount} Boons`;
      this.alignTextEl.style.color = hasUndying ? '#ffe08a' : '#ff9a6c';
    }
  }

  updateInteractPrompt(interactable, lockedGateHint = null) {
    if (interactable) {
      this.interactKeyBadge.textContent = 'F';
      this.interactLabel.textContent = interactable.label;
      this.interactPrompt.classList.remove('hidden');
    } else if (lockedGateHint) {
      this.interactKeyBadge.textContent = '🔒';
      this.interactLabel.textContent = lockedGateHint;
      this.interactPrompt.classList.remove('hidden');
    } else {
      this.interactPrompt.classList.add('hidden');
    }
  }

  updateBossBar(activeBoss) {
    if (!activeBoss || !activeBoss.active || !activeBoss.alive) {
      this.bossWrap.classList.add('hidden');
      return;
    }
    this.bossWrap.classList.remove('hidden');
    this.bossName.textContent = activeBoss.name;
    this.bossPhase.textContent =
      activeBoss.phaseLabel ||
      (activeBoss.phase === 2 ? 'PHASE II · THE GLAZE SHATTERS' : 'PHASE I · UNBROKEN GLAZE');
    const pct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    this.bossHpFill.style.width = `${pct}%`;
    this.bossHpTrail.style.width = `${pct}%`;
  }

  update(dt, player, renderer) {
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.stats.maxHp) * 100));
    const mpPct = Math.max(0, Math.min(100, (player.mp / player.stats.maxMp) * 100));
    this.hpFill.style.height = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.stats.maxHp)}`;
    this.mpFill.style.height = `${mpPct}%`;
    this.mpText.textContent = `${Math.floor(player.mp)} / ${Math.round(player.stats.maxMp)}`;

    const nextXp = player.getNextXp();
    const xpPct = Math.min(100, (player.xp / nextXp) * 100);
    this.xpFill.style.width = `${xpPct}%`;
    this.xpText.textContent = `Lv ${player.level} · ${player.xp} / ${nextXp} XP`;
    this.goldEl.textContent = String(player.gold);
    this.levelEl.textContent = String(player.level);
    this.relicCountEl.textContent = String(player.relics.length);
    this.flaskCountEl.textContent = String(player.flasks);

    const wDef = WEAPONS[player.weaponId] || WEAPONS.claymore;
    this.weaponGlyphEl.textContent = wDef.glyph;
    const shortNames = { claymore: 'Claymore', hammer: 'Hammer', daggers: 'Daggers', glaive: 'Glaive' };
    this.weaponNameEl.textContent = shortNames[player.weaponId] || 'Claymore';

    this.slots.nova.classList.toggle('locked', !player.unlockedSpells.nova);
    this.slots.aegis.classList.toggle('locked', !player.unlockedSpells.aegis);
    this.slots.tether.classList.toggle('locked', !player.unlockedSpells.tether);
    this.slots.aegis.classList.toggle('active', player.aegisTimer > 0);

    this._setSlotCd(this.slots.bolt, player.cooldowns.bolt, SPELLS.bolt.cooldown);
    this._setSlotCd(this.slots.nova, player.cooldowns.nova, SPELLS.nova.cooldown);
    this._setSlotCd(this.slots.aegis, player.cooldowns.aegis, SPELLS.aegis.cooldown);
    this._setSlotCd(this.slots.tether, player.cooldowns.tether, SPELLS.tether.cooldown);
    this._setSlotCd(this.slots.dash, player.dashCooldown, player.stats.dashCooldown);
    this._setSlotCd(this.slots.flask, player.cooldowns.flask, 1.4);

    if (this.zoneBannerTimer > 0) {
      this.zoneBannerTimer -= dt;
      if (this.zoneBannerTimer <= 0) this.zoneBanner.classList.add('hidden');
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastBanner.classList.add('hidden');
    }

    for (let i = this.floatingNums.length - 1; i >= 0; i--) {
      const f = this.floatingNums[i];
      f.age += dt;
      f.worldPos.y += dt * 1.45;
      const p = renderer.projectToScreen(f.worldPos);
      if (p.visible) {
        f.el.style.left = `${p.x + f.offsetX}px`;
        f.el.style.top = `${p.y}px`;
        f.el.style.opacity = String(Math.max(0, 1 - Math.pow(f.age / f.life, 2)));
      }
      if (f.age >= f.life) {
        f.el.remove();
        this.floatingNums.splice(i, 1);
      }
    }
  }

  _setSlotCd(slotEl, rem, max) {
    const ov = slotEl.querySelector('.skill-cd-overlay');
    if (!ov) return;
    const pct = rem > 0 ? Math.min(100, (rem / max) * 100) : 0;
    ov.style.height = `${pct}%`;
  }
}
