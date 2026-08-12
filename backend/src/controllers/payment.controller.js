const prisma = require('../db/pool');

// get all
const getAll = async (req, res, next) => {
    try {

        const {
            party_id,
            start_date,
            end_date
        } = req.query;


        // Build filters
        const where = {};


        // Filter by party
        if (party_id) {
            where.party_id = party_id;
        }


        // Date range filter
        if (start_date || end_date) {

            where.payment_date = {};

            if (start_date) {
                where.payment_date.gte = new Date(start_date);
            }

            if (end_date) {
                where.payment_date.lte = new Date(end_date);
            }
        }


        const payments = await prisma.payment.findMany({

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
                }
            },

            orderBy: {
                payment_date: 'desc'
            }
        });


        return res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {
        next(error);
    }
};


// create payment
const create = async (req, res, next) => {
    try {

        const {
            party_id,
            staff_id,
            payment_type,
            payment_method,
            amount,
            reference_note,
            payment_date
        } = req.body;


        if (!payment_type || !payment_method || !payment_date) {
            return res.status(422).json({
                success: false,
                message: 'payment_type, payment_method and payment_date are required'
            });
        }

        if (amount === undefined || Number(amount) <= 0) {
            return res.status(422).json({
                success: false,
                message: 'amount must be greater than 0'
            });
        }

        if (!party_id && !staff_id) {
            return res.status(422).json({
                success: false,
                message: 'party_id or staff_id is required'
            });
        }

        const result = await prisma.$transaction(async (tx) => {


            if (party_id) {

                const party = await tx.party.findFirst({
                    where: {
                        party_id: party_id,
                        is_active: true
                    }
                });


                if (!party) {
                    throw new Error(
                        'party does not exist or is inactive'
                    );
                }
            }


            if (staff_id) {

                const staff = await tx.staff.findUnique({
                    where: {
                        staff_id: staff_id
                    }
                });


                if (!staff) {
                    throw new Error(
                        'staff does not exist'
                    );
                }
            }

            const payment = await tx.payment.create({
                data: {
                    party_id: party_id || null,
                    staff_id: staff_id || null,
                    payment_type: payment_type,
                    payment_method: payment_method,
                    amount: Number(amount),
                    reference_note: reference_note || '',
                    payment_date: new Date(payment_date)
                }
            });

            if (party_id) {

                let debit = 0;
                let credit = 0;

                if (payment_type === 'Received') {
                    credit = Number(amount);
                }

                if (payment_type === 'Paid') {
                    debit = Number(amount);
                }

                await tx.ledger.create({
                    data: {
                        party_id: party_id,
                        debit: debit,
                        credit: credit,
                        transaction_type: 'Payment',
                        reference_id: payment.payment_id
                    }
                });
            }

            return payment;
        });


        return res.status(201).json({
            success: true,
            message: 'payment created successfully',
            data: result
        });


    } catch (error) {
        next(error);
    }
};

module.exports = {getAll,create}
