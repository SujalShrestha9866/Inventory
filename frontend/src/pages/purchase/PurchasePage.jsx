import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { TypeBadge } from '../../components/ui/Badge';

import { purchaseApi } from '../../api/endpoints';
import { formatMoney, formatDate } from '../../utils/format';

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function PurchasePage() {
    const [rows, setRows] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [range, setRange] = useState({
        start_date: '',
        end_date: '',
    });

    /*
     * ================================
     * LOAD PURCHASES
     * ================================
     */
    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = {};

            /*
             * IMPORTANT:
             * These names must match req.query
             * in purchase.controller.js
             */
            if (range.start_date) {
                params.start_date = range.start_date;
            }

            if (range.end_date) {
                params.end_date = range.end_date;
            }

            console.log('Purchase API params:', params);

            const data = await purchaseApi.list(params);

            console.log('Purchase API response:', data);

            setRows(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load purchases:', err);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load purchases'
            );

            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [range.start_date, range.end_date]);

    /*
     * Reload whenever date changes
     */
    useEffect(() => {
        load();
    }, [load]);

    /*
     * ================================
     * START DATE
     * ================================
     */
    const handleStartDateChange = (e) => {
        const value = e.target.value;

        setRange((current) => ({
            ...current,
            start_date: value,
        }));
    };

    /*
     * ================================
     * END DATE
     * ================================
     */
    const handleEndDateChange = (e) => {
        const value = e.target.value;

        setRange((current) => ({
            ...current,
            end_date: value,
        }));
    };

    /*
     * ================================
     * CLEAR FILTERS
     * ================================
     */
    const clearFilters = () => {
        setRange({
            start_date: '',
            end_date: '',
        });
    };

    /*
     * ================================
     * TODAY
     * ================================
     */
    const setToday = () => {
        const today = getToday();

        setRange({
            start_date: today,
            end_date: today,
        });
    };

    /*
     * ================================
     * DATE VALIDATION
     * ================================
     */
    const invalidRange =
        range.start_date &&
        range.end_date &&
        range.start_date > range.end_date;

    return (
        <div>

            {/* ================================
                HEADER
            ================================= */}

            <div className="page-header">

                <div>
                    <h1>Purchases</h1>

                    <p>
                        Stock brought in from suppliers.
                    </p>
                </div>

                <Link to="/purchase/new">
                    <Button variant="primary">
                        + New Purchase
                    </Button>
                </Link>

            </div>


            {/* ================================
                DATE FILTERS
            ================================= */}

            <div
                className="toolbar"
                style={{
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >

                {/* FROM */}

                <div>

                    <label
                        style={{
                            display: 'block',
                            marginBottom: 6,
                            fontSize: 12,
                        }}
                    >
                        From
                    </label>

                    <input
                        type="date"
                        value={range.start_date}
                        max={range.end_date || undefined}
                        onChange={handleStartDateChange}
                    />

                </div>


                {/* TO TEXT */}

                <span
                    style={{
                        color: 'var(--ink-500)',
                        marginTop: 20,
                    }}
                >
                    to
                </span>


                {/* TO */}

                <div>

                    <label
                        style={{
                            display: 'block',
                            marginBottom: 6,
                            fontSize: 12,
                        }}
                    >
                        To
                    </label>

                    <input
                        type="date"
                        value={range.end_date}
                        min={range.start_date || undefined}
                        onChange={handleEndDateChange}
                    />

                </div>


                {/* BUTTONS */}

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 20,
                    }}
                >

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={setToday}
                    >
                        Today
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                    >
                        Clear
                    </Button>

                </div>

            </div>


            {/* ================================
                INVALID DATE RANGE
            ================================= */}

            {invalidRange && (
                <div className="error-banner">
                    The start date cannot be later than the end date.
                </div>
            )}


            {/* ================================
                ERROR
            ================================= */}

            {error && (
                <div className="error-banner">
                    {error}
                </div>
            )}


            {/* ================================
                PURCHASE TABLE
            ================================= */}

            <DataTable
                loading={loading}
                rowKey="purchase_id"
                rows={invalidRange ? [] : rows}
                columns={[

                    /*
                     * DATE
                     */
                    {
                        key: 'purchase_date',
                        header: 'Date',

                        render: (r) =>
                            formatDate(r.purchase_date),
                    },


                    /*
                     * SUPPLIER
                     */
                    {
                        key: 'party_name',
                        header: 'Supplier',

                        render: (r) =>
                            r.party?.party_name ||
                            r.party_name ||
                            '—',
                    },


                    /*
                     * RECORDED BY
                     */
                    {
                        key: 'staff_name',
                        header: 'Recorded by',

                        render: (r) =>
                            r.staff?.staff_name ||
                            r.staff_name ||
                            '—',
                    },


                    /*
                     * PURCHASE TYPE
                     */
                    {
                        key: 'purchase_type',
                        header: 'Type',

                        render: (r) => (
                            <TypeBadge
                                type={r.purchase_type}
                            />
                        ),
                    },


                    /*
                     * TOTAL
                     */
                    {
                        key: 'total_amount',
                        header: 'Total',

                        render: (r) =>
                            formatMoney(
                                r.total_amount
                            ),
                    },


                    /*
                     * VIEW
                     */
                    {
                        key: '__actions',
                        header: '',

                        render: (r) => (
                            <Link
                                to={`/purchase/${r.purchase_id}`}
                            >
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    type="button"
                                >
                                    View
                                </Button>
                            </Link>
                        ),
                    },

                ]}
            />

        </div>
    );
}