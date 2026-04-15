package com.example.employeetracker.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Dashboard : Screen("dashboard")
    object EmployeeList : Screen("employee_list")
    object AddEditEmployee : Screen("add_edit_employee/{employeeId}") {
        fun createRoute(employeeId: Int = -1) = "add_edit_employee/$employeeId"
    }
    object EmployeeDetail : Screen("employee_detail/{employeeId}") {
        fun createRoute(employeeId: Int) = "employee_detail/$employeeId"
    }
    object Task : Screen("task/{employeeId}") {
        fun createRoute(employeeId: Int) = "task/$employeeId"
    }
    object Performance : Screen("performance/{employeeId}") {
        fun createRoute(employeeId: Int) = "performance/$employeeId"
    }
    object Analytics : Screen("analytics")
    object Report : Screen("report")
}
