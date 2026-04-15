package com.example.employeetracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.employeetracker.data.model.Employee
import com.example.employeetracker.data.model.Task
import com.example.employeetracker.data.model.Performance
import com.example.employeetracker.data.model.Attendance
import com.example.employeetracker.data.repository.AppRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(private val repository: AppRepository) : ViewModel() {
    
    // Employees
    val employees: StateFlow<List<Employee>> = repository.allEmployees
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Tasks
    val tasks: StateFlow<List<Task>> = repository.allTasks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Performance
    val performance: StateFlow<List<Performance>> = repository.allPerformance
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // CRUD Operations
    fun addEmployee(employee: Employee) = viewModelScope.launch { repository.insertEmployee(employee) }
    fun addTask(task: Task) = viewModelScope.launch { repository.insertTask(task) }
    fun addPerformance(perf: Performance) = viewModelScope.launch { repository.insertPerformance(perf) }
    fun markAttendance(att: Attendance) = viewModelScope.launch { repository.insertAttendance(att) }
    
    // Dashboard Stats
    val totalEmployees = employees.map { it.size }
    val pendingTasksCount = tasks.map { it.count { t -> t.status != "Completed" } }
    val completedTasksCount = tasks.map { it.count { t -> t.status == "Completed" } }
}
