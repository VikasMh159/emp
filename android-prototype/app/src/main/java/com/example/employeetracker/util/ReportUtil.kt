package com.example.employeetracker.util

import android.content.Context
import com.example.employeetracker.data.model.Employee
import com.example.employeetracker.data.model.Performance
import java.io.File

object ReportUtil {
    fun generatePerformanceReportCsv(context: Context, employees: List<Employee>, performances: List<Performance>): File {
        val file = File(context.cacheDir, "performance_report.csv")
        file.writeText("Employee ID,Name,Department,Overall Rating,Remarks\n")
        
        employees.forEach { emp ->
            val rating = performances.filter { it.employeeId == emp.id }.map { it.overallRating }.average().let { if (it.isNaN()) 0.0 else it }
            val remarks = performances.findLast { it.employeeId == emp.id }?.remarks ?: "No reviews"
            file.appendText("${emp.id},${emp.name},${emp.department},${String.format("%.2f", rating)},$remarks\n")
        }
        return file
    }

    fun generatePerformanceReportText(employees: List<Employee>, performances: List<Performance>): String {
        val sb = StringBuilder()
        sb.append("EMPLOYEE PERFORMANCE SUMMARY\n")
        sb.append("============================\n\n")
        
        employees.forEach { emp ->
            val rating = performances.filter { it.employeeId == emp.id }.map { it.overallRating }.average().let { if (it.isNaN()) 0.0 else it }
            sb.append("Name: ${emp.name}\n")
            sb.append("Dept: ${emp.department}\n")
            sb.append("Rating: ${String.format("%.2f", rating)} / 5.0\n")
            sb.append("----------------------------\n")
        }
        return sb.toString()
    }
}
