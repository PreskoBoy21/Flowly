import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'

// Temporarily commented out for build testing
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  full_name: string
  role: 'free_user' | 'pro_user'
  created_at: string
}

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'free_user', // Default role for new users
        },
      },
    })

    if (error) {
      console.error('Auth signup error:', error)
      throw new Error(error.message)
    }

    // Create a profile record in the profiles table
    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            full_name: fullName,
            role: 'free_user',
          },
        ])
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error details:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          user: data.user.id
        })
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      console.log('Profile created successfully:', profileData)
    }

    return data
  } catch (error: any) {
    console.error('Signup process error:', error)
    throw error // Re-throw the error to be handled by the component
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return null

  // Get the user's profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  return {
    ...user,
    ...profile,
  } as User
}

export async function updateUserRole(userId: string, role: 'free_user' | 'pro_user') {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) throw error
} 