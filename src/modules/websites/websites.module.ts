import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';
import { WebsitesRepository } from './websites.repository';
import { Website, WebsiteSchema } from './schemas/website.schema';
import {
  CustomWebsiteRequest,
  CustomWebsiteRequestSchema,
} from './schemas/custom-website-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Website.name, schema: WebsiteSchema },
      { name: CustomWebsiteRequest.name, schema: CustomWebsiteRequestSchema },
    ]),
  ],
  controllers: [WebsitesController],
  providers: [WebsitesService, WebsitesRepository],
  exports: [WebsitesService],
})
export class WebsitesModule {}
