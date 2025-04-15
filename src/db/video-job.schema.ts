import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoJobDocument = VideoJob & Document;

@Schema({ timestamps: true })
export class VideoJob {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  inputKey: string;

  @Prop()
  outputKey: string;

  @Prop({ required: true, enum: ['pending', 'processing', 'done', 'error'] })
  status: string;

  @Prop()
  errorMessage?: string;
}

export const VideoJobSchema = SchemaFactory.createForClass(VideoJob);
