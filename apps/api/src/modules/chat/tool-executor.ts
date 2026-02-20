import { Injectable } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { ProjectsService } from '../projects/projects.service';
import { TagsService } from '../tags/tags.service';
import { FoldersService } from '../folders/folders.service';
import { PerspectivesService } from '../perspectives/perspectives.service';

@Injectable()
export class ToolExecutor {
  constructor(
    private actionsService: ActionsService,
    private projectsService: ProjectsService,
    private tagsService: TagsService,
    private foldersService: FoldersService,
    private perspectivesService: PerspectivesService,
  ) {}

  async execute(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      switch (toolName) {
        // Actions
        case 'create_action':
          return await this.actionsService.create(args as any, 'ai-assistant');
        case 'list_actions':
          return await this.actionsService.findAll(args as any);
        case 'search_actions':
          return await this.actionsService.search(args as any);
        case 'get_action':
          return await this.actionsService.findOne(args.id);
        case 'update_action': {
          const { id, ...updateData } = args;
          return await this.actionsService.update(id, updateData as any, 'ai-assistant');
        }
        case 'complete_action':
          return await this.actionsService.complete(args.id, 'ai-assistant');
        case 'uncomplete_action':
          return await this.actionsService.uncomplete(args.id, 'ai-assistant');
        case 'delete_action':
          return await this.actionsService.delete(args.id, 'ai-assistant');
        case 'bulk_complete_actions':
          return await this.actionsService.bulkComplete(args.actionIds, 'ai-assistant');
        case 'bulk_move_actions':
          return await this.actionsService.bulkMove(args.actionIds, args.projectId, 'ai-assistant');
        
        // Projects
        case 'create_project':
          return await this.projectsService.create(args as any);
        case 'list_projects':
          return await this.projectsService.findAll(args.folderId);
        case 'get_project':
          return await this.projectsService.findOne(args.id);
        case 'update_project': {
          const { id, ...updateData } = args;
          return await this.projectsService.update(id, updateData as any);
        }
        case 'delete_project':
          return await this.projectsService.delete(args.id);
        case 'review_project':
          return await this.projectsService.review(args.id);
        
        // Tags
        case 'create_tag':
          return await this.tagsService.create(args as any);
        case 'list_tags':
          return await this.tagsService.findAll();
        case 'get_tag':
          return await this.tagsService.findOne(args.id);
        case 'update_tag': {
          const { id, ...updateData } = args;
          return await this.tagsService.update(id, updateData as any);
        }
        case 'delete_tag':
          return await this.tagsService.delete(args.id);
        
        // Folders
        case 'create_folder':
          return await this.foldersService.create(args as any);
        case 'list_folders':
          return await this.foldersService.findAll();
        case 'get_folder':
          return await this.foldersService.findOne(args.id);
        case 'update_folder': {
          const { id, ...updateData } = args;
          return await this.foldersService.update(id, updateData as any);
        }
        case 'delete_folder':
          return await this.foldersService.delete(args.id);
        
        // Perspectives
        case 'create_perspective':
          return await this.perspectivesService.create(args as any);
        case 'list_perspectives':
          return await this.perspectivesService.findAll();
        case 'update_perspective': {
          const { id, ...updateData } = args;
          return await this.perspectivesService.update(id, updateData as any);
        }
        case 'delete_perspective':
          return await this.perspectivesService.delete(args.id);
        
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error: any) {
      return { error: error.message || 'Tool execution failed' };
    }
  }
}
