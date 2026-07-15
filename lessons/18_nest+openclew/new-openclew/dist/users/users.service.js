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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    entityManager;
    create(createUserDto) {
        return this.entityManager.save(user_entity_1.User, createUserDto);
    }
    findAll() {
        return this.entityManager.find(user_entity_1.User);
    }
    findOne(id) {
        return this.entityManager.findOne(user_entity_1.User, { where: { id } });
    }
    update(id, updateUserDto) {
        return this.entityManager.update(user_entity_1.User, id, updateUserDto);
    }
    remove(id) {
        return this.entityManager.delete(user_entity_1.User, id);
    }
};
exports.UsersService = UsersService;
__decorate([
    (0, common_1.Inject)(typeorm_1.EntityManager),
    __metadata("design:type", typeorm_1.EntityManager)
], UsersService.prototype, "entityManager", void 0);
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map