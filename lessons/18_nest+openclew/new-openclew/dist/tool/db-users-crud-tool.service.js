"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbUsersCrudToolService = void 0;
const common_1 = require("@nestjs/common");
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const users_service_1 = require("../users/users.service");
function formatUser(user) {
    return `ID=${user.id}, name=${user.name}, email=${user.email}, createdAt=${user.createdAt?.toISOString?.() ?? ''}`;
}
let DbUsersCrudToolService = class DbUsersCrudToolService {
    tool;
    usersService;
    constructor() {
        const dbUsersCrudArgsSchema = zod_1.z.object({
            action: zod_1.z
                .enum(['create', 'list', 'get', 'update', 'delete'])
                .describe('Action to run: create, list, get, update, delete'),
            id: zod_1.z
                .number()
                .int()
                .positive()
                .optional()
                .describe('User ID for get/update/delete'),
            name: zod_1.z
                .string()
                .min(1)
                .max(50)
                .optional()
                .describe('User name for create/update'),
            email: zod_1.z
                .string()
                .email()
                .max(50)
                .optional()
                .describe('User email for create/update'),
        });
        this.tool = (0, tools_1.tool)(async ({ action, id, name, email }) => {
            switch (action) {
                case 'create': {
                    if (!name || !email) {
                        return 'Creating a user requires both name and email.';
                    }
                    const created = await this.usersService.create({ name, email });
                    return `Created user: ${formatUser(created)}`;
                }
                case 'list': {
                    const users = await this.usersService.findAll();
                    if (!users.length) {
                        return 'There are no users in the database.';
                    }
                    return `Users:\n${users.map(formatUser).join('\n')}`;
                }
                case 'get': {
                    if (!id) {
                        return 'Getting a user requires id.';
                    }
                    const user = await this.usersService.findOne(id);
                    return user
                        ? `User: ${formatUser(user)}`
                        : `User ${id} does not exist.`;
                }
                case 'update': {
                    if (!id) {
                        return 'Updating a user requires id.';
                    }
                    const payload = {};
                    if (name !== undefined)
                        payload.name = name;
                    if (email !== undefined)
                        payload.email = email;
                    if (!Object.keys(payload).length) {
                        return 'No update fields were provided.';
                    }
                    const existing = await this.usersService.findOne(id);
                    if (!existing) {
                        return `User ${id} does not exist.`;
                    }
                    await this.usersService.update(id, payload);
                    const updated = await this.usersService.findOne(id);
                    return updated
                        ? `Updated user: ${formatUser(updated)}`
                        : `User ${id} does not exist.`;
                }
                case 'delete': {
                    if (!id) {
                        return 'Deleting a user requires id.';
                    }
                    const existing = await this.usersService.findOne(id);
                    if (!existing) {
                        return `User ${id} does not exist, no delete needed.`;
                    }
                    await this.usersService.remove(id);
                    return `Deleted user: ${formatUser(existing)}`;
                }
            }
        }, {
            name: 'db_users_crud',
            description: 'Create, list, get, update, or delete records in the users table.',
            schema: dbUsersCrudArgsSchema,
        });
    }
};
exports.DbUsersCrudToolService = DbUsersCrudToolService;
__decorate([
    (0, common_1.Inject)(users_service_1.UsersService),
    __metadata("design:type", users_service_1.UsersService)
], DbUsersCrudToolService.prototype, "usersService", void 0);
exports.DbUsersCrudToolService = DbUsersCrudToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DbUsersCrudToolService);
//# sourceMappingURL=db-users-crud-tool.service.js.map