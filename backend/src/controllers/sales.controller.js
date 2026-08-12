const prisma = require('../db/pool');

// get all sales
const getAll = async (req,res,next) =>{
    try{
        const { start_date, end_date } = req.query;
        const where = {};
        if (start_date || end_date) {
            where.sales_date = {};

            if (start_date) {
                where.sales_date.gte = new Date(
                    `${start_date}T00:00:00+05:45`
                );
            }

            if (end_date) {
                where.sales_date.lt = new Date(
                    `${end_date}T00:00:00+05:45`
                );

                where.sales_date.lt.setDate(
                    where.sales_date.lt.getDate() + 1
                );
            }
        }        const sales = await prisma.sale.findMany({
            where,
            select: {
                sales_id: true,
                sales_date: true,
                sales_type: true,

                party: {
                    select: {
                        party_id: true,
                        party_name: true
                    }
                },

                staff: {
                    select: {
                        staff_id: true,
                        staff_name: true
                    }
                },

                sale_item: {
                    select: {
                        sale_item_id: true,
                        product_id: true,
                        sales_quantity: true,
                        sales_price: true
                    }
                },

                created_at: true,
                updated_at: true
            },
            orderBy: {
                sales_date: 'desc'
            }
        });

        if(!sales){
            return res.status(404).json({success:false,message:'no sales records'});
        }
        const result = sales.map(sale => {

            const total = sale.sale_item.reduce((sum, item) => {
                return sum + Number(item.sales_quantity) * Number(item.sales_price);
            }, 0);

            return {
                ...sale,
                total_amount: total
            };
        });
        res.status(200).json({success:true,data:result});
    } catch(error){
        next(error);
    }
}

const getOne = async (req,res,next) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.status(424).json({success:false,message:'id is required'});
        }

        const sales = await prisma.sale.findUnique({
            where:{sales_id:id},
            select: {
                sales_id: true,
                sales_date: true,
                sales_type: true,

                party: {
                    select: {
                        party_id: true,
                        party_name: true
                    }
                },

                staff: {
                    select: {
                        staff_id: true,
                        staff_name: true
                    }
                },

                sale_item: {
                    select: {
                        sale_item_id: true,
                        product_id: true,
                        sales_quantity: true,
                        sales_price: true
                    }
                },

                created_at: true,
                updated_at: true
            }
        });

        if(sales.length === 0 ){
            return res.status(404).json({success:false,message:"incorrect sales id"});
        }
        res.status(200).json({success:true,data:sales});
    } catch(error){
        next(error);
    }
}

//create
const create = async (req,res,next) => {
    try{
        const {partyID,sales_type,sales_date,items} = req.body;

        const sales_by = req.user.staff_id;

        if(!partyID || !sales_by || !sales_type || ! sales_date){
            return res.status(422).json({success:false,message:'all fields are required'});
        }


        if (!Array.isArray(items) || items.length === 0) {
            return res.status(422).json({
                success: false,
                message: 'items must contain at least one item'
            });
        }

        for (const item of items) {

            if (!item.product_id) {
                return res.status(422).json({
                    success: false,
                    message: 'product_id is required for every item'
                });
            }

            if (!item.quantity || Number(item.quantity) <= 0) {
                return res.status(422).json({
                    success: false,
                    message: 'quantity must be greater than 0'
                });
            }

            if (item.price === undefined || Number(item.price) < 0) {
                return res.status(422).json({
                    success: false,
                    message: 'price must be provided and cannot be negative'
                });
            }
        }


        const result = await prisma.$transaction(async (tx) => {

            // 1. Check party
            const party = await tx.party.findFirst({
                where: {
                    party_id: partyID,
                    is_active: true
                }
            });

            if (!party) {
                throw new Error('party does not exist or is inactive');
            }


            // 2. Create SALE
            const sale = await tx.sale.create({
                data: {
                    party_id: partyID,
                    sales_by: sales_by,
                    sales_type: sales_type,
                    sales_date: new Date(sales_date)
                }
            });

            let totalAmount = 0;

            for (const item of items) {

                const quantity = Number(item.quantity);
                const price = Number(item.price);

                totalAmount += quantity * price;

                // inventory check
                const inventory = await tx.inventory.findUnique({
                    where: {
                        product_id: item.product_id
                    }
                });

                if (!inventory) {
                    throw new Error(
                        `Inventory not found for product ${item.product_id}`
                    );
                }

                if (
                    Number(inventory.remaining_quantity) < quantity
                ) {
                    throw new Error(
                        `Insufficient stock. Available: ${
                            inventory.remaining_quantity
                        }`
                    );
                }

                // Create sale item
                await tx.sale_item.create({
                    data: {
                        sales_id: sale.sales_id,
                        product_id: item.product_id,
                        sales_quantity: quantity,
                        sales_price: price
                    }
                });

                // Reduce stock
                await tx.inventory.update({
                    where: {
                        product_id: item.product_id
                    },
                    data: {
                        remaining_quantity:
                            Number(inventory.remaining_quantity) - quantity
                    }
                });

                // Inventory log
                await tx.inventory_log.create({
                    data: {
                        product_id: item.product_id,
                        change_quantity: quantity,
                        change_type: 'OUT',
                        reference_type: 'Sales',
                        reason: 'Sales'
                    }
                });
            }

            if (sales_type === 'Credit') {
                await tx.ledger.create({
                    data: {
                        party_id: partyID,
                        credit: 0,
                        debit: totalAmount,
                        transaction_type: 'Sale',
                        reference_id: sale.sales_id
                    }
                });
            }
            return {
                sale_id: sale.sales_id,
                total_amount: totalAmount
            };
        });


        return res.status(201).json({
            success: true,
            message: 'sale created successfully',
            data: result
        });
    }  catch(error){
        next(error);
    }
}

// delete
const del = async (req, res, next) => {
    try {

        const { id } = req.params;

        if (!id) {
            return res.status(422).json({
                success: false,
                message: 'sale id is required'
            });
        }


        const result = await prisma.$transaction(async (tx) => {

            const sale = await tx.sale.findUnique({
                where: {
                    sales_id: id
                },
                include: {
                    sale_item: true
                }
            });


            if (!sale) {
                throw new Error('sale does not exist');
            }


            if (sale.status === 'CANCELLED') {
                throw new Error('sale is already cancelled');
            }


            for (const item of sale.sale_item) {

                const inventory = await tx.inventory.findUnique({
                    where: {
                        product_id: item.product_id
                    }
                });


                if (!inventory) {
                    throw new Error(
                        `Inventory not found for product ${item.product_id}`
                    );
                }

                await tx.inventory.update({
                    where: {
                        product_id: item.product_id
                    },
                    data: {
                        remaining_quantity:
                            Number(inventory.remaining_quantity) +
                            Number(item.sales_quantity)
                    }
                });

                await tx.inventory_log.create({
                    data: {
                        product_id: item.product_id,
                        quantity: item.sales_quantity,
                        transaction_type: 'IN',
                        reference: 'SalesReturn'
                    }
                });
            }

            let totalAmount = 0;

            for (const item of sale.sale_item) {
                totalAmount +=
                    Number(item.sales_quantity) *
                    Number(item.sales_price);
            }

            if (sale.sales_type === 'Credit') {

                await tx.ledger.create({
                    data: {
                        party_id: sale.partyID,
                        debit: 0,
                        credit: totalAmount,
                        reference_type: 'SALE_CANCEL',
                        reference_id: sale.sales_id
                    }
                });
            }

            const cancelledSale = await tx.sale.update({
                where: {
                    sales_id: id
                },
                data: {
                    status: 'CANCELLED'
                }
            });


            return {
                sales_id: cancelledSale.sales_id,
                status: cancelledSale.status,
                total_amount: totalAmount
            };
        });


        return res.status(200).json({
            success: true,
            message: 'sale cancelled successfully',
            data: result
        });


    } catch (error) {
        next(error);
    }
};

module.exports = {getAll,getOne,create,del};