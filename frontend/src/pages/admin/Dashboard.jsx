import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function StatCard({ title, value, subtitle, icon, iconBg, changeColor }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-4xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && <p className={`text-sm mt-1 ${changeColor}`}>{subtitle}</p>}
      </div>
      <div className={`${iconBg} w-14 h-14 rounded-2xl flex items-center justify-center text-3xl`}>
        {icon}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [pendingAssociations, setPendingAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, monthlyRes, categoryRes, pendingRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/monthly-donations'),
          api.get('/admin/category-breakdown'),
          api.get('/admin/pending-associations')
        ]);

        setStats(statsRes.data);
        setMonthlyData(monthlyRes.data);
        setCategoryData(categoryRes.data);
        setPendingAssociations(pendingRes.data.associations || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading Dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back • {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {/* Stats Cards - Full width responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers?.toLocaleString() || 0}
            subtitle="+12% this month"
            icon="👥"
            iconBg="bg-blue-100 text-blue-600"
            changeColor="text-blue-600"
          />
          <StatCard
            title="Total Donors"
            value={stats?.totalDonors?.toLocaleString() || 0}
            subtitle="Active community"
            icon="🙋‍♂️"
            iconBg="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Associations"
            value={`${stats?.activeAssociations || 0} active`}
            subtitle={`${stats?.pendingAssociations || 0} pending`}
            icon="🏢"
            iconBg="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Pending Reviews"
            value={stats?.pendingAssociations || 0}
            subtitle="Requires attention"
            icon="⏳"
            iconBg="bg-amber-100 text-amber-600"
            changeColor="text-amber-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
          {/* Monthly Donations - Wider */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Donations (TND)</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} TND`, 'Donations']}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="Donations" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donations by Category */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Donations by Category</h2>
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} donations`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Associations */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pending Association Verifications</h2>
            <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium">
              {pendingAssociations.length} Pending
            </span>
          </div>

          {pendingAssociations.length > 0 ? (
            <div className="space-y-4">
              {pendingAssociations.map((assoc) => (
                <div key={assoc._id} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">{assoc.organizationName || assoc.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted on {new Date(assoc.createdAt).toLocaleDateString('fr-TN')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 text-red-600 border border-red-200 rounded-xl hover:bg-red-50">
                      Reject
                    </button>
                    <button className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-16 text-gray-400">No pending verifications at the moment</p>
          )}
        </div>

      </div>
    </div>
  );
}