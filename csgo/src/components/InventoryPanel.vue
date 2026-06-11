<template>
  <div v-if="user" class="inventory">
    <div class="inv-header" @click="open = !open">
      <span>Inventory ({{ items.length }})</span>
      <span>{{ open ? '▲' : '▼' }}</span>
    </div>

    <div v-if="open" class="inv-body">
      <div v-if="loading" class="inv-empty">Loading...</div>
      <div v-else-if="items.length === 0" class="inv-empty">No skins yet.</div>
      <div v-else class="inv-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="inv-card"
          :style="{ borderColor: rarityColor(item.skins.rarity) }"
        >
          <img :src="item.skins.img_url" :alt="item.skins.short_name" @error="e => e.target.style.display='none'" />
          <div class="card-name" :style="{ color: rarityColor(item.skins.rarity) }">
            {{ item.skins.short_name }}
          </div>
          <div class="card-meta">
            <span v-if="item.stat_trak" class="st">ST</span>
            {{ item.wear_label }}
          </div>
          <div class="card-float">{{ item.float_val.toFixed(4) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { supabase, user } from '@/supabase'

const open    = ref(true)
const items   = ref([])
const loading = ref(false)

const RARITY_COLORS = {
  milspec: '#4b69ff',
  restricted: '#8847ff',
  classified: '#d32ce6',
  covert: '#eb4b4b',
  gold: '#e4ae39',
}
function rarityColor(r) { return RARITY_COLORS[r] ?? '#666' }

async function fetchInventory() {
  if (!user.value) { items.value = []; return }
  loading.value = true
  const { data } = await supabase
    .from('inventory')
    .select('id, stat_trak, wear_label, wear_tier, float_val, skins(name, short_name, rarity, img_url)')
    .order('opened_at', { ascending: false })
  items.value = data ?? []
  loading.value = false
}

watch(user, fetchInventory, { immediate: true })

supabase
  .channel('inventory-inserts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory' }, fetchInventory)
  .subscribe()

let poll = setInterval(() => { if (user.value) fetchInventory() }, 3000)
onUnmounted(() => clearInterval(poll))
</script>

<style scoped>
.inventory {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 320px;
  z-index: 999;
  font-family: sans-serif;
  font-size: 12px;
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
}

.inv-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1a1a1a;
  cursor: pointer;
  color: #aaa;
  border-bottom: 1px solid #333;
}
.inv-header:hover { background: #222; }

.inv-body { max-height: 360px; overflow-y: auto; padding: 8px; }

.inv-empty { color: #555; text-align: center; padding: 16px; }

.inv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.inv-card {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.inv-card img {
  width: 70px;
  height: 50px;
  object-fit: contain;
}

.card-name {
  font-size: 9px;
  text-align: center;
  line-height: 1.2;
}

.card-meta {
  font-size: 9px;
  color: #666;
  display: flex;
  gap: 4px;
  align-items: center;
}

.st {
  font-size: 8px;
  background: rgba(207,106,50,0.2);
  color: #cf6a32;
  padding: 1px 3px;
  border-radius: 2px;
}

.card-float {
  font-family: monospace;
  font-size: 8px;
  color: #444;
}
</style>
