#!/usr/bin/env tsx

/**
 * Script to create a facilitator account
 *
 * Usage:
 *   npm run create-facilitator
 *   or
 *   npx tsx scripts/create-facilitator.ts
 */

import { createFacilitatorAccount } from '../src/lib/facilitator-session'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('=== Create Facilitator Account ===\n')

  const email = await question('Email: ')
  const name = await question('Name (optional): ')
  const password = await question('Password: ')
  const confirmPassword = await question('Confirm password: ')

  if (password !== confirmPassword) {
    console.error('\nError: Passwords do not match')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('\nError: Password must be at least 8 characters')
    process.exit(1)
  }

  console.log('\nCreating facilitator account...')

  const result = await createFacilitatorAccount(
    email,
    password,
    name || undefined
  )

  if (result.success) {
    console.log('\n✓ Facilitator account created successfully!')
    console.log(`  Email: ${email}`)
    console.log(`  ID: ${result.facilitatorId}`)
    console.log('\nYou can now log in at: http://localhost:3000/admin/login')
  } else {
    console.error(`\n✗ Failed to create account: ${result.error}`)
    process.exit(1)
  }

  rl.close()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
