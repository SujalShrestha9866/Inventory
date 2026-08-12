const prisma = require('../db/pool');

//all available inventory.
const getAll = async (req,res,next) => {
    try{
        const inventory = await prisma.inventory.findMany({
            select:{
                inventory_id:true,
                product_id:true,
                product:true,
                remaining_quantity:true,
                updated_at:true
            }
        });
        if(!inventory){
            return res.status(404).json({success:false,message:'not inventory available'});
        }
        res.status(200).json({success:true,data:inventory});
    } catch(error){
        next(error);
    }
}

// update
const update = async (req,res,next) => {
    try{
        const {id} = req.params;
        const {remainingQuantity,reason}= req.body;

        if(!id ||  remainingQuantity === undefined || ! reason){
            return res.status(422).json({success:false,message:'fields are required'});
        }
            const currentInventory = await prisma.inventory.findUnique({
                where:{
                    product_id:id
                    },
                    select:{
                        remaining_quantity:true,
                        product:{
                            select: {
                                is_active: true
                            }
                    }
                }
            });
            if(!currentInventory|| !currentInventory.product.is_active){
                return res.status(404).json({success:false,message:'no such product found'});
            }
            const oldQty = Number(currentInventory.remaining_quantity);
            const newQty = Number(remainingQuantity);
            const changeQuantity = Math.abs(newQty - oldQty);
            let changeType;
            if(oldQty>newQty){
                changeType="OUT";
            } else{
                changeType = "IN";
            }

        const result = await prisma.$transaction(async (tr) => {

            const updatedInventory = await tr.inventory.update({
                where: {
                    product_id: id
                },
                data: {
                    remaining_quantity: newQty
                },
                orderBy:{remaining_quantity:'desc'}
            });

            const inventoryLog = await tr.inventory_log.create({
                data: {
                    product_id: id,
                    change_quantity: changeQuantity,
                    change_type: changeType,
                    reason: reason
                }
            });

            return {
                updatedInventory,
                inventoryLog
            };
        });
        res.status(200).json({success:true,data:result});
    }catch(error){
        next(error);
    }
}

//get logs
const getLogs = async(req,res,next) => {
    try{
        const {id} = req.params;
        const inventoryLog = await prisma.inventory_log.findMany({
            where:{
                product_id:id,
                product:{
                    is_active:true
                }
            },
            select:{
                log_id:true,
                product_id:true,
                change_quantity:true,
                change_type:true,
                reason:true,
                reference_type:true,
                created_at:true,
                updated_at:true,
                product:true
            }
        });

        if(!inventoryLog){
            return res.status(404).json({success:false,message:'no such product exist.'})
        }
        res.status(200).json({success:true,data:inventoryLog});
    }catch (error){
        next(error);
    }
}
module.exports = {getAll,update,getLogs};