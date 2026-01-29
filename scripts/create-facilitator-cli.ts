#!/usr/bin/env tsx

/**
 * Non-interactive script to create a facilitator account
 *
 * Usage:
 *   npx tsx scripts/create-facilitator-cli.ts <email> <password> [name]
 *
 * Example:
 *   npx tsx scripts/create-facilitator-cli.ts admin@example.com mypassword123 "Admin User"
 */

import { createFacilitatorAccount } from '../src/lib/facilitator-session'

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/create-facilitator-cli.ts <email> <password> [name]')
    console.error('\nExample:')
    console.error('  npx tsx scripts/create-facilitator-cli.ts admin@example.com mypassword123 "Admin User"')
    process.exit(1)
  }

  const [email, password, name] = args

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters')
    process.exit(1)
  }

  console.log('Creating facilitator account...')
  console.log(`Email: ${email}`)
  if (name) console.log(`Name: ${name}`)

  const result = await createFacilitatorAccount(email, password, name)

  if (result.success) {
    console.log('\n✓ Facilitator account created successfully!')
    console.log(`  ID: ${result.facilitatorId}`)
    console.log('\nYou can now log in at: http://localhost:3000/admin/login')
  } else {
    console.error(`\n✗ Failed to create account: ${result.error}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
