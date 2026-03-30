// Simple smoke test for registration/auth data layer (runs without Next.js runtime)
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Load .env manually to avoid extra deps
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*)"?$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  }
}

async function run() {
  const prisma = new PrismaClient()

  const email = `cli-smoke-${Date.now()}@example.com`
  const password = 'senhaSegura1'
  const hash = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: { name: 'CLI Smoke Co', documentNumber: `SMK-${Date.now()}` },
    select: { id: true },
  })

  const user = await prisma.user.create({
    data: { fullName: 'CLI Smoke', email, password: hash },
    select: { id: true, password: true },
  })

  await prisma.tenantUser.create({
    data: { tenantId: tenant.id, userId: user.id, role: 'admin' },
  })

  const dup = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = await bcrypt.compare(password, dup.password || '')

  let duplicateErrorCode = 'none'
  try {
    await prisma.user.create({ data: { fullName: 'Dup', email, password: hash } })
  } catch (e) {
    duplicateErrorCode = e.code || e.message
  }

  await prisma.$disconnect()

  return {
    email,
    tenantId: tenant.id,
    userId: user.id,
    storedPasswordPreview: dup.password?.slice(0, 20) + '...',
    passwordMatches,
    duplicateErrorCode,
  }
}

run()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
