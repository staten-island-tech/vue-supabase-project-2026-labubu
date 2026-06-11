<template>
  <div class="spinner-root">
    <div class="title-bar">
      <img src="https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbl9jYXNlcy9jcmF0ZV9jb21tdW5pdHlfMjIuZjIyM2RkNDJjOGQ0YzNlY2Y1YTAzYjI3NDE2Y2I1MjNmNDkzZDhhZi5wbmc-/50/auto/85/notrim/da4e37795b893243fd73725bb8874820.png" alt="Prisma Case" class="case-img" />
      <div>
        <h1>Prisma Case</h1>
        <p>17 skins · 4 knife types · Released March 13, 2019</p>
      </div>
    </div>

    <div class="track-wrapper">
      <div class="track-container">
        <div class="fade-left" />
        <div class="fade-right" />
        <div class="indicator">
          <div class="indicator-top" />
          <div class="indicator-line" />
          <div class="indicator-bottom" />
        </div>
        <div ref="trackRef" class="track">
          <div
            v-for="(item, i) in pool"
            :key="i"
            class="item"
            :class="{ 'item-winner': i === winnerIndex && showWinner }"
            :style="{ borderTopColor: rarityColor(item.rarity) }"
          >
            <span v-if="item.statTrak" class="st-badge">ST</span>
            <img :src="item.img" :alt="item.shortName" class="item-img" loading="lazy" @error="e => e.target.style.display='none'" />
            <div class="item-name" :style="{ color: rarityColor(item.rarity) }">{{ item.shortName }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom">
      <button class="spin-btn" :disabled="spinning" @click="spin">
        {{ spinning ? 'Opening...' : 'Open Case — $2.49' }}
      </button>

      <div class="stats">
        <span>Opens: <b>{{ opens }}</b></span>
        <span>StatTrak™: <b>{{ statTrakCount }}</b></span>
        <span>Best: <b :style="{ color: rarityColor(bestRarity) }">{{ bestDrop || '—' }}</b></span>
        <span>Spent: <b>${{ (opens * 2.49).toFixed(2) }}</b></span>
      </div>

      <div v-if="result" class="result">
        <img :src="result.img" :alt="result.name" class="result-img" />
        <div class="result-info">
          <div class="result-name" :style="{ color: rarityColor(result.rarity) }">
            <span v-if="result.statTrak" class="st-prefix">StatTrak™ </span>{{ result.name }}
          </div>
          <div>{{ RARITY_LABEL[result.rarity] }}</div>
          <div>{{ result.wear.label }} · {{ result.wear.float }}</div>
          <div class="wear-bar-wrap">
            <div class="wear-bar">
              <div class="wear-needle" :style="{ left: (result.wear.floatRaw * 100).toFixed(2) + '%' }" />
            </div>
            <div class="wear-labels"><span>FN</span><span>MW</span><span>FT</span><span>WW</span><span>BS</span></div>
          </div>
        </div>
      </div>

      <div v-if="history.length" class="history">
        <div class="history-label">Recent drops</div>
        <div class="history-list">
          <div
            v-for="drop in history.slice(0, 10)"
            :key="drop.id"
            class="history-chip"
            :style="{ borderColor: rarityColor(drop.rarity) }"
          >
            <img :src="drop.img" :alt="drop.shortName" class="chip-img" @error="e => e.target.style.display='none'" />
            <span v-if="drop.statTrak" class="st-badge">ST</span>
            <span :style="{ color: rarityColor(drop.rarity) }">{{ drop.shortName }}</span>
            <span class="chip-wear">{{ drop.wear.short }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { supabase, user } from '@/supabase'

const RARITY_COLORS = {
  milspec: '#4b69ff', restricted: '#8847ff', classified: '#d32ce6', covert: '#eb4b4b', gold: '#e4ae39',
}
function rarityColor(r) { return RARITY_COLORS[r] ?? '#666' }

const IMG = {
  'm4a4_emperor':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tNGExX2dzX200YTRfZW1wZXJvcl9saWdodC44OWE1NjU0YTc2NTExMGFlNTY5N2U3YjBkMTdmZjBkYWYzMTdkZWZlLnBuZw--/auto/auto/85/notrim/6e51084ac660f74319b2e88e12f913ce.webp',
  'fiveseven_angrymob': 'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9maXZlc2V2ZW5fY3VfZml2ZV9zZXZlbl9hbmdyeV9saWdodC41OWU3YTM2NzUxNjM2N2I4ZGYyOTgyNWI1NzE2OWZkZjU0OTA5ODBiLnBuZw--/auto/auto/85/notrim/56c95654ed5d4c11757dff0cfdc879d0.webp',
  'aug_momentum':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hdWdfY3VfYXVnX21vbWVudHVtX2xpZ2h0LjE0MjA4ZWE0OGRiMjgxNDgyZTU4YjIyYzNlODM3NzU3N2JlNjkzYzEucG5n/auto/auto/85/notrim/55103e74ce3d734a74c43e8e7ccee996.webp',
  'xm1014_incinegator': 'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl94bTEwMTRfY3VfeG0xMDE0X2luY2luZXJhdG9yX2xpZ2h0LjAwYjFhMmU3NDE2Zjg5MmQ2ZTQ5ODFkZWZhOTk0OTQyYmFiY2Q3ZDcucG5n/auto/auto/85/notrim/32bdfc9b359c12228f48c9ae2ece21be.webp',
  'r8_skullcrusher':    'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9yZXZvbHZlcl9jdV9yZXZvbHZlcl9vcHByZXNzb3JfbGlnaHQuMDY0YWQ0ZjIxZjQyZTUxNGI3MDA2YzE0YWQzNmZlMjI1ZDJiNjY1My5wbmc-/auto/auto/85/notrim/424e0d31f363fd19fbea56b6d19521b3.webp',
  'awp_atheris':        'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hd3BfY3VfYXdwX3ZpcGVyX2xpZ2h0LjEyZTJlOTA3Zjg4ZjU2MzNhMzEzMGVlMDY5ZDQxMDg3OWNmNWE2NmUucG5n/auto/auto/85/notrim/4dce1a042bb0f10ba8b305ed7037de2e.webp',
  'deagle_lightrail':   'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9kZWFnbGVfZ3NfZGVhZ2xlX2V4b19saWdodC44ZDlmZTg2N2NiMWU4NGYyZjRjMGE5OGUyNzI2MTE4YjMyZTU5MGQ1LnBuZw--/auto/auto/85/notrim/0deb275bf988abeb3e2e7afe244b44bb.webp',
  'ump45_moonrise':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl91bXA0NV9hYV91bXA0NV9tb29ucmlzZV9zdW5zZXRfbGlnaHQuM2I0ZWRiNmQxZmEyYmU4YzkxNTlhMzI0NWZhNGQ3OGRhMDJhMDk4Zi5wbmc-/auto/auto/85/notrim/e3c8fae4c33ef389f4c8af9e4ebfff9e.webp',
  'mp5sd_gauss':        'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tcDVzZF9nc19tcDVzZF9hc3Ryb21hdGljX2xpZ2h0LjQ2MDdiNmE4YjUwMDQwMzMwNWFlZjRiNTZjOTk0NjNjN2ZmYzE1ZmMucG5n/auto/auto/85/notrim/0c79c8f6001e8592f536daf498c29cf9.webp',
  'tec9_bamboozle':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl90ZWM5X2N1X3RlYzlfYmFtYm9vX2xpZ2h0LmYxYjBjYzkyNWE2ZWM5YzNhNWQ4ZTk4MTQ2ZmVjZThhZDFjNTQ4ODYucG5n/auto/auto/85/notrim/e64dd8d6ac9ba8dc01607ddcec6eb0b6.webp',
  'ak47_uncharted':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9hazQ3X2N1X2FrNDdfYXp0ZWNfbGlnaHQuMGY3MDNlYTllNGFkN2IwMmEwNTU5OGRjMGVjMGQyNjRjZDIzNGY2Ny5wbmc-/auto/auto/85/notrim/1a7c6be8159149e85c4ac678638c042b.webp',
  'p250_verdigris':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9wMjUwX2FxX3AyNTBfdmVyZGlncmlzX2xpZ2h0LmUzM2EwYWZmODU1ZWI5MjhmNDgyNGIzYWUzZDE4OWZhY2MzMzA5NjkucG5n/auto/auto/85/notrim/7240dd37ebbf44c0be941877005cb90e.webp',
  'mp7_mischief':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tcDdfY3VfbXA3X3JhY2tldGVlcl9saWdodC4zMThjZmY2ZTFkMGQ5ZGZmOGQ4ZDBiYTc4MzI0ZmY2MTc5YWRiZDBkLnBuZw--/auto/auto/85/notrim/8f32fc0f0c92abee2e538508b048e6b7.webp',
  'p90_offworld':       'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9wOTBfY3VfcDkwX29mZndvcmxkX2xpZ2h0LjNjNTlkYTBhYzllNDg2ZjY5MjVmMDdhNTVjNDExMzcyMmNmNDYyMTAucG5n/auto/auto/85/notrim/10401708168f20fe5f9893d327f0aca4.webp',
  'mac10_whitefish':    'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9tYWMxMF9nc19tYWMxMF9maXNoX2JhaXRfbGlnaHQuMGIwNGEyMzA5YzBjZGMzMTQ4MDdhMWZiM2RmOWRhMGE4NDM2MWI3YS5wbmc-/auto/auto/85/notrim/5473ec62cb3e95f1b5fe9e306c94547e.webp',
  'galilar_akoben':     'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9nYWxpbGFyX3NwX2dhbGlsX2Frb2Jlbl9saWdodC5jOGI2MzNkZGQ2MDlkNDUzODk4N2JhZDczY2U5MGE5ODQ4MDFmNWJlLnBuZw--/auto/auto/85/notrim/a18749df7de227a71a7f5cfb697b347e.webp',
  'famas_crypsis':      'https://cdn.csgoskins.gg/public/uih/items/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL2RlZmF1bHRfZ2VuZXJhdGVkL3dlYXBvbl9mYW1hc19zcF9mYW1hc19naG9zdF9pbnNlY3RzX2xpZ2h0LjZmOTNmMTVjNDFiZmZlOTBhM2M3ODRhZWZiOThmMzdhY2ZmYTc5YTIucG5n/auto/auto/85/notrim/3eecddc4f169047b65643d10792244a2.webp',
  'knife_navaja':       'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV9neXBzeV9qYWNra25pZmUuYTY4YzFiZjMxM2Q5MTdhM2ZhMDVjNGM4NzYxYmViODdiYTI4MzBiOC5wbmc-/50/auto/85/notrim/3df5596ed036887c96e022db8017d8fa.png',
  'knife_stiletto':     'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV9zdGlsZXR0by5jNGZiNzAwNGFkMjk5ZDZiZWZjN2M5NmFmNWE0MTE3NjcwNWUzMTJkLnBuZw--/50/auto/85/notrim/97867128054268a0143c1056ca60056d.png',
  'knife_ursus':        'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV91cnN1cy4yZjIxOGNkYmVlMTIxZjYxZWFkY2NlZjg5ZWUxN2ZjNDZmZDQyZWY2LnBuZw--/50/auto/85/notrim/eae1933f485a066c5d70ff67ff07bd91.png',
  'knife_talon':        'https://cdn.csgoskins.gg/public/uih/weapons/aHR0cHM6Ly9jZG4uY3Nnb3NraW5zLmdnL3B1YmxpYy9pbWFnZXMvYnVja2V0cy9lY29uL3dlYXBvbnMvYmFzZV93ZWFwb25zL3dlYXBvbl9rbmlmZV93aWRvd21ha2VyLjYxNzcwNDliZDg4OWQ4ZjZiNWU2NzE5ZTUxZmZjOWY5OTRlZGEwMWEucG5n/50/auto/85/notrim/11a1f1d1f34a44ea9c5b48e046131266.png',
}

const KNIFE_FINISHES = [
  'Doppler (Phase 1)', 'Doppler (Phase 2)', 'Doppler (Phase 3)', 'Doppler (Phase 4)',
  'Doppler (Ruby)', 'Doppler (Sapphire)', 'Doppler (Black Pearl)',
  'Marble Fade', 'Tiger Tooth', 'Damascus Steel', 'Ultraviolet', 'Rust Coat',
]

const WEAR_TIERS = [
  { tier: 'fn', label: 'Factory New',    short: 'FN', min: 0.00, max: 0.07 },
  { tier: 'mw', label: 'Minimal Wear',   short: 'MW', min: 0.07, max: 0.15 },
  { tier: 'ft', label: 'Field-Tested',   short: 'FT', min: 0.15, max: 0.38 },
  { tier: 'ww', label: 'Well-Worn',      short: 'WW', min: 0.38, max: 0.45 },
  { tier: 'bs', label: 'Battle-Scarred', short: 'BS', min: 0.45, max: 1.00 },
]

function rollWear() {
  const f = Math.random()
  const tier = WEAR_TIERS.find(t => f >= t.min && f < t.max) ?? WEAR_TIERS[4]
  return { tier: tier.tier, label: tier.label, short: tier.short, floatRaw: f, float: f.toFixed(10) }
}

const ITEMS = [
  { key: 'm4a4_emperor',       name: 'M4A4 | The Emperor',          shortName: 'The Emperor',    img: IMG.m4a4_emperor,       rarity: 'covert',     weight: 0.32 },
  { key: 'fiveseven_angrymob', name: 'Five-SeveN | Angry Mob',      shortName: 'Angry Mob',      img: IMG.fiveseven_angrymob, rarity: 'covert',     weight: 0.32 },
  { key: 'aug_momentum',       name: 'AUG | Momentum',              shortName: 'Momentum',       img: IMG.aug_momentum,       rarity: 'classified', weight: 1.067 },
  { key: 'xm1014_incinegator', name: 'XM1014 | Incinegator',        shortName: 'Incinegator',    img: IMG.xm1014_incinegator, rarity: 'classified', weight: 1.067 },
  { key: 'r8_skullcrusher',    name: 'R8 Revolver | Skull Crusher', shortName: 'Skull Crusher',  img: IMG.r8_skullcrusher,    rarity: 'classified', weight: 1.066 },
  { key: 'awp_atheris',        name: 'AWP | Atheris',               shortName: 'Atheris',        img: IMG.awp_atheris,        rarity: 'restricted', weight: 3.196 },
  { key: 'deagle_lightrail',   name: 'Desert Eagle | Light Rail',   shortName: 'Light Rail',     img: IMG.deagle_lightrail,   rarity: 'restricted', weight: 3.196 },
  { key: 'ump45_moonrise',     name: 'UMP-45 | Moonrise',           shortName: 'Moonrise',       img: IMG.ump45_moonrise,     rarity: 'restricted', weight: 3.196 },
  { key: 'mp5sd_gauss',        name: 'MP5-SD | Gauss',              shortName: 'Gauss',          img: IMG.mp5sd_gauss,        rarity: 'restricted', weight: 3.196 },
  { key: 'tec9_bamboozle',     name: 'Tec-9 | Bamboozle',          shortName: 'Bamboozle',      img: IMG.tec9_bamboozle,     rarity: 'restricted', weight: 3.196 },
  { key: 'ak47_uncharted',     name: 'AK-47 | Uncharted',          shortName: 'Uncharted',      img: IMG.ak47_uncharted,     rarity: 'milspec',    weight: 11.417 },
  { key: 'p250_verdigris',     name: 'P250 | Verdigris',           shortName: 'Verdigris',      img: IMG.p250_verdigris,     rarity: 'milspec',    weight: 11.417 },
  { key: 'mp7_mischief',       name: 'MP7 | Mischief',             shortName: 'Mischief',       img: IMG.mp7_mischief,       rarity: 'milspec',    weight: 11.417 },
  { key: 'p90_offworld',       name: 'P90 | Off World',            shortName: 'Off World',      img: IMG.p90_offworld,       rarity: 'milspec',    weight: 11.417 },
  { key: 'mac10_whitefish',    name: 'MAC-10 | Whitefish',         shortName: 'Whitefish',      img: IMG.mac10_whitefish,    rarity: 'milspec',    weight: 11.417 },
  { key: 'galilar_akoben',     name: 'Galil AR | Akoben',          shortName: 'Akoben',         img: IMG.galilar_akoben,     rarity: 'milspec',    weight: 11.416 },
  { key: 'famas_crypsis',      name: 'FAMAS | Crypsis',            shortName: 'Crypsis',        img: IMG.famas_crypsis,      rarity: 'milspec',    weight: 11.416 },
]

const KNIVES = [
  { key: 'knife_navaja',   base: '★ Navaja Knife',   img: IMG.knife_navaja   },
  { key: 'knife_stiletto', base: '★ Stiletto Knife', img: IMG.knife_stiletto },
  { key: 'knife_ursus',    base: '★ Ursus Knife',    img: IMG.knife_ursus    },
  { key: 'knife_talon',    base: '★ Talon Knife',    img: IMG.knife_talon    },
]

const RARITY_LABEL = {
  milspec: 'Mil-Spec Grade', restricted: 'Restricted', classified: 'Classified',
  covert: 'Covert', gold: '★ Rare Special Item',
}
const RARITY_ORDER = ['milspec', 'restricted', 'classified', 'covert', 'gold']
const ITEM_W = 120
const POOL_SIZE = 100

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
let historyId = 0

const getCenter = () => window.innerWidth / 2

function weightedRandom() {
  const knifeWeight = 0.26
  const total = ITEMS.reduce((s, i) => s + i.weight, 0) + knifeWeight
  let r = Math.random() * total
  if (r < knifeWeight) return null
  r -= knifeWeight
  for (const item of ITEMS) { r -= item.weight; if (r <= 0) return item }
  return ITEMS.at(-1)
}

function rollKnife() {
  const k = KNIVES[Math.floor(Math.random() * KNIVES.length)]
  const finish = KNIFE_FINISHES[Math.floor(Math.random() * KNIFE_FINISHES.length)]
  return {
    key: k.key,
    name: `${k.base} | ${finish}`,
    shortName: `${k.base.replace('★ ', '')} ${finish}`,
    img: k.img, rarity: 'gold', weight: 0.26,
    wear: rollWear(), statTrak: Math.random() < 0.1,
  }
}

function rollDrop() {
  const base = weightedRandom()
  if (!base) return rollKnife()
  return { ...base, wear: rollWear(), statTrak: Math.random() < 0.1 }
}

function centerTrack() {
  if (trackRef.value && !spinning.value)
    gsap.set(trackRef.value, { x: -(POOL_SIZE / 2 * ITEM_W - getCenter()) })
}

async function saveRoll(winner) {
  if (!user.value) return
  const { data: skin } = await supabase.from('skins').select('id').eq('skin_key', winner.key).single()
  if (!skin) return
  const { error } = await supabase.from('inventory').insert({
    user_id: user.value.id, skin_id: skin.id,
    stat_trak: winner.statTrak ?? false,
    wear_label: winner.wear.label, wear_tier: winner.wear.tier, float_val: winner.wear.floatRaw,
  })
  if (error) console.error('saveRoll error:', error.message)
}

async function spin() {
  if (spinning.value) return
  spinning.value = true
  result.value = null
  showWinner.value = false

  const winner = rollDrop()
  const winIdx = Math.floor(POOL_SIZE * 0.85) + Math.floor(Math.random() * 8)

  pool.value = Array.from({ length: POOL_SIZE }, (_, i) =>
    i === winIdx ? winner : rollDrop()
  )
  winnerIndex.value = winIdx

  await new Promise(r => setTimeout(r, 30))
  gsap.set(trackRef.value, { x: 0 })

  const targetX = -(winIdx * ITEM_W + ITEM_W / 2 - getCenter())
  const overshoot = targetX + (Math.random() - 0.5) * ITEM_W * 0.5

  await gsap.timeline()
    .to(trackRef.value, { x: overshoot, duration: 6.5, ease: 'power4.out' })
    .to(trackRef.value, { x: targetX, duration: 0.4, ease: 'back.out(2)' })

  showWinner.value = true
  result.value = winner
  opens.value++
  if (winner.statTrak) statTrakCount.value++

  const wi = RARITY_ORDER.indexOf(winner.rarity)
  if (wi > RARITY_ORDER.indexOf(bestRarity.value)) {
    bestDrop.value = winner.shortName
    bestRarity.value = winner.rarity
  }

  history.value.unshift({ ...winner, id: ++historyId })
  if (history.value.length > 12) history.value.pop()

  spinning.value = false
  await saveRoll(winner)
}

onMounted(() => {
  pool.value = Array.from({ length: POOL_SIZE }, () => rollDrop())
  centerTrack()
  window.addEventListener('resize', centerTrack)
})
onUnmounted(() => window.removeEventListener('resize', centerTrack))
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.spinner-root {
  font-family: sans-serif;
  background: #0a0a0a;
  color: #ccc;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 13px;
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 2rem;
}
.case-img { width: 60px; height: 60px; object-fit: contain; }
.title-bar h1 { font-size: 22px; color: #ddd; }
.title-bar p { font-size: 12px; color: #555; margin-top: 2px; }

.track-wrapper { width: 100%; margin: 1.5rem 0; }
.track-container {
  position: relative;
  height: 136px;
  overflow: hidden;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
  background: #050505;
}

.fade-left, .fade-right {
  position: absolute; top: 0; bottom: 0; width: 200px; z-index: 3; pointer-events: none;
}
.fade-left  { left: 0;  background: linear-gradient(to right, #0a0a0a, transparent); }
.fade-right { right: 0; background: linear-gradient(to left,  #0a0a0a, transparent); }

.indicator {
  position: absolute; left: 50%; top: 0; bottom: 0;
  transform: translateX(-50%); z-index: 4;
  display: flex; flex-direction: column; align-items: center; pointer-events: none;
}
.indicator-line { flex: 1; width: 2px; background: #e8a020; }
.indicator-top, .indicator-bottom { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; }
.indicator-top    { border-top: 10px solid #e8a020; }
.indicator-bottom { border-bottom: 10px solid #e8a020; }

.track { display: flex; align-items: center; height: 100%; gap: 6px; padding: 0 6px; will-change: transform; }

.item {
  flex-shrink: 0; width: 114px; height: 122px;
  background: #111;
  border: 1px solid #222;
  border-top-width: 3px;
  border-radius: 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding-bottom: 6px; position: relative;
}
.item-winner { border-color: #e8a020 !important; box-shadow: 0 0 12px rgba(232,160,32,0.3); }

.st-badge {
  position: absolute; top: 4px; right: 4px;
  font-size: 8px; font-weight: 700;
  background: rgba(207,106,50,0.2); color: #cf6a32;
  padding: 1px 3px; border-radius: 2px;
}

.item-img { width: 82px; height: 60px; object-fit: contain; margin-bottom: 4px; }
.item-name { font-size: 9px; text-align: center; line-height: 1.2; max-width: 106px; padding: 0 4px; }

.bottom {
  width: 100%; max-width: 860px; margin: 0 auto; padding: 0 2rem;
  display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
}

.spin-btn {
  padding: 12px 56px;
  font-size: 14px; font-weight: 600; letter-spacing: 1px;
  background: #c8a84b; color: #0a0a0a;
  border: none; border-radius: 4px; cursor: pointer;
}
.spin-btn:hover:not(:disabled) { background: #d9bc6a; }
.spin-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.stats {
  display: flex; gap: 2rem; color: #555; font-size: 12px; flex-wrap: wrap; justify-content: center;
}
.stats b { color: #999; }


.result {
  display: flex; align-items: center; gap: 20px;
  background: #111; border: 1px solid #222; border-radius: 6px;
  padding: 1rem 1.4rem; width: 100%; max-width: 600px;
}
.result-img { width: 140px; height: 100px; object-fit: contain; flex-shrink: 0; }
.result-info { display: flex; flex-direction: column; gap: 5px; }
.result-name { font-size: 18px; font-weight: 600; }
.st-prefix { color: #cf6a32; }

.wear-bar-wrap { margin-top: 6px; }
.wear-bar {
  position: relative; height: 5px; border-radius: 3px;
  background: linear-gradient(to right, #4ade80 0%, #fbbf24 15%, #f97316 38%, #f87171 45%, #9e3030 100%);
}
.wear-needle {
  position: absolute; top: -4px; width: 2px; height: 13px;
  background: #fff; border-radius: 1px; transform: translateX(-50%);
}
.wear-labels { display: flex; justify-content: space-between; font-size: 10px; color: #444; margin-top: 3px; }


.history { width: 100%; border-top: 1px solid #1a1a1a; padding-top: 1rem; text-align: center; }
.history-label { font-size: 11px; color: #444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.history-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }

.history-chip {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; padding: 4px 8px;
  background: #111; border: 1px solid #222; border-radius: 3px; color: #777;
}
.chip-img { width: 28px; height: 20px; object-fit: contain; }
.chip-wear { font-size: 10px; color: #444; }
</style>
