// Follow this setup guide to integrate the Edge Function:
// https://supabase.com/docs/guides/functions
//
// 1. Create a new function:
//    supabase functions new search-company
//
// 2. Add your PAPPERS_API_KEY to Supabase secrets:
//    supabase secrets set PAPPERS_API_KEY=your_api_key
//
// 3. Deploy the function:
//    supabase functions deploy search-company

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PAPPERS_API_KEY = Deno.env.get('PAPPERS_API_KEY')
    if (!PAPPERS_API_KEY) {
      throw new Error('PAPPERS_API_KEY is not set')
    }

    const { query, type } = await req.json()
    const baseUrl = 'https://api.pappers.fr/v2'
    let url = ''

    if (type === 'siret') {
      url = `${baseUrl}/entreprise?api_token=${PAPPERS_API_KEY}&siret=${query}`
    } else if (type === 'siren') {
      url = `${baseUrl}/entreprise?api_token=${PAPPERS_API_KEY}&siren=${query}`
    } else if (type === 'search') {
      url = `${baseUrl}/recherche?api_token=${PAPPERS_API_KEY}&q=${encodeURIComponent(query)}&longueur=10`
    } else {
      throw new Error('Invalid search type')
    }

    const response = await fetch(url)
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
