import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, password, tipoAccount } = body;

    if (!nome || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verifica se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    // Gera slug único para o tenant
    const baseSlug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);

    let slug = baseSlug;
    let slugTaken = await prisma.tenant.findUnique({ where: { slug } });
    let i = 1;
    while (slugTaken) {
      slug = `${baseSlug}-${i++}`;
      slugTaken = await prisma.tenant.findUnique({ where: { slug } });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Cria tenant + user + config_marca + agente em transação
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { slug, plano: 'FREE' },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          nome,
          passwordHash,
          role: 'ADMIN',
        },
      });

      await tx.configMarca.create({
        data: { tenantId: tenant.id, nomeEmpresa: nome },
      });

      await tx.agenteIA.create({
        data: { tenantId: tenant.id },
      });

      await tx.site.create({
        data: { tenantId: tenant.id, slug },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      { message: 'Conta criada com sucesso', tenantId: result.tenant.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro no signup:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
