const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // 1. Find the user
        const user = await prisma.system_users.findUnique({
            where: {
                system_user_name: username
            },
            include: {
                staff: true
            }
        });

        // 2. Generic error — don't reveal whether username or password was wrong
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // 3. Compare password against hash
        const match = await bcrypt.compare(
            password,
            user.system_user_password_hash
        );

        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 4. Create JWT
        const token = jwt.sign(
            {
                user_id: user.system_user_id,
                user_role: user.user_role,
                staff_id: user.staff_id,
                name: user.staff.staff_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        // 5. Send token back
        res.json({
            success: true,
            token,
            user: {
                user_id: user.system_user_id,
                username: user.system_user_name,
                user_role: user.user_role,
                name: user.staff.staff_name
            }
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = { login };
