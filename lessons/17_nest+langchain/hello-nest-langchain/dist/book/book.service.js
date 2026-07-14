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
exports.BookService = void 0;
const common_1 = require("@nestjs/common");
let BookService = class BookService {
    bookRepository;
    create(createBookDto) {
        return 'This action adds a new book';
    }
    findAll() {
        return this.bookRepository.findAll();
    }
    findOne(id) {
        return `This action returns a #${id} book`;
    }
    update(id, updateBookDto) {
        return `This action updates a #${id} book`;
    }
    remove(id) {
        return `This action removes a #${id} book`;
    }
};
exports.BookService = BookService;
__decorate([
    (0, common_1.Inject)('BOOK_REPOSITORY'),
    __metadata("design:type", Object)
], BookService.prototype, "bookRepository", void 0);
exports.BookService = BookService = __decorate([
    (0, common_1.Injectable)()
], BookService);
//# sourceMappingURL=book.service.js.map