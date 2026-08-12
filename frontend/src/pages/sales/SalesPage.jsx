import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import {
    TypeBadge,
    StatusBadge
} from '../../components/ui/Badge';

import { salesApi } from '../../api/endpoints';
import {
    formatMoney,
    formatDate
} from '../../utils/format';

function getToday() {

    const now = new Date();

    const nepalTime =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone: 'Asia/Kathmandu',

                year: 'numeric',

                month: '2-digit',

                day: '2-digit'
            }
        ).format(now);

    return nepalTime;
}


export default function SalesPage() {

    const [rows, setRows] =
        useState([]);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState('');


    const [range, setRange] =
        useState({

            start_date: '',

            end_date: ''

        });


    const load = useCallback(
        async () => {

            setLoading(true);

            setError('');


            try {

                const params = {};


                // Start date
                if (range.start_date) {

                    params.start_date =
                        range.start_date;

                }


                // End date
                if (range.end_date) {

                    params.end_date =
                        range.end_date;

                }


                console.log(
                    'Sales API params:',
                    params
                );


                const data =
                    await salesApi.list(
                        params
                    );


                console.log(
                    'Sales API response:',
                    data
                );


                setRows(
                    Array.isArray(data)
                        ? data
                        : []
                );


            } catch (err) {

                console.error(
                    'Failed to load sales:',
                    err
                );


                setError(

                    err?.response?.data?.message ||

                    err?.message ||

                    'Failed to load sales'

                );


                setRows([]);

            } finally {

                setLoading(false);

            }

        },
        [
            range.start_date,
            range.end_date
        ]
    );

    useEffect(() => {

        load();

    }, [load]);

    const handleStartDateChange =
        (e) => {

            const value =
                e.target.value;


            setRange(
                (current) => ({

                    ...current,

                    start_date:
                    value

                })
            );

        };



    // =================================================
    // End date
    // =================================================
    const handleEndDateChange =
        (e) => {

            const value =
                e.target.value;


            setRange(
                (current) => ({

                    ...current,

                    end_date:
                    value

                })
            );

        };



    // =================================================
    // Clear filters
    // =================================================
    const clearFilters = () => {

        setRange({

            start_date: '',

            end_date: ''

        });

    };



    // =================================================
    // Today
    // =================================================
    const setToday = () => {

        const today =
            getToday();


        setRange({

            start_date:
            today,

            end_date:
            today

        });

    };



    // =================================================
    // Validate range
    // =================================================
    const invalidRange =
        range.start_date &&
        range.end_date &&
        range.start_date >
        range.end_date;



    // =================================================
    // UI
    // =================================================
    return (

        <div>


            {/* =========================================
                HEADER
            ========================================= */}

            <div className="page-header">

                <div>

                    <h1>
                        Sales
                    </h1>


                    <p>
                        Every sale recorded,
                        with running totals
                        per invoice.
                    </p>

                </div>


                <Link to="/sales/new">

                    <Button
                        variant="primary"
                    >
                        + New Sale
                    </Button>

                </Link>

            </div>



            {/* =========================================
                DATE FILTERS
            ========================================= */}

            <div
                className="toolbar"

                style={{
                    marginBottom: 16,

                    display: 'flex',

                    alignItems:
                        'center',

                    gap: 12,

                    flexWrap:
                        'wrap'
                }}
            >


                {/* FROM */}

                <div>

                    <label
                        style={{
                            display:
                                'block',

                            marginBottom:
                                6,

                            fontSize:
                                12
                        }}
                    >
                        From
                    </label>


                    <input
                        type="date"

                        value={
                            range.start_date
                        }

                        max={
                            range.end_date ||
                            undefined
                        }

                        onChange={
                            handleStartDateChange
                        }
                    />

                </div>



                <span
                    style={{

                        color:
                            'var(--ink-500)',

                        marginTop:
                            20

                    }}
                >
                    to
                </span>



                {/* TO */}

                <div>

                    <label
                        style={{
                            display:
                                'block',

                            marginBottom:
                                6,

                            fontSize:
                                12
                        }}
                    >
                        To
                    </label>


                    <input
                        type="date"

                        value={
                            range.end_date
                        }

                        min={
                            range.start_date ||
                            undefined
                        }

                        onChange={
                            handleEndDateChange
                        }
                    />

                </div>



                {/* BUTTONS */}

                <div
                    style={{

                        display:
                            'flex',

                        gap: 8,

                        marginTop:
                            20

                    }}
                >

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={
                            setToday
                        }
                    >
                        Today
                    </Button>


                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={
                            clearFilters
                        }
                    >
                        Clear
                    </Button>

                </div>

            </div>



            {/* =========================================
                INVALID DATE
            ========================================= */}

            {invalidRange && (

                <div className="error-banner">

                    The start date cannot
                    be later than the end date.

                </div>

            )}



            {/* =========================================
                ERROR
            ========================================= */}

            {error && (

                <div className="error-banner">

                    {error}

                </div>

            )}



            {/* =========================================
                TABLE
            ========================================= */}

            <DataTable

                loading={
                    loading
                }

                rowKey="sales_id"

                rows={
                    invalidRange
                        ? []
                        : rows
                }


                columns={[


                    // ---------------------------------
                    // DATE
                    // ---------------------------------
                    {
                        key:
                            'sales_date',

                        header:
                            'Date',

                        render:
                            (r) =>
                                formatDate(
                                    r.sales_date
                                )
                    },


                    // ---------------------------------
                    // PARTY
                    // ---------------------------------
                    {
                        key:
                            'party',

                        header:
                            'Party',

                        render:
                            (r) =>
                                r.party
                                    ?.party_name ||

                                r.party_name ||

                                '—'
                    },


                    // ---------------------------------
                    // STAFF
                    // ---------------------------------
                    {
                        key:
                            'staff',

                        header:
                            'Sold by',

                        render:
                            (r) =>
                                r.staff
                                    ?.staff_name ||

                                r.staff_name ||

                                '—'
                    },


                    // ---------------------------------
                    // TYPE
                    // ---------------------------------
                    {
                        key:
                            'sales_type',

                        header:
                            'Type',

                        render:
                            (r) => (

                                <TypeBadge
                                    type={
                                        r.sales_type
                                    }
                                />

                            )
                    },


                    // ---------------------------------
                    // STATUS
                    // ---------------------------------
                    {
                        key:
                            'status',

                        header:
                            'Status',

                        render:
                            (r) => (

                                <StatusBadge

                                    status={
                                        r.status ||
                                        'ACTIVE'
                                    }

                                />

                            )
                    },


                    // ---------------------------------
                    // TOTAL
                    // ---------------------------------
                    {
                        key:
                            'total_amount',

                        header:
                            'Total',

                        render:
                            (r) =>

                                formatMoney(
                                    r.total_amount
                                )
                    },


                    // ---------------------------------
                    // VIEW
                    // ---------------------------------
                    {
                        key:
                            '__actions',

                        header:
                            '',

                        render:
                            (r) => (

                                <Link
                                    to={
                                        `/sales/${r.sales_id}`
                                    }
                                >

                                    <Button

                                        size="sm"

                                        variant="ghost"

                                        type="button"
                                    >
                                        View
                                    </Button>

                                </Link>

                            )
                    }

                ]}

            />

        </div>
    );
}