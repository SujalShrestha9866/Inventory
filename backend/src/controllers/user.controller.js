const prisma = require('../db/pool');
const bcrypt = require('bcrypt');

const getAll = async (req, res, next) => {
    try {
        const users = await prisma.system_users.findMany({
            select: {
                system_user_id: true,
                system_user_name: true,
                system_user_email: true,
                user_role: true,
                is_active: true,
                created_at: true,
                staff: { select: { staff_id: true, staff_name: true, staff_role: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};
const create = async (req, res, next) => {
    try {
        const { staffId, username, email, password, userRole } = req.body;

        if (!staffId || !username || !password || !userRole) {
            return res.status(422).json({
                success: false,
                message: 'staffId, username, password and userRole are required',
            });
        }
        if (password.length < 8) {
            return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const staff = await prisma.staff.findUnique({ where: { staff_id: staffId } });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        const existing = await prisma.system_users.findUnique({ where: { staff_id: staffId } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'This staff member already has a login' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.system_users.create({
            data: {
                staff_id: staffId,
                system_user_name: username,
                system_user_email: email || null,
                system_user_password_hash: password_hash,
                user_role: userRole,
            },
            select: {
                system_user_id: true,
                system_user_name: true,
                system_user_email: true,
                user_role: true,
                is_active: true,
                staff: { select: { staff_id: true, staff_name: true } },
            },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        // unique constraint (duplicate username/email)
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Username or email is already in use' });
        }
        next(error);
    }
};


const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userRole, password, isActive } = req.body;

        const data = {};
        if (userRole) data.user_role = userRole;
        if (typeof isActive === 'boolean') data.is_active = isActive;
        if (password) {
            if (password.length < 8) {
                return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
            }
            data.system_user_password_hash = await bcrypt.hash(password, 10);
        }
        if (Object.keys(data).length === 0) {
            return res.status(422).json({ success: false, message: 'Nothing to update' });
        }
        data.updated_at = new Date();

        const user = await prisma.system_users.update({
            where: { system_user_id: id },
            data,
            select: {
                system_user_id: true,
                system_user_name: true,
                user_role: true,
                is_active: true,
                staff: { select: { staff_name: true } },
            },
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        next(error);
    }
};

const del = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === req.user.user_id) {
            return res.status(400).json({ success: false, message: "You can't deactivate your own account" });
        }

        const user = await prisma.system_users.update({
            where: { system_user_id: id },
            data: { is_active: false, updated_at: new Date() },
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        next(error);
    }
};

module.exports = { getAll, create, update, del };
