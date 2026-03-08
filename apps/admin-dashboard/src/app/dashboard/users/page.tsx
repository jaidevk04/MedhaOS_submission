'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Search, Filter, UserPlus, 
  Mail, Phone, MapPin, Calendar,
  Activity, TrendingUp, Eye, Edit
} from 'lucide-react';

// Hardcoded users data
const usersData = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@medhaos.com',
    role: 'Clinician',
    department: 'Cardiology',
    status: 'active',
    lastActive: '2 min ago',
    consultations: 234,
    phone: '+1 (555) 123-4567',
    joinDate: 'Jan 15, 2024'
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john.smith@email.com',
    role: 'Patient',
    department: 'N/A',
    status: 'active',
    lastActive: '5 min ago',
    consultations: 12,
    phone: '+1 (555) 234-5678',
    joinDate: 'Feb 20, 2024'
  },
  {
    id: 3,
    name: 'Nurse Emily Davis',
    email: 'emily.davis@medhaos.com',
    role: 'Nurse',
    department: 'Emergency',
    status: 'active',
    lastActive: '1 min ago',
    consultations: 456,
    phone: '+1 (555) 345-6789',
    joinDate: 'Dec 10, 2023'
  },
  {
    id: 4,
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medhaos.com',
    role: 'Clinician',
    department: 'Neurology',
    status: 'active',
    lastActive: '10 min ago',
    consultations: 189,
    phone: '+1 (555) 456-7890',
    joinDate: 'Mar 5, 2024'
  },
  {
    id: 5,
    name: 'Admin User',
    email: 'admin@medhaos.com',
    role: 'Admin',
    department: 'Administration',
    status: 'active',
    lastActive: 'Just now',
    consultations: 0,
    phone: '+1 (555) 567-8901',
    joinDate: 'Jan 1, 2024'
  },
  {
    id: 6,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    role: 'Patient',
    department: 'N/A',
    status: 'inactive',
    lastActive: '2 days ago',
    consultations: 8,
    phone: '+1 (555) 678-9012',
    joinDate: 'Feb 28, 2024'
  },
  {
    id: 7,
    name: 'Dr. James Wilson',
    email: 'james.wilson@medhaos.com',
    role: 'Clinician',
    department: 'Pediatrics',
    status: 'active',
    lastActive: '15 min ago',
    consultations: 312,
    phone: '+1 (555) 789-0123',
    joinDate: 'Nov 20, 2023'
  },
  {
    id: 8,
    name: 'Nurse Robert Taylor',
    email: 'robert.taylor@medhaos.com',
    role: 'Nurse',
    department: 'Cardiology',
    status: 'active',
    lastActive: '3 min ago',
    consultations: 278,
    phone: '+1 (555) 890-1234',
    joinDate: 'Jan 25, 2024'
  }
];

// User stats
const userStats = {
  total: 2847,
  active: 1923,
  clinicians: 234,
  patients: 2456,
  nurses: 145,
  admins: 12
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-slate-600 mt-1">Manage all users across the platform</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.total.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userStats.active.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Clinicians</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{userStats.clinicians}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{userStats.patients.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Nurses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{userStats.nurses}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{userStats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'clinician', 'patient', 'nurse', 'admin'].map((role) => (
                    <Button
                      key={role}
                      variant={filterRole === role ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterRole(role)}
                      className={filterRole === role ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : ''}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-md bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          user.role === 'Clinician' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                          user.role === 'Patient' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                          user.role === 'Nurse' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                          'bg-gradient-to-br from-orange-500 to-red-500'
                        }`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-lg">{user.name}</h3>
                            <Badge className={`text-xs ${
                              user.role === 'Clinician' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              user.role === 'Patient' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              user.role === 'Nurse' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-orange-100 text-orange-800 border-orange-200'
                            }`}>
                              {user.role}
                            </Badge>
                            <Badge className={`text-xs ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {user.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{user.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {user.joinDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 px-6 border-l border-gray-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{user.consultations}</div>
                            <div className="text-xs text-gray-600">Consultations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-green-600">{user.lastActive}</div>
                            <div className="text-xs text-gray-600">Last Active</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
