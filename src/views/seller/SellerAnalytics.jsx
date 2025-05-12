import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { get_seller_analytics_data } from '../../store/Reducers/analyticsReducer';
import moment from 'moment';

const SellerAnalytics = () => {
    const dispatch = useDispatch();
    const { analyticsData, loading, error } = useSelector((state) => state.analytics);
    const { userInfo } = useSelector((state) => state.auth);
    const [timePeriod, setTimePeriod] = useState('month');

    useEffect(() => {
        if (userInfo?._id) {
            dispatch(get_seller_analytics_data({ sellerId: userInfo._id, period: timePeriod }));
        }
    }, [dispatch, userInfo?._id, timePeriod]);

    const salesChart = {
        series: analyticsData?.salesTrend
            ? [
                  {
                      name: 'Sales',
                      data: analyticsData.salesTrend.sales || Array(12).fill(0),
                  },
                  {
                      name: 'Orders',
                      data: analyticsData.salesTrend.orders || Array(12).fill(0),
                  },
              ]
            : [
                  {
                      name: 'Sales',
                      data: Array(12).fill(0),
                  },
                  {
                      name: 'Orders',
                      data: Array(12).fill(0),
                  },
              ],
        options: {
            chart: {
                type: 'line',
                height: 350,
                background: 'transparent',
                foreColor: '#d0d2d6',
            },
            stroke: {
                width: [4, 4],
                curve: 'smooth',
            },
            xaxis: {
                categories:
                    timePeriod === 'year'
                        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        : timePeriod === 'month'
                        ? Array.from({ length: moment().daysInMonth() }, (_, i) => `${i + 1}`)
                        : Array.from({ length: 7 }, (_, i) => moment().subtract(6 - i, 'days').format('ddd')),
                labels: {
                    style: {
                        colors: '#d0d2d6',
                    },
                },
            },
            yaxis: {
                title: {
                    text: 'Value',
                    style: {
                        color: '#d0d2d6',
                    },
                },
                labels: {
                    style: {
                        colors: '#d0d2d6',
                    },
                },
            },
            fill: {
                colors: ['#a855f7', '#3b82f6'],
            },
            tooltip: {
                theme: 'dark',
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                labels: {
                    colors: '#d0d2d6',
                },
            },
        },
    };

    const orderStatusChart = {
        series: analyticsData?.orderStatus
            ? Object.values(analyticsData.orderStatus)
            : [0, 0, 0, 0],
        options: {
            chart: {
                type: 'pie',
                height: 350,
                background: 'transparent',
                foreColor: '#d0d2d6',
            },
            labels: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
            colors: ['#eab308', '#3b82f6', '#22c55e', '#ef4444'],
            tooltip: {
                theme: 'dark',
            },
            legend: {
                position: 'bottom',
                labels: {
                    colors: '#d0d2d6',
                },
            },
        },
    };

    return (
        <div className="px-4 md:px-7 py-5 min-h-screen bg-[#1a1a2e] relative overflow-hidden text-gray-200">
            <div className="absolute inset-0 wave-bg opacity-30 pointer-events-none" />
            <div className="absolute inset-0 particles pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a4a]/50 to-[#1a1a2e]/70 backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-100">Analytics Dashboard</h1>
                    <Link
                        to="/seller/dashboard"
                        className="text-sm text-purple-400 hover:underline"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Charts and Metrics */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#2a2a4a]/80 p-4 rounded-lg border border-purple-500/40">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-100">Sales Trend</h2>
                            <select
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value)}
                                className="px-3 py-1 bg-[#1a1a2e]/50 border border-gray-600 rounded-md text-gray-300 focus:outline-none"
                            >
                                <option value="week">Last 7 Days</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                        {loading ? (
                            <div className="animate-pulse h-[350px] bg-gray-600/50 rounded"></div>
                        ) : (
                            <Chart
                                options={salesChart.options}
                                series={salesChart.series}
                                type="line"
                                height={350}
                            />
                        )}
                    </div>

                    <div className="bg-[#2a2a4a]/80 p-4 rounded-lg border border-purple-500/40">
                        <h2 className="text-lg font-semibold text-gray-100 mb-4">Order Status Breakdown</h2>
                        {loading ? (
                            <div className="animate-pulse h-[350px] bg-gray-600/50 rounded"></div>
                        ) : (
                            <Chart
                                options={orderStatusChart.options}
                                series={orderStatusChart.series}
                                type="pie"
                                height={350}
                            />
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="w-full bg-[#2a2a4a]/80 p-4 rounded-lg border border-purple-500/40">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-100">Top Products</h2>
                        <Link
                            to="/seller/dashboard/products"
                            className="text-sm text-purple-400 hover:underline"
                        >
                            View All Products
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="animate-pulse flex gap-3">
                                    <div className="w-16 h-16 bg-gray-600/50 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-600/50 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-600/50 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : analyticsData?.topProducts?.length > 0 ? (
                        <div className="space-y-4">
                            {analyticsData.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <img
                                        src={p.image || '/demo.jpg'}
                                        alt={p.name}
                                        className="w-16 h-16 object-cover rounded"
                                        onError={(e) => (e.target.src = '/demo.jpg')}
                                    />
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-100">{p.name}</h3>
                                        <p className="text-xs text-gray-400">
                                            Sold: {p.sold} | Revenue: {(p.revenue || 0).toFixed(2)} DA
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center">No products sold yet</p>
                    )}
                </div>

                {/* Customer Insights Placeholder */}
                <div className="w-full mt-6 bg-[#2a2a4a]/80 p-4 rounded-lg border border-purple-500/40">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4">Customer Insights</h2>
                    {loading ? (
                        <div className="animate-pulse h-20 bg-gray-600/50 rounded"></div>
                    ) : (
                        <p className="text-gray-400">
                            Coming soon: Insights on repeat customers, top regions, and more.
                        </p>
                    )}
                </div>
            </div>

            <style jsx>{`
                .wave-bg {
                    background: linear-gradient(45deg, #0d0d1a, #1a1a2e, #0d0d1a, #1a1a2e);
                    background-size: 400%;
                    animation: waveAnimation 15s ease-in-out infinite;
                }
                @keyframes waveAnimation {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                .particles {
                    background-image: radial-gradient(rgba(0, 229, 255, 0.15) 1px, transparent 1px),
                        radial-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px);
                    background-size: 35px 35px, 55px 55px;
                    background-position: 0 0, 27px 27px;
                    animation: particleMove 25s linear infinite;
                }
                @keyframes particleMove {
                    from {
                        background-position: 0 0, 27px 27px;
                    }
                    to {
                        background-position: 350px 350px, 377px 377px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SellerAnalytics;