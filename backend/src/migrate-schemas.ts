import { DataSource } from 'typeorm'
import { Helpdesk } from './modules/helpdesks/entities/helpdesk.entity'

async function migrateSchemas() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'helpdesk',
    password: process.env.DB_PASSWORD || 'helpdesk123',
    database: process.env.DB_DATABASE || 'helpdesk_dev',
    entities: [Helpdesk],
  })
  await ds.initialize()

  const helpdeskRepo = ds.getRepository(Helpdesk)
  const helpdesks = await helpdeskRepo.findBy({ companyId: '1' })

  // Priority field shared across all schemas
  const priorityField = {
    name: 'prioridade',
    type: 'select',
    label: 'Prioridade',
    required: true,
    options: ['Baixa', 'Média', 'Alta'],
  }

  for (const h of helpdesks) {
    const schema = h.schema as any[]
    const hasPrioridade = schema.some((f) => f.name === 'prioridade')
    const hasAssunto = schema.some((f) => f.name === 'assunto' || f.name === 'assunto_do_problema')

    if (!hasPrioridade) {
      schema.unshift(priorityField)
      console.log(`[migrate] Added "prioridade" to helpdesk "${h.name}"`)
    }

    if (h.name === 'TI' && !hasAssunto) {
      schema.unshift({
        name: 'assunto_do_problema',
        type: 'text',
        label: 'Assunto',
        required: true,
      })
      console.log(`[migrate] Added "assunto_do_problema" to helpdesk "${h.name}"`)
    }

    if (h.name === 'Qualidade' && !hasAssunto) {
      schema.unshift({
        name: 'assunto_do_problema',
        type: 'text',
        label: 'Assunto',
        required: true,
      })
      console.log(`[migrate] Added "assunto_do_problema" to helpdesk "${h.name}"`)
    }

    if (h.name === 'Manutenção' && !hasAssunto) {
      schema.unshift({
        name: 'assunto_do_problema',
        type: 'text',
        label: 'Assunto',
        required: true,
      })
      console.log(`[migrate] Added "assunto_do_problema" to helpdesk "${h.name}"`)
    }

    await helpdeskRepo.update(h.id, { schema })
  }

  console.log('\nAll helpdesk schemas updated.')
  await ds.destroy()
}

migrateSchemas().catch((err) => {
  console.error('[migrate] Erro:', err)
  process.exit(1)
})
