"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mailer_1 = require("@nestjs-modules/mailer");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const node_path_1 = require("node:path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const user_entity_1 = require("./users/entities/user.entity");
const ai_module_1 = require("./ai/ai.module");
const job_module_1 = require("./job/job.module");
const job_entity_1 = require("./job/entities/job.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: (0, node_path_1.resolve)(process.cwd(), '..', '..', '..', '.env'),
            }),
            schedule_1.ScheduleModule.forRoot(),
            mailer_1.MailerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const mailUser = configService.get('MAIL_USER');
                    return {
                        transport: {
                            host: configService.get('MAIL_HOST') ?? 'localhost',
                            port: Number(configService.get('MAIL_PORT') ?? 587),
                            secure: configService.get('MAIL_SECURE') === 'true',
                            auth: mailUser
                                ? {
                                    user: mailUser,
                                    pass: configService.get('MAIL_PASS') ?? '',
                                }
                                : undefined,
                        },
                        defaults: {
                            from: configService.get('MAIL_FROM') ?? 'no-reply@example.com',
                        },
                    };
                },
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: '',
                database: 'openclew',
                synchronize: true,
                entities: [user_entity_1.User, job_entity_1.Job],
            }),
            users_module_1.UsersModule,
            ai_module_1.AiModule,
            job_module_1.JobModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map