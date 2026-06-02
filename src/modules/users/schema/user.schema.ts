import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus, Gender } from '../enums/user.enum';

export type UserDocument = User & Document;

export interface UserDocumentWithPrivate extends Document {
  email: string;
  username: string;
  password: string;
  profile: Profile;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  isSuperAdmin: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  security: SecurityInfo;
  refreshToken?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
}

// Embedded: Address
@Schema({ _id: false })
export class Address {
  @Prop({ trim: true })
  street?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  postalCode?: string;
}

// Embedded: Profile
@Schema({ _id: false })
export class Profile {
  @Prop({ trim: true })
  firstName?: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ type: Address })
  address?: Address;
}

// Embedded: SecurityInfo
@Schema({ _id: false })
export class SecurityInfo {
  @Prop({ default: 0 })
  loginAttempts!: number;

  @Prop()
  lockUntil?: Date;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ trim: true })
  lastLoginIp?: string;
}

// Main User Schema
@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['password'];
      delete ret['__v'];
      return ret;
    },
  },
})
export class User {
  // Identity
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
  })
  username!: string;

  @Prop({ required: true, select: false })
  password!: string;

  //  Profile
  @Prop({ type: Profile, default: {} })
  profile!: Profile;

  // Role & Status
  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.MEMBER,
    index: true,
  })
  role!: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.PENDING,
    index: true,
  })
  status!: UserStatus;

  // Permissions (fine-grained override)
  @Prop({ type: [String], default: [] })
  permissions!: string[];

  // Flags
  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: false })
  isTwoFactorEnabled!: boolean;

  @Prop({ default: false })
  isSuperAdmin!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;

  // Security
  @Prop({ type: SecurityInfo, default: {} })
  security!: SecurityInfo;

  // Refresh Token (hashed)
  @Prop({ select: false })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtuals
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  const { firstName, lastName } = this.profile || {};
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  return this.username;
});

// Pre-save Hook: Hash password
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.security) {
    (this as any).security = {};
  }

  this.security.passwordChangedAt = new Date();
});

// Instance Methods
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.security?.lockUntil && this.security.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  const MAX_ATTEMPTS = 5;

  if (this.security?.lockUntil && this.security.lockUntil < new Date()) {
    await this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 },
    });
    return;
  }

  const updates: Record<string, any> = {
    $inc: { 'security.loginAttempts': 1 },
  };

  if ((this.security?.loginAttempts ?? 0) + 1 >= MAX_ATTEMPTS) {
    updates['$set'] = {
      'security.lockUntil': new Date(Date.now() + LOCK_TIME),
    };
  }

  await this.updateOne(updates);
};

// Indexes
UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ username: 1, isDeleted: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });
