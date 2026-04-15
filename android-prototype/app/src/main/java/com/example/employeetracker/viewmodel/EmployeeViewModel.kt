package com.example.employeetracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.employeetracker.data.local.EmployeeDao
import com.example.employeetracker.data.model.Employee
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class EmployeeViewModel(private val employeeDao: EmployeeDao) : ViewModel() {
    private val _employees = MutableStateFlow<List<Employee>>(emptyList())
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    init {
        viewModelScope.launch {
            employeeDao.getAllEmployees().collect {
                _employees.value = it
            }
        }
    }

    fun addEmployee(employee: Employee) {
        viewModelScope.launch {
            employeeDao.insertEmployee(employee)
        }
    }

    fun updateEmployee(employee: Employee) {
        viewModelScope.launch {
            employeeDao.updateEmployee(employee)
        }
    }

    fun deleteEmployee(employee: Employee) {
        viewModelScope.launch {
            employeeDao.deleteEmployee(employee)
        }
    }
}
