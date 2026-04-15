package com.example.employeetracker.data.local

import androidx.room.*
import com.example.employeetracker.data.model.Employee
import com.example.employeetracker.data.model.Performance
import com.example.employeetracker.data.model.Task
import kotlinx.coroutines.flow.Flow

@Dao
interface EmployeeDao {
    @Query("SELECT * FROM employees")
    fun getAllEmployees(): Flow<List<Employee>>

    @Query("SELECT * FROM employees WHERE id = :id")
    suspend fun getEmployeeById(id: Int): Employee?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEmployee(employee: Employee)

    @Update
    suspend fun updateEmployee(employee: Employee)

    @Delete
    suspend fun deleteEmployee(employee: Employee)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE employeeId = :employeeId")
    fun getTasksForEmployee(employeeId: Int): Flow<List<Task>>

    @Query("SELECT * FROM tasks")
    fun getAllTasks(): Flow<List<Task>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: Task)

    @Update
    suspend fun updateTask(task: Task)

    @Delete
    suspend fun deleteTask(task: Task)
}

@Dao
interface PerformanceDao {
    @Query("SELECT * FROM performance WHERE employeeId = :employeeId")
    fun getPerformanceForEmployee(employeeId: Int): Flow<List<Performance>>

    @Query("SELECT * FROM performance")
    fun getAllPerformance(): Flow<List<Performance>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPerformance(performance: Performance)

    @Update
    suspend fun updatePerformance(performance: Performance)

    @Delete
    suspend fun deletePerformance(performance: Performance)
}

@Dao
interface AttendanceDao {
    @Query("SELECT * FROM attendance WHERE employeeId = :employeeId")
    fun getAttendanceForEmployee(employeeId: Int): Flow<List<Attendance>>

    @Query("SELECT * FROM attendance WHERE date = :date")
    fun getAttendanceByDate(date: String): Flow<List<Attendance>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendance(attendance: Attendance)
}

@Database(entities = [Employee::class, Task::class, Performance::class, Attendance::class], version = 2)
abstract class AppDatabase : RoomDatabase() {
    abstract fun employeeDao(): EmployeeDao
    abstract fun taskDao(): TaskDao
    abstract fun performanceDao(): PerformanceDao
    abstract fun attendanceDao(): AttendanceDao
}
