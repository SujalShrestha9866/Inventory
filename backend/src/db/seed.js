require('dotenv').config();

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function seed() {
    try {
        // Check ADMIN_PASSWORD first
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            throw new Error('ADMIN_PASSWORD environment variable is not set');
        }

        // Find existing staff
        let staff = await prisma.staff.findUnique({
            where: {
                staff_contact: '9800000000',
            },
        });

        // Create staff if it doesn't exist
        if (!staff) {
            staff = await prisma.staff.create({
                data: {
                    staff_name: 'Admin User',
                    staff_role: 'Admin',
                    staff_contact: '9800000000',
                    staff_email: 'admin@example.com',
                    staff_salary: 50000,
                    staff_joining_date: new Date('2024-01-01'),
                },
            });

            console.log('Admin staff created.');
        }

        // Hash the password
        const hash = await bcrypt.hash(adminPassword, 10);

        // Check if system user already exists
        const existingUser = await prisma.system_users.findUnique({
            where: {
                staff_id: staff.staff_id,
            },
        });

        // If admin already exists, UPDATE password
        if (existingUser) {
            await prisma.system_users.update({
                where: {
                    staff_id: staff.staff_id,
                },
                data: {
                    system_user_password_hash: hash,
                    system_user_name: 'admin',
                    system_user_email: 'admin@example.com',
                    user_role: 'Admin',
                },
            });

            console.log('Admin password updated successfully.');
            console.log('Username: admin');

            return;
        }

        // Otherwise create admin user
        await prisma.system_users.create({
            data: {
                staff_id: staff.staff_id,
                system_user_name: 'admin',
                system_user_email: 'admin@example.com',
                system_user_password_hash: hash,
                user_role: 'Admin',
            },
        });

        console.log('Admin user created successfully.');
        console.log('Username: admin');

    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();