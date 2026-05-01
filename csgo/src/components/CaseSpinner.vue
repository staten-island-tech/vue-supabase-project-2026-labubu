<template>
  <div class="spinner-root">
    <div class="bg-glow" />
 
    <!-- Header -->
    <div class="title-bar">
      <img
        class="case-img"
        src="https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbl9jYXNlcy9jcmF0ZV9jb21tdW5pdHlfMjIuZjIyM2RkNDJjOGQ0YzNlY2Y1YTAzYjI3NDE2Y2I1MjNmNDkzZDhhZi5wbmc-/50/auto/85/notrim/da4e37795b893243fd73725bb8874820.png"
        alt="Prisma Case"
      />
      <div>
        <h1>Prisma Case</h1>
        <p class="subtitle">17 skins · 4 knife pools · Released March 13, 2019</p>
      </div>
    </div>
 
    <!-- Spin Track -->
    <div class="track-container">
      <div class="track-fade track-fade-left" />
      <div class="track-fade track-fade-right" />
      <div class="center-indicator">
        <div class="indicator-arrow indicator-top" />
        <div class="indicator-line" />
        <div class="indicator-arrow indicator-bottom" />
      </div>
      <div ref="trackRef" class="track">
        <div
          v-for="(item, i) in pool"
          :key="i"
          class="item"
          :class="[`bg-${item.rarity}`, { 'item-winner': i === winnerIndex && showWinner }]"
        >
          <div class="rarity-bar" :class="`rarity-${item.rarity}`" />
          <div v-if="item.statTrak" class="st-badge">ST</div>
          <img
            class="item-img"
            :src="item.img"
            :alt="item.shortName"
            loading="lazy"
            @error="onImgError"
          />
          <div class="item-name" :class="`col-${item.rarity}`">{{ item.shortName }}</div>
        </div>
      </div>
    </div>
 
    <!-- Controls -->
    <div class="controls">
      <button class="spin-btn" :disabled="spinning" @click="spin">
        <span v-if="!spinning">Open Case  —  $2.49</span>
        <span v-else class="btn-spinning">Opening<span class="dots" /></span>
      </button>
 
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Opens</span>
          <span class="stat-value">{{ opens }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label">StatTrak™</span>
          <span class="stat-value st-count">{{ statTrakCount }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label">Best drop</span>
          <span class="stat-value" :class="bestRarity ? `col-${bestRarity}` : ''">
            {{ bestDrop || '—' }}
          </span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label">Spent</span>
          <span class="stat-value">${{ (opens * 2.49).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <Transition name="result-fade">
      <div v-if="result" class="result-display" :class="{ 'result-gold': result.rarity === 'gold' }">
        <div class="result-top">
          <div class="result-rarity-badge" :class="`badge-${result.rarity}`">
            {{ RARITY_LABEL[result.rarity] }}
          </div>
          <div v-if="result.statTrak" class="result-st-badge">StatTrak™</div>
        </div>
 
        <div class="result-skin-row">
          <img class="result-img" :src="result.img" :alt="result.name" />
          <div class="result-info">
            <div class="result-name" :class="`col-${result.rarity}`">
              <span v-if="result.statTrak" class="st-prefix">StatTrak™ </span>{{ result.name }}
            </div>
            <div class="result-wear-row">
              <span class="result-wear" :class="`wear-col-${result.wear.tier}`">
                {{ result.wear.label }}
              </span>
              <span class="result-float">{{ result.wear.float }}</span>
            </div>
            <!-- Float bar -->
            <div class="wear-bar-wrap">
              <div class="wear-bar-track">
                <div class="wear-bar-needle" :style="{ left: (result.wear.floatRaw * 100).toFixed(2) + '%' }" />
              </div>
              <div class="wear-bar-labels">
                <span>FN</span><span>MW</span><span>FT</span><span>WW</span><span>BS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
 
    <!-- History -->
    <div v-if="history.length" class="history">
      <div class="history-label">Recent drops</div>
      <div class="history-list">
        <TransitionGroup name="history-item">
          <div
            v-for="drop in history.slice(0, 8)"
            :key="drop.id"
            class="history-chip"
            :class="[`chip-${drop.rarity}`, { 'chip-st': drop.statTrak }]"
          >
            <img :src="drop.img" :alt="drop.shortName" class="chip-img" @error="onImgError" />
            <span v-if="drop.statTrak" class="chip-st-dot">ST</span>
            {{ drop.shortName }}
            <span class="chip-wear" :class="`wear-col-${drop.wear.tier}`">{{ drop.wear.short }}</span>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
 
// ─── Image base ──────────────────────────────────────────────────────────────
// All skin images are served from csgoskins.gg CDN.
// Pattern: https://cdn.csgoskins.gg/public/uih/items/{base64_url}/{size}/auto/85/notrim/{hash}.png
// The simplest reliable source is the Steam CDN via the item's inspect link hash.
// We use the csgoskins.gg item image endpoints directly (they hotlink-allow these).
 
const IMG = {
  // Covert
  'm4a4_emperor':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tNGExX2dzX200YTRfZW1wZXJvcl9saWdodC44OWE1NjU0YTc2NTExMGFlNTY5N2U3YjBkMTdmZjBkYWYzMTdkZWZlLnBuZw--/auto/auto/85/notrim/6e51084ac660f74319b2e88e12f913ce.webp',
  'fiveseven_angrymob': 'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9maXZlc2V2ZW5fY3VfZml2ZV9zZXZlbl9hbmdyeV9saWdodC41OWU3YTM2NzUxNjM2N2I4ZGYyOTgyNWI1NzE2OWZkZjU0OTA5ODBiLnBuZw--/auto/auto/85/notrim/56c95654ed5d4c11757dff0cfdc879d0.webp',
  // Classified
  'aug_momentum':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hdWdfY3VfYXVnX21vbWVudHVtX2xpZ2h0LjE0MjA4ZWE0OGRiMjgxNDgyZTU4YjIyYzNlODM3NzU3N2JlNjkzYzEucG5n/auto/auto/85/notrim/55103e74ce3d734a74c43e8e7ccee996.webp',
  'xm1014_incinegator': 'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl94bTEwMTRfY3VfeG0xMDE0X2luY2luZXJhdG9yX2xpZ2h0LjAwYjFhMmU3NDE2Zjg5MmQ2ZTQ5ODFkZWZhOTk0OTQyYmFiY2Q3ZDcucG5n/auto/auto/85/notrim/32bdfc9b359c12228f48c9ae2ece21be.webp',
  'r8_skullcrusher':    'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9yZXZvbHZlcl9jdV9yZXZvbHZlcl9vcHByZXNzb3JfbGlnaHQuMDY0YWQ0ZjIxZjQyZTUxNGI3MDA2YzE0YWQzNmZlMjI1ZDJiNjY1My5wbmc-/auto/auto/85/notrim/424e0d31f363fd19fbea56b6d19521b3.webp',
  // Restricted
  'awp_atheris':        'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hd3BfY3VfYXdwX3ZpcGVyX2xpZ2h0LjEyZTJlOTA3Zjg4ZjU2MzNhMzEzMGVlMDY5ZDQxMDg3OWNmNWE2NmUucG5n/auto/auto/85/notrim/4dce1a042bb0f10ba8b305ed7037de2e.webp',
  'deagle_lightrail':   'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9kZWFnbGVfZ3NfZGVhZ2xlX2V4b19saWdodC44ZDlmZTg2N2NiMWU4NGYyZjRjMGE5OGUyNzI2MTE4YjMyZTU5MGQ1LnBuZw--/auto/auto/85/notrim/0deb275bf988abeb3e2e7afe244b44bb.webp',
  'ump45_moonrise':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl91bXA0NV9hYV91bXA0NV9tb29ucmlzZV9zdW5zZXRfbGlnaHQuM2I0ZWRiNmQxZmEyYmU4YzkxNTlhMzI0NWZhNGQ3OGRhMDJhMDk4Zi5wbmc-/auto/auto/85/notrim/e3c8fae4c33ef389f4c8af9e4ebfff9e.webp',
  'mp5sd_gauss':        'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tcDVzZF9nc19tcDVzZF9hc3Ryb21hdGljX2xpZ2h0LjQ2MDdiNmE4YjUwMDQwMzMwNWFlZjRiNTZjOTk0NjNjN2ZmYzE1ZmMucG5n/auto/auto/85/notrim/0c79c8f6001e8592f536daf498c29cf9.webp',
  'tec9_bamboozle':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl90ZWM5X2N1X3RlYzlfYmFtYm9vX2xpZ2h0LmYxYjBjYzkyNWE2ZWM5YzNhNWQ4ZTk4MTQ2ZmVjZThhZDFjNTQ4ODYucG5n/auto/auto/85/notrim/e64dd8d6ac9ba8dc01607ddcec6eb0b6.webp',
  // Mil-Spec
  'ak47_uncharted':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hazQ3X2N1X2FrNDdfYXp0ZWNfbGlnaHQuMGY3MDNlYTllNGFkN2IwMmEwNTU5OGRjMGVjMGQyNjRjZDIzNGY2Ny5wbmc-/auto/auto/85/notrim/1a7c6be8159149e85c4ac678638c042b.webp',
  'p250_verdigris':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9wMjUwX2FxX3AyNTBfdmVyZGlncmlzX2xpZ2h0LmUzM2EwYWZmODU1ZWI5MjhmNDgyNGIzYWUzZDE4OWZhY2MzMzA5NjkucG5n/auto/auto/85/notrim/7240dd37ebbf44c0be941877005cb90e.webp',
  'mp7_mischief':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tcDdfY3VfbXA3X3JhY2tldGVlcl9saWdodC4zMThjZmY2ZTFkMGQ5ZGZmOGQ4ZDBiYTc4MzI0ZmY2MTc5YWRiZDBkLnBuZw--/auto/auto/85/notrim/8f32fc0f0c92abee2e538508b048e6b7.webp',
  'p90_offworld':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9wOTBfY3VfcDkwX29mZndvcmxkX2xpZ2h0LjNjNTlkYTBhYzllNDg2ZjY5MjVmMDdhNTVjNDExMzcyMmNmNDYyMTAucG5n/auto/auto/85/notrim/10401708168f20fe5f9893d327f0aca4.webp',
  'mac10_whitefish':    'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tYWMxMF9nc19tYWMxMF9maXNoX2JhaXRfbGlnaHQuMGIwNGEyMzA5YzBjZGMzMTQ4MDdhMWZiM2RmOWRhMGE4NDM2MWI3YS5wbmc-/auto/auto/85/notrim/5473ec62cb3e95f1b5fe9e306c94547e.webp',
  'galilar_akoben':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9nYWxpbGFyX3NwX2dhbGlsX2Frb2Jlbl9saWdodC5jOGI2MzNkZGQ2MDlkNDUzODk4N2JhZDczY2U5MGE5ODQ4MDFmNWJlLnBuZw--/auto/auto/85/notrim/a18749df7de227a71a7f5cfb697b347e.webp', 
  'famas_crypsis':      'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9mYW1hc19zcF9mYW1hc19naG9zdF9pbnNlY3RzX2xpZ2h0LjZmOTNmMTVjNDFiZmZlOTBhM2M3ODRhZWZiOThmMzdhY2ZmYTc5YTIucG5n/auto/auto/85/notrim/3eecddc4f169047b65643d10792244a2.webp',
  // Knives
  'knife_navaja':       'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV9neXBzeV9qYWNra25pZmUuYTY4YzFiZjMxM2Q5MTdhM2ZhMDVjNGM4NzYxYmViODdiYTI4MzBiOC5wbmc-/50/auto/85/notrim/3df5596ed036887c96e022db8017d8fa.png',
  'knife_stiletto':     'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV9zdGlsZXR0by5jNGZiNzAwNGFkMjk5ZDZiZWZjN2M5NmFmNWE0MTE3NjcwNWUzMTJkLnBuZw--/50/auto/85/notrim/97867128054268a0143c1056ca60056d.png',
  'knife_ursus':        'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV91cnN1cy4yZjIxOGNkYmVlMTIxZjYxZWFkY2NlZjg5ZWUxN2ZjNDZmZDQyZWY2LnBuZw--/50/auto/85/notrim/eae1933f485a066c5d70ff67ff07bd91.png',
  'knife_talon':        'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV93aWRvd21ha2VyLjYxNzcwNDliZDg4OWQ4ZjZiNWU2NzE5ZTUxZmZjOWY5OTRlZGEwMWEucG5n/50/auto/85/notrim/11a1f1d1f34a44ea9c5b48e046131266.png',
}
 
// Fallback emoji for broken images
function onImgError(e) { e.target.style.display = 'none' }
 
// ─── Knife finishes ───────────────────────────────────────────────────────────
const KNIFE_FINISHES = [
  'Doppler (Phase 1)', 'Doppler (Phase 2)', 'Doppler (Phase 3)', 'Doppler (Phase 4)',
  'Doppler (Ruby)', 'Doppler (Sapphire)', 'Doppler (Black Pearl)',
  'Marble Fade', 'Tiger Tooth', 'Damascus Steel', 'Ultraviolet', 'Rust Coat',
]
 
// ─── Wear system ─────────────────────────────────────────────────────────────
const WEAR_TIERS = [
  { tier: 'fn', label: 'Factory New',    short: 'FN', min: 0.00, max: 0.07 },
  { tier: 'mw', label: 'Minimal Wear',   short: 'MW', min: 0.07, max: 0.15 },
  { tier: 'ft', label: 'Field-Tested',   short: 'FT', min: 0.15, max: 0.38 },
  { tier: 'ww', label: 'Well-Worn',      short: 'WW', min: 0.38, max: 0.45 },
  { tier: 'bs', label: 'Battle-Scarred', short: 'BS', min: 0.45, max: 1.00 },
]
 
function rollWear() {
  const f    = Math.random()
  const tier = WEAR_TIERS.find(t => f >= t.min && f < t.max) ?? WEAR_TIERS[4]
  return { tier: tier.tier, label: tier.label, short: tier.short, floatRaw: f, float: f.toFixed(10) }
}
 
// Rarity breakdown: 79.92% Mil-Spec | 15.98% Restricted | 3.20% Classified | 0.64% Covert | 0.26% Knife
const ITEMS = [
  // Covert (0.32% each ≈ 0.64% total)
  { name: 'M4A4 | The Emperor',       shortName: 'The Emperor',    img: IMG.m4a4_emperor,       rarity: 'covert',     weight: 0.32 },
  { name: 'Five-SeveN | Angry Mob',   shortName: 'Angry Mob',      img: IMG.fiveseven_angrymob, rarity: 'covert',     weight: 0.32 },
  // Classified (1.066% each ≈ 3.20% total)
  { name: 'AUG | Momentum',           shortName: 'Momentum',       img: IMG.aug_momentum,       rarity: 'classified', weight: 1.067 },
  { name: 'XM1014 | Incinegator',     shortName: 'Incinegator',    img: IMG.xm1014_incinegator, rarity: 'classified', weight: 1.067 },
  { name: 'R8 Revolver | Skull Crusher', shortName: 'Skull Crusher', img: IMG.r8_skullcrusher, rarity: 'classified', weight: 1.066 },
  // Restricted (3.196% each ≈ 15.98% total)
  { name: 'AWP | Atheris',            shortName: 'Atheris',        img: IMG.awp_atheris,        rarity: 'restricted', weight: 3.196 },
  { name: 'Desert Eagle | Light Rail',shortName: 'Light Rail',     img: IMG.deagle_lightrail,   rarity: 'restricted', weight: 3.196 },
  { name: 'UMP-45 | Moonrise',        shortName: 'Moonrise',       img: IMG.ump45_moonrise,     rarity: 'restricted', weight: 3.196 },
  { name: 'MP5-SD | Gauss',           shortName: 'Gauss',          img: IMG.mp5sd_gauss,        rarity: 'restricted', weight: 3.196 },
  { name: 'Tec-9 | Bamboozle',        shortName: 'Bamboozle',      img: IMG.tec9_bamboozle,     rarity: 'restricted', weight: 3.196 },
  // Mil-Spec (11.417% each ≈ 79.92% total)
  { name: 'AK-47 | Uncharted',        shortName: 'Uncharted',      img: IMG.ak47_uncharted,     rarity: 'milspec',    weight: 11.417 },
  { name: 'P250 | Verdigris',         shortName: 'Verdigris',      img: IMG.p250_verdigris,     rarity: 'milspec',    weight: 11.417 },
  { name: 'MP7 | Mischief',           shortName: 'Mischief',       img: IMG.mp7_mischief,       rarity: 'milspec',    weight: 11.417 },
  { name: 'P90 | Off World',          shortName: 'Off World',      img: IMG.p90_offworld,       rarity: 'milspec',    weight: 11.417 },
  { name: 'MAC-10 | Whitefish',       shortName: 'Whitefish',      img: IMG.mac10_whitefish,    rarity: 'milspec',    weight: 11.417 },
  { name: 'Galil AR | Akoben',        shortName: 'Akoben',         img: IMG.galilar_akoben,     rarity: 'milspec',    weight: 11.416 },
  { name: 'FAMAS | Crypsis',          shortName: 'Crypsis',        img: IMG.famas_crypsis,      rarity: 'milspec',    weight: 11.416 },
]
 

const KNIVES = [
  { base: '★ Navaja Knife',   img: IMG.knife_navaja   },
  { base: '★ Stiletto Knife', img: IMG.knife_stiletto },
  { base: '★ Ursus Knife',    img: IMG.knife_ursus    },
  { base: '★ Talon Knife',    img: IMG.knife_talon    },
]
 
const RARITY_LABEL = {
  milspec:    'Mil-Spec Grade',
  restricted: 'Restricted',
  classified: 'Classified',
  covert:     'Covert',
  gold:       '★ Rare Special Item',
}
 
const RARITY_ORDER = ['milspec','restricted','classified','covert','gold']
const ITEM_W      = 120
const POOL_SIZE   = 60
const CONTAINER_W = 640
 
// ─── State ───────────────────────────────────────────────────────────────────
const trackRef      = ref(null)
const pool          = ref([])
const winnerIndex   = ref(-1)
const showWinner    = ref(false)
const spinning      = ref(false)
const result        = ref(null)
const opens         = ref(0)
const bestDrop      = ref('')
const bestRarity    = ref('')
const statTrakCount = ref(0)
const history       = ref([])
let   historyId     = 0
 
// ─── Helpers ─────────────────────────────────────────────────────────────────
function weightedRandom() {
  // Total weight for regular skins + knife (0.26%)
  const knifeWeight = 0.26
  const skinTotal   = ITEMS.reduce((s, i) => s + i.weight, 0)
  const grand       = skinTotal + knifeWeight
  let r = Math.random() * grand
  if (r < knifeWeight) return null  // null = knife
  r -= knifeWeight
  for (const item of ITEMS) { r -= item.weight; if (r <= 0) return item }
  return ITEMS.at(-1)
}
 
function rollKnife() {
  const k       = KNIVES[Math.floor(Math.random() * KNIVES.length)]
  const finish  = KNIFE_FINISHES[Math.floor(Math.random() * KNIFE_FINISHES.length)]
  const wear    = rollWear()
  const stTrack = Math.random() < 0.1
  return {
    name:      `${k.base} | ${finish}`,
    shortName: `${k.base.replace('★ ', '')} ${finish}`,
    img:       k.img,
    rarity:    'gold',
    weight:    0.26,
    wear,
    statTrak:  stTrack,
    canStatTrak: true,
  }
}
 
function rollDrop() {
  const base = weightedRandom()
  if (base === null) return rollKnife()
  const wear     = rollWear()
  const statTrak = Math.random() < 0.1
  return { ...base, wear, statTrak }
}
 
function updateBest(item) {
  const wi = RARITY_ORDER.indexOf(item.rarity)
  const bi = RARITY_ORDER.indexOf(bestRarity.value)
  if (wi > bi) {
    bestDrop.value   = item.shortName
    bestRarity.value = item.rarity
  }
}
 
// ─── Spin ────────────────────────────────────────────────────────────────────
async function spin() {
  if (spinning.value) return
  spinning.value   = true
  result.value     = null
  showWinner.value = false
 
  const winner = rollDrop()
  const winIdx = Math.floor(POOL_SIZE * 0.70) + Math.floor(Math.random() * 8)
 
  // Build pool — track items only use skin (no wear/statTrak displayed in track)
  pool.value = Array.from({ length: POOL_SIZE }, (_, i) => {
    if (i === winIdx) return winner
    const base = weightedRandom()
    return base === null
      ? rollKnife()
      : { ...base, statTrak: Math.random() < 0.1, wear: rollWear() }
  })
  winnerIndex.value = winIdx
  showWinner.value  = false
 
  await new Promise(r => setTimeout(r, 30))
 
  const el = trackRef.value
  gsap.set(el, { x: 0 })
 
  const center    = CONTAINER_W / 2
  const targetX   = -(winIdx * ITEM_W + ITEM_W / 2 - center)
  const jitter    = (Math.random() - 0.5) * ITEM_W * 0.5
  const overshoot = targetX + jitter
 
  await gsap.timeline()
    .to(el, { x: overshoot, duration: 5.0, ease: 'power4.out' })
    .to(el, { x: targetX,   duration: 0.3, ease: 'back.out(2.5)' })
 
  showWinner.value = true
  result.value     = winner
  opens.value++
  if (winner.statTrak) statTrakCount.value++
  updateBest(winner)
 
  history.value.unshift({ ...winner, id: ++historyId })
  if (history.value.length > 12) history.value.pop()
 
  spinning.value = false
}
 
// ─── Init ────────────────────────────────────────────────────────────────────
onMounted(() => {
  pool.value = Array.from({ length: POOL_SIZE }, () => {
    const base = weightedRandom()
    return base === null ? rollKnife() : { ...base, statTrak: false, wear: rollWear() }
  })
  gsap.set(trackRef.value, { x: -(POOL_SIZE / 2 * ITEM_W - CONTAINER_W / 2) })
})
</script>
 
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Barlow:wght@400;500&display=swap');
 
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
.spinner-root {
  font-family: 'Barlow', sans-serif;
  background: #080b12;
  border-radius: 12px;
  padding: 2rem 1.5rem 2rem;
  color: #dde4f0;
  position: relative;
  overflow: hidden;
  max-width: 700px;
  margin: 0 auto;
}
 
.bg-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 30% at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%);
  pointer-events: none;
}
 
/* ── Title ── */
.title-bar {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  margin-bottom: 1.5rem;
}
.case-img { width: 56px; height: 56px; object-fit: contain; }
.title-bar h1 {
  font-family: 'Rajdhani', sans-serif; font-size: 26px; font-weight: 700;
  letter-spacing: 4px; text-transform: uppercase; color: #e0c870;
}
.subtitle { font-size: 11px; letter-spacing: 1.5px; color: #4a5060; text-transform: uppercase; margin-top: 3px; }
 
/* ── Track ── */
.track-container {
  position: relative; height: 130px; overflow: hidden;
  border-top: 1px solid #1a1e2a; border-bottom: 1px solid #1a1e2a; background: #060810;
}
.track-fade { position: absolute; top: 0; bottom: 0; width: 140px; z-index: 3; pointer-events: none; }
.track-fade-left  { left:  0; background: linear-gradient(to right, #060810, transparent); }
.track-fade-right { right: 0; background: linear-gradient(to left,  #060810, transparent); }
 
.center-indicator {
  position: absolute; left: 50%; top: 0; bottom: 0;
  transform: translateX(-50%); z-index: 4;
  display: flex; flex-direction: column; align-items: center; pointer-events: none;
}
.indicator-line { flex: 1; width: 2px; background: #e8a020; box-shadow: 0 0 10px 2px rgba(232,160,32,0.45); }
.indicator-arrow { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; }
.indicator-top    { border-top:    11px solid #e8a020; }
.indicator-bottom { border-bottom: 11px solid #e8a020; }
 
.track { display: flex; align-items: center; height: 100%; gap: 6px; padding: 0 6px; will-change: transform; }
 
/* ── Track Items ── */
.item {
  flex-shrink: 0; width: 114px; height: 122px; border-radius: 5px;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding-bottom: 6px; position: relative; border: 1px solid transparent; transition: border-color 0.2s;
}
.item-winner { border-color: #e8a020 !important; box-shadow: 0 0 12px rgba(232,160,32,0.3); }
 
.rarity-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 5px 5px 0 0; }
 
.st-badge {
  position: absolute; top: 5px; right: 5px;
  font-size: 8px; font-weight: 700; letter-spacing: 1px;
  background: rgba(207,106,50,0.2); color: #cf6a32;
  border: 1px solid rgba(207,106,50,0.4); padding: 1px 4px; border-radius: 2px;
}
 
.item-img {
  width: 86px; height: 64px; object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
  margin-bottom: 2px;
}
.item-name {
  font-size: 9px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  text-align: center; line-height: 1.2; max-width: 108px; padding: 0 4px;
}
 
/* Rarity backgrounds */
.bg-milspec    { background: #0c1228; }
.bg-restricted { background: #110c22; }
.bg-classified { background: #130c1e; }
.bg-covert     { background: #1c0c0c; }
.bg-gold       { background: #18140a; }
 
/* Rarity bar colors */
.rarity-milspec    { background: #4b69ff; }
.rarity-restricted { background: #8847ff; }
.rarity-classified { background: #d32ce6; }
.rarity-covert     { background: #eb4b4b; }
.rarity-gold       { background: linear-gradient(90deg, #e4ae39, #fff07a, #e4ae39); }
 
/* Rarity text colors */
.col-milspec    { color: #4b69ff; }
.col-restricted { color: #8847ff; }
.col-classified { color: #d32ce6; }
.col-covert     { color: #eb4b4b; }
.col-gold       { color: #e4ae39; }
 
/* Wear text colors */
.wear-col-fn { color: #4ade80; }
.wear-col-mw { color: #86efac; }
.wear-col-ft { color: #fbbf24; }
.wear-col-ww { color: #f97316; }
.wear-col-bs { color: #f87171; }
 
/* ── Result ── */
.result-display {
  margin-top: 1.25rem; padding: 1rem 1.25rem; border-radius: 6px;
  background: #0d101a; border: 1px solid #1a1e2a;
}
.result-gold { border-color: rgba(228,174,57,0.3); background: rgba(24,20,10,0.9); }
 
.result-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
 
.result-rarity-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  padding: 3px 10px; border-radius: 3px;
}
.badge-milspec    { background: rgba(75,105,255,0.12);  color: #7080ff; }
.badge-restricted { background: rgba(136,71,255,0.12);  color: #a070ff; }
.badge-classified { background: rgba(211,44,230,0.12);  color: #e060f0; }
.badge-covert     { background: rgba(235,75,75,0.14);   color: #f07070; }
.badge-gold       { background: rgba(228,174,57,0.14);  color: #e4ae39; }
 
.result-st-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  padding: 3px 10px; border-radius: 3px;
  background: rgba(207,106,50,0.15); color: #cf6a32; border: 1px solid rgba(207,106,50,0.3);
}
 
.result-skin-row { display: flex; align-items: center; gap: 16px; }
.result-img { width: 120px; height: 90px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6)); flex-shrink: 0; }
 
.result-info { flex: 1; }
.result-name {
  font-family: 'Rajdhani', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: 1px; line-height: 1.2;
}
.st-prefix { color: #cf6a32; }
 
.result-wear-row { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
.result-wear { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; }
.result-float { font-family: monospace; font-size: 11px; color: #3a4558; }
 
/* Float bar */
.wear-bar-wrap { margin-top: 8px; }
.wear-bar-track {
  position: relative; height: 5px; border-radius: 3px;
  background: linear-gradient(to right, #4ade80 0%, #86efac 7%, #fbbf24 15%, #f97316 38%, #f87171 45%, #9e3030 100%);
}
.wear-bar-needle {
  position: absolute; top: -4px; width: 2px; height: 13px;
  background: #fff; border-radius: 1px; transform: translateX(-50%);
  box-shadow: 0 0 4px rgba(255,255,255,0.6); transition: left 0.4s ease;
}
.wear-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #3a4050; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px;
}
 
/* ── Controls ── */
.controls { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; margin-top: 1.25rem; }
 
.spin-btn {
  font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
  background: linear-gradient(135deg, #b8942e 0%, #e8cc58 50%, #b8942e 100%);
  color: #0a0c10; border: none; border-radius: 4px; padding: 13px 56px; cursor: pointer;
  transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 16px rgba(200,168,75,0.25);
}
.spin-btn:hover:not(:disabled)  { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(200,168,75,0.4); }
.spin-btn:active:not(:disabled) { transform: scale(0.97); }
.spin-btn:disabled { opacity: 0.45; cursor: not-allowed; }
 
.btn-spinning { display: flex; align-items: center; gap: 2px; }
.dots::after  { content: ''; animation: dotdot 1.2s infinite steps(4, end); }
@keyframes dotdot { 0%{content:''} 33%{content:'.'} 66%{content:'..'} 100%{content:'...'} }
 
/* Stats */
.stats { display: flex; align-items: center; gap: 1.25rem; }
.stat  { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #3a404e; }
.stat-value { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #8090a8; }
.st-count   { color: #cf6a32; }
.stat-divider { width: 1px; height: 28px; background: #1a1e2a; }
 
/* ── History ── */
.history { margin-top: 1.5rem; border-top: 1px solid #12151e; padding-top: 1rem; }
.history-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #3a404e; margin-bottom: 8px; }
.history-list  { display: flex; flex-wrap: wrap; gap: 6px; }
 
.history-chip {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
  padding: 4px 8px; border-radius: 3px; border: 1px solid transparent;
}
.chip-milspec    { background: rgba(75,105,255,0.08);  border-color: rgba(75,105,255,0.2);  color: #7080ff; }
.chip-restricted { background: rgba(136,71,255,0.08);  border-color: rgba(136,71,255,0.2);  color: #a070ff; }
.chip-classified { background: rgba(211,44,230,0.08);  border-color: rgba(211,44,230,0.2);  color: #e060f0; }
.chip-covert     { background: rgba(235,75,75,0.08);   border-color: rgba(235,75,75,0.25);  color: #f07070; }
.chip-gold       { background: rgba(228,174,57,0.08);  border-color: rgba(228,174,57,0.25); color: #e4ae39; }
.chip-st         { border-color: rgba(207,106,50,0.45) !important; }
 
.chip-img { width: 28px; height: 20px; object-fit: contain; }
.chip-st-dot {
  font-size: 8px; font-weight: 700; color: #cf6a32;
  background: rgba(207,106,50,0.15); padding: 1px 3px; border-radius: 2px;
}
.chip-wear { font-size: 9px; opacity: 0.65; }
 
/* ── Transitions ── */
.result-fade-enter-active { transition: opacity 0.35s, transform 0.35s; }
.result-fade-leave-active { transition: opacity 0.2s; }
.result-fade-enter-from   { opacity: 0; transform: translateY(8px); }
.result-fade-leave-to     { opacity: 0; }
 
.history-item-enter-active { transition: all 0.3s ease; }
.history-item-enter-from   { opacity: 0; transform: scale(0.8); }
.history-item-leave-active { transition: all 0.2s ease; position: absolute; }
.history-item-leave-to     { opacity: 0; }
</style>