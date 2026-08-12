const prisma = require('../db/pool');

// get all the product data.
const getAll = async (req,res) => {
    try{
        const product = await prisma.product.findMany({
            where:{
                is_active:true,
                category:{
                    is_active:true,
                }
            },
            select :{
                product_id: true,
                product_name: true,
                selling_price: true,
                unit: true,
                is_active: true,
                category:{
                    select:{category_name:true}
                },
                inventory:{
                    select:{remaining_quantity: true}
                }
            },
            orderBy:{
                product_name:'asc'
            }
        })
        if(product.length === 0){
            return res.json({success:false, message:'There is no products'});
        }
        const formatedData = product.map(p => ({
            product_id: p.product_id,
            product_name: p.product_name,
            selling_price: p.selling_price,
            unit: p.unit,
            is_active: p.is_active,
            category_name: p.category?.category_name,
            remaining_quantity: p.inventory?.remaining_quantity ?? 0
        }));
        res.json({success: true, data:formatedData});
    } catch(error){
        res.status(500).json({success:false, message: error.message});
    }
};

// to search product by id.
const getOne =  async (req,res) => {
    try{
        const {id} = req.params ;
        const product = await prisma.product.findUnique({
            where:{
                is_active: true,
                product_id:id
            },
            select:{
                product_id:true,
                product_name:true,
                selling_price:true,
                unit: true,
                is_active: true,
                category:{
                    select:{category_name:true}
                },
                inventory:{
                    select:{remaining_quantity:true}
                }
            }
        });
        if(!product){
            return res.json({success: false, message:'No such product or incorrect product id'});
        }

        const formatedData = {
            product_id : product.product_id,
            product_name: product.product_name,
            selling_price: product.selling_price,
            unit:product.unit,
            is_active:product.is_active,
            category_name: product.category?.category_name,
            remaining_quantity:product.remaining_quantity
        };
        res.json({success: true, data:formatedData});
    }catch(error){
        res.json({success:false,message:error.message});
    }
}

//create a new product
const create = async (req,res) => {
    try{
        const {productName,sellingPrice,unit,categoryId} = req.body;

        if (!productName ||  !sellingPrice || !unit || !categoryId ){
            return res.json({success:false, message:'Product name, selling price, unit and category must be provided'});
        }
        if(categoryId){
            const categoryExist = await prisma.category.findUnique({
                where:{
                    category_id: categoryId.trim()
                }
            });

            if(!categoryExist){
                return res.json({success: false,message:'no such category exist'})
            }
        }

        const newProduct = await prisma.product.create({
            data: {
                product_name: productName,
                selling_price: parseFloat(sellingPrice),
                unit: unit,
                category: {
                    connect: {
                        category_id: categoryId
                    }
                },
                inventory: {
                    create: {
                        remaining_quantity: 0
                    }
                }
            },
            select: {
                product_id: true,
                product_name: true,
                selling_price: true,
                unit: true,
                is_active: true,
                created_at: true,
                updated_at: true,
                category: {
                    select: {
                        category_id: true,
                        category_name: true
                    }
                },
                inventory: {
                    select: {
                        remaining_quantity: true
                    }
                }
            }
            });

        const formattedData = {
            product_id: newProduct.product_id,
            product_name: newProduct.product_name,
            selling_price: newProduct.selling_price,
            unit: newProduct.unit,
            is_active: newProduct.is_active,
            category_name: newProduct.category?.category_name,
            remaining_quantity: newProduct.inventory?.remaining_quantity
        };

        res.json({success:true, data:formattedData});
    } catch (error){
        res.json({success:false,message:error.message});
    }
}

// to update
const  update = async (req,res) => {
    try{
        const {id} = req.params;
        const {productName,sellingPrice,unit,categoryId} = req.body;

        const productExist = await prisma.product.findUnique({
            where:{
                product_id:id
            }
        });

        if(!productExist){
            return res.json({success:false, message:'product does not exist'});
        }

        if(categoryId) {
            const categoryExist = await prisma.category.findUnique({
                where: {
                    category_id: categoryId
                }
            });
            if(!categoryExist){
                return res.json({success:false,message:'category does not exist'});
            }
        }

        const updateProduct = await prisma.product.update({
            where:{
                product_id:id
            },
            data:{
                ...(productName && {product_name:productName}),
                ...(sellingPrice && {selling_price:sellingPrice}),
                ...(unit && {unit:unit}),
                ...(categoryId&& {category_id:categoryId}),
                updated_at:new Date()
            },
            select:{
                product_id: true,
                product_name: true,
                selling_price: true,
                unit: true,
                is_active: true,
                category: {
                    select: {
                        category_name: true
                    }
                },
                inventory: {
                    select: {
                        remaining_quantity: true
                    }
                }
            }
        });

        const formattedData = {
            product_id: updateProduct.product_id,
            product_name: updateProduct.product_name,
            selling_price: updateProduct.selling_price,
            unit: updateProduct.unit,
            is_active: updateProduct.is_active,
            category_name: updateProduct.category?.category_name,
            remaining_quantity: updateProduct.inventory?.remaining_quantity
        };
        res.json({success:true,data:formattedData});
    } catch(error){
        res.json({success:false,message:error.message});
    }
}

//to delete
const del = async (req,res) => {
    try{
        const {id} = req.body;
        const productExist = await prisma.product.findFirst({
            where:{product_name:id}
        })
        if(!productExist){
            return res.json({success:false,response:'No such product found || incorrect product name'});
        }
        const product = await prisma.product.update({
            where:{
                product_id:id
            },
            data:{
                is_active: false
            }
        })
        const formattedData = {
            product_id: product.product_id,
            product_name: product.product_name,
            selling_price: product.selling_price,
            unit: product.unit,
            is_active: product.is_active,
            category_name: category.category?.category_name,
            remaining_quantity: inventory.inventory?.remaining_quantity
        };
        res.json({success:true,data:product})
    }catch(error){
        res.json({success:false,message:error.message});
    }
}
module.exports = {getAll,getOne,create,update,del};