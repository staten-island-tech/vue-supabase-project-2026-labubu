
<script setup>
import { ref } from 'vue'

const milspec = [
  { name: 'MP7 | Abyss' },
  { name: 'Glock-18 | Grinder' },
  { name: 'Nova | Koi' }
]

const restricted = [
  { name: 'USP-S | Ticket to Hell' },
  { name: 'G3SG1 | Dream Glade' }
  { name: 'M4A1-S | Night Terror' },
  { name: 'PP-Bizon | Space Cat' },
  { name: 'XM1014 | Zombie Offensive' },

]

const classified = [
  { name: 'Dual Berettas | Melondrama' },
  { name: 'MP7 | Abyssal Apparition' },
  { name: 'FAMAS | Rapid Eye Movement' }
]

const covert = [
  { name: 'MP9 | Starlight Protector' },
  { name: 'AK-47 | Nightwish' }
]

const gold = [
  { name: '★ Butterfly Knife | Gamma Doppler' },
  { name: '★ Butterfly Knife | Lore' },
  { name: '★ Butterfly Knife | Autotronic' },
  { name: '★ Butterfly Knife | Black Laminate' },
  { name: '★ Butterfly Knife | Freehand' },
  { name: '★ Huntsman Knife | Gamma Doppler' },
  { name: '★ Butterfly Knife | Bright Water' },
  { name: '★ Falchion Knife | Gamma Doppler' },
  { name: '★ Bowie Knife | Gamma Doppler' },
  { name: '★ Shadow Daggers | Gamma Doppler' },
  { name: '★ Bowie Knife | Lore' },
  { name: '★ Falchion Knife | Autotronic' },
  { name: '★ Huntsman Knife | Lore' },
  { name: '★ Falchion Knife | Lore' },
  { name: '★ Bowie Knife | Autotronic' },
  { name: '★ Huntsman Knife | Black Laminate' },
  { name: '★ Falchion Knife | Black Laminate' },
  { name: '★ Bowie Knife | Black Laminate' },
  { name: '★ Falchion Knife | Freehand' },
  { name: '★ Huntsman Knife | Freehand' },
  { name: '★ Falchion Knife | Bright Water' },
  { name: '★ Bowie Knife | Freehand' },
  { name: '★ Shadow Daggers | Autotronic' },
  { name: '★ Huntsman Knife | Bright Water' },
  { name: '★ Bowie Knife | Bright Water' },
  { name: '★ Shadow Daggers | Freehand' },
  { name: '★ Shadow Daggers | Bright Water' }
]

const pulls = ref(0)
const results = ref([])

const rates = [
  { rarity: 'Gold', chance: 0.0026, pool: gold },
  { rarity: 'Covert', chance: 0.0064, pool: covert },
  { rarity: 'Classified', chance: 0.032, pool: classified },
  { rarity: 'Restricted', chance: 0.1598, pool: restricted },
  { rarity: 'Mil-Spec', chance: 0.7992, pool: milspec }
]

function rollItem() {
  const r = Math.random()
  let cumulative = 0

  for (const tier of rates) {
    cumulative += tier.chance
    if (r < cumulative) {
      const item = tier.pool[Math.floor(Math.random() * tier.pool.length)]
      return { name: item.name, rarity: tier.rarity }
    }
  }

  return { name: 'Unknown Item', rarity: 'Mil-Spec' }
}

function singlepull() {
  pulls.value++
  results.value.unshift(rollItem())
}

function tenpull() {
  for (let i = 0; i < 10; i++) {
    singlepull()
  }
}

function reset() {
  pulls.value = 0
  results.value = []
}
</script>
<template>
  <div class="container">
    <div class="stats">
      <p class="pulls">Opens: {{ pulls }}</p>
    </div>

    <button @click="reset">Reset</button>

    <div class="results">
      <h2>Results</h2>
      <ul>
        <li v-for="(item, i) in results" :key="i" :class="'rarity-' + item.rarity">
          {{ item.name }} — {{ item.rarity }}
        </li>
      </ul>
    </div>
  </div>

  <img class="single-pull-button" @click="singlepull" src="data:image/png;base64,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" />
  <img class="ten-pull-button" @click="tenpull" src="data:image/png;base64,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" />
</template>