import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Req,
} from "@nestjs/common";
import {
  CreateTeamDto,
  ExportTeamDto,
  OffsetPaginationSearchParams,
  UpdateTeamDto,
} from "./dto";
import { TeamsService } from "./teams.service";
import type { AuthRequest } from "@/common/interfaces/active-user.interface";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/generated/prisma/enums";
import { apiResponse } from "@/common/utils/api-response";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileExtensionValidator } from "./pipes/FileExtensionValidator";

@Controller({
  path: "teams",
  version: "1",
})
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(Role.SRE)
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @Req() { user }: AuthRequest
  ) {
    const result = await this.teamsService.create(user.sub, createTeamDto);
    return apiResponse(result);
  }

  @Get("export")
  @Roles(Role.SRE)
  async export(@Query() query: ExportTeamDto, @Req() { user }: AuthRequest) {
    return await this.teamsService.export(user.sub, query.format);
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file"))
  @Roles(Role.SRE)
  async import(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileExtensionValidator({ extensions: ["json", "csv"] }),
        ],
      })
    )
    file: Express.Multer.File,
    @Req() { user }: AuthRequest
  ) {
    const result = await this.teamsService.import(user.sub, file);
    return apiResponse(result);
  }

  @Patch(":teamId")
  @Roles(Role.SRE)
  async update(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Req() { user }: AuthRequest,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    const result = await this.teamsService.update(
      user.sub,
      teamId,
      updateTeamDto
    );
    return apiResponse(result);
  }

  @Get()
  @Roles(Role.SRE)
  async findAllForOwner(
    @Req() { user }: AuthRequest,
    @Query() query: OffsetPaginationSearchParams
  ) {
    const { teams, total } = await this.teamsService.findAllForOwner(
      user.sub,
      query
    );
    return apiResponse(teams, { total });
  }

  @Get(":teamId")
  @Roles(Role.SRE)
  async findOne(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Req() { user }: AuthRequest
  ) {
    const result = await this.teamsService.findOne(user.sub, teamId);
    return apiResponse(result);
  }

  @Get(":teamId/stats")
  @Roles(Role.SRE)
  async getStats(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Req() { user }: AuthRequest
  ) {
    const result = await this.teamsService.getStats(user.sub, teamId);
    return apiResponse(result);
  }

  @Delete(":teamId")
  @Roles(Role.SRE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("teamId", ParseUUIDPipe) teamId: string,
    @Req() { user }: AuthRequest
  ) {
    await this.teamsService.remove(user.sub, teamId);
  }
}
