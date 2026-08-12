const prisma = require('../db/pool');

//get all
const getAll = async (req,res,next) => {
    try{
        const { start_date, end_date } = req.query;
        const where = {};
        if (start_date || end_date) {
            where.purchase_date = {};

            if (start_date) {
                where.purchase_date.gte = new Date(
                    `${start_date}T00:00:00`
                );
            }

            if (end_date) {
                const end = new Date(
                    `${end_date}T00:00:00`
                );
                end.setDate(end.getDate() + 1);

                where.purchase_date.lt = end;
            }
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
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

                purchase_item: {
                    select: {
                        product_quantity: true,
                        purchase_price: true
                    }
                }
            },

            orderBy: {
                purchase_date: 'desc'
            }
        });

        const result = purchases.map(purchase => {

            let total = 0;

            for (const item of purchase.purchase_item) {
                total +=
                    Number(item.product_quantity) *
                    Number(item.purchase_price);
            }

            return {
                purchase_id: purchase.purchase_id,
                party_id: purchase.party_id,
                party_name: purchase.party.party_name,

                created_by: purchase.created_by,
                staff_name: purchase.staff.staff_name,

                purchase_type: purchase.purchase_type,
                purchase_date: purchase.purchase_date,

                total_amount: total,

                created_at: purchase.created_at,
                updated_at: purchase.updated_at
            };
        });
        res.status(200).json({success:false,data:result});
    } catch(error){
        next(error);
    }
}

//getOne
const getOne = async(req,res,next) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.status(424).json({success:false,message:'Id is required'});
        }

        const purchase = await prisma.purchase.findUnique({
            where:{
                purchase_id:id
            },
            include: {

                party: {
                    select: {
                        party_id: true,
                        party_name: true,
                        party_address: true,
                        party_contact: true
                    }
                },

                staff: {
                    select: {
                        staff_id: true,
                        staff_name: true
                    }
                },

                purchase_item: {
                    include: {
                        product: {
                            select: {
                                product_id: true,
                                product_name: true,
                                unit: true
                            }
                        }
                    }
                }
            }
        });

        if(!purchase) {
            return res.status(404).json({success:false,message:'no such purchase found'});
        }
        let total = 0;

        for (const item of purchase.purchase_item) {

            total +=
                Number(item.product_quantity) *
                Number(item.purchase_price);
        }


        return res.status(200).json({
            success: true,
            data: {
                purchase_id: purchase.purchase_id,

                party: purchase.party,

                staff: purchase.staff,

                purchase_type: purchase.purchase_type,

                purchase_date: purchase.purchase_date,

                items: purchase.purchase_item,

                total_amount: total,

                created_at: purchase.created_at,
                updated_at: purchase.updated_at
            }
        });
    } catch(error){
        next(error);
    }
}

const create = async (req, res, next) => {
    try {

        const {
            party_id,
            purchase_type,
            purchase_date,
            items
        } = req.body;

        const created_by = req.user.staff_id;

        // Validate required fields
        if (
            !party_id ||
            !created_by ||
            !purchase_type ||
            !purchase_date
        ) {
            return res.status(422).json({
                success: false,
                message: 'party_id, created_by, purchase_type and purchase_date are required'
            });
        }

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(422).json({
                success: false,
                message: 'items must contain at least one item'
            });
        }

        // Validate every item
        for (const item of items) {

            if (!item.product_id) {
                return res.status(422).json({
                    success: false,
                    message: 'product_id is required for every item'
                });
            }

            if (
                item.quantity === undefined ||
                Number(item.quantity) <= 0
            ) {
                return res.status(422).json({
                    success: false,
                    message: 'quantity must be greater than 0'
                });
            }

            if (
                item.price === undefined ||
                Number(item.price) <= 0
            ) {
                return res.status(422).json({
                    success: false,
                    message: 'price must be greater than 0'
                });
            }
        }

        const result = await prisma.$transaction(async (tx) => {

            // Check supplier
            const party = await tx.party.findFirst({
                where: {
                    party_id: party_id,
                    is_active: true
                }
            });

            if (!party) {
                throw new Error('Supplier does not exist or is inactive');
            }

            // Create purchase
            const purchase = await tx.purchase.create({
                data: {
                    party_id: party_id,
                    created_by: created_by,
                    purchase_type: purchase_type,
                    purchase_date: new Date(purchase_date)
                }
            });

            let totalAmount = 0;

            for (const item of items) {

                const quantity = Number(item.quantity);
                const price = Number(item.price);

                totalAmount += quantity * price;

                // ------------------------------------------------
                // 1. Create purchase item
                // ------------------------------------------------
                await tx.purchase_item.create({
                    data: {
                        purchase_id: purchase.purchase_id,
                        product_id: item.product_id,
                        product_quantity: quantity,
                        purchase_price: price
                    }
                });

                // ------------------------------------------------
                // 2. UPDATE INVENTORY
                // ------------------------------------------------
                await tx.inventory.update({
                    where: {
                        product_id: item.product_id
                    },
                    data: {
                        remaining_quantity: {
                            increment: quantity
                        }
                    }
                });

                // ------------------------------------------------
                // 3. Create inventory log
                // ------------------------------------------------
                await tx.inventory_log.create({
                    data: {
                        product_id: item.product_id,
                        change_quantity: quantity,
                        change_type: 'IN',
                        reference_type: 'Purchase',
                        reason: 'Purchase'
                    }
                });
            }

            // ------------------------------------------------
            // 4. Create ledger for credit purchase
            // ------------------------------------------------
            if (purchase_type === 'Credit') {

                await tx.ledger.create({
                    data: {
                        party_id: party_id,
                        credit: totalAmount,
                        debit: 0,
                        transaction_type: 'Purchase',
                        reference_id: purchase.purchase_id
                    }
                });
            }

            return {
                purchase_id: purchase.purchase_id,
                total_amount: totalAmount
            };
        });

        return res.status(201).json({
            success: true,
            message: 'purchase created successfully',
            data: result
        });

    } catch (error) {
        next(error);
    }
};

module.exports={getAll,getOne,create};