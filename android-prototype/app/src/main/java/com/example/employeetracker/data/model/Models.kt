package com.example.employeetracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "employees")
data class Employee(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val role: String,
    val department: String,
    val joiningDate: String,
    val email: String,
    val contact: String,
    val profileUri: String? = null
)

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val employeeId: Int,
    val description: String,
    val deadline: String,
    val priority: String, // Low, Medium, High
    val assignedDate: String,
    val status: String // Pending, In Progress, Completed, Reviewed
)

@Entity(tableName = "performance")
data class Performance(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val employeeId: Int,
    val date: String,
    val qualityScore: Int,
    val timelinessScore: Int,
    val attendanceScore: Int,
    val communicationScore: Int,
    val innovationScore: Int,
    val overallRating: Float,
    val remarks: String
)

@Entity(tableName = "attendance")
data class Attendance(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val employeeId: Int,
    val date: String,
    val status: String // Present, Absent
)
