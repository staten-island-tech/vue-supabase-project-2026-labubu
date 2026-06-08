<template>
  <div class="auth-overlay">
    <!-- Collapsed: just the avatar/login button -->
    <div v-if="!panelOpen && !user" class="auth-trigger" @click="panelOpen = true">
      <div class="trigger-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <span class="trigger-label">SIGN IN</span>
    </div>

    <!-- Logged in: user chip -->
    <div v-if="!panelOpen && user" class="user-chip">
      <div class="user-avatar">{{ userInitial }}</div>
      <div class="user-info">
        <span class="user-email">{{ userShortEmail }}</span>
        <button class="signout-btn" @click="signOut">SIGN OUT</button>
      </div>
    </div>

    <!-- Auth panel -->
    <Transition name="panel-slide">
      <div v-if="panelOpen && !user" class="auth-panel">
        <div class="panel-header">
          <div class="panel-logo">
            <div class="logo-diamond" />
            <span>{{ isLogin ? 'SIGN IN' : 'CREATE ACCOUNT' }}</span>
          </div>
          <button class="close-btn" @click="panelOpen = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="panel-body">
          <div class="field-group">
            <label class="field-label">EMAIL</label>
            <div class="field-wrap" :class="{ 'field-error': errors.email }">
              <svg class="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                v-model="email"
                type="email"
                placeholder="operator@steam.gg"
                class="field-input"
                @keyup.enter="submit"
                @input="errors.email = ''"
              />
            </div>
            <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
          </div>

          <div class="field-group">
            <label class="field-label">PASSWORD</label>
            <div class="field-wrap" :class="{ 'field-error': errors.password }">
              <svg class="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••••••"
                class="field-input"
                @keyup.enter="submit"
                @input="errors.password = ''"
              />
              <button class="toggle-pass" @click="showPass = !showPass" tabindex="-1">
                <svg v-if="!showPass" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
          </div>

          <div v-if="!isLogin" class="field-group">
            <label class="field-label">CONFIRM PASSWORD</label>
            <div class="field-wrap" :class="{ 'field-error': errors.confirm }">
              <svg class="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <input
                v-model="confirm"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••••••"
                class="field-input"
                @keyup.enter="submit"
                @input="errors.confirm = ''"
              />
            </div>
            <span v-if="errors.confirm" class="error-msg">{{ errors.confirm }}</span>
          </div>

          <!-- Global error -->
          <Transition name="fade-err">
            <div v-if="globalError" class="global-error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ globalError }}
            </div>
          </Transition>


          <button class="submit-btn" :disabled="loading" @click="submit">
            <span v-if="!loading">{{ isLogin ? 'ENTER' : 'REGISTER' }}</span>
            <span v-else class="loading-dots">
              <span /><span /><span />
            </span>
          </button>

          <div class="panel-footer">
            <button class="switch-mode" @click="switchMode">
              {{ isLogin ? "No account? Create one" : "Already registered? Sign in" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://siasdkjwazfburpiqwwx.supabase.co'
const SUPABASE_KEY  = 'sb_publishable_j_iXanjsA27YUpgJc9idOw_F1OrMAI-'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── State ──────────────────────────────────────────────────────────────────
const panelOpen   = ref(false)
const isLogin     = ref(true)
const email       = ref('')
const password    = ref('')
const confirm     = ref('')
const showPass    = ref(false)
const loading     = ref(false)
const globalError = ref('')
const errors      = ref({ email: '', password: '', confirm: '' })
const user        = ref(null)

// ── Check existing session ─────────────────────────────────────────────────
supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null
})
supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
  if (user.value) panelOpen.value = false
})

// ── Computed ───────────────────────────────────────────────────────────────
const userInitial   = computed(() => user.value?.email?.[0]?.toUpperCase() ?? '?')
const userShortEmail = computed(() => {
  const e = user.value?.email ?? ''
  return e.length > 18 ? e.slice(0, 15) + '…' : e
})

// ── Methods ────────────────────────────────────────────────────────────────
function validate() {
  errors.value = { email: '', password: '', confirm: '' }
  let ok = true
  if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = 'Enter a valid email'; ok = false
  }
  if (!password.value || password.value.length < 6) {
    errors.value.password = 'Min 6 characters'; ok = false
  }
  if (!isLogin.value && password.value !== confirm.value) {
    errors.value.confirm = "Passwords don't match"; ok = false
  }
  return ok
}

async function submit() {
  globalError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    if (isLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (signUpError) throw signUpError
      // Auto sign-in immediately after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (signInError) throw signInError
    }
  } catch (err) {
    globalError.value = err.message ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}

async function signOut() {
  await supabase.auth.signOut()
}

function switchMode() {
  isLogin.value     = !isLogin.value
  globalError.value = ''
  errors.value      = { email: '', password: '', confirm: '' }
  confirm.value     = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Barlow:wght@400;500&display=swap');

.auth-overlay {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  font-family: 'Barlow', sans-serif;
}

/* ── Trigger button ── */
.auth-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(8, 11, 18, 0.92);
  border: 1px solid rgba(200, 168, 75, 0.25);
  border-radius: 4px;
  padding: 8px 14px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  backdrop-filter: blur(8px);
}
.auth-trigger:hover {
  border-color: rgba(200, 168, 75, 0.6);
  box-shadow: 0 0 16px rgba(200, 168, 75, 0.15);
}
.trigger-icon { color: #c8a84b; display: flex; }
.trigger-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: #c8a84b;
}

/* ── User chip ── */
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(8, 11, 18, 0.92);
  border: 1px solid rgba(200, 168, 75, 0.25);
  border-radius: 4px;
  padding: 7px 14px 7px 10px;
  backdrop-filter: blur(8px);
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  background: linear-gradient(135deg, #b8942e, #e8cc58);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #080b12;
  flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-email { font-size: 11px; color: #8090a8; letter-spacing: 0.5px; }
.signout-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #c8a84b;
  text-align: left;
  transition: color 0.2s;
}
.signout-btn:hover { color: #eb4b4b; }

/* ── Panel ── */
.auth-panel {
  width: 300px;
  background: rgba(6, 8, 16, 0.97);
  border: 1px solid rgba(200, 168, 75, 0.2);
  border-radius: 6px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(200, 168, 75, 0.05) inset;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(200, 168, 75, 0.1);
  background: rgba(200, 168, 75, 0.04);
}
.panel-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #c8a84b;
}
.logo-diamond {
  width: 8px;
  height: 8px;
  background: #c8a84b;
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(200, 168, 75, 0.6);
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a5060;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 3px;
  transition: color 0.2s, background 0.2s;
}
.close-btn:hover { color: #eb4b4b; background: rgba(235, 75, 75, 0.1); }

.panel-body { padding: 18px 16px 16px; display: flex; flex-direction: column; gap: 12px; }

/* ── Fields ── */
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #4a5060;
}
.field-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #1a1e2a;
  border-radius: 4px;
  padding: 0 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-wrap:focus-within {
  border-color: rgba(200, 168, 75, 0.4);
  box-shadow: 0 0 0 2px rgba(200, 168, 75, 0.06);
}
.field-wrap.field-error { border-color: rgba(235, 75, 75, 0.5); }
.field-icon { color: #4a5060; flex-shrink: 0; }
.field-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: #c8d4e8;
  padding: 9px 0;
  min-width: 0;
}
.field-input::placeholder { color: #2a3040; }
.toggle-pass {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a5060;
  display: flex;
  padding: 0;
  transition: color 0.2s;
}
.toggle-pass:hover { color: #c8a84b; }
.error-msg { font-size: 10px; color: #eb4b4b; letter-spacing: 0.5px; padding-left: 2px; }

/* ── Alerts ── */
.global-error, .global-success {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.3px;
}
.global-error {
  background: rgba(235, 75, 75, 0.1);
  border: 1px solid rgba(235, 75, 75, 0.25);
  color: #f07070;
}
.global-success {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

/* ── Submit ── */
.submit-btn {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #b8942e 0%, #e8cc58 50%, #b8942e 100%);
  color: #080b12;
  border: none;
  border-radius: 4px;
  padding: 11px;
  width: 100%;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 2px 16px rgba(200, 168, 75, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}
.submit-btn:hover:not(:disabled) {
  box-shadow: 0 4px 24px rgba(200, 168, 75, 0.4);
  transform: translateY(-1px);
}
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Loading dots */
.loading-dots { display: flex; gap: 5px; align-items: center; }
.loading-dots span {
  width: 6px; height: 6px;
  background: #080b12;
  border-radius: 50%;
  animation: pulse-dot 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse-dot {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Footer ── */
.panel-footer { display: flex; justify-content: center; }
.switch-mode {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Barlow', sans-serif;
  font-size: 11px;
  color: #4a5060;
  letter-spacing: 0.5px;
  padding: 4px;
  transition: color 0.2s;
}
.switch-mode:hover { color: #c8a84b; }

/* ── Transitions ── */
.panel-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.panel-slide-leave-active {
  transition: all 0.18s ease-in;
}
.panel-slide-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.fade-err-enter-active, .fade-err-leave-active { transition: all 0.2s ease; }
.fade-err-enter-from, .fade-err-leave-to { opacity: 0; transform: translateY(-4px); }
</style>