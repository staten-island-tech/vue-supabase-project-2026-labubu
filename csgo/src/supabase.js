import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://siasdkjwazfburpiqwwx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_j_iXanjsA27YUpgJc9idOw_F1OrMAI-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const user = ref(null)

supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null
})

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
})
