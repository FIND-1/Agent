"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
let UserService = class UserService {
    users = new Map([
        [
            '001',
            { id: '001', name: '赵云', email: 'zhaoyun@example.com', role: 'admin' },
        ],
        [
            '002',
            {
                id: '002',
                name: '诸葛亮',
                email: 'zhugeliang@example.com',
                role: 'manager',
            },
        ],
        [
            '003',
            { id: '003', name: '关羽', email: 'guanyu@example.com', role: 'user' },
        ],
        [
            '004',
            { id: '004', name: '张飞', email: 'zhangfei@example.com', role: 'user' },
        ],
        [
            '005',
            { id: '005', name: '刘备', email: 'liubei@example.com', role: 'owner' },
        ],
        [
            '006',
            {
                id: '006',
                name: '黄忠',
                email: 'huangzhong@example.com',
                role: 'user',
            },
        ],
    ]);
    findAll() {
        return Array.from(this.users.values());
    }
    findOne(id) {
        return this.users.get(id);
    }
    create(user) {
        this.users.set(user.id, user);
        return user;
    }
    update(id, partial) {
        const existing = this.users.get(id);
        if (!existing) {
            return undefined;
        }
        const updated = {
            ...existing,
            ...partial,
            id: existing.id,
        };
        this.users.set(id, updated);
        return updated;
    }
    remove(id) {
        return this.users.delete(id);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map