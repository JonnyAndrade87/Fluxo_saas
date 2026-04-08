import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sendEmail, buildWelcomeEmailHtml } from '@/lib/messaging/email'

type RegisterBody = {
  name?: string
  company?: string
  companyName?: string
  cnpj?: string
  email?: string
  password?: string
}

const MIN_PASSWORD_LENGTH = 6

function validate(payload: RegisterBody) {
  const name = payload.name?.trim()
  const company = (payload.company ?? payload.companyName)?.trim()
  const cnpj = payload.cnpj?.trim()
  const email = payload.email?.trim().toLowerCase()
  const password = payload.password ?? ''

  if (!name || !company || !cnpj || !email || !password) {
    return { ok: false as const, error: 'Todos os campos são obrigatórios.' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false as const, error: 'A senha deve ter ao menos 6 caracteres.' }
  }

  return { ok: true as const, data: { name, company, cnpj, email, password } }
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as RegisterBody
    const result = validate(json)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const { name, company, cnpj, email, password } = result.data

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { tenantId, userId } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: company,
          documentNumber: cnpj,
        },
        select: { id: true },
      })

      const user = await tx.user.create({
        data: {
          fullName: name,
          email,
          password: hashedPassword,
        },
        select: { id: true },
      })

      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'admin',
        },
      })

      return { tenantId: tenant.id, userId: user.id }
    })

    // Await obrigatório em Vercel Serverless Functions para o email sair antes de retornar a resposta
    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao Fluxo',
      html: buildWelcomeEmailHtml({
        name: name || 'Usuário',
        companyName: company || 'Sua Empresa',
        email,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fluxeer.com.br'}/onboarding`
      }),
    }).catch(err => console.error("Erro ao disparar welcome email (Credentials):", err));

    return NextResponse.json({ success: true, tenantId, userId }, { status: 201 })
  } catch (error) {
    console.error('Registration API error:', error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Empresa ou e-mail já cadastrados.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
