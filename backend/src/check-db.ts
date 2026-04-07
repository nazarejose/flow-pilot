import { DataSource } from 'typeorm'
import { Company } from './modules/companies/entities/company.entity'
import { Sector } from './modules/sectors/entities/sector.entity'
import { Helpdesk } from './modules/helpdesks/entities/helpdesk.entity'

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'helpdesk',
    password: 'helpdesk123',
    database: 'helpdesk_dev',
    entities: [Company, Sector, Helpdesk],
    synchronize: true,
  })
  await ds.initialize()

  const companies = await ds.getRepository(Company).find()
  console.log('Companies:', companies.length)

  for (const c of companies) {
    const sectors = await ds.getRepository(Sector).findBy({ companyId: c.id })
    console.log(`  Sectors for ${c.name}: ${sectors.map((s) => s.name).join(', ')}`)

    const helpdesks = await ds.getRepository(Helpdesk).find({ where: { companyId: c.id } })
    console.log(`  Helpdesks for ${c.name}: ${helpdesks.map((h) => h.name + ' (pub:' + h.published + ')').join(', ')}`)
  }

  const permResult = await ds.manager.query('SELECT COUNT(*) FROM helpdesk_companies')
  console.log('Junction entries:', permResult[0])

  await ds.destroy()
}

main().catch(console.error)
