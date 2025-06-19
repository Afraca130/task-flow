import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsService } from '../projects/projects.service';
import { TaskStatus } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly tasksService: TasksService,
        private readonly projectsService: ProjectsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Cron('0 12 * * *', {
        name: 'daily-due-date-notifications',
        timeZone: 'Asia/Seoul',
    })
    async sendDailyDueDateNotifications(): Promise<void> {
        this.logger.log('🔔 Starting daily due date notifications check...');

        try {
            // Get tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            this.logger.log(`Checking for tasks and projects due on: ${tomorrow.toISOString()}`);

            // Check for tasks due tomorrow
            await this.checkTasksDueTomorrow(tomorrow, dayAfterTomorrow);

            // Check for projects due tomorrow
            await this.checkProjectsDueTomorrow(tomorrow, dayAfterTomorrow);

            this.logger.log('Daily due date notifications check completed');
        } catch (error) {
            this.logger.error('❌ Error in daily due date notifications:', error.stack || error);
        }
    }

    private async checkTasksDueTomorrow(tomorrow: Date, dayAfterTomorrow: Date): Promise<void> {
        try {
            // Get all tasks that are not completed and due tomorrow
            const taskFilters = {
                page: 1,
                limit: 1000, // Large limit to get all tasks
            };

            const tasksResult = await this.tasksService.findWithFilters(taskFilters);

            const tasksDueTomorrow = tasksResult.tasks.filter(task => {
                if (!task.dueDate || task.status === TaskStatus.COMPLETED) {
                    return false;
                }

                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);

                return taskDueDate.getTime() === tomorrow.getTime();
            });

            this.logger.log(`📋 Found ${tasksDueTomorrow.length} tasks due tomorrow`);

            // Send notifications for each task
            for (const task of tasksDueTomorrow) {
                if (task.assigneeId) {
                    try {
                        await this.notificationsService.createNotification({
                            userId: task.assigneeId,
                            type: NotificationType.TASK_DUE_SOON,
                            title: '업무 마감 임박',
                            message: `"${task.title}" 업무가 내일 마감입니다.`,
                            data: {
                                taskId: task.id,
                                taskTitle: task.title,
                                dueDate: task.dueDate,
                                projectId: task.projectId,
                            },
                            relatedEntityType: 'task',
                            relatedEntityId: task.id,
                        });

                        this.logger.log(`Sent due date notification for task: ${task.title} to user: ${task.assigneeId}`);
                    } catch (error) {
                        this.logger.error(`❌ Failed to send notification for task ${task.id}:`, error);
                    }
                }
            }
        } catch (error) {
            this.logger.error('❌ Error checking tasks due tomorrow:', error);
        }
    }

    private async checkProjectsDueTomorrow(tomorrow: Date, dayAfterTomorrow: Date): Promise<void> {
        try {
            // Get all active projects
            const publicProjects = await this.projectsService.getAllPublicProjects({
                page: 1,
                limit: 1000,
            });

            const projectsDueTomorrow = publicProjects.projects.filter(project => {
                if (!project.dueDate || !project.isActive) {
                    return false;
                }

                const projectDueDate = new Date(project.dueDate);
                projectDueDate.setHours(0, 0, 0, 0);

                return projectDueDate.getTime() === tomorrow.getTime();
            });

            this.logger.log(`Found ${projectsDueTomorrow.length} projects due tomorrow`);

            // Send notifications to all project members
            for (const project of projectsDueTomorrow) {
                try {
                    const projectMembers = await this.projectsService.getProjectMembers(project.id, project.ownerId);

                    for (const member of projectMembers) {
                        try {
                            await this.notificationsService.createNotification({
                                userId: member.userId,
                                type: NotificationType.PROJECT_STATUS_CHANGED,
                                title: '프로젝트 마감 임박',
                                message: `"${project.name}" 프로젝트가 내일 마감입니다.`,
                                data: {
                                    projectId: project.id,
                                    projectName: project.name,
                                    dueDate: project.dueDate,
                                    memberRole: member.role,
                                },
                                relatedEntityType: 'project',
                                relatedEntityId: project.id,
                            });

                            this.logger.log(` Sent project due date notification for project: ${project.name} to user: ${member.userId}`);
                        } catch (error) {
                            this.logger.error(`❌ Failed to send project notification to user ${member.userId}:`, error);
                        }
                    }
                } catch (error) {
                    this.logger.error(`❌ Failed to get members for project ${project.id}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('❌ Error checking projects due tomorrow:', error);
        }
    }

    // Manual trigger for testing (can be called via API endpoint)
    async triggerDueDateNotifications(): Promise<void> {
        this.logger.log('🔧 Manually triggering due date notifications...');
        await this.sendDailyDueDateNotifications();
    }

    // Get cron job status
    getCronJobStatus(): { name: string; nextRun: string; isActive: boolean } {
        return {
            name: 'daily-due-date-notifications',
            nextRun: 'Every day at 12:00 PM (Seoul time)',
            isActive: true,
        };
    }
}
