const prisma = require('../db/pool');

//get all
const getAll = async (req,res,next) => {
    try{
        const party = await prisma.party.findMany({
            where:{
                is_active:true
            },
            select:{
                party_id:true,
                party_name:true,
                party_address:true,
                party_contact:true,
                party_role:true,
                is_active:true,
                updated_at:true,
                created_at:true
            },
            orderBy:{
                party_name:'asc'
            }
        });

        if(!party){
            return res.status(404).json({success:false,message:'no party found'});
        }
        res.status(200).json({success:true,data:party});
    }catch(error){
        next(error);
    }
}

//get one
const getOne = async (req,res,next) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.json({success:false,message:'id is required'});
        }
        const party = await prisma.party.findUnique({
            where:{
                party_id:id,
                is_active:true
            },
            select:{
                party_id:true,
                party_name:true,
                party_address:true,
                party_contact:true,
                party_role:true,
                is_active:true,
                updated_at:true,
                created_at:true
            }
        });

        if(!party){
            return res.status(404).json({success:false,message:"no such party exist"});
        }
        res.status(200).json({success:true,data:party});
    } catch(error){
        next(error);
    }
}

//create
const create = async (req,res,next) => {
    try{
        const {partyName,partyAddress,partyContact,partyRole} = req.body;

        if(!partyName || ! partyAddress || !partyContact || !partyRole){
            return res.status(424).json({success:false,message:'all fields are required'});
        }

        const party = await prisma.party.create({
            data:{
                party_name:partyName,
                party_address:partyAddress,
                party_contact:partyContact,
                party_role: {
                    create: {
                        role: partyRole
                    }
                }
            },
            select:{
                party_id:true,
                party_name:true,
                party_address:true,
                party_contact:true,
                is_active:true,
                updated_at:true,
                created_at:true,
                party_role: {
                    select: {
                        role: true
                    }
                }
            }
        });
        res.status(200).json({success:true,data:party});
    } catch(error){
        next(error);
    }
}

//update
const update = async (req,res,next) => {
    try {
        const {id} = req.params;

        if(!id){
            return res.json({success:false,message:'id is required'});
        }

        const {partyName,partyAddress,partyContact,partyRoll} = req.body;

        const partyExist = await prisma.party.findUnique({
            where:{
                party_id:id,
                is_active:true
            }
        });
        if(!partyExist){
            return res.status(404).json({success:false,message:'no such party exist'});
        }

        const party = await prisma.party.update({
            where:{
                party_id:id,
                is_active:true
            },
            data:{
                ... (partyName !== undefined && {party_name:partyName}),
                ... (partyAddress !== undefined && {party_address:partyAddress}),
                ... (partyContact !== undefined && {party_contact:partyContact}),
                ... (partyRoll !== undefined && {party_roll:partyRoll})
            },
            select:{
                party_id:true,
                party_name:true,
                party_address:true,
                party_contact:true,
                party_role:true,
                is_active:true,
                updated_at:true,
                created_at:true
            }
        });
        res.status(200).json({success:true,data:party});
    } catch(error){
        next(error);
    }
}

//delete
const del = async(req,res,next) => {
    try{
        const {id} = req.params;

        if(!id){
            return res.json({success:false,message:'id is required'});
        }

        const partyExist = await prisma.party.findUnique({
            where:{is_active:true,party_id:id}
        });
        if(!partyExist){
            return res.status(404).json({success:false,message:'no such party exist'});
        }
        const party = await prisma.party.update({
            where:{party_id:id,is_active:true},
            data:{
                is_active:false
            },
            select:{
                party_id:true,
                party_name:true,
                party_address:true,
                party_contact:true,
                party_role:true,
                is_active:true,
                updated_at:true,
                created_at:true
            }
        });
        res.status(200).json({success:true,data:party});
    }catch(error){
        next(error);
    }
}

module.exports = {getAll,getOne,create,update,del};