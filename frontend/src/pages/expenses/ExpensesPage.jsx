import { useEffect, useState } from 'react';
import CrudPage from '../../components/ui/CrudPage';
import { expenseApi, staffApi } from '../../api/endpoints';
import { formatMoney, formatDate, toDateInputValue, todayInputValue } from '../../utils/format';

const METHODS = ['Cash', 'Bank', 'Cheque', 'Mobile'];

export default function ExpensesPage() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    staffApi.list().then(setStaff).catch(() => setStaff([]));
  }, []);

  return (
    <CrudPage
      title="Expenses"
      description="Day-to-day business expenses, attributed to the staff member who paid."
      idKey="expense_id"
      api={{
        list: expenseApi.list,
        create: (p) => expenseApi.create({
          expensesName: p.expensesName,
          expensesAmount: p.expensesAmount,
          expensesType: p.expensesType,
          expensesPaidby: p.expensesPaidby,
          expensesMethod: p.expensesMethod,
          expensesDate: p.expensesDate,
        }),
        update: (id, p) => expenseApi.update(id, {
          expensesName: p.expensesName,
          expensesAmount: p.expensesAmount,
          expensesType: p.expensesType,
          expensesPaidby: p.expensesPaidby,
          expensesMethod: p.expensesMethod,
          expensesDate: p.expensesDate,
        }),
        remove: expenseApi.remove,
      }}
      emptyValues={{
        expensesName: '', expensesAmount: '', expensesType: '',
        expensesPaidby: staff[0]?.staff_id || '', expensesMethod: 'Cash', expensesDate: todayInputValue(),
      }}
      fields={[
        { name: 'expensesName', label: 'Expense name', required: true, fromRow: (r) => r.expense_name },
        { name: 'expensesType', label: 'Type', required: true, placeholder: 'e.g. Utilities, Rent, Supplies', fromRow: (r) => r.expense_type },
        { name: 'expensesAmount', label: 'Amount', type: 'number', required: true, fromRow: (r) => r.expense_amount },
        {
          name: 'expensesPaidby', label: 'Paid by', type: 'select', required: true,
          options: staff.map((s) => ({ value: s.staff_id, label: s.staff_name })),
          fromRow: (r) => r.paid_by,
        },
        { name: 'expensesMethod', label: 'Payment method', type: 'select', required: true, options: METHODS.map((m) => ({ value: m, label: m })), fromRow: (r) => r.payment_method },
        { name: 'expensesDate', label: 'Date', type: 'date', required: true, fromRow: (r) => toDateInputValue(r.expense_date) },
      ]}
      columns={[
        { key: 'expense_name', header: 'Name' },
        { key: 'expense_type', header: 'Type' },
        { key: 'expense_amount', header: 'Amount', render: (r) => formatMoney(r.expense_amount) },
        { key: 'payment_method', header: 'Method' },
        { key: 'expense_date', header: 'Date', render: (r) => formatDate(r.expense_date) },
      ]}
    />
  );
}
