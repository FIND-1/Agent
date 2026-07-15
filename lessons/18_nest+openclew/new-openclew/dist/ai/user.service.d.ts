type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};
export declare class UserService {
    private readonly users;
    findAll(): User[];
    findOne(id: string): User | undefined;
    create(user: User): User;
    update(id: string, partial: Partial<Omit<User, 'id'>>): User | undefined;
    remove(id: string): boolean;
}
export {};
