const express = require('express');
const cors = require('cors');

const app = express();


app.use(cors());
app.use(express.json());
const { authenticate } = require('./middleware/auth');
const authRouter = require('./routes/auth.routes');
const categoryRouter = require('./routes/category.routes');
const productRouter = require('./routes/product.routes');
const expenseRouter = require('./routes/expense.routes');
const staffRouter = require('./routes/staff.routes');
const inventoryRouter = require('./routes/inventory.routes');
const partyRouter = require('./routes/party.routes');
const salesRouter = require('./routes/sales.routes');
const purchaseRouter = require('./routes/purchase.routes');
const paymentRouter = require('./routes/payment.routes');
const ledgerRouter = require('./routes/ledger.routes');
const usersRouter = require('./routes/user.routes');


app.use('/auth', authRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

app.use('/categories', authenticate, categoryRouter);
app.use('/products', authenticate, productRouter);
app.use('/expenses', authenticate, expenseRouter);
app.use('/staff', authenticate, staffRouter);
app.use('/inventory', authenticate, inventoryRouter);
app.use('/party', authenticate, partyRouter);
app.use('/sales', authenticate, salesRouter);
app.use('/purchase', authenticate, purchaseRouter);
app.use('/payment', authenticate, paymentRouter);
app.use('/ledger', authenticate, ledgerRouter);
app.use('/users', authenticate, usersRouter);


const errorHandler = (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong'
    });
};

app.use(errorHandler);


module.exports = app;
