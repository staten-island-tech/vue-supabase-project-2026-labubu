
<script setup>
import { ref } from 'vue'
const milspec = [
  { name: 'P2000 | Lifted Spirits' },
  { name: 'Five-SeveN | Scrawl' },
  { name: 'MAC-10 | Ensnared' },
  { name: 'MP5-SD | Necro Jr.' },
  { name: 'Sawed-Off | Spirit Board' },
  { name: 'MAG-7 | Foresight' },
  { name: 'SCAR-20 | Poultrygeist' }
]

const restricted = [
  { name: 'USP-S | Ticket to Hell' },
  { name: 'G3SG1 | Dream Glade' },
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

    <button class="reset-button" @click="reset">Reset</button>

    <div class="results">
      <h2>Results</h2>
      <ul>
        <li v-for="(item, i) in results" :key="i" :class="'rarity-' + item.rarity">
          {{ item.name }} — {{ item.rarity }}
        </li>
      </ul>
    </div>
  </div>

  <div class="button-group">
  <button class="btn btn-single" @click="singlepull">Open Case</button>
  <button class="btn btn-ten" @click="tenpull">Open 10 Cases</button>
</div>
</template>
<style scoped>
/* Base Layout */
.container {
  max-width: 600px;
  margin: 20px auto;
  font-family: 'Segoe UI', Roboto, sans-serif;
  background: #1b1e23;
  color: #e0e0e0;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* Stats and Titles */
.stats {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #888;
}

h2 {
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

/* Button Group Styling */
.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn, .reset-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s, filter 0.2s;
}

.btn-single { background: #4b69ff; color: white; }
.btn-ten { background: #eb4b4b; color: white; }
.reset-button { background: #333; color: #999; margin-bottom: 1rem; }

.btn:hover, .reset-button:hover {
  filter: brightness(1.2);
}

.btn:active {
  transform: scale(0.95);
}

/* Results List */
.results ul {
  list-style: none;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
}

.results li {
  padding: 10px;
  margin: 5px 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 5px solid transparent;
  display: flex;
  justify-content: space-between;
}

/* Rarity Colors (CS:GO Standards) */
.rarity-Mil-Spec { border-left-color: #4b69ff; color: #4b69ff; }     /* Blue */
.rarity-Restricted { border-left-color: #8847ff; color: #8847ff; }   /* Purple */
.rarity-Classified { border-left-color: #d32ce6; color: #d32ce6; }   /* Pink/Cerise */
.rarity-Covert { border-left-color: #eb4b4b; color: #eb4b4b; }       /* Red */
.rarity-Gold { 
  border-left-color: #ffae00; 
  color: #ffae00; 
  font-weight: bold;
  background: rgba(255, 174, 0, 0.1); 
}</style>