import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsRepository } from './organizations.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UploadService } from 'src/common/upload/upload.service';
import { UpdateOrganizationDto } from './dto/update-organization';
import { Types } from 'mongoose';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';
import { OrganizationDocument } from './schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly orgsRepository: OrganizationsRepository,
    private readonly uploadService: UploadService,
  ) {}

  private toPlain(doc: OrganizationDocument): Record<string, any> {
    const plain = doc.toObject({ virtuals: true, versionKey: false });
    delete plain.__v;
    // Convert _id to string explicitly
    plain.id = plain._id?.toString();
    return JSON.parse(JSON.stringify(plain));
  }

  async create(
    dto: CreateOrganizationDto,
    currentUser: RequestUser,
    logoFile?: Express.Multer.File,
  ): Promise<Record<string, any>> {
    const nameExists = await this.orgsRepository.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      createdBy: currentUser._id,
    });

    if (nameExists) {
      throw new ConflictException(
        `You already have an organization named "${dto.name}"`,
      );
    }

    if (dto.acronym) {
      const acronymExists = await this.orgsRepository.exists({
        acronym: dto.acronym.toUpperCase(),
      });
      if (acronymExists) {
        throw new ConflictException(
          `Acronym "${dto.acronym}" is already in use`,
        );
      }
    }

    let logo;
    if (logoFile) {
      logo = await this.uploadService.processLogo(logoFile);
      console.log('Processed logo:', logo); // ← add this
    }
    const org = await this.orgsRepository.create({
      name: dto.name,
      acronym: dto.acronym,
      sports: dto.sports,
      location: {
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        zipCode: dto.zipCode,
      },
      contact: {
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
      },
      timezone: dto.timezone,
      gender: dto.gender,
      color: dto.color,
      logo: logo
        ? {
            filename: logo.filename,
            url: logo.url,
            path: logo.path,
            size: logo.size,
            width: logo.width,
            height: logo.height,
          }
        : undefined,
      createdBy: currentUser._id as any,
      members: [currentUser._id as any],
    });

    this.logger.log(
      `Organization created: ${org.name} by ${currentUser.email}`,
    );

    return this.toPlain(org);
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    currentUser?: RequestUser,
  ) {
    const filter: any = {};

    if (currentUser && !currentUser.isSuperAdmin) {
      filter['createdBy'] = currentUser._id;
    }

    if (search) {
      filter['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { acronym: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.country': { $regex: search, $options: 'i' } },
      ];
    }

    const { data, total } = await this.orgsRepository.findMany(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: data.map((doc) => this.toPlain(doc)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    currentUser: RequestUser,
  ): Promise<Record<string, any>> {
    const org = await this.orgsRepository.findById(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    this.checkAccess(org, currentUser);
    return this.toPlain(org);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    currentUser: RequestUser,
    logoFile?: Express.Multer.File,
  ): Promise<Record<string, any>> {
    const org = await this.orgsRepository.findById(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    this.checkAccess(org, currentUser);

    if (dto.acronym && dto.acronym !== org.acronym) {
      const acronymExists = await this.orgsRepository.exists({
        acronym: dto.acronym.toUpperCase(),
        _id: { $ne: id },
      });
      if (acronymExists) {
        throw new ConflictException(`Acronym "${dto.acronym}" already in use`);
      }
    }

    const updatePayload: any = {};

    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.acronym !== undefined) updatePayload.acronym = dto.acronym;
    if (dto.sports !== undefined) updatePayload.sports = dto.sports;
    if (dto.timezone !== undefined) updatePayload.timezone = dto.timezone;
    if (dto.gender !== undefined) updatePayload.gender = dto.gender;
    if (dto.color !== undefined) updatePayload.color = dto.color;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    if (dto.address) updatePayload['location.address'] = dto.address;
    if (dto.city) updatePayload['location.city'] = dto.city;
    if (dto.state) updatePayload['location.state'] = dto.state;
    if (dto.country) updatePayload['location.country'] = dto.country;
    if (dto.zipCode) updatePayload['location.zipCode'] = dto.zipCode;

    if (dto.email !== undefined) updatePayload['contact.email'] = dto.email;
    if (dto.phone !== undefined) updatePayload['contact.phone'] = dto.phone;
    if (dto.website !== undefined)
      updatePayload['contact.website'] = dto.website;

    if (logoFile) {
      if (org.logo?.path) {
        this.uploadService.deleteFile(org.logo.path);
      }
      const processed = await this.uploadService.processLogo(logoFile);
      updatePayload['logo.filename'] = processed.filename;
      updatePayload['logo.url'] = processed.url;
      updatePayload['logo.path'] = processed.path;
      updatePayload['logo.size'] = processed.size;
      updatePayload['logo.width'] = processed.width;
      updatePayload['logo.height'] = processed.height;
    }

    const updated = await this.orgsRepository.update(id, {
      $set: updatePayload,
    });

    this.logger.log(`Organization updated: ${id} by ${currentUser.email}`);
    return this.toPlain(updated!);
  }

  async removeLogo(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const org = await this.orgsRepository.findById(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    this.checkAccess(org, currentUser);

    if (!org.logo?.path) {
      throw new BadRequestException('Organization has no logo to remove');
    }

    this.uploadService.deleteFile(org.logo.path);
    await this.orgsRepository.update(id, { $unset: { logo: 1 } });

    return { message: 'Logo removed successfully' };
  }

  async remove(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const org = await this.orgsRepository.findById(id);
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    this.checkAccess(org, currentUser);

    if (org.logo?.path) {
      this.uploadService.deleteFile(org.logo.path);
    }

    await this.orgsRepository.softDelete(id);
    this.logger.log(`Organization deleted: ${id} by ${currentUser.email}`);
    return { message: 'Organization deleted successfully' };
  }

  async addMember(
    orgId: string,
    userId: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const org = await this.orgsRepository.findById(orgId);
    if (!org) throw new NotFoundException(`Organization ${orgId} not found`);

    this.checkAccess(org, currentUser);
    await this.orgsRepository.addMember(orgId, userId);

    return { message: 'Member added successfully' };
  }

  async removeMember(
    orgId: string,
    userId: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const org = await this.orgsRepository.findById(orgId);
    if (!org) throw new NotFoundException(`Organization ${orgId} not found`);

    this.checkAccess(org, currentUser);
    await this.orgsRepository.removeMember(orgId, userId);

    return { message: 'Member removed successfully' };
  }

  async getStats(currentUser: RequestUser) {
    const filter = currentUser.isSuperAdmin
      ? {}
      : { createdBy: currentUser._id };

    const [total, active, pending] = await Promise.all([
      this.orgsRepository.count(filter),
      this.orgsRepository.count({ ...filter, status: 'active' }),
      this.orgsRepository.count({ ...filter, status: 'pending' }),
    ]);

    return { total, active, pending };
  }

  async findById(id: string): Promise<OrganizationDocument | null> {
    return this.orgsRepository.findById(id);
  }

  async validateOrgAndSport(
    organizationId: string,
    sport: string,
    user: RequestUser,
  ): Promise<OrganizationDocument> {
    const org = await this.orgsRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    this.checkAccess(org, user);

    if (!org.sports.includes(sport as any)) {
      throw new BadRequestException(
        `Sport '${sport}' is not registered in organization '${org.name}'. ` +
          `Available: [${org.sports.join(', ')}]`,
      );
    }

    return org;
  }

  async validateOrg(
    organizationId: string,
    user: RequestUser,
  ): Promise<OrganizationDocument> {
    const org = await this.orgsRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    this.checkAccess(org, user);
    return org;
  }

  async addDivisionRef(
    organizationId: string,
    divisionId: string,
  ): Promise<void> {
    await this.orgsRepository.update(organizationId, {
      $addToSet: { divisions: new Types.ObjectId(divisionId) },
    });
  }

  async removeDivisionRef(
    organizationId: string,
    divisionId: string,
  ): Promise<void> {
    await this.orgsRepository.update(organizationId, {
      $pull: { divisions: new Types.ObjectId(divisionId) },
    });
  }

  async addClubRef(organizationId: string, clubId: string): Promise<void> {
    await this.orgsRepository.update(organizationId, {
      $addToSet: { clubs: new Types.ObjectId(clubId) },
    });
  }

  async removeClubRef(organizationId: string, clubId: string): Promise<void> {
    await this.orgsRepository.update(organizationId, {
      $pull: { clubs: new Types.ObjectId(clubId) },
    });
  }

  private checkAccess(org: OrganizationDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isOwner = org.createdBy.toString() === user._id;
    const isMember = org.members?.some((m: any) => m.toString() === user._id);

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }
}
