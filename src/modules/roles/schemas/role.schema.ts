import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
  collection: 'roles',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Role {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  name!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ default: false })
  isSystem!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 99 })
  level!: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({ name: 1 });
RoleSchema.index({ level: 1 });
