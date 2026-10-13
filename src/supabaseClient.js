import { createClient } from '@supabase/supabase-js'

// Replace these placeholders with your actual keys from Supabase Settings -> API
const supabaseUrl = 'https://nwbjzcmlgtdzakmgslez.supabase.co'
const supabaseAnonKey = 'sb_publishable_x6TIbWkKOZ3JRnkPvdMFtw_A23R12wH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)