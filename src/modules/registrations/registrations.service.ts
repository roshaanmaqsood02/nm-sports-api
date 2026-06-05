import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RegistrationsRepository } from './registrations.repository';
import { Step1Dto } from './dto/step1.dto';
import { Step2Dto } from './dto/step2.dto';
import { Step3Dto } from './dto/step3.dto';
import { Step4Dto } from './dto/step4.dto';
import { Step5Dto } from './dto/step5.dto';
import { RegistrationDocument } from './schemas/registration.schema';
import {
  RegistrationStatus,
  CompletionTimeline,
} from './enums/registration.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(private readonly repo: RegistrationsRepository) {}

  async start(
    user: RequestUser,
    organizationId?: string,
  ): Promise<RegistrationDocument> {
    const referenceNumber = await this.repo.getNextReferenceNumber();

    const reg = await this.repo.create({
      referenceNumber,
      submittedBy: user._id as any,
      organizationId: organizationId
        ? new Types.ObjectId(organizationId)
        : undefined,
      currentStep: 1,
      status: RegistrationStatus.DRAFT,
    });

    this.logger.log(
      `Registration started: ${referenceNumber} by ${user.email}`,
    );
    return reg;
  }

  async saveStep1(
    id: string,
    dto: Step1Dto,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);

    const isRush = dto.completionTimeline === CompletionTimeline.RUSH;

    const updated = await this.repo.update(id, {
      $set: {
        'step1.usedBefore': dto.usedBefore,
        'step1.sessionType': dto.sessionType,
        'step1.completionTimeline': dto.completionTimeline,
        'step1.hasRushFee': isRush,
        'step1.expectedCompletionDate': new Date(dto.expectedCompletionDate),
        'step1.newRegistrationTitle': dto.newRegistrationTitle,
        'step1.organizationName': dto.organizationName,
        'step1.sport': dto.sport,
        'step1.signupType': dto.signupType,
        'step1.copySourceUrl': dto.copySourceUrl,
        'step1.copyToSameWebsite': dto.copyToSameWebsite,
        'step1.needChanges': dto.needChanges,
        'step1.changesNeeded': dto.changesNeeded,
        'step1.collectingMoney': dto.collectingMoney,
        'step1.limitRegistrations': dto.limitRegistrations,
        'step1.inventoryRestrictions': dto.inventoryRestrictions,
        'step1.uploadDocumentation': dto.uploadDocumentation,
        'step1.documentCount': dto.documentCount,
        'step1.includesBackgroundScreen': dto.includesBackgroundScreen,
        currentStep: Math.max(reg.currentStep, 2),
      },
    });

    this.logger.log(`Step 1 saved: ${id}`);
    return updated!;
  }

  async saveStep2(
    id: string,
    dto: Step2Dto,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);
    this.checkStepOrder(reg, 2);

    const updated = await this.repo.update(id, {
      $set: {
        'step2.organizationName': dto.organizationName,
        'step2.websiteUrl': dto.websiteUrl,
        'step2.country': dto.country,
        'step2.state': dto.state,
        'step2.registrationTitle': dto.registrationTitle,
        'step2.whoRegistering': dto.whoRegistering,
        'step2.otherWhoRegistering': dto.otherWhoRegistering,
        'step2.sport': dto.sport,
        'step2.registrationType': dto.registrationType,
        'step2.otherRegistrationType': dto.otherRegistrationType,
        'step2.addHeadsUpWaiver': dto.addHeadsUpWaiver,
        'step2.validateMembershipIds': dto.validateMembershipIds,
        'step2.registrationTemplate': dto.registrationTemplate,
        'step2.collectDivisionsAgeGroups': dto.collectDivisionsAgeGroups,
        'step2.collectAdditionalRequests': dto.collectAdditionalRequests,
        'step2.collectWaivers': dto.collectWaivers,
        'step2.collectHeadsUpWaiver': dto.collectHeadsUpWaiver,
        'step2.additionalQuestions': dto.additionalQuestions,
        'step2.divisionsAgeGroups': dto.divisionsAgeGroups,
        'step2.uploadSupportingDocs': dto.uploadSupportingDocs,
        'step2.supportingDocCount': dto.supportingDocCount,
        'step2.limitRegistrations': dto.limitRegistrations,
        'step2.inventoryRestrictions': dto.inventoryRestrictions,
        'step2.needVolunteerBuyout': dto.needVolunteerBuyout,
        'step2.volunteerBuyoutRequirements': dto.volunteerBuyoutRequirements,
        'step2.processingFeeResponsibility': dto.processingFeeResponsibility,
        'step2.totalCostDetails': dto.totalCostDetails,
        'step2.paymentTerm': dto.paymentTerm,
        'step2.customTermsCount': dto.customTermsCount,
        'step2.customPaymentTerms': dto.customPaymentTerms,
        currentStep: Math.max(reg.currentStep, 3),
      },
    });

    this.logger.log(`Step 2 saved: ${id}`);
    return updated!;
  }

  async saveStep3(
    id: string,
    dto: Step3Dto,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);
    this.checkStepOrder(reg, 3);

    // Resolve internal contact
    const internalContact = dto.internalContactSameAsPublic
      ? dto.publicContact
      : dto.internalContact;

    const updated = await this.repo.update(id, {
      $set: {
        'step3.publicContact': dto.publicContact,
        'step3.notifyOnEveryRegistration': dto.notifyOnEveryRegistration,
        'step3.internalContactSameAsPublic': dto.internalContactSameAsPublic,
        'step3.internalContact': internalContact,
        'step3.preferredContactMethod': dto.preferredContactMethod,
        'step3.participateInResearch': dto.participateInResearch,
        currentStep: Math.max(reg.currentStep, 4),
      },
    });

    this.logger.log(`Step 3 saved: ${id}`);
    return updated!;
  }

  async saveStep4(
    id: string,
    dto: Step4Dto,
    user: RequestUser,
    ipAddress?: string,
  ): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);
    this.checkStepOrder(reg, 4);

    if (!dto.agreedToTerms) {
      throw new BadRequestException(
        'You must agree to the terms and conditions to proceed',
      );
    }

    const now = new Date();

    const updated = await this.repo.update(id, {
      $set: {
        'step4.signature': {
          signatureData: dto.signature.signatureData,
          signedBy: dto.signature.signedBy,
          ipAddress: ipAddress ?? 'unknown',
          signedAt: now,
          agreed: true,
        },
        'step4.agreedToTerms': true,
        'step4.agreedAt': now,
        currentStep: Math.max(reg.currentStep, 5),
      },
    });

    this.logger.log(`Step 4 (Agreement) saved: ${id}`);
    return updated!;
  }

  async saveStep5(
    id: string,
    dto: Step5Dto,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);
    this.checkStepOrder(reg, 5);

    // Calculate total
    const isRush = reg.step1?.completionTimeline === CompletionTimeline.RUSH;
    const rushFee = isRush ? 100 : 0;
    const totalAmount = rushFee;

    const updated = await this.repo.update(id, {
      $set: {
        'step5.rushFeeAmount': rushFee,
        'step5.totalAmount': totalAmount,
        'step5.paymentNotes':
          dto.paymentNotes ?? 'Payment pending — invoice will be sent.',
        'step5.paymentCompleted': false, // No payment gateway yet
        currentStep: Math.max(reg.currentStep, 6),
      },
    });

    this.logger.log(`Step 5 (Payment) saved: ${id}`);
    return updated!;
  }

  async submit(id: string, user: RequestUser): Promise<RegistrationDocument> {
    const reg = await this.findAndGuard(id, user);

    // Validate all required steps are complete
    if (reg.currentStep < 5) {
      throw new BadRequestException(
        `Please complete all steps before submitting. ` +
          `You are currently on step ${reg.currentStep}.`,
      );
    }

    if (!reg.step4?.agreedToTerms) {
      throw new BadRequestException(
        'Agreement and signature required before submission',
      );
    }

    if (reg.status !== RegistrationStatus.DRAFT) {
      throw new BadRequestException(`Registration is already ${reg.status}`);
    }

    const updated = await this.repo.update(id, {
      $set: {
        status: RegistrationStatus.SUBMITTED,
        currentStep: 6,
      },
    });

    this.logger.log(
      `Registration submitted: ${reg.referenceNumber} by ${user.email}`,
    );

    // TODO: send confirmation email
    // await this.mailService.sendRegistrationConfirmation(...)

    return updated!;
  }

  async findAll(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      status?: string;
      organizationId?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['submittedBy'] = new Types.ObjectId(user._id);
    }

    if (filters.status) filter['status'] = filters.status;
    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { referenceNumber: regex },
        { 'step1.organizationName': regex },
        { 'step2.registrationTitle': regex },
      ];
    }

    const { data, total } = await this.repo.findMany(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: RequestUser): Promise<RegistrationDocument> {
    return this.findAndGuard(id, user);
  }

  async updateStatus(
    id: string,
    status: RegistrationStatus,
    adminNotes: string,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can update registration status',
      );
    }

    const reg = await this.repo.findById(id);
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);

    const payload: Record<string, any> = { status };
    if (adminNotes) payload['adminNotes'] = adminNotes;
    if (status === RegistrationStatus.COMPLETED) {
      payload['completedAt'] = new Date();
    }

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Registration ${id} status → ${status} by ${user.email}`);
    return updated!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const reg = await this.findAndGuard(id, user);

    if (reg.status === RegistrationStatus.SUBMITTED) {
      throw new BadRequestException(
        'Cannot delete a submitted registration. Contact admin.',
      );
    }

    await this.repo.softDelete(id);
    return { message: 'Registration deleted successfully' };
  }

  async getStats(user: RequestUser) {
    const base =
      user.isSuperAdmin || user.role === UserRole.ADMIN
        ? {}
        : { submittedBy: new Types.ObjectId(user._id) };

    const [total, draft, submitted, processing, completed] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: RegistrationStatus.DRAFT }),
      this.repo.count({ ...base, status: RegistrationStatus.SUBMITTED }),
      this.repo.count({ ...base, status: RegistrationStatus.PROCESSING }),
      this.repo.count({ ...base, status: RegistrationStatus.COMPLETED }),
    ]);

    return { total, draft, submitted, processing, completed };
  }

  private async findAndGuard(
    id: string,
    user: RequestUser,
  ): Promise<RegistrationDocument> {
    const reg = await this.repo.findById(id);
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);

    // Only owner, admin, superadmin can access
    const isOwner = reg.submittedBy.toString() === user._id;
    if (!isOwner && !user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have access to this registration',
      );
    }

    return reg;
  }

  private checkStepOrder(
    reg: RegistrationDocument,
    requiredStep: number,
  ): void {
    if (reg.currentStep < requiredStep - 1) {
      throw new BadRequestException(
        `Please complete step ${requiredStep - 1} before proceeding to step ${requiredStep}`,
      );
    }
  }
}
