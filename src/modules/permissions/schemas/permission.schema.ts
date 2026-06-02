import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({
  timestamps: true,
  collection: 'permissions',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Permission {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  resource!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  action!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ trim: true, default: 'General' })
  group!: string;

  @Prop({ default: false })
  isSystem!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
PermissionSchema.index({ group: 1 });
