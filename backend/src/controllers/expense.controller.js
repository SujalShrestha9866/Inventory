const prisma = require('../db/pool');

// show all the expenses based date
const getAll = async (req,res,next) => {
    try{
        const {date} = req.query;

        let whereCondition = {};

        if(date){
            whereCondition = {
                expense_date: {
                    gte: new Date(`${date}T00:00:00.000Z`),
                    lte: new Date(`${date}T23:59:59.999Z`),
                }
            };
        }
        const expenses = await prisma.expenses.findMany({
            where:{...whereCondition, is_active:true},
            orderBy:{
                expense_date: 'asc'
            },
            select:{
                expense_id: true,
                expense_name: true,
                expense_amount: true,
                expense_type: true,
                paid_by:true,
                payment_method:true,
                expense_date:true,
                created_at: true,
                updated_at: true,
                is_active:true
            }
        });
        if(expenses.length === 0){
            return res.status(444).json({success:false,message:'no expenses are not found'});
        }
        res.json({success:true,data:expenses})
    } catch (error){
        next(error);
    }
}

// show all the expenses of a particular date
const getOne = async (req,res,next) =>{
    try{
        const {id} = req.params;

        if(!id) {
            return res.status(422).json({success:false,message:'id must be provided'});
        }
        const expenses =  await prisma.expenses.findUnique({
            where:{expense_id:id,is_active:true},
            select:{
                expense_id: true,
                expense_name: true,
                expense_amount: true,
                expense_type: true,
                paid_by:true,
                payment_method:true,
                expense_date:true,
                created_at: true,
                updated_at: true,
                is_active:true
            }
        });

        if(!expenses){
            return res.status(404).json({success:false,message:'no expenses for that date'});
        }

        res.status(200).json({success:true,data:expenses});
    } catch(error) {
        next(error);
    }
}

//create a new expenses
const create = async (req,res,next) => {
    try{
        const {expensesName,expensesAmount,expensesType,expensesPaidby,expensesMethod,expensesDate} = req.body;

        if(!expensesName || !expensesAmount || !expensesType || !expensesPaidby || !expensesMethod || !expensesDate){
            return res.status(422).json({success:false,message:'all the fields are required'});
        }

        const expenses = await prisma.expenses.create({
            data:{
                expense_name:expensesName,
                expense_amount:expensesAmount,
                expense_type:expensesType,
                paid_by:expensesPaidby,
                payment_method:expensesMethod,
                expense_date: new Date(expensesDate)
            },
            select:{
                expense_id: true,
                expense_name: true,
                expense_amount: true,
                expense_type: true,
                paid_by:true,
                payment_method:true,
                expense_date:true,
                created_at: true,
                updated_at: true,
                is_active:true
            }
        });

        res.status(200).json({success:true,data:expenses});
    } catch(error){
        next(error);
    }
}

// update
const update = async (req,res,next) => {
    try{
        const {id} = req.params;
        if(!id) {
            return res.status(422).json({success:false,message:'id must be provided'});
        }
        const {expensesName,expensesAmount,expensesType,expensesPaidby,expensesMethod,expensesDate} = req.body;

        const expneseExist = await prisma.expenses.findUnique({
            where:{expense_id:id}
        });

        if(!expneseExist) {
            return res.status(404).json({success:false,message:'no such expenses exists'});
        }

        const expenses = await prisma.expenses.update({
            where:{expense_id:id,is_active:true},
            data:{
                ... (expensesName !== undefined && {expense_name:expensesName}),
                ... (expensesAmount !== undefined && {expense_amount:expensesAmount}),
                ... (expensesType !== undefined && {expense_type:expensesType}),
                ... (expensesPaidby !== undefined && {paid_by:expensesPaidby}),
                ... (expensesMethod !== undefined && {payment_method:expensesMethod}),
                ... (expensesDate !== undefined && {expense_date:new Date(expensesDate)}),
                updated_at:new Date()
            },
            select:{
                expense_id: true,
                expense_name: true,
                expense_amount: true,
                expense_type: true,
                paid_by:true,
                payment_method:true,
                expense_date:true,
                created_at: true,
                updated_at: true,
                is_active:true
            }
        });

        res.status(200).json({success:true,data:expenses});
    } catch(error){
        next(error);
    }
}

//delete
const del = async (req,res,next) => {
    try{
        const {id} = req.params;

        if(!id) {
            return res.status(422).json({success:false,message:'id is required'});
        }

        const expneseExist = await prisma.expenses.findUnique({
            where:{expense_id:id}
        });

        if(!expneseExist){
            return res.status(404).json({success:false,message:'no such expenses exists'});
        }

        const expenses = await prisma.expenses.update({
            where:{expense_id:id,is_active:true},
            data:{is_active:false},
            select:{
                expense_id: true,
                expense_name: true,
                expense_amount: true,
                expense_type: true,
                paid_by:true,
                payment_method:true,
                expense_date:true,
                created_at: true,
                updated_at: true,
                is_active:true
            }
        });

        res.status(200).json({success:true,data:expenses});
    } catch(error) {
        next(error);
    }
}
module.exports = {getAll,getOne,create,update,del};