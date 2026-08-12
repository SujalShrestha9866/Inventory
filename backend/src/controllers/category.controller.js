const prisma = require('../db/pool');

// to select all
const getAll = async (req,res,next) => {
    try{
        const category = await prisma.category.findMany({
            where:{
                is_active:true
            },
            select:{
                category_id: true,
                category_name: true,
                is_active: true,
                created_at:true,
                updated_at:true
            }
        })

        if(category.length === 0){
            return res.status(404).json({success:false,message:'no category available'});
        }
        res.json({success:true,data:category});
    } catch(error){
        next(error);
    }
}

//to get one category
const getOne = async (req,res,next) => {
    try {
        const {id} = req.params;

        if (!id) {
            return res.json({success: false, message: 'category id is required'});
        }
        const category = await prisma.category.findUnique({
            where: {category_id: id},
            select: {
                category_id: true,
                category_name: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            }
        });

        if (!category) {
            return res.json({success: false, message: 'category does not exist'});
        }

        res.json({success: true, data: category});
    } catch (error) {
        next(error);

    }
}

// to create
    const create = async (req, res, next) => {
        try {
            const {categoryName} = req.body;

            if (!categoryName) {
                return res.json({success: false, message: 'category name is required'});
            }

            const categoryExist = await prisma.category.findUnique({
                where: {category_name: categoryName}
            });

            if (categoryExist) {
                return res.json({success: false, message: 'category already exists'});
            }
            const newCategory = await prisma.category.create({
                data: {
                    category_name: categoryName
                },
                select: {
                    category_id: true,
                    category_name: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });
            res.json({success: true, data: newCategory});
        } catch (error) {
            next(error);
        }
    }

// to update
    const update = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {categoryName, isActive} = req.body;
            const categoryExist = await prisma.category.findUnique({
                where: {category_id: id}
            });
            if (!categoryExist) {
                return res.json({success: false, message: 'category does not exist'});
            }
            const updateCategory = await prisma.category.update({
                where: {
                    category_id: id
                },
                data: {
                    ...(categoryName !== undefined && {category_name: categoryName}),
                    ...(isActive !== undefined && {is_active: isActive}),
                    updated_at:new Date()
                },
                select: {
                    category_id: true,
                    category_name: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });
            res.json({success: true, data:updateCategory});
        } catch (error) {
            next(error);
        }
    }

// to delete
    const del = async (req, res, next) => {
        try {
            const {id} = req.params;

            if (!id) {
                return res.json({success: false, message: 'id is required'})
            }
            const categoryExist = await prisma.category.findUnique({
                where: {category_id: id}
            });

            if (!categoryExist) {
                return res.json({success: false, message: "category doesn't exist"});
            }

            const category = await prisma.category.update({
                where: {
                    category_id: id
                },
                data: {
                    is_active: false
                },
                select: {
                    category_id: true,
                    category_name: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true
                }
            });
            res.json({success: true, data: category});
        } catch (error) {
            next(error);
        }
    }

module.exports={getAll,getOne,create,update,del};