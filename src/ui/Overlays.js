import { FORGE_UPGRADES, LORE_ENTRIES, RELICS, SPELLS, WEAPONS } from '../config/gameData.js';
import { WORLD_LAYOUT } from '../config/worldLayout.js';
import { META_UPGRADES, ROGUELIKE_BOONS, ROGUELIKE_WEAPONS } from '../config/roguelikeData.js';

/**
 * KILNWARD — Modal & Overlay Controller (Full 4-Act Campaign)
 */
export class Overlays {
  constructor(callbacks) {
    this.cb = callbacks;

    this.titleEl = document.getElementById('overlay-title');
    this.dialogueEl = document.getElementById('overlay-dialogue');
    this.forgeEl = document.getElementById('overlay-forge');
    this.codexEl = document.getElementById('overlay-codex');
    this.pauseEl = document.getElementById('overlay-pause');
    this.deathEl = document.getElementById('overlay-death');
    this.victoryEl = document.getElementById('overlay-victory');

    // Roguelike Modals
    this.rlLobbyEl = document.getElementById('overlay-rl-lobby');
    this.rlBoonsEl = document.getElementById('overlay-rl-boons');
    this.rlPortalEl = document.getElementById('overlay-rl-portal');
    this.rlShopEl = document.getElementById('overlay-rl-shop');
    this.rlSummaryEl = document.getElementById('overlay-rl-summary');
    this.selectedRlWeapon = 'claymore';

    this.continueBtn = document.getElementById('btn-continue-save');

    this.dlgKicker = document.getElementById('dlg-kicker');
    this.dlgSpeaker = document.getElementById('dlg-speaker');
    this.dlgBody = document.getElementById('dlg-body');
    this.dlgChoices = document.getElementById('dlg-choices');

    this.forgeGold = document.getElementById('forge-gold');
    this.forgeList = document.getElementById('forge-list');
    this.forgeTravelWrap = document.getElementById('forge-travel-wrap');
    this.forgeTravelList = document.getElementById('forge-travel-list');

    this.codexRelics = document.getElementById('codex-relics');
    this.codexLore = document.getElementById('codex-lore');
    this.codexLoreCount = document.getElementById('codex-lore-count');

    this.victoryKicker = document.getElementById('victory-kicker');
    this.victoryTitle = document.getElementById('victory-title');
    this.victoryEpilogue = document.getElementById('victory-epilogue');
    this.victoryStats = document.getElementById('victory-stats');

    this._bindButtons();
  }

  _bindButtons() {
    document.getElementById('btn-start-game').addEventListener('click', () => this.cb.onStart(1));
    document.getElementById('btn-open-roguelike').addEventListener('click', () => this.cb.onOpenRoguelikeLobby());
    document.getElementById('btn-rl-back').addEventListener('click', () => this.cb.onBackToTitle());
    document.getElementById('btn-rl-launch').addEventListener('click', () => this.cb.onStartRoguelike(this.selectedRlWeapon));
    document.getElementById('btn-rl-reroll').addEventListener('click', () => this.cb.onRerollBoons());
    document.getElementById('btn-rl-leave-shop').addEventListener('click', () => this.cb.onLeaveShop());
    document.getElementById('btn-rl-lobby-return').addEventListener('click', () => this.cb.onOpenRoguelikeLobby());
    document.getElementById('btn-rl-quick-retry').addEventListener('click', () => this.cb.onStartRoguelike(this.selectedRlWeapon));
    this.continueBtn.addEventListener('click', () => this.cb.onContinueSave());
    document.querySelectorAll('.chapter-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.cb.onStart(Number(btn.dataset.act)));
    });
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.cb.onSetDifficulty) this.cb.onSetDifficulty(btn.dataset.diff);
      });
    });

    document.getElementById('btn-close-forge').addEventListener('click', () => this.cb.onCloseModal());
    document.getElementById('btn-close-codex').addEventListener('click', () => this.cb.onCloseModal());
    document.getElementById('btn-resume').addEventListener('click', () => this.cb.onCloseModal());
    document.getElementById('btn-restart-pause').addEventListener('click', () => this.cb.onRestart());
    document.getElementById('btn-respawn').addEventListener('click', () => this.cb.onRespawn());
    document.getElementById('btn-continue-explore').addEventListener('click', () => this.cb.onCloseModal());
    document.getElementById('btn-play-again').addEventListener('click', () => this.cb.onRestart(true));

    document.getElementById('btn-codex').addEventListener('click', () => this.cb.onToggleCodex());
    document.getElementById('btn-pause').addEventListener('click', () => this.cb.onTogglePause());
    const muteBtn = document.getElementById('btn-mute');
    muteBtn.addEventListener('click', () => {
      const muted = this.cb.onToggleMute();
      muteBtn.textContent = muted ? '✕ Muted' : '♪ Sound';
    });
  }

  hideAll() {
    [
      this.titleEl,
      this.dialogueEl,
      this.forgeEl,
      this.codexEl,
      this.pauseEl,
      this.deathEl,
      this.victoryEl,
      this.rlLobbyEl,
      this.rlBoonsEl,
      this.rlPortalEl,
      this.rlShopEl,
      this.rlSummaryEl,
    ].forEach((el) => el && el.classList.add('hidden'));
  }

  // ============================================================
  // ROGUELIKE MODE MODALS (THE ENDLESS KILN)
  // ============================================================
  showRoguelikeLobby(meta) {
    this.hideAll();
    document.getElementById('rl-embers').textContent = String(meta.embers);
    document.getElementById('rl-best-floor').textContent = String(meta.bestFloor);
    document.getElementById('rl-total-runs').textContent = String(meta.totalRuns);

    const wGrid = document.getElementById('rl-weapon-grid');
    wGrid.innerHTML = '';
    for (const w of Object.values(ROGUELIKE_WEAPONS)) {
      const card = document.createElement('div');
      card.className = `rl-weapon-card${this.selectedRlWeapon === w.id ? ' selected' : ''}`;
      card.innerHTML = `
        <div class="rl-weapon-head">
          <h4>${w.glyph} ${w.name}</h4>
          <span class="rl-weapon-tag">${w.tag}</span>
        </div>
        <p>${w.desc}</p>
      `;
      card.addEventListener('click', () => {
        this.selectedRlWeapon = w.id;
        this.showRoguelikeLobby(meta);
      });
      wGrid.appendChild(card);
    }

    const mGrid = document.getElementById('rl-meta-grid');
    mGrid.innerHTML = '';
    for (const u of META_UPGRADES) {
      const rank = meta.ranks[u.id] || 0;
      const maxed = rank >= u.maxRank;
      const cost = maxed ? 0 : u.costs[rank];
      const canBuy = !maxed && meta.embers >= cost;
      const row = document.createElement('div');
      row.className = 'forge-item';
      row.innerHTML = `
        <div class="forge-item-info">
          <h4>${u.name} <span style="color:var(--gold);font-size:11px;">(${rank}/${u.maxRank})</span></h4>
          <p>${u.desc}</p>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = 'forge-buy-btn';
      btn.textContent = maxed ? 'MAX' : `${cost} 🔥`;
      btn.disabled = !canBuy;
      btn.addEventListener('click', () => {
        if (this.cb.onBuyMetaUpgrade(u.id)) {
          this.showRoguelikeLobby(meta);
        }
      });
      row.appendChild(btn);
      mGrid.appendChild(row);
    }

    this.rlLobbyEl.classList.remove('hidden');
  }

  showBoonDraft(floor, choices, rerollsLeft, highRarity) {
    this.hideAll();
    document.getElementById('rl-boon-kicker').textContent = highRarity
      ? `FLOOR ${floor} CLEARED · ENHANCED RARE/LEGENDARY BOON`
      : `FLOOR ${floor} CLEARED · CLAIM A KINTSUGI BOON`;
    document.getElementById('rl-reroll-count').textContent = String(rerollsLeft);
    const rerollBtn = document.getElementById('btn-rl-reroll');
    rerollBtn.disabled = rerollsLeft <= 0;
    rerollBtn.style.opacity = rerollsLeft <= 0 ? '0.45' : '1';

    const wrap = document.getElementById('rl-boon-cards');
    wrap.innerHTML = '';
    for (const b of choices) {
      const card = document.createElement('div');
      card.className = `boon-card rarity-${b.rarity}`;
      card.innerHTML = `
        <div>
          <div class="boon-glyph">${b.glyph}</div>
          <div class="boon-rarity">${b.rarity}</div>
          <h4>${b.name}</h4>
          <p>${b.desc}</p>
        </div>
        <div class="boon-pick-tag">◈ CLAIM BOON</div>
      `;
      card.addEventListener('click', () => this.cb.onPickBoon(b.id));
      wrap.appendChild(card);
    }
    this.rlBoonsEl.classList.remove('hidden');
  }

  showRoomPortal(nextFloor, options) {
    this.hideAll();
    document.getElementById('rl-portal-kicker').textContent = `NEXT DESTINATION · FLOOR ${nextFloor}`;
    const wrap = document.getElementById('rl-portal-cards');
    wrap.innerHTML = '';
    for (const opt of options) {
      const card = document.createElement('div');
      card.className = 'portal-card';
      card.innerHTML = `
        <div class="panel-eyebrow">${opt.kicker}</div>
        <h4>${opt.title}</h4>
        <p>${opt.desc}</p>
      `;
      card.addEventListener('click', () => this.cb.onPickNextRoom(opt.roomType));
      wrap.appendChild(card);
    }
    this.rlPortalEl.classList.remove('hidden');
  }

  showPeddlerShop(player, shopBoons, allWeapons) {
    this.hideAll();
    document.getElementById('rl-shop-gold').textContent = String(player.gold);
    const list = document.getElementById('rl-shop-list');
    list.innerHTML = '';

    // 1. Extra Boons for sale
    for (const b of shopBoons) {
      const row = document.createElement('div');
      row.className = 'forge-item';
      row.innerHTML = `
        <div class="forge-item-info">
          <h4>${b.glyph} ${b.name} <span style="color:var(--verdigris);font-size:11px;text-transform:uppercase;">[${b.rarity}]</span></h4>
          <p>${b.desc}</p>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = 'forge-buy-btn';
      btn.textContent = b._bought ? 'CLAIMED' : `Buy · ${b.cost} ✦`;
      btn.disabled = b._bought || player.gold < b.cost;
      btn.addEventListener('click', () => {
        if (this.cb.onShopBuyBoon(b)) {
          b._bought = true;
          this.showPeddlerShop(player, shopBoons, allWeapons);
        }
      });
      row.appendChild(btn);
      list.appendChild(row);
    }

    // 2. Full Heal & Flask Refill
    const healRow = document.createElement('div');
    healRow.className = 'forge-item';
    healRow.innerHTML = `
      <div class="forge-item-info">
        <h4>⚗ Ember Tonic</h4>
        <p>Restore to 100% Vitality & refill all Ember Flasks.</p>
      </div>
    `;
    const healBtn = document.createElement('button');
    healBtn.className = 'forge-buy-btn';
    healBtn.textContent = 'Drink · 40 ✦';
    healBtn.disabled = player.gold < 40;
    healBtn.addEventListener('click', () => {
      if (this.cb.onShopBuyHeal()) this.showPeddlerShop(player, shopBoons, allWeapons);
    });
    healRow.appendChild(healBtn);
    list.appendChild(healRow);

    // 3. Weapon Swap Row
    const wWrap = document.getElementById('rl-shop-weapons');
    wWrap.innerHTML = '';
    for (const w of allWeapons) {
      const btn = document.createElement('button');
      btn.className = 'chapter-btn';
      const equipped = player.weaponId === w.id;
      btn.textContent = equipped ? `${w.glyph} ${w.name} (Equipped)` : `${w.glyph} ${w.name} · 45 ✦`;
      btn.disabled = equipped || player.gold < 45;
      btn.style.opacity = btn.disabled ? '0.45' : '1';
      btn.addEventListener('click', () => {
        if (this.cb.onShopBuyWeapon(w.id)) this.showPeddlerShop(player, shopBoons, allWeapons);
      });
      wWrap.appendChild(btn);
    }

    this.rlShopEl.classList.remove('hidden');
  }

  showRoguelikeSummary(summary) {
    this.hideAll();
    document.getElementById('rl-summary-sub').textContent =
      `You reached Floor ${summary.floor} wielding ${summary.weaponName} and earned +${summary.embersEarned} Kiln Embers (Total: ${summary.totalEmbers} 🔥).`;
    const items = [
      { val: `Floor ${summary.floor}`, lbl: 'Floor Reached' },
      { val: `Floor ${summary.bestFloor}`, lbl: 'Personal Best' },
      { val: `+${summary.embersEarned} 🔥`, lbl: 'Kiln Embers Earned' },
      { val: String(summary.bossesSlain), lbl: 'Bosses Slain' },
      { val: String(summary.kills), lbl: 'Vessels Shattered' },
      { val: String(summary.boonsCount), lbl: 'Active Boons' },
    ];
    document.getElementById('rl-summary-stats').innerHTML = items
      .map((i) => `<div class="victory-stat-box"><div class="val">${i.val}</div><div class="lbl">${i.lbl}</div></div>`)
      .join('');
    this.rlSummaryEl.classList.remove('hidden');
  }

  showTitle(hasSave = false) {
    this.hideAll();
    this.continueBtn.classList.toggle('hidden', !hasSave);
    this.titleEl.classList.remove('hidden');
  }

  showDialogue({ kicker, speaker, body, choices }) {
    this.hideAll();
    this.dlgKicker.textContent = kicker || 'CHRONICLE';
    this.dlgSpeaker.textContent = speaker || '';
    this.dlgBody.textContent = body;
    this.dlgChoices.innerHTML = '';

    for (const ch of choices) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-prefix">◈</span>${ch.label}`;
      btn.addEventListener('click', () => this.cb.onDialogueChoice(ch));
      this.dlgChoices.appendChild(btn);
    }
    this.dialogueEl.classList.remove('hidden');
  }

  showForge(player, discoveredShrines) {
    this.hideAll();
    this.forgeGold.textContent = String(player.gold);
    this.forgeList.innerHTML = '';

    for (const u of FORGE_UPGRADES) {
      const tier = player.forgeTiers[u.id] || 0;
      const maxed = tier >= u.maxTier;
      const cost = maxed ? 0 : u.costs[tier];
      const canBuy = !maxed && player.gold >= cost;

      const row = document.createElement('div');
      row.className = 'forge-item';
      row.innerHTML = `
        <div class="forge-item-info">
          <h4>${u.name} <span style="color:var(--gold);font-size:12px;">(Tier ${tier}/${u.maxTier})</span></h4>
          <p>${u.desc}</p>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = 'forge-buy-btn';
      btn.textContent = maxed ? 'MAXED' : `Temper · ${cost} ✦`;
      btn.disabled = !canBuy;
      btn.addEventListener('click', () => {
        if (this.cb.onBuyUpgrade(u.id)) {
          this.showForge(player, discoveredShrines);
        }
      });
      row.appendChild(btn);
      this.forgeList.appendChild(row);
    }

    // Fast-travel between discovered Kiln Shrines
    const shrines = WORLD_LAYOUT.shrines.filter((s) => discoveredShrines.has(s.id));
    if (shrines.length > 1) {
      this.forgeTravelWrap.classList.remove('hidden');
      this.forgeTravelList.innerHTML = '';
      for (const s of shrines) {
        const b = document.createElement('button');
        b.className = 'travel-btn';
        b.textContent = `Act ${s.act} · ${s.name}`;
        b.addEventListener('click', () => this.cb.onFastTravel(s));
        this.forgeTravelList.appendChild(b);
      }
    } else {
      this.forgeTravelWrap.classList.add('hidden');
    }

    this.forgeEl.classList.remove('hidden');
  }

  showCodex(player, discoveredLoreIds, activeBoonIds = []) {
    this.hideAll();

    this.codexRelics.innerHTML = '';
    const w = WEAPONS[player.weaponId];
    if (w) {
      const div = document.createElement('div');
      div.className = 'codex-entry';
      div.innerHTML = `<h4>Weapon · ${w.name}${player.unlockedHammer ? ' [V to Swap]' : ''}</h4><p>${w.desc}</p>`;
      this.codexRelics.appendChild(div);
    }
    for (const bId of activeBoonIds) {
      const b = ROGUELIKE_BOONS.find((x) => x.id === bId);
      if (!b) continue;
      const div = document.createElement('div');
      div.className = 'codex-entry';
      div.innerHTML = `<h4>${b.glyph} Boon · ${b.name} [${b.rarity.toUpperCase()}]</h4><p>${b.desc}</p>`;
      this.codexRelics.appendChild(div);
    }
    for (const sp of Object.values(SPELLS)) {
      if (!player.unlockedSpells[sp.id]) continue;
      const div = document.createElement('div');
      div.className = 'codex-entry';
      div.innerHTML = `<h4>Art · ${sp.name}</h4><p>${sp.desc}</p>`;
      this.codexRelics.appendChild(div);
    }
    for (const rId of player.relics) {
      const r = RELICS[rId];
      if (!r) continue;
      const div = document.createElement('div');
      div.className = 'codex-entry';
      div.innerHTML = `<h4>Relic · ${r.name}</h4><p><strong style="color:#6ce3d5">${r.summary}</strong><br/>${r.flavor}</p>`;
      this.codexRelics.appendChild(div);
    }

    const allLore = Object.values(LORE_ENTRIES);
    this.codexLoreCount.textContent = `${discoveredLoreIds.size}/${allLore.length}`;
    this.codexLore.innerHTML = '';
    for (const entry of allLore) {
      const found = discoveredLoreIds.has(entry.id);
      const div = document.createElement('div');
      div.className = 'codex-entry';
      if (found) {
        div.innerHTML = `<h4>${entry.title}</h4><p>${entry.text.replace(/\n/g, '<br/>')}</p>`;
      } else {
        div.innerHTML = `<h4 style="opacity:0.5">Undiscovered Stele</h4><p style="opacity:0.45">Explore ${entry.location} to recover this inscription.</p>`;
      }
      this.codexLore.appendChild(div);
    }

    this.codexEl.classList.remove('hidden');
  }

  showPause() {
    this.hideAll();
    this.pauseEl.classList.remove('hidden');
  }

  showDeath() {
    this.hideAll();
    this.deathEl.classList.remove('hidden');
  }

  showVictory(ending, stats) {
    this.hideAll();
    this.victoryKicker.textContent = ending.kicker;
    this.victoryTitle.textContent = ending.title;
    this.victoryEpilogue.textContent = ending.epilogue;

    const mins = Math.floor(stats.elapsed / 60);
    const secs = String(Math.floor(stats.elapsed % 60)).padStart(2, '0');
    const items = [
      { val: `${mins}:${secs}`, lbl: 'Pilgrimage Time' },
      { val: stats.alignmentLabel || 'Unbound', lbl: 'Path Walked' },
      { val: `Lv ${stats.level}`, lbl: 'Final Level' },
      { val: String(stats.enemiesDefeated), lbl: 'Vessels Quieted' },
      { val: `${stats.loreFound} / 7`, lbl: 'Steles Recovered' },
      { val: `${stats.relicsCount}`, lbl: 'Relics Claimed' },
    ];
    this.victoryStats.innerHTML = items
      .map((i) => `<div class="victory-stat-box"><div class="val">${i.val}</div><div class="lbl">${i.lbl}</div></div>`)
      .join('');
    this.victoryEl.classList.remove('hidden');
  }
}
