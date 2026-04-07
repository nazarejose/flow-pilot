import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { Company } from './modules/companies/entities/company.entity'
import { Sector } from './modules/sectors/entities/sector.entity'
import { User } from './modules/users/entities/user.entity'
import { Helpdesk } from './modules/helpdesks/entities/helpdesk.entity'
import { HelpdeskCompany } from './modules/helpdesks/entities/helpdesk-company.entity'
import { Role } from './shared/enums/role.enum'

const FULL_RESET = process.argv.includes('--full-reset')

const sectorConfigs = [
  { name: 'Tecnologia da Informação', shortCode: 'ti' },
  { name: 'Recursos Humanos', shortCode: 'rh' },
  { name: 'Manutenção', shortCode: 'manutencao' },
  { name: 'Qualidade', shortCode: 'qualidade' },
]

const helpdeskSchemas = [
  [ // TI
    { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true, options: ['Hardware', 'Software', 'Rede', 'Acesso'] },
    { name: 'ativo_relacionado', type: 'text', label: 'Ativo Relacionado', required: true },
    { name: 'sistema_operacional', type: 'text', label: 'Sistema Operacional', required: false },
    { name: 'mensagem_erro', type: 'textarea', label: 'Mensagem de Erro', required: false },
  ],
  [ // RH
    { name: 'assunto', type: 'select', label: 'Assunto', required: true, options: ['Férias', 'Benefícios', 'Ponto Eletrônico', 'Recrutamento', 'Treinamento'] },
    { name: 'matricula', type: 'text', label: 'Matrícula do Funcionário', required: true },
    { name: 'documentos', type: 'textarea', label: 'Anexo de Documentos', required: false },
    { name: 'data_desejada', type: 'date', label: 'Data Desejada para Resolução', required: false },
  ],
  [ // Manutenção
    { name: 'local_afetado', type: 'text', label: 'Local/Área Afetada', required: true },
    { name: 'tipo_manutencao', type: 'select', label: 'Tipo de Manutenção', required: true, options: ['Elétrica', 'Hidráulica', 'Civil', 'Equipamentos'] },
    { name: 'gravidade', type: 'select', label: 'Gravidade do Dano', required: true, options: ['Leve', 'Moderado', 'Grave', 'Crítico'] },
    { name: 'interdicao', type: 'select', label: 'Necessidade de Interdição', required: true, options: ['Não', 'Sim, parcial', 'Sim, total'] },
  ],
  [ // Qualidade
    { name: 'produto_lote', type: 'text', label: 'Produto/Lote Afetado', required: true },
    { name: 'tipo_nao_conformidade', type: 'select', label: 'Tipo de Não Conformidade', required: true, options: ['Defeito Estético', 'Funcional', 'Material'] },
    { name: 'quantidade_afetada', type: 'number', label: 'Quantidade Afetada', required: true },
    { name: 'localizacao_falha', type: 'textarea', label: 'Localização da Falha no Processo', required: true },
  ],
]

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'helpdesk',
    password: process.env.DB_PASSWORD || 'helpdesk123',
    database: process.env.DB_DATABASE || 'helpdesk_dev',
    entities: [Company, Sector, User, Helpdesk, HelpdeskCompany],
    synchronize: true,
  })
  await ds.initialize()

  const companyRepo = ds.getRepository(Company)
  const sectorRepo = ds.getRepository(Sector)
  const helpdeskRepo = ds.getRepository(Helpdesk)
  const hcRepo = ds.getRepository(HelpdeskCompany)
  const userRepo = ds.getRepository(User)

  // ---- FULL RESET mode ----
  if (FULL_RESET) {
    console.log('[seed] --full-reset: limpando dados do banco...')
    await ds.query('DELETE FROM helpdesk_companies')
    await ds.query('DELETE FROM helpdesk')
    await ds.query('DELETE FROM "user"')
    await ds.query('DELETE FROM sector')
    await ds.query('DELETE FROM company')
    console.log('[seed] Dados limpos, recriando.\n')
  }

  // ---- 1. Empresa ----
  let company = await companyRepo.findOneBy({ cnpj: '00.000.000/0001-00' })
  if (!company) {
    company = await companyRepo.save(
      companyRepo.create({ name: 'Raposo Plásticos', cnpj: '00.000.000/0001-00' }),
    )
    console.log(`[seed] Empresa criada: ${company.name}`)
  } else {
    console.log(`[seed] Empresa existente: ${company.name}`)
  }

  // ---- 2. Setores ----
  let sectors = await sectorRepo.findBy({ companyId: company.id })
  const sectorByCode = new Map<string, Sector>()
  for (const s of sectors) {
    if (s.shortCode) sectorByCode.set(s.shortCode, s)
  }

  for (const sc of sectorConfigs) {
    if (sectorByCode.has(sc.shortCode)) continue
    const sector = await sectorRepo.save(
      sectorRepo.create({ name: sc.name, shortCode: sc.shortCode, companyId: company.id }),
    )
    sectors.push(sector)
    sectorByCode.set(sc.shortCode, sector)
    console.log(`[seed] Setor adicionado: ${sector.name}`)
  }

  // ---- 3. Helpdesks + Junction ----
  const existingHelpdesks = await helpdeskRepo.findBy({ companyId: company.id })
  const existingHelpdeskSectors = new Set(existingHelpdesks.map((h) => h.sectorId))
  const sectorNames = ['TI', 'RH', 'Manutenção', 'Qualidade']

  for (let i = 0; i < 4; i++) {
    const sector = sectorByCode.get(sectorConfigs[i].shortCode)
    if (!sector) {
      console.log(`[seed] WARN: setor ${sectorConfigs[i].shortCode} não encontrado`)
      continue
    }
    if (existingHelpdeskSectors.has(sector.id)) continue

    const helpdesk = await helpdeskRepo.save(
      helpdeskRepo.create({
        name: sectorNames[i],
        sectorId: sector.id,
        companyId: company.id,
        schema: helpdeskSchemas[i] as any,
        published: true,
        active: true,
      }),
    )

    // Junction entry
    const permission = new HelpdeskCompany()
    permission.helpdeskId = helpdesk.id
    permission.companyId = company.id
    await hcRepo.save(permission)
    console.log(`[seed] Helpdesk: ${helpdesk.name} (${helpdeskSchemas[i].length} campos, publicado)`)
  }

  // Verify junctions
  const junctions = await hcRepo.findBy({ companyId: company.id })
  console.log(`[seed] ${junctions.length} vinculo(s) na tabela helpdesk_companies`)

  // ---- 4. Usuários ----
  const usersData = [
    { name: 'Admin', email: 'admin@raposo.com', password: '123456', role: Role.ADMIN as Role, sectorId: undefined as string | undefined },
    { name: 'Atendente', email: 'atendente@raposo.com', password: '123456', role: Role.ATTENDANT as Role, sectorId: sectors.find((s) => s.shortCode === 'ti')?.id },
    { name: 'Solicitante', email: 'solicitante@raposo.com', password: '123456', role: Role.REQUESTER as Role, sectorId: sectors.find((s) => s.shortCode === 'rh')?.id },
  ]

  for (const u of usersData) {
    const exists = await userRepo.findOneBy({ email: u.email })
    if (exists) {
      if (!exists.name) {
        await userRepo.update(exists.id, { name: u.name })
        console.log(`[seed] Nome atualizado para ${u.email}: ${u.name}`)
      }
      console.log(`[seed] Usuário ${u.email} já existe`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 10)
    const user = await userRepo.save(
      userRepo.create({
        name: u.name,
        email: u.email,
        password: hashed,
        companyId: company.id,
        sectorId: u.sectorId,
        role: u.role,
      }),
    )
    console.log(`[seed] Usuário criado: ${user.email} (${user.role})`)
  }

  console.log('\n=== Credenciais de teste ===')
  console.log('  Admin:        admin@raposo.com      / 123456')
  console.log('  Atendente TI: atendente@raposo.com  / 123456')
  console.log('  Solicitante:  solicitante@raposo.com / 123456')
  console.log('===============================\n')

  await ds.destroy()
  console.log('[seed] Concluído.')
}

seed().catch((err) => {
  console.error('[seed] Erro:', err)
  process.exit(1)
})
