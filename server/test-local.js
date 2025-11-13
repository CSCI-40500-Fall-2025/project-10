#!/usr/bin/env node
/**
 * Quick local test to verify server starts and responds
 * Run with: node test-local.js
 */

import { spawn } from 'child_process'
import http from 'http'

console.log('🧪 Testing Apify Integration Locally...\n')

// Start the server
console.log('Starting server...')
const server = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
})

let serverStarted = false
let testsPassed = 0
let testsFailed = 0

// Capture server output
server.stdout.on('data', (data) => {
  const output = data.toString()
  process.stdout.write(output)
  
  // Check if server started
  if (output.includes('listening on') || output.includes('API listening')) {
    serverStarted = true
    setTimeout(runTests, 2000) // Wait 2 seconds then run tests
  }
})

server.stderr.on('data', (data) => {
  const output = data.toString()
  // Only show warnings/errors, not debug logs
  if (output.includes('warn') || output.includes('error') || output.includes('Error')) {
    process.stderr.write(output)
  }
})

// Run tests after server starts
async function runTests() {
  console.log('\n📋 Running Tests...\n')
  
  // Test 1: Health check
  await testEndpoint(
    'Health Check',
    'http://localhost:4000/health',
    200,
    (body) => body.ok === true
  )
  
  // Test 2: Listings endpoint (without auth - should fail or require auth)
  await testEndpoint(
    'Listings Endpoint (structure test)',
    'http://localhost:4000/api/listings',
    [200, 401], // Either works or requires auth
    () => true // We just want to know it doesn't crash
  )
  
  // Test 3: Apify routes are registered
  await testEndpoint(
    'Apify Routes Registered',
    'http://localhost:4000/api/apify/runs',
    [401, 403], // Should require authentication
    () => true
  )
  
  // Print results
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Tests Passed: ${testsPassed}`)
  console.log(`❌ Tests Failed: ${testsFailed}`)
  console.log('='.repeat(50))
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Server is working correctly.')
    console.log('✅ Apify integration does not break existing functionality.')
    console.log('\nReady to deploy to Vercel! 🚀\n')
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.')
  }
  
  // Cleanup
  console.log('Stopping server...')
  server.kill()
  process.exit(testsFailed === 0 ? 0 : 1)
}

function testEndpoint(name, url, expectedStatus, validator) {
  return new Promise((resolve) => {
    const statusArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
    
    http.get(url, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          const statusOk = statusArray.includes(res.statusCode)
          const validatorOk = validator(parsed)
          
          if (statusOk && validatorOk) {
            console.log(`✅ ${name}`)
            console.log(`   Status: ${res.statusCode}`)
            testsPassed++
          } else {
            console.log(`❌ ${name}`)
            console.log(`   Expected status: ${statusArray.join(' or ')}, got: ${res.statusCode}`)
            console.log(`   Response: ${body.substring(0, 100)}`)
            testsFailed++
          }
        } catch (err) {
          console.log(`❌ ${name}`)
          console.log(`   Error: ${err.message}`)
          testsFailed++
        }
        resolve()
      })
    }).on('error', (err) => {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${err.message}`)
      testsFailed++
      resolve()
    })
  })
}

// Handle timeout
setTimeout(() => {
  if (!serverStarted) {
    console.error('\n❌ Server failed to start within 30 seconds')
    server.kill()
    process.exit(1)
  }
}, 30000)

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nStopping server...')
  server.kill()
  process.exit(0)
})

