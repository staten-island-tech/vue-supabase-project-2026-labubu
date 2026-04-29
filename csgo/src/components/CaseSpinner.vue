<template>
  <div class="spinner-root">
    <!-- Background glow -->
    <div class="bg-glow" />

    <!-- Header -->
    <div class="title-bar">
      <div class="case-icon">⬡</div>
      <h1>Prisma Case</h1>
      <p class="subtitle">Contains one of the following</p>
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
          :class="[
            `bg-${item.rarity}`,
            { 'item-winner': i === winnerIndex && showWinner }
          ]"
        >
          <div class="rarity-bar" :class="`rarity-${item.rarity}`" />

          <div class="item-inner">
            <div class="item-emoji">{{ item.emoji }}</div>
            <div class="item-name" :class="`col-${item.rarity}`">
              {{ item.shortName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls (NOW ABOVE RESULT) -->
    <div class="controls">
      <button class="spin-btn" :disabled="spinning" @click="spin">
        <span v-if="!spinning">Open Case</span>
        <span v-else class="btn-spinning">
          Opening<span class="dots" />
        </span>
      </button>

      <!-- Stats -->
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Opens</span>
          <span class="stat-value">{{ opens }}</span>
        </div>

        <div class="stat-divider" />

        <div class="stat">
          <span class="stat-label">Best drop</span>
          <span
            class="stat-value"
            :class="bestRarity ? `col-${bestRarity}` : ''"
          >
            {{ bestDrop || '—' }}
          </span>
        </div>

        <div class="stat-divider" />

        <div class="stat">
          <span class="stat-label">Spent</span>
          <span class="stat-value">
            ${{ (opens * 2.49).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <!-- RESULT (MOVED HERE) -->
    <Transition name="result-fade">
      <div v-if="result" class="result-display">
        <div class="result-rarity-badge" :class="`badge-${result.rarity}`">
          {{ RARITY_LABEL[result.rarity] }}
        </div>

        <div
          class="result-name"
          :class="[
            `col-${result.rarity}`,
            { 'stat-trak': result.statTrak }
          ]"
        >
          {{ result.statTrak ? 'StatTrak™ ' : '' }}{{ result.name }}
        </div>

        <div class="result-wear">
          {{ result.wear }}
          <span class="float">({{ result.float }})</span>
        </div>
      </div>
    </Transition>

    <!-- History -->
    <div v-if="history.length" class="history">
      <div class="history-label">Recent drops</div>

      <div class="history-list">
        <TransitionGroup name="history-item">
          <div
            v-for="(drop, i) in history.slice(0, 6)"
            :key="drop.id"
            class="history-chip"
            :class="`chip-${drop.rarity}`"
          >
            {{ drop.statTrak ? '★ ' : '' }}
            {{ drop.emoji }} {{ drop.shortName }}
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

// ─── Data ────────────────────────────────────────────────────────────────────

const ITEMS = [
  { name: 'MP9 | Modest Threat',           shortName: 'Modest Threat',     emoji: '🔫', rarity: 'consumer',   weight: 30   },
  { name: 'P250 | Ripple',                 shortName: 'Ripple',             emoji: '🔫', rarity: 'consumer',   weight: 28   },
  { name: 'Dual Berettas | Shred',         shortName: 'Shred',              emoji: '🔫', rarity: 'industrial', weight: 22   },
  { name: 'MP7 | Neon Ply',                shortName: 'Neon Ply',           emoji: '🔫', rarity: 'industrial', weight: 20   },
  { name: 'UMP-45 | Primal Saber',         shortName: 'Primal Saber',       emoji: '🔫', rarity: 'milspec',    weight: 14   },
  { name: 'SSG 08 | Fever Dream',          shortName: 'Fever Dream',        emoji: '🔫', rarity: 'milspec',    weight: 12   },
  { name: 'Glock | Chromatic Aberration',  shortName: 'Chromatic Aber.',    emoji: '🔫', rarity: 'restricted', weight: 6    },
  { name: 'AK-47 | Neon Rider',            shortName: 'Neon Rider',         emoji: '🔫', rarity: 'classified', weight: 2.5  },
  { name: 'M4A1-S | Nightmare',            shortName: 'Nightmare',          emoji: '🔫', rarity: 'classified', weight: 2.5  },
  { name: 'AWP | Atheris',                 shortName: 'Atheris',            emoji: '🔫', rarity: 'covert',     weight: 0.64 },
  { name: 'M4A4 | Buzz Kill',              shortName: 'Buzz Kill',          emoji: '🔫', rarity: 'covert',     weight: 0.64 },
  { name: '★ Karambit | Fade',             shortName: '★ Karambit Fade',   emoji: '🗡️', rarity: 'gold',       weight: 0.26 },
]

const RARITY_LABEL = {
  consumer:   'Consumer Grade',
  industrial: 'Industrial Grade',
  milspec:    'Mil-Spec Grade',
  restricted: 'Restricted',
  classified: 'Classified',
  covert:     'Covert',
  gold:       '★ Extraordinary',
}

const RARITY_ORDER = ['consumer','industrial','milspec','restricted','classified','covert','gold']

// ─── Wear System ─────────────────────────────────────────────────────────────

const WEAR_LEVELS = [
  { name: 'Factory New', min: 0.00, max: 0.07 },
  { name: 'Minimal Wear', min: 0.07, max: 0.15 },
  { name: 'Field-Tested', min: 0.15, max: 0.38 },
  { name: 'Well-Worn', min: 0.38, max: 0.45 },
  { name: 'Battle-Scarred', min: 0.45, max: 1.00 },
]

function generateWear() {
  const wear = WEAR_LEVELS[Math.floor(Math.random() * WEAR_LEVELS.length)]
  const float = +(Math.random() * (wear.max - wear.min) + wear.min).toFixed(4)
  return { wear: wear.name, float }
}

function isStatTrak() {
  return Math.random() < 0.1 // 10%
}

// ─── Config ─────────────────────────────────────────────────────────────────

const ITEM_W = 120
const POOL_SIZE = 60
const CONTAINER_W = 640

// ─── State ───────────────────────────────────────────────────────────────────

const trackRef    = ref(null)
const pool        = ref([])
const winnerIndex = ref(-1)
const showWinner  = ref(false)
const spinning    = ref(false)
const result      = ref(null)
const opens       = ref(0)
const bestDrop    = ref('')
const bestRarity  = ref('')
const history     = ref([])
let   historyId   = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weightedRandom() {
  const total = ITEMS.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of ITEMS) {
    r -= item.weight
    if (r <= 0) return item
  }
  return ITEMS.at(-1)
}

function buildPool(winner, idx) {
  pool.value = Array.from({ length: POOL_SIZE }, (_, i) =>
    i === idx ? winner : ITEMS[Math.floor(Math.random() * ITEMS.length)]
  )
  winnerIndex.value = idx
  showWinner.value  = false
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
  spinning.value = true
  result.value   = null
  showWinner.value = false

  const baseWinner = weightedRandom()

  // NEW: apply wear + stattrak
  const wearData = generateWear()
  const finalItem = {
    ...baseWinner,
    wear: wearData.wear,
    float: wearData.float,
    statTrak: isStatTrak()
  }

  const winIdx = Math.floor(POOL_SIZE * 0.70) + Math.floor(Math.random() * 8)

  buildPool(baseWinner, winIdx)

  await new Promise(r => setTimeout(r, 30))

  const el = trackRef.value
  gsap.set(el, { x: 0 })

  const center   = CONTAINER_W / 2
  const targetX  = -(winIdx * ITEM_W + ITEM_W / 2 - center)
  const jitter   = (Math.random() - 0.5) * ITEM_W * 0.5
  const overshoot = targetX + jitter

  await gsap.timeline()
    .to(el, { x: overshoot, duration: 5.0, ease: 'power4.out' })
    .to(el, { x: targetX,   duration: 0.3, ease: 'back.out(2.5)' })

  showWinner.value = true
  result.value     = finalItem

  opens.value++
  updateBest(finalItem)

  history.value.unshift({ ...finalItem, id: ++historyId })
  if (history.value.length > 10) history.value.pop()

  spinning.value = false
}

// ─── Init ────────────────────────────────────────────────────────────────────

onMounted(() => {
  const dummies = Array.from({ length: POOL_SIZE }, () =>
    ITEMS[Math.floor(Math.random() * ITEMS.length)]
  )
  pool.value = dummies
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

/* Subtle top glow */
.bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 30% at 50% 0%, rgba(200,168,75,0.07) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Title ── */
.title-bar {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}
.case-icon {
  font-size: 28px;
  color: #c8a84b;
  margin-bottom: 4px;
  display: block;
}
.title-bar h1 {
  font-family: 'Rajdhani', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #e0c870;
}
.subtitle {
  font-size: 11px;
  letter-spacing: 2px;
  color: #4a5060;
  text-transform: uppercase;
  margin-top: 4px;
}

/* ── Track ── */
.track-container {
  position: relative;
  height: 126px;
  overflow: hidden;
  border-top: 1px solid #1a1e2a;
  border-bottom: 1px solid #1a1e2a;
  background: #060810;
}

.track-fade {
  position: absolute;
  top: 0; bottom: 0;
  width: 140px;
  z-index: 3;
  pointer-events: none;
}
.track-fade-left  { left:  0; background: linear-gradient(to right, #060810, transparent); }
.track-fade-right { right: 0; background: linear-gradient(to left,  #060810, transparent); }

.center-indicator {
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  transform: translateX(-50%);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.indicator-line {
  flex: 1;
  width: 2px;
  background: #e8a020;
  box-shadow: 0 0 10px 2px rgba(232,160,32,0.45);
}
.indicator-arrow {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}
.indicator-top    { border-top:    11px solid #e8a020; }
.indicator-bottom { border-bottom: 11px solid #e8a020; }

.track {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 6px;
  padding: 0 6px;
  will-change: transform;
}

/* ── Items ── */
.item {
  flex-shrink: 0;
  width: 114px;
  height: 112px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8px;
  position: relative;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}
.item-winner { border-color: #e8a020 !important; }

.rarity-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 5px 5px 0 0;
}

.item-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.item-emoji { font-size: 38px; line-height: 1; }
.item-name  { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; text-align: center; line-height: 1.3; max-width: 100px; }

/* Rarity backgrounds */
.bg-consumer   { background: #10141d; }
.bg-industrial { background: #0e1422; }
.bg-milspec    { background: #0c1228; }
.bg-restricted { background: #110c22; }
.bg-classified { background: #130c1e; }
.bg-covert     { background: #1c0c0c; }
.bg-gold       { background: #18140a; }

/* Rarity bar colors */
.rarity-consumer   { background: #b0c3d9; }
.rarity-industrial { background: #5e98d9; }
.rarity-milspec    { background: #4b69ff; }
.rarity-restricted { background: #8847ff; }
.rarity-classified { background: #d32ce6; }
.rarity-covert     { background: #eb4b4b; }
.rarity-gold       { background: linear-gradient(90deg, #e4ae39, #fff07a, #e4ae39); }

/* Rarity text colors */
.col-consumer   { color: #b0c3d9; }
.col-industrial { color: #5e98d9; }
.col-milspec    { color: #4b69ff; }
.col-restricted { color: #8847ff; }
.col-classified { color: #d32ce6; }
.col-covert     { color: #eb4b4b; }
.col-gold       { color: #e4ae39; }

/* ── Result ── */
.result-display {
  text-align: center;
  padding: 1rem 0 0.25rem;
  min-height: 72px;
}
.result-rarity-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 3px;
  margin-bottom: 6px;
}
.badge-consumer   { background: rgba(176,195,217,0.12); color: #b0c3d9; }
.badge-industrial { background: rgba(94,152,217,0.12);  color: #5e98d9; }
.badge-milspec    { background: rgba(75,105,255,0.12);  color: #7080ff; }
.badge-restricted { background: rgba(136,71,255,0.12); color: #a070ff; }
.badge-classified { background: rgba(211,44,230,0.12); color: #e060f0; }
.badge-covert     { background: rgba(235,75,75,0.14);  color: #f07070; }
.badge-gold       { background: rgba(228,174,57,0.14); color: #e4ae39; }

.result-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}
.result-wear {
  font-size: 11px;
  color: #445;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 3px;
}

/* ── Controls ── */
.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
}

.spin-btn {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #b8942e 0%, #e8cc58 50%, #b8942e 100%);
  color: #0a0c10;
  border: none;
  border-radius: 4px;
  padding: 13px 56px;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 16px rgba(200,168,75,0.25);
}
.spin-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(200,168,75,0.4); }
.spin-btn:active:not(:disabled) { transform: scale(0.97); }
.spin-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-spinning { display: flex; align-items: center; gap: 2px; }
.dots::after  { content: '...'; animation: dotdot 1.2s infinite steps(4, end); }
@keyframes dotdot { 0%,100%{content:''}  33%{content:'.'}  66%{content:'..'}  100%{content:'...'} }

/* Stats */
.stats {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #3a404e; }
.stat-value { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #8090a8; }
.stat-divider { width: 1px; height: 28px; background: #1a1e2a; }

/* ── History ── */
.history {
  margin-top: 1.5rem;
  border-top: 1px solid #12151e;
  padding-top: 1rem;
}
.history-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #3a404e;
  margin-bottom: 8px;
}
.history-list { display: flex; flex-wrap: wrap; gap: 6px; }

.history-chip {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 3px;
  border: 1px solid transparent;
}
.chip-consumer   { background: rgba(176,195,217,0.08); border-color: rgba(176,195,217,0.2); color: #b0c3d9; }
.chip-industrial { background: rgba(94,152,217,0.08);  border-color: rgba(94,152,217,0.2);  color: #5e98d9; }
.chip-milspec    { background: rgba(75,105,255,0.08);  border-color: rgba(75,105,255,0.2);  color: #7080ff; }
.chip-restricted { background: rgba(136,71,255,0.08); border-color: rgba(136,71,255,0.2);  color: #a070ff; }
.chip-classified { background: rgba(211,44,230,0.08); border-color: rgba(211,44,230,0.2);  color: #e060f0; }
.chip-covert     { background: rgba(235,75,75,0.08);  border-color: rgba(235,75,75,0.25);  color: #f07070; }
.chip-gold       { background: rgba(228,174,57,0.08); border-color: rgba(228,174,57,0.25); color: #e4ae39; }

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