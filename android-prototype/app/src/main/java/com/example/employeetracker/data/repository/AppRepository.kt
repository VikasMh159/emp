package com.example.employeetracker.data.repository

import com.example.employeetracker.data.local.AttendanceDao
import com.example.employeetracker.data.local.EmployeeDao
import com.example.employeetracker.data.local.PerformanceDao
import com.example.employeetracker.data.local.TaskDao
import com.example.employeetracker.data.model.Attendance
import com.example.employeetracker.data.model.Employee
import com.example.employeetracker.data.model.Performance
import com.example.employeetracker.data.model.Task
import kotlinx.coroutines.flow.Flow

class AppRepository(
    private val employeeDao: EmployeeDao,
    private val taskDao: TaskDao,
    private val performanceDao: PerformanceDao,
    private val attendanceDao: AttendanceDao
) {
    // Employee
    val allEmployees: Flow<List<Employee>> = employeeDao.getAllEmployees()
    suspend fun insertEmployee(employee: Employee) = employeeDao.insertEmployee(employee)
    suspend fun updateEmployee(employee: Employee) = employeeDao.updateEmployee(employee)
    suspend fun deleteEmployee(employee: Employee) = employeeDao.deleteEmployee(employee)

    // Tasks
    val allTasks: Flow<List<Task>> = taskDao.getAllTasks()
    suspend fun insertTask(task: Task) = taskDao.insertTask(task)
    suspend fun updateTask(task: Task) = taskDao.updateTask(task)
    suspend fun deleteTask(task: Task) = taskDao.deleteTask(task)

    // Performance
    val allPerformance: Flow<List<Performance>> = performanceDao.getAllPerformance()
    suspend fun insertPerformance(performance: Performance) = performanceDao.insertPerformance(performance)

    // Attendance
    fun getAttendanceForEmployee(id: Int) = attendanceDao.getAttendanceForEmployee(id)
    suspend fun insertAttendance(attendance: Attendance) = attendanceDao.insertAttendance(attendance)
}
