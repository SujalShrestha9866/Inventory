const prisma = require('../db/pool');
const {response} = require("express");

// get all current employee
const getAll = async (req,res,next) => {
    try{
        const employee = await prisma.staff.findMany({
            where:{is_active:true},
            select:{
                staff_id: true,
                staff_name: true,
                staff_role:true,
                staff_email: true,
                staff_contact:true,
                staff_salary:true,
                staff_joining_date: true,
                is_active: true,
                created_at:true,
                updated_at:true,
            }
        });
        if(!employee){
            return res.status(422).json({success:false,message:'no emplyoee found '});
        }
        res.status(200).json({success:true,data:employee});
    } catch(error) {
        next(error);
    }
}

// get one employee
const getOne = async (req,res,next) => {
    try{
        const {id} = req.params;

        if(!id) {
            return res.status(422).json({success:false,message:'id is required'});
        }

        const employee = await prisma.staff.findUnique({
            where:{staff_id:id},
            select:{
                staff_id: true,
                staff_name: true,
                staff_role:true,
                staff_email: true,
                staff_contact:true,
                staff_salary:true,
                staff_joining_date: true,
                is_active: true,
                created_at:true,
                updated_at:true,
            }
        });

        if(!employee){
            return res.status(404).json({success:false,message:'incorrect employee id'})
        }

        res.status(200).json({success:true,data:employee});
    } catch (error){
        next(error);
    }
}

// create for new employee

const create = async(req,res,next) => {
    try{
        const {staffName,staffRoll,staffEmail,staffContact,staffSalary,staffJoiningdate} = req.body;

        if(!staffName || !staffRoll || !staffEmail || !staffContact || !staffSalary || ! staffJoiningdate){
            return res.status(422).json({success:false,message:'All the fields are required'});
        }

        const employee = await prisma.staff.create({
            data:{
                staff_name:staffName,
                staff_role:staffRoll,
                staff_email:staffEmail,
                staff_contact:staffContact,
                staff_salary:staffSalary,
                staff_joining_date:staffJoiningdate
            },
            select:{
                staff_id: true,
                staff_name: true,
                staff_role:true,
                staff_email: true,
                staff_contact:true,
                staff_salary:true,
                staff_joining_date: true,
                is_active: true,
                created_at:true,
                updated_at:true,
            }
        });

        res.status(200).json({success:true,data:employee});
    }catch(error){
        next(error);
    }
}

//update the employee records.
const update = async (req,res,next) =>{
    try{
        const {id} = req.params;
        const {staffRole,staffEmail,staffContact,staffSalary} = req.body;

        const employeeExist = await prisma.staff.findUnique({
            where:{staff_id:id}
        });

        if(!employeeExist){
            return res.status(404).json({success:false,message:'no such employee exist || incorrect employee id'});
        }

        const employee = await prisma.staff.update({
            where:{staff_id:id},
            data:{
                ... (staffRole !== undefined && {staff_role:staffRole}),
                ... (staffEmail !== undefined && {staff_email:staffEmail}),
                ... (staffContact !== undefined && {staff_contact:staffContact}),
                ... (staffSalary !== undefined && {staff_salary:staffSalary}),
                updated_at:new Date()
            },
            select:{
                staff_id: true,
                staff_name: true,
                staff_role:true,
                staff_email: true,
                staff_contact:true,
                staff_salary:true,
                staff_joining_date: true,
                is_active: true,
                created_at:true,
                updated_at:true,
            }
        });
        res.status(200).json({success:true,data:employee});
    } catch(error){
        next(error);
    }
}

// to delete (soft delete) employee
const del = async (req,res,next) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.status(422).json({success:false,message:'No id provided'});
        }

        const employee = await prisma.staff.update({
            where:{staff_id:id},
            data:{
                is_active:false
            },
            select:{
                staff_id: true,
                staff_name: true,
                staff_role:true,
                staff_email: true,
                staff_contact:true,
                staff_salary:true,
                staff_joining_date: true,
                is_active: true,
                created_at:true,
                updated_at:true,
            }
        });

        res.status(200).json({success:true,data:employee});
    } catch(error){
        next(error);
    }
}
module.exports = {getAll,getOne,create,update,del};