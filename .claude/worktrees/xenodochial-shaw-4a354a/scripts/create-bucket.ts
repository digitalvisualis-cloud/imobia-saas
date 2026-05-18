import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Criando bucket "imoveis" no Supabase...');
  
  const { data, error } = await supabase.storage.createBucket('imoveis', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Bucket "imoveis" já existe e está configurado!');
    } else {
      console.error('❌ Erro ao criar bucket:', error);
    }
  } else {
    console.log('✅ Bucket "imoveis" criado com sucesso!');
  }
}

main();
