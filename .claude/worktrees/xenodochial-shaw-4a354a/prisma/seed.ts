import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Semeando banco de dados com Prisma 7 + PG Adapter...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      marca: {
        create: {
          nomeEmpresa: 'Imobiliária One Star',
          slogan: 'Seu imóvel, nossa estrela',
          corPrimaria: '#7c3aed',
          corSecundaria: '#06b6d4',
          whatsapp: '(11) 99999-9999',
        }
      },
      site: {
        create: {
          slug: 'demo',
          titulo: 'Imobiliária One Star - Portal de Imóveis',
          publicado: true
        }
      },
      imoveis: {
        create: [
          {
            codigo: 'IMV-001',
            titulo: 'Apartamento Luxo Pinheiros',
            tipo: 'APARTAMENTO',
            operacao: 'VENDA',
            preco: 850000,
            quartos: 3,
            banheiros: 2,
            areaM2: 95,
            cidade: 'São Paulo',
            bairro: 'Pinheiros',
            publicado: true,
          },
          {
            codigo: 'IMV-002',
            titulo: 'Casa Vila Madalena',
            tipo: 'CASA',
            operacao: 'VENDA',
            preco: 1200000,
            quartos: 4,
            banheiros: 3,
            areaM2: 180,
            cidade: 'São Paulo',
            bairro: 'Vila Madalena',
            publicado: true,
          }
        ]
      }
    }
  });

  console.log('✅ Tenant demo criado com sucesso:', tenant.id);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
