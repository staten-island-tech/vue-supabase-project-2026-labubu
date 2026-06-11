<template>
  <div class="auth">
    <button v-if="!user && !open" class="auth-btn" @click="open = true">Sign In</button>

    <div v-if="user" class="user-bar">
      <span>{{ user.email }}</span>
      <button @click="signOut">Sign Out</button>
    </div>

    <div v-if="open && !user" class="auth-form">
      <div class="auth-form-header">
        <span>{{ isLogin ? 'Sign In' : 'Create Account' }}</span>
        <button @click="open = false">✕</button>
      </div>

      <input v-model="email" type="email" placeholder="Email" @keyup.enter="submit" />
      <span v-if="errors.email" class="err">{{ errors.email }}</span>

      <input v-model="password" type="password" placeholder="Password" @keyup.enter="submit" />
      <span v-if="errors.password" class="err">{{ errors.password }}</span>

      <input v-if="!isLogin" v-model="confirm" type="password" placeholder="Confirm password" @keyup.enter="submit" />
      <span v-if="errors.confirm" class="err">{{ errors.confirm }}</span>

      <span v-if="globalError" class="err">{{ globalError }}</span>

      <button :disabled="loading" @click="submit">
        {{ loading ? '...' : isLogin ? 'Sign In' : 'Register' }}
      </button>

      <button class="switch" @click="switchMode">
        {{ isLogin ? 'No account? Create one' : 'Already registered? Sign in' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase, user } from '@/supabase'

const open        = ref(false)
const isLogin     = ref(true)
const email       = ref('')
const password    = ref('')
const confirm     = ref('')
const loading     = ref(false)
const globalError = ref('')
const errors      = ref({ email: '', password: '', confirm: '' })

function validate() {
  errors.value = { email: '', password: '', confirm: '' }
  let ok = true
  if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) { errors.value.email = 'Enter a valid email'; ok = false }
  if (!password.value || password.value.length < 6) { errors.value.password = 'Min 6 characters'; ok = false }
  if (!isLogin.value && password.value !== confirm.value) { errors.value.confirm = "Passwords don't match"; ok = false }
  return ok
}

async function submit() {
  globalError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    if (isLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
      if (error) throw error
      await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    }
    open.value = false
  } catch (err) {
    globalError.value = err.message ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}

function signOut() { supabase.auth.signOut() }

function switchMode() {
  isLogin.value = !isLogin.value
  globalError.value = ''
  errors.value = { email: '', password: '', confirm: '' }
  confirm.value = ''
}
</script>

<style scoped>
.auth {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  font-family: sans-serif;
  font-size: 13px;
}

.auth-btn, .user-bar button, .auth-form button {
  padding: 6px 12px;
  background: #222;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
}
.auth-btn:hover, .user-bar button:hover, .auth-form button:hover { background: #333; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

.user-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #aaa;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 14px;
  width: 240px;
}

.auth-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ccc;
  margin-bottom: 4px;
}
.auth-form-header button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px 6px;
}

.auth-form input {
  padding: 7px 10px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  outline: none;
}
.auth-form input:focus { border-color: #555; }

.err { font-size: 11px; color: #e05; }

.switch {
  background: none !important;
  border: none !important;
  color: #666 !important;
  font-size: 11px;
  cursor: pointer;
  padding: 0 !important;
  text-align: left;
}
.switch:hover { color: #999 !important; }
</style>