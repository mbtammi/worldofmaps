// Security Checker - Helps diagnose browser security issues
// Add this to your browser console to check for common issues

const SecurityChecker = {
  
  async checkSite() {
    console.log('🔍 Running Security Diagnostics...')
    console.log('='.repeat(50))
    
    this.checkProtocol()
    this.checkMixedContent()
    await this.checkExternalAPIs()
    this.checkSecurityHeaders()
    this.checkCSP()
    
    console.log('='.repeat(50))
    console.log('✅ Security check complete')
  },
  
  checkProtocol() {
    const protocol = window.location.protocol
    console.log(`🌐 Protocol: ${protocol}`)
    
    if (protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('⚠️  Site is not using HTTPS - this can cause security warnings')
    } else {
      console.log('✅ Protocol OK')
    }
  },
  
  checkMixedContent() {
    console.log('\n🔍 Checking for mixed content...')
    
    // Check for HTTP resources on HTTPS site
    const scripts = document.querySelectorAll('script[src]')
    const links = document.querySelectorAll('link[href]')
    const images = document.querySelectorAll('img[src]')
    
    let mixedContent = false
    
    const allElements = Array.from(scripts).concat(Array.from(links)).concat(Array.from(images))
    allElements.forEach(element => {
      const src = element.src || element.href
      if (src && src.startsWith('http://') && window.location.protocol === 'https:') {
        console.warn(`⚠️  Mixed content found: ${src}`)
        mixedContent = true
      }
    })
    
    if (!mixedContent) {
      console.log('✅ No mixed content detected')
    }
  },
  
  async checkExternalAPIs() {
    console.log('\n🌍 Testing external API connections...')
    
    const apiEndpoints = [
      'https://api.worldbank.org/v2/country/US/indicator/NY.GDP.PCAP.CD?format=json&date=2022&per_page=1',
      'https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/population/population.csv',
      'https://data.un.org/ws/rest/data/UNSD,DF_UNS_DEMOGRAPHIC,1.0/all/'
    ]
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, { 
          method: 'HEAD', // Just check if accessible
          mode: 'cors'
        })
        console.log(`✅ ${endpoint.split('/')[2]}: Accessible`)
      } catch (error) {
        console.warn(`⚠️  ${endpoint.split('/')[2]}: ${error.message}`)
        
        if (error.message.includes('CORS')) {
          console.log('   💡 This might be a CORS issue, not a security problem')
        } else if (error.message.includes('net::') || error.message.includes('SSL')) {
          console.warn('   🚨 This could cause Safari security warnings!')
        }
      }
    }
  },
  
  checkSecurityHeaders() {
    console.log('\n🛡️  Checking security headers...')
    
    // This would need to be checked via network tab, but we can check meta tags
    const metaTags = document.querySelectorAll('meta[http-equiv]')
    const securityMetas = Array.from(metaTags).filter(meta => {
      const equiv = meta.getAttribute('http-equiv').toLowerCase()
      return equiv.includes('content-security-policy') ||
             equiv.includes('x-frame-options') ||
             equiv.includes('x-content-type-options') ||
             equiv.includes('x-xss-protection')
    })
    
    if (securityMetas.length > 0) {
      console.log(`✅ Found ${securityMetas.length} security meta tags`)
    } else {
      console.warn('⚠️  No security meta tags found')
    }
  },
  
  checkCSP() {
    console.log('\n📋 Checking Content Security Policy...')
    
    const cspMeta = document.querySelector('meta[http-equiv*="content-security-policy" i]')
    if (cspMeta) {
      console.log('✅ CSP meta tag found')
      console.log(`   Policy: ${cspMeta.content}`)
    } else {
      console.warn('⚠️  No CSP meta tag found (may be in HTTP headers)')
    }
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.SecurityChecker = SecurityChecker
}

// Auto-run on load
console.log('🔧 Security Checker loaded')
console.log('Run SecurityChecker.checkSite() to diagnose issues')

export default SecurityChecker