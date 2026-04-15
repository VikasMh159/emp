export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  joiningDate: string;
  email: string;
  contact: string;
  gender?: 'Male' | 'Female' | 'Other';
  avatar?: string;
  rbacRole?: 'super_admin' | 'admin' | 'employee';
  isTeamLeader?: boolean;
  leaderId?: string;
}

export interface Task {
  id: string;
  employeeId: string;
  description: string;
  details?: string;
  targetRole?: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Reviewed';
}

export interface Performance {
  id: string;
  employeeId: string;
  date: string;
  qualityScore: number;
  timelinessScore: number;
  attendanceScore: number;
  communicationScore: number;
  innovationScore: number;
  overallRating: number;
  remarks: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent';
}

export const DUMMY_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Engineering Lead',
    department: 'Engineering',
    joiningDate: '2023-01-15',
    email: 'sarah.j@company.com',
    contact: '+1 234 567 8901',
    gender: 'Female',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    isTeamLeader: true
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Product Manager',
    department: 'Product',
    joiningDate: '2023-03-10',
    email: 'm.chen@company.com',
    contact: '+1 234 567 8902',
    gender: 'Male',
    avatar: 'https://i.pravatar.cc/150?u=michael',
    isTeamLeader: true
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    role: 'UX Designer',
    department: 'Product',
    joiningDate: '2023-06-22',
    email: 'elena.r@company.com',
    contact: '+1 234 567 8903',
    gender: 'Female',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    leaderId: '2'
  },
  {
    id: '4',
    name: 'David Smith',
    role: 'QA Engineer',
    department: 'Engineering',
    joiningDate: '2023-08-05',
    email: 'd.smith@company.com',
    contact: '+1 234 567 8904',
    gender: 'Male',
    avatar: 'https://i.pravatar.cc/150?u=david',
    leaderId: '1'
  },
  {
    id: '5',
    name: 'Alex Rivera',
    role: 'Frontend Developer',
    department: 'Engineering',
    joiningDate: '2023-09-12',
    email: 'a.rivera@company.com',
    contact: '+1 234 567 8905',
    gender: 'Male',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    leaderId: '1'
  }
];

export const DUMMY_TASKS: Task[] = [
  {
    id: 't1',
    employeeId: '1',
    description: 'Implement new auth flow',
    details: 'Set up JWT based authentication with refresh tokens and secure cookie storage.',
    targetRole: 'Senior Developer',
    deadline: '2024-05-20',
    priority: 'High',
    assignedDate: '2024-05-10',
    status: 'In Progress'
  },
  {
    id: 't2',
    employeeId: '1',
    description: 'Code review for PR #452',
    details: 'Review the new dashboard widgets and ensure responsive design compliance.',
    targetRole: 'Senior Developer',
    deadline: '2024-05-15',
    priority: 'Medium',
    assignedDate: '2024-05-12',
    status: 'Completed'
  },
  {
    id: 't3',
    employeeId: '2',
    description: 'Q3 Product Roadmap',
    details: 'Draft the initial roadmap for Q3 focusing on AI integration features.',
    targetRole: 'Product Manager',
    deadline: '2024-06-01',
    priority: 'High',
    assignedDate: '2024-05-01',
    status: 'Pending'
  }
];

export const DUMMY_PERFORMANCE: Performance[] = [
  {
    id: 'p1',
    employeeId: '1',
    date: '2024-04-30',
    qualityScore: 5,
    timelinessScore: 4,
    attendanceScore: 5,
    communicationScore: 4,
    innovationScore: 5,
    overallRating: 4.6,
    remarks: 'Excellent technical leadership and code quality.'
  },
  {
    id: 'p2',
    employeeId: '2',
    date: '2024-04-30',
    qualityScore: 4,
    timelinessScore: 5,
    attendanceScore: 4,
    communicationScore: 5,
    innovationScore: 4,
    overallRating: 4.4,
    remarks: 'Great stakeholder management.'
  },
  {
    id: 'p3',
    employeeId: '3',
    date: '2024-04-30',
    qualityScore: 5,
    timelinessScore: 5,
    attendanceScore: 4,
    communicationScore: 4,
    innovationScore: 5,
    overallRating: 4.6,
    remarks: 'Outstanding creative vision and design execution.'
  },
  {
    id: 'p4',
    employeeId: '4',
    date: '2024-04-30',
    qualityScore: 4,
    timelinessScore: 4,
    attendanceScore: 5,
    communicationScore: 4,
    innovationScore: 4,
    overallRating: 4.2,
    remarks: 'Very thorough testing and attention to detail.'
  }
];

export const DUMMY_ATTENDANCE: Attendance[] = [
  { id: 'a1', employeeId: '1', date: '2024-05-13', status: 'Present' },
  { id: 'a2', employeeId: '2', date: '2024-05-13', status: 'Present' },
  { id: 'a3', employeeId: '3', date: '2024-05-13', status: 'Absent' },
];
