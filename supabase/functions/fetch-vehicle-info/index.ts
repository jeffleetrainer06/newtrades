import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(req.url)
    const stock = url.searchParams.get('stock')
    
    if (!stock) {
      return new Response(
        JSON.stringify({ error: "Missing stock parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Looking up stock number: ${stock}`)

    // Fetch Pedersen Toyota's used car search page
    const searchUrl = "https://www.pedersentoyota.com/searchused.aspx"
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    console.log(`Fetched HTML, length: ${html.length}`)

    // Look for the stock number in the HTML content
    let foundVehicle = null

    // Try multiple patterns to find the stock number
    const stockPatterns = [
      new RegExp(`Stock[\\s#:]*${stock}[^\\w]`, 'i'),
      new RegExp(`${stock}`, 'i'),
      new RegExp(`#${stock}`, 'i')
    ]

    let stockFound = false
    for (const pattern of stockPatterns) {
      if (pattern.test(html)) {
        stockFound = true
        console.log(`Found stock number with pattern: ${pattern}`)
        break
      }
    }

    if (stockFound) {
      // Extract vehicle information using various patterns
      // Look for year (4 digits starting with 19 or 20)
      const yearMatch = html.match(/\b(19|20)\d{2}\b/g)
      const year = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear()

      // Look for common Toyota models
      const toyotaModels = [
        'Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Sienna', 'Tacoma', 
        'Tundra', '4Runner', 'Sequoia', 'Avalon', 'Venza', 'C-HR', 'Yaris',
        'Supra', 'GR86', 'Mirai', 'Prius Prime', 'RAV4 Prime', 'Highlander Hybrid'
      ]
      
      let foundModel = ''
      for (const model of toyotaModels) {
        const modelRegex = new RegExp(`\\b${model}\\b`, 'i')
        if (modelRegex.test(html)) {
          foundModel = model
          break
        }
      }

      // Look for VIN pattern
      const vinMatch = html.match(/\b[A-HJ-NPR-Z0-9]{17}\b/)
      const vin = vinMatch ? vinMatch[0] : ''

      // Look for mileage
      const mileagePatterns = [
        /(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi\.?)/i,
        /mileage[:\s]*(\d{1,3}(?:,\d{3})*)/i
      ]
      
      let mileage = 0
      for (const pattern of mileagePatterns) {
        const match = html.match(pattern)
        if (match) {
          mileage = parseInt(match[1].replace(/,/g, ''))
          break
        }
      }

      // Look for price
      const pricePatterns = [
        /\$(\d{1,3}(?:,\d{3})*)/g,
        /price[:\s]*\$?(\d{1,3}(?:,\d{3})*)/i
      ]
      
      let price = 0
      for (const pattern of pricePatterns) {
        const matches = html.match(pattern)
        if (matches) {
          // Get the largest price found (likely the vehicle price)
          const prices = matches.map(match => {
            const numMatch = match.match(/(\d{1,3}(?:,\d{3})*)/)
            return numMatch ? parseInt(numMatch[1].replace(/,/g, '')) : 0
          })
          price = Math.max(...prices.filter(p => p > 5000)) // Filter out small prices
          if (price > 0) break
        }
      }

      // Look for colors
      const colorPatterns = [
        /(?:exterior|ext\.?|outside)\s*(?:color)?[:\s]*([a-zA-Z\s]+)/i,
        /(?:interior|int\.?|inside)\s*(?:color)?[:\s]*([a-zA-Z\s]+)/i
      ]
      
      let exteriorColor = ''
      let interiorColor = ''
      
      const extMatch = html.match(colorPatterns[0])
      if (extMatch) {
        exteriorColor = extMatch[1].trim().split(/[,\n\r]/)[0].trim()
      }
      
      const intMatch = html.match(colorPatterns[1])
      if (intMatch) {
        interiorColor = intMatch[1].trim().split(/[,\n\r]/)[0].trim()
      }

      foundVehicle = {
        stock_number: stock,
        year: year,
        make: 'Toyota',
        model: foundModel || 'Unknown Model',
        trim: '',
        vin: vin,
        mileage: mileage,
        price: price,
        exterior_color: exteriorColor,
        interior_color: interiorColor,
        transmission: '',
        engine: '',
        features: [],
        description: '',
        status: 'active',
        assigned_salesperson: ''
      }

      console.log('Extracted vehicle data:', foundVehicle)
    }

    if (!foundVehicle) {
      console.log('Vehicle not found in HTML')
      return new Response(
        JSON.stringify({ error: "Vehicle not found on website" }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify(foundVehicle),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching vehicle info:', error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch vehicle info", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
