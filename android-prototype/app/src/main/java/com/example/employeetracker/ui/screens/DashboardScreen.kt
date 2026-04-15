package com.example.employeetracker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.employeetracker.data.model.Employee

@Composable
fun DashboardScreen(
    totalEmployees: Int,
    totalTasks: Int,
    pendingTasks: Int,
    completedTasks: Int,
    topPerformers: List<Employee>,
    lowPerformers: List<Employee>,
    onNavigate: (String) -> Unit
) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("MindMatrix Dashboard") },
                actions = {
                    IconButton(onClick = { onNavigate("settings") }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { onNavigate("add_employee") }) {
                Icon(Icons.Default.Add, contentDescription = "Add Employee")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatCard("Total Staff", totalEmployees.toString(), Icons.Default.Person, Modifier.weight(1fr))
                    StatCard("Total Tasks", totalTasks.toString(), Icons.Default.List, Modifier.weight(1fr))
                }
            }
            
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatCard("Pending", pendingTasks.toString(), Icons.Default.Info, Modifier.weight(1fr), Color(0xFFFFA000))
                    StatCard("Completed", completedTasks.toString(), Icons.Default.CheckCircle, Modifier.weight(1fr), Color(0xFF43A047))
                }
            }

            item {
                SectionHeader("Top 3 Performers", Icons.Default.Star, Color(0xFFFFA000))
            }
            
            items(topPerformers) { employee ->
                EmployeeItem(employee, onNavigate)
            }

            item {
                SectionHeader("Low Performers", Icons.Default.Warning, Color(0xFFF44336))
            }

            items(lowPerformers) { employee ->
                EmployeeItem(employee, onNavigate)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onNavigate("attendance") }, modifier = Modifier.weight(1fr)) {
                        Text("Attendance")
                    }
                    Button(onClick = { onNavigate("analytics") }, modifier = Modifier.weight(1fr)) {
                        Text("Analytics")
                    }
                }
            }
        }
    }
}

@Composable
fun SectionHeader(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 8.dp)) {
        Icon(icon, contentDescription = null, tint = color)
        Spacer(modifier = Modifier.width(8.dp))
        Text(title, style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
fun EmployeeItem(employee: Employee, onNavigate: (String) -> Unit) {
    Card(
        onClick = { onNavigate("employee_detail/${employee.id}") },
        modifier = Modifier.fillMaxWidth()
    ) {
        ListItem(
            headlineContent = { Text(employee.name) },
            supportingContent = { Text("${employee.role} • ${employee.department}") },
            trailingContent = { Icon(Icons.Default.KeyboardArrowRight, contentDescription = null) }
        )
    }
}

@Composable
fun StatCard(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier, color: Color = Color(0xFF3949AB)) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, tint = color)
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.headlineMedium, fontStyle = androidx.compose.ui.text.font.FontStyle.Normal)
        }
    }
}
