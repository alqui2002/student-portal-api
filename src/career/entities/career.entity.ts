import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('careers')
export class Career {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @OneToMany(() => User, (user) => user.career)
    users: User[];

    @ManyToMany(() => Course, (course) => course.careers, { cascade: true })
    @JoinTable({
        name: 'career_courses',
        joinColumns: [{ name: 'career_id', referencedColumnName: 'id' }],
        inverseJoinColumns: [{ name: 'course_id', referencedColumnName: 'id' }],
    })
    courses: Course[];
}
