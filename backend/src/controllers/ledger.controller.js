const prisma = require('../db/pool');

//get by party
const getByParty = async (req, res, next) => {
    try {

        const { partyId } = req.params;


        if (!partyId) {
            return res.status(422).json({
                success: false,
                message: 'party id is required'
            });
        }


        // Get ledger rows
        const ledger = await prisma.ledger.findMany({
            where: {
                party_id: partyId
            },

            orderBy: {
                created_at: 'asc'
            }
        });


        // Calculate running balance
        let balance = 0;


        const result = ledger.map(row => {

            const credit = Number(row.credit);
            const debit = Number(row.debit);

            // Balance = Credit - Debit
            balance += credit - debit;


            return {
                ledger_id: row.ledger_id,
                party_id: row.party_id,

                debit: row.debit,
                credit: row.credit,

                reference_type: row.reference_type,
                reference_id: row.reference_id,

                created_at: row.created_at,
                updated_at: row.updated_at,

                balance: balance
            };
        });


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {
        next(error);
    }
};
// get party balance
const getBalance = async (req, res, next) => {
    try {

        const { partyId } = req.params;


        if (!partyId) {
            return res.status(422).json({
                success: false,
                message: 'party id is required'
            });
        }


        // Get all ledger rows for party
        const result = await prisma.ledger.aggregate({

            where: {
                party_id: partyId
            },

            _sum: {
                credit: true,
                debit: true
            }
        });


        const credit = Number(result._sum.credit || 0);
        const debit = Number(result._sum.debit || 0);


        const balance = credit - debit;


        return res.status(200).json({
            success: true,
            data: {
                party_id: partyId,
                balance: balance
            }
        });


    } catch (error) {
        next(error);
    }
};

module.exports = {getByParty,getBalance};