import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { HelpdeskService } from './helpdesk.service';
import { Helpdesk } from './entities/helpdesk.entity';
import { HelpdeskCompany } from './entities/helpdesk-company.entity';

const mockHelpdesk = () =>
  ({
    id: 'hd-1',
    sectorId: 'sector-1',
    companyId: 'comp-1',
    name: 'Helpdesk TI',
    description: 'TI support',
    schema: [
      {
        name: 'category',
        type: 'select',
        label: 'Category',
        required: true,
        options: ['Hardware', 'Software', 'Network'],
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: true,
      },
    ],
    published: false,
    active: true,
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Helpdesk;

describe('HelpdeskService', () => {
  let service: HelpdeskService;
  let helpdeskRepo: Partial<Repository<Helpdesk>>;
  let hcRepo: Partial<Repository<HelpdeskCompany>>;

  const findOne = jest.fn();
  const create = jest.fn();
  const save = jest.fn();
  const find = jest.fn();
  const findBy = jest.fn();
  const findOneHc = jest.fn();
  const createHc = jest.fn();
  const saveHc = jest.fn();
  const removeHc = jest.fn();
  const findHc = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    helpdeskRepo = { findOne, create, save, find };
    hcRepo = { find: findHc, findBy, findOne: findOneHc, create: createHc, save: saveHc, remove: removeHc };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpdeskService,
        { provide: getRepositoryToken(Helpdesk), useValue: helpdeskRepo },
        { provide: getRepositoryToken(HelpdeskCompany), useValue: hcRepo },
      ],
    }).compile();

    service = module.get<HelpdeskService>(HelpdeskService);
  });

  describe('create', () => {
    it('should create a helpdesk with valid schema', async () => {
      findOne.mockResolvedValue(null);
      create.mockReturnValue(mockHelpdesk());
      save.mockResolvedValue(mockHelpdesk());

      const result = await service.create('comp-1', {
        sectorId: 'sector-1',
        name: 'Helpdesk TI',
        description: 'TI support',
        schema: mockHelpdesk().schema as any,
      });

      expect(create).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(result.name).toBe('Helpdesk TI');
    });

    it('should throw ConflictException if sector already has a helpdesk in same company', async () => {
      findOne.mockResolvedValue(mockHelpdesk());

      await expect(
        service.create('comp-1', {
          sectorId: 'sector-1',
          name: 'Another TI',
          schema: mockHelpdesk().schema as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow creating helpdesk on same sector if belongs to different company', async () => {
      const existingHelpdesk = { ...mockHelpdesk(), companyId: 'comp-1' }; // existing in comp-1
      findOne.mockResolvedValueOnce(null); // no match in comp-2
      const customHelpdesk = { ...mockHelpdesk(), companyId: 'comp-2', name: 'TI Helpdesk Comp2' };
      create.mockReturnValue(customHelpdesk);
      save.mockResolvedValue(customHelpdesk);

      await service.create('comp-2', {
        sectorId: 'sector-1',
        name: 'TI Helpdesk Comp2',
        schema: mockHelpdesk().schema as any,
      });

      // Verify findOne checked for same sector AND same company
      expect(findOne).toHaveBeenCalledWith({
        where: { sectorId: 'sector-1', companyId: 'comp-2', active: true },
      });
    });
  });

  describe('findAll', () => {
    it('should return active helpdesks for the caller company', async () => {
      find.mockResolvedValue([mockHelpdesk()]);

      const result = await service.findAll('comp-1');

      expect(result).toHaveLength(1);
      expect(find).toHaveBeenCalledWith({
        where: { active: true, companyId: 'comp-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should bypass companyId filter for Super Admin', async () => {
      find.mockResolvedValue([mockHelpdesk(), { ...mockHelpdesk(), companyId: 'comp-2' }]);

      const result = await service.findAll('1', { role: 'admin' });

      expect(result).toHaveLength(2);
      expect(find).toHaveBeenCalledWith({
        where: { active: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should still filter by companyId if user has admin role but companyId NOT 1', async () => {
      find.mockResolvedValue([mockHelpdesk()]);

      await service.findAll('comp-5', { role: 'admin' });

      expect(find).toHaveBeenCalledWith({
        where: { active: true, companyId: 'comp-5' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a helpdesk by id', async () => {
      findOne.mockResolvedValue(mockHelpdesk());

      const result = await service.findOne('hd-1', 'comp-1');

      expect(result.name).toBe('Helpdesk TI');
    });

    it('should throw NotFoundException if helpdesk does not exist', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'comp-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if helpdesk belongs to different company', async () => {
      findOne.mockResolvedValue(mockHelpdesk()); // companyId: 'comp-1'

      await expect(
        service.findOne('hd-1', 'comp-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should bypass company check for Super Admin', async () => {
      findOne.mockResolvedValue(mockHelpdesk()); // companyId: 'comp-1'

      const result = await service.findOne('hd-1', '1', { role: 'admin' });

      expect(result.name).toBe('Helpdesk TI');
    });
  });

  describe('findByCompany', () => {
    it('should return helpdesks for a company', async () => {
      findBy.mockResolvedValue([{ helpdeskId: 'hd-1', companyId: 'comp-1' }]);
      find.mockResolvedValue([mockHelpdesk()]);

      const result = await service.findByCompany('comp-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array if no permissions exist', async () => {
      findBy.mockResolvedValue([]);

      const result = await service.findByCompany('comp-1');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update helpdesk name', async () => {
      findOne.mockResolvedValue(mockHelpdesk());
      save.mockResolvedValue({ ...mockHelpdesk(), name: 'New Name' });

      const result = await service.update('hd-1', 'comp-1', { name: 'New Name' });

      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
      expect(result.name).toBe('New Name');
    });

    it('should throw ForbiddenException if companyId does not match', async () => {
      findOne.mockResolvedValue(mockHelpdesk());

      await expect(service.update('hd-1', 'comp-2', { name: 'X' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if updating schema of published helpdesk', async () => {
      const published = { ...mockHelpdesk(), published: true };
      findOne.mockResolvedValue(published);

      await expect(
        service.update('hd-1', 'comp-1', {
          schema: [{ name: 'x', type: 'text', label: 'x', required: false }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update schema of unpublished helpdesk', async () => {
      findOne.mockResolvedValue(mockHelpdesk());
      save.mockResolvedValue({
        ...mockHelpdesk(),
        schema: [{ name: 'x', type: 'text', label: 'x', required: false }],
      });

      const result = await service.update('hd-1', 'comp-1', {
        schema: [{ name: 'x', type: 'text', label: 'x', required: false }],
      } as any);

      expect(result.schema).toHaveLength(1);
    });
  });

  describe('publish', () => {
    it('should publish a helpdesk with schema', async () => {
      findOne.mockResolvedValue(mockHelpdesk());
      save.mockResolvedValue({ ...mockHelpdesk(), published: true });

      const result = await service.publish('hd-1', 'comp-1');

      expect(result.published).toBe(true);
    });

    it('should throw BadRequestException if helpdesk has no schema fields', async () => {
      findOne.mockResolvedValue({ ...mockHelpdesk(), schema: [] });

      await expect(service.publish('hd-1', 'comp-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if companyId does not match', async () => {
      findOne.mockResolvedValue(mockHelpdesk());

      await expect(service.publish('hd-1', 'comp-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a helpdesk', async () => {
      const published = { ...mockHelpdesk(), published: true };
      findOne.mockResolvedValue(published);
      save.mockResolvedValue({ ...published, published: false });

      const result = await service.unpublish('hd-1', 'comp-1');

      expect(result.published).toBe(false);
    });
  });

  describe('remove', () => {
    it('should deactivate a helpdesk', async () => {
      findOne.mockResolvedValue(mockHelpdesk());
      save.mockResolvedValue({ ...mockHelpdesk(), active: false });

      await service.remove('hd-1', 'comp-1');

      expect(save).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });
  });

  describe('permissions', () => {
    describe('addCompanyPermission', () => {
      it('should add a company permission', async () => {
        findOne.mockResolvedValue(mockHelpdesk());
        findOneHc.mockResolvedValue(null);
        createHc.mockReturnValue({ helpdeskId: 'hd-1', companyId: 'comp-2' });
        saveHc.mockResolvedValue({});

        await service.addCompanyPermission('hd-1', 'comp-1');

        expect(saveHc).toHaveBeenCalled();
      });

      it('should throw ConflictException if company already has access', async () => {
        findOne.mockResolvedValue(mockHelpdesk());
        findOneHc.mockResolvedValue({ helpdeskId: 'hd-1', companyId: 'comp-2' } as any);

        await expect(service.addCompanyPermission('hd-1', 'comp-1')).rejects.toThrow(ConflictException);
      });

      it('should throw NotFoundException if helpdesk does not belong to caller company', async () => {
        findOne.mockResolvedValue(null);

        await expect(service.addCompanyPermission('hd-1', 'comp-2')).rejects.toThrow(NotFoundException);
      });
    });

    describe('listCompanyPermissions', () => {
      it('should return list of company ids', async () => {
        findOne.mockResolvedValue(mockHelpdesk());
        findBy.mockResolvedValue([
          { helpdeskId: 'hd-1', companyId: 'comp-1' },
          { helpdeskId: 'hd-1', companyId: 'comp-2' },
        ]);

        const result = await service.listCompanyPermissions('hd-1', 'comp-1');

        expect(result).toEqual(['comp-1', 'comp-2']);
      });
    });

    describe('removeCompanyPermission', () => {
      it('should remove a company permission', async () => {
        findOneHc.mockResolvedValue({ helpdeskId: 'hd-1', companyId: 'comp-2' });
        removeHc.mockResolvedValue({});

        await service.removeCompanyPermission('hd-1', 'comp-2');

        expect(removeHc).toHaveBeenCalled();
      });

      it('should throw NotFoundException if permission does not exist', async () => {
        findOneHc.mockResolvedValue(null);

        await expect(
          service.removeCompanyPermission('hd-1', 'comp-2'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});